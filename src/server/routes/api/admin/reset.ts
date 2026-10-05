import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import typedPlugin from '@/server/typedPlugin';
import crypto from 'crypto';
import z from 'zod';

export const PATH = '/api/admin/reset/:resetKey';

const logger = log('api').c('admin/reset');

/**
 * Derive a URL-safe reset key from a user's raw DB token.
 *
 * We HMAC-SHA256 the raw token with the server's core.secret so:
 *  - The key is 64 hex chars — no dots, slashes, or pluses that break URL routing.
 *  - It is cryptographically tied to both the token *and* the server secret,
 *    so it cannot be forged even if someone knows the token format.
 *  - It is deterministic — the admin can always re-derive it from their token.
 *  - No extra DB column is needed.
 */
function deriveResetKey(rawToken: string): string {
  return crypto.createHmac('sha256', config.core.secret).update(rawToken).digest('hex');
}

export { deriveResetKey };

export default typedPlugin(
  async (server) => {
    server.get(
      PATH,
      {
        schema: {
          description:
            'Reset the Zipline instance to first-time setup mode. ' +
            'Supply the reset key shown in your account settings. ' +
            'The key is HMAC-SHA256(rawToken, serverSecret) as lowercase hex — ' +
            'it is not the token itself. ' +
            'On success all users are deleted and firstSetup is re-enabled.',
          params: z.object({
            resetKey: z.string().regex(/^[0-9a-f]{64}$/, 'Reset key must be a 64-char hex string'),
          }),
          response: {
            200: z.object({ reset: z.boolean() }),
            401: z.object({ error: z.string() }),
          },
          tags: ['admin'],
        },
      },
      async (req, res) => {
        const { resetKey } = req.params as { resetKey: string };

        // Fetch all admin users and compare derived keys in constant time
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true, token: true },
        });

        let matchedAdminId: string | null = null;

        for (const admin of admins) {
          const expected = deriveResetKey(admin.token);
          // constant-time comparison to prevent timing attacks
          if (
            expected.length === resetKey.length &&
            crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(resetKey, 'hex'))
          ) {
            matchedAdminId = admin.id;
            break;
          }
        }

        if (!matchedAdminId) {
          logger.warn('reset attempt with invalid reset key');
          return res.status(401).send({ error: 'Invalid reset key' });
        }

        logger.info('factory reset initiated', { adminId: matchedAdminId });

        // Delete all users (cascades to files, sessions, etc. via FK relations)
        await prisma.user.deleteMany({});

        // Re-enable firstSetup so the instance returns to first-run state
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
