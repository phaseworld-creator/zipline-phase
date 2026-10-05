import { config } from '@/lib/config';
import { isAdministrator } from '@/lib/role';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

export type ApiUserRatelimitResponse = {
  enabled: boolean;
  max: number;
  windowMs: number | null;
  adminBypass: boolean;
  isAdminBypassing: boolean;
  isOnAllowList: boolean;
};

export const PATH = '/api/user/ratelimit';
export default typedPlugin(
  async (server) => {
    server.get(
      PATH,
      {
        schema: {
          description: "Return the authenticated user's current rate-limit configuration and bypass status.",
          response: {
            200: z.object({
              enabled: z.boolean(),
              max: z.number(),
              windowMs: z.number().nullable(),
              adminBypass: z.boolean(),
              isAdminBypassing: z.boolean(),
              isOnAllowList: z.boolean(),
            }),
          },
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        const rl = config.ratelimit;
        const isAdmin = isAdministrator(req.user.role);
        const key = `${req.user.id}-${req.url.split('?')[0]}-GET`;
        const isOnAllowList = rl.allowList?.includes(key) ?? false;

        return res.send({
          enabled: rl.enabled,
          max: rl.max,
          windowMs: rl.window ?? null,
          adminBypass: rl.adminBypass,
          isAdminBypassing: isAdmin && rl.adminBypass,
          isOnAllowList,
        });
      },
    );
  },
  { name: PATH },
);
