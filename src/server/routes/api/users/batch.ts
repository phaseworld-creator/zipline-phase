import { ApiError } from '@/lib/api/errors';
import { writeAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import { canInteract } from '@/lib/role';
import { administratorMiddleware } from '@/server/middleware/administrator';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

export type ApiUsersBatchResponse = { updated: number };

const logger = log('api').c('users').c('batch');

export const PATH = '/api/users/batch';
export default typedPlugin(
  async (server) => {
    // PATCH /api/users/batch — bulk disable/enable tokens, change quotas
    server.patch(
      PATH,
      {
        schema: {
          description:
            'Bulk update multiple users: disable/enable tokens or reset their quotas (admin only).',
          body: z.object({
            userIds: z.array(z.string()).min(1).max(100),
            action: z.enum(['disable_token', 'enable_token', 'reset_quota', 'delete']),
          }),
          response: {
            200: z.object({ updated: z.number() }),
          },
          tags: ['auth', 'admin'],
        },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (req, res) => {
        const { userIds, action } = req.body;

        // Validate targets are interactable
        const targets = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, role: true, username: true },
        });
        if (!targets.length) throw new ApiError(4009);

        for (const t of targets) {
          if (!canInteract(req.user.role, t.role)) throw new ApiError(3019);
          if (t.id === req.user.id) throw new ApiError(3010);
        }

        let updated = 0;

        if (action === 'disable_token') {
          const result = await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { tokenDisabled: true },
          });
          updated = result.count;
          writeAuditLog({
            action: 'user.token_disable',
            actorId: req.user.id,
            actorName: req.user.username,
            meta: { userIds, count: updated },
          });
        } else if (action === 'enable_token') {
          const result = await prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { tokenDisabled: false },
          });
          updated = result.count;
          writeAuditLog({
            action: 'user.token_enable',
            actorId: req.user.id,
            actorName: req.user.username,
            meta: { userIds, count: updated },
          });
        } else if (action === 'reset_quota') {
          const result = await prisma.userQuota.deleteMany({
            where: { userId: { in: userIds } },
          });
          updated = result.count;
        } else if (action === 'delete') {
          // delete users cascade
          const result = await prisma.user.deleteMany({
            where: { id: { in: userIds } },
          });
          updated = result.count;
          writeAuditLog({
            action: 'user.delete',
            actorId: req.user.id,
            actorName: req.user.username,
            meta: { userIds, count: updated },
          });
        }

        logger.info(`${req.user.username} batch ${action} on ${updated} users`);
        return res.send({ updated });
      },
    );

    // GET /api/admin/api-report — summary report of all users + token status
    server.get(
      '/api/admin/api-report',
      {
        schema: {
          description: 'Admin report: list all users with token status, quota, file count, URL count.',
          response: {
            200: z.object({
              users: z.array(
                z.object({
                  id: z.string(),
                  username: z.string(),
                  role: z.string(),
                  tokenDisabled: z.boolean(),
                  createdAt: z.string(),
                  fileCount: z.number(),
                  urlCount: z.number(),
                  storageBytes: z.number(),
                }),
              ),
            }),
          },
          tags: ['auth', 'admin'],
        },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (_req, res) => {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            username: true,
            role: true,
            tokenDisabled: true,
            createdAt: true,
            _count: { select: { files: true, urls: true } },
            files: { select: { size: true } },
          },
        });

        return res.send({
          users: users.map((u) => ({
            id: u.id,
            username: u.username,
            role: u.role,
            tokenDisabled: u.tokenDisabled,
            createdAt: u.createdAt.toISOString(),
            fileCount: u._count.files,
            urlCount: u._count.urls,
            storageBytes: u.files.reduce((acc, f) => acc + Number(f.size), 0),
          })),
        });
      },
    );
  },
  { name: PATH },
);
