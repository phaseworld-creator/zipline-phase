import { ApiError } from '@/lib/api/errors';
import { prisma } from '@/lib/db';
import { canInteract } from '@/lib/role';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

export type ApiUserFilesIdDownloadsResponse = {
  total: number;
  logs: {
    id: string;
    createdAt: string;
    ip: string | null;
    userAgent: string | null;
    viewerId: string | null;
  }[];
};

const paramsSchema = z.object({ id: z.string() });
const querySchema = z.object({
  page: z.coerce.number().min(0).default(0),
  perpage: z.coerce.number().min(1).max(100).default(20),
});

export const PATH = '/api/user/files/:id/downloads';
export default typedPlugin(
  async (server) => {
    server.get(
      PATH,
      {
        schema: {
          description: 'Get download/view history for a file owned by the authenticated user.',
          params: paramsSchema,
          querystring: querySchema,
          response: {
            200: z.object({
              total: z.number(),
              logs: z.array(
                z.object({
                  id: z.string(),
                  createdAt: z.string(),
                  ip: z.string().nullable(),
                  userAgent: z.string().nullable(),
                  viewerId: z.string().nullable(),
                }),
              ),
            }),
          },
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        const file = await prisma.file.findFirst({
          where: { OR: [{ id: req.params.id }, { name: req.params.id }] },
          select: { id: true, userId: true, User: { select: { role: true } } },
        });
        if (!file) throw new ApiError(4000);

        if (
          req.user.id !== file.userId &&
          !canInteract(req.user.role, file.User?.role ?? 'USER')
        )
          throw new ApiError(4000);

        const { page, perpage } = req.query;
        const [total, logs] = await prisma.$transaction([
          prisma.downloadLog.count({ where: { fileId: file.id } }),
          prisma.downloadLog.findMany({
            where: { fileId: file.id },
            orderBy: { createdAt: 'desc' },
            skip: page * perpage,
            take: perpage,
          }),
        ]);

        return res.send({
          total,
          logs: logs.map((l) => ({
            id: l.id,
            createdAt: l.createdAt.toISOString(),
            ip: l.ip,
            userAgent: l.userAgent,
            viewerId: l.viewerId,
          })),
        });
      },
    );
  },
  { name: PATH },
);
