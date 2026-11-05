import { ApiError } from '@/lib/api/errors';
import { createToken } from '@/lib/crypto';
import { prisma } from '@/lib/db';
import { secondlyRatelimit } from '@/lib/ratelimits';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

const tokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  token: z.string(),
  expiresAt: z.string().nullable(),
  maxUses: z.number().nullable(),
  uses: z.number(),
  folderId: z.string().nullable(),
  createdAt: z.string(),
});

export const PATH = '/api/user/upload-tokens';

export default typedPlugin(
  async (server) => {
    // List all tokens for the authenticated user
    server.get(
      PATH,
      {
        schema: {
          description: 'List all shareable upload tokens for the authenticated user.',
          response: { 200: z.array(tokenSchema) },
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        const tokens = await prisma.uploadToken.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
        });

        return res.send(
          tokens.map((t) => ({
            id: t.id,
            name: t.name,
            token: t.token,
            expiresAt: t.expiresAt?.toISOString() ?? null,
            maxUses: t.maxUses,
            uses: t.uses,
            folderId: t.folderId,
            createdAt: t.createdAt.toISOString(),
          })),
        );
      },
    );

    // Create a new token
    server.post(
      PATH,
      {
        schema: {
          description: 'Create a shareable upload token.',
          body: z.object({
            name: z.string().min(1).max(64),
            expiresAt: z.string().datetime().nullable().default(null),
            maxUses: z.number().int().min(1).nullable().default(null),
            folderId: z.string().nullable().default(null),
          }),
          response: { 200: tokenSchema },
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
        ...secondlyRatelimit(2),
      },
      async (req, res) => {
        const { name, expiresAt, maxUses, folderId } = req.body;

        // Validate folderId belongs to user if set
        if (folderId) {
          const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId: req.user.id },
            select: { id: true },
          });
          if (!folder) throw new ApiError(4001);
        }

        const token = await prisma.uploadToken.create({
          data: {
            name,
            token: createToken(),
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            maxUses,
            folderId,
            userId: req.user.id,
          },
        });

        return res.send({
          id: token.id,
          name: token.name,
          token: token.token,
          expiresAt: token.expiresAt?.toISOString() ?? null,
          maxUses: token.maxUses,
          uses: token.uses,
          folderId: token.folderId,
          createdAt: token.createdAt.toISOString(),
        });
      },
    );

    // Delete a token
    server.delete(
      `${PATH}/:id`,
      {
        schema: {
          description: 'Delete a shareable upload token.',
          params: z.object({ id: z.string() }),
          response: { 200: z.object({ success: z.boolean() }) },
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        const token = await prisma.uploadToken.findFirst({
          where: { id: req.params.id, userId: req.user.id },
        });
        if (!token) throw new ApiError(9002);

        await prisma.uploadToken.delete({ where: { id: token.id } });
        return res.send({ success: true });
      },
    );
  },
  { name: PATH },
);
