import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

export const PATH = '/api/admin/reset/:token';

const logger = log('api').c('admin/reset');

export default typedPlugin(
  async (server) => {
    server.get(
      PATH,
      {
        schema: {
          description:
            'Reset the Zipline instance to first-time setup mode. ' +
            'The caller must supply the current admin account token in the URL. ' +
            'All users and their data are deleted, and the firstSetup flag is re-enabled.',
          params: z.object({
            token: z.string(),
          }),
          response: {
            200: z.object({ reset: z.boolean() }),
            401: z.object({ error: z.string() }),
          },
          tags: ['admin'],
        },
      },
      async (req, res) => {
        const { token } = req.params as { token: string };

        // Verify the token belongs to an ADMIN user
        const admin = await prisma.user.findFirst({
          where: { token, role: 'ADMIN' },
          select: { id: true },
        });

        if (!admin) {
          logger.warn('reset attempt with invalid token');
          return res.status(401).send({ error: 'Invalid token' });
        }

        logger.info('factory reset initiated', { adminId: admin.id });

        // Delete all users (cascades to files, sessions, etc. via FK relations)
        await prisma.user.deleteMany({});

        // Re-enable firstSetup on every Zipline row (typically just one)
        await prisma.zipline.updateMany({
          data: { firstSetup: true },
        });

        logger.info('factory reset complete — instance is in first-time setup mode');

        return res.send({ reset: true });
      },
    );
  },
  { name: PATH },
);
