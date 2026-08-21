import { trollStore, TrollLink, TrollMediaType } from '@/lib/trollStore';
import { administratorMiddleware } from '@/server/middleware/administrator';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

const MEDIA_TYPES: [TrollMediaType, ...TrollMediaType[]] = ['image', 'gif', 'video', 'youtube'];

export const PATH = '/api/troll';
export default typedPlugin(
  async (server) => {
    /** GET /api/troll — list all troll links (admin only) */
    server.get(
      PATH,
      {
        schema: { tags: ['admin'] },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (_req, res) => {
        return res.send(trollStore.all());
      },
    );

    /** POST /api/troll — create a troll link (admin only) */
    server.post(
      PATH,
      {
        schema: {
          tags: ['admin'],
          body: z.object({
            alias: z.string().min(1).max(64).regex(/^[\w-]+$/, 'Only letters, numbers, - and _ allowed'),
            mediaUrl: z.string().url(),
            mediaType: z.enum(MEDIA_TYPES),
            label: z.string().max(80).default(''),
          }),
        },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (req, res) => {
        const { alias, mediaUrl, mediaType, label } = req.body;

        if (trollStore.hasAlias(alias)) {
          return res.conflict(`Alias "${alias}" is already in use`);
        }

        const link: TrollLink = {
          id: crypto.randomUUID(),
          alias,
          mediaUrl,
          mediaType,
          label: label || alias,
          createdAt: new Date().toISOString(),
        };

        trollStore.add(link);
        return res.status(201).send(link);
      },
    );

    /** DELETE /api/troll/:alias — remove a troll link (admin only) */
    server.delete(
      `${PATH}/:alias`,
      {
        schema: { tags: ['admin'] },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (req, res) => {
        const { alias } = req.params as { alias: string };
        const removed = trollStore.remove(alias);
        if (!removed) return res.notFound(`Alias "${alias}" not found`);
        return res.status(204).send();
      },
    );
  },
  { name: PATH },
);
