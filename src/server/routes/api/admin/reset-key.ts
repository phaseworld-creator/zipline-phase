import { deriveResetKey } from '@/server/routes/api/admin/reset';
import { ApiError } from '@/lib/api/errors';
import { isAdministrator } from '@/lib/role';
import { prisma } from '@/lib/db';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

export const PATH = '/api/admin/reset-key';

export default typedPlugin(
  async (server) => {
    server.get(
      PATH,
      {
        schema: {
          description:
            'Return the reset key for the authenticated admin user. ' +
            'The key is HMAC-SHA256(rawToken, serverSecret) as lowercase hex. ' +
            'Use it at GET /api/admin/reset/:resetKey to factory-reset the instance.',
          response: {
            200: z.object({ resetKey: z.string() }),
            403: z.object({ error: z.string() }),
          },
          tags: ['admin'],
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        if (!isAdministrator(req.user.role)) {
          throw new ApiError(3000);
        }

        // Fetch the raw token (not exposed in req.user by default)
        const row = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { token: true },
        });

        if (!row?.token) throw new ApiError(9004);

        const resetKey = deriveResetKey(row.token);

        return res.send({ resetKey });
      },
    );
  },
  { name: PATH },
);
