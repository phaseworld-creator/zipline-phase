import { prisma } from '@/lib/db';
import { administratorMiddleware } from '@/server/middleware/administrator';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

export type ApiAdminAuditLogsResponse = {
  total: number;
  logs: {
    id: string;
    createdAt: string;
    action: string;
    actorId: string | null;
    actorName: string | null;
    targetId: string | null;
    targetType: string | null;
    meta: Record<string, unknown>;
  }[];
};

const logSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  action: z.string(),
  actorId: z.string().nullable(),
  actorName: z.string().nullable(),
  targetId: z.string().nullable(),
  targetType: z.string().nullable(),
  meta: z.record(z.string(), z.unknown()),
});

export const PATH = '/api/admin/audit-logs';
export default typedPlugin(
  async (server) => {
    server.get(
      PATH,
      {
        schema: {
          description: 'Fetch paginated audit logs of admin actions (admin only).',
          querystring: z.object({
            page: z.coerce.number().min(0).default(0),
            perpage: z.coerce.number().min(1).max(100).default(25),
            action: z.string().optional(),
            actorId: z.string().optional(),
          }),
          response: {
            200: z.object({
              total: z.number(),
              logs: z.array(logSchema),
            }),
          },
          tags: ['auth', 'admin'],
        },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (req, res) => {
        const { page, perpage, action, actorId } = req.query;

        const where = {
          ...(action ? { action: { contains: action } } : {}),
          ...(actorId ? { actorId } : {}),
        };

        const [total, logs] = await prisma.$transaction([
          prisma.auditLog.count({ where }),
          prisma.auditLog.findMany({
            where,
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
            action: l.action,
            actorId: l.actorId,
            actorName: l.actorName,
            targetId: l.targetId,
            targetType: l.targetType,
            meta: l.meta as Record<string, unknown>,
          })),
        });
      },
    );
  },
  { name: PATH },
);
