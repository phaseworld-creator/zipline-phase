import { ApiError } from '@/lib/api/errors';
import { config } from '@/lib/config';
import { administratorMiddleware } from '@/server/middleware/administrator';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import { z } from 'zod';

export const PATH = '/api/server/settings/test-webhook';

const DEFAULT_AVATAR =
  'https://raw.githubusercontent.com/diced/zipline/9b60147e112ec5b70170500b85c75ea621f41d03/public/zipline.png';

export default typedPlugin(
  async (server) => {
    server.post(
      PATH,
      {
        schema: {
          description: 'Send a test webhook to a Discord webhook URL.',
          body: z.object({
            webhookUrl: z.url(),
            username: z.string().optional(),
            avatarUrl: z.url().optional(),
            /** If true, send a Components V2 test message instead of a classic embed */
            useComponentsV2: z.boolean().default(false),
          }),
          response: {
            200: z.object({ ok: z.boolean(), status: z.number().optional(), error: z.string().optional() }),
          },
          tags: ['auth', 'superadmin'],
        },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (req, res) => {
        if (req.user.role !== 'ADMIN') throw new ApiError(3015);

        const { webhookUrl, username, avatarUrl, useComponentsV2 } = req.body;

        const resolvedUsername = username || config.discord?.username || 'Zipline';
        const resolvedAvatar = avatarUrl || config.discord?.avatarUrl || DEFAULT_AVATAR;

        const body = useComponentsV2
          ? {
              username: resolvedUsername,
              avatar_url: resolvedAvatar,
              flags: 32768,
              components: [
                {
                  type: 17,
                  accent_color: 0x5865f2,
                  components: [
                    {
                      type: 10,
                      content:
                        '## ✅ Zipline Webhook Test\nThis is a **Components V2** test message from Zipline.\nIf you can see this, your webhook is configured correctly.',
                    },
                  ],
                },
              ],
            }
          : {
              username: resolvedUsername,
              avatar_url: resolvedAvatar,
              embeds: [
                {
                  title: '✅ Zipline Webhook Test',
                  description:
                    'This is a **classic embed** test message from Zipline.\nIf you can see this, your webhook is configured correctly.',
                  color: 0x5865f2,
                  footer: { text: 'Sent from Zipline settings' },
                  timestamp: new Date().toISOString(),
                },
              ],
            };

        const fetchUrl = useComponentsV2
          ? `${webhookUrl}${webhookUrl.includes('?') ? '&' : '?'}with_components=true`
          : webhookUrl;

        try {
          const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const text = await response.text().catch(() => 'unknown error');
            return res.send({ ok: false, status: response.status, error: text.slice(0, 500) });
          }

          return res.send({ ok: true, status: response.status });
        } catch (err) {
          return res.send({ ok: false, error: err instanceof Error ? err.message : 'Network error' });
        }
      },
    );
  },
  { name: PATH },
);
