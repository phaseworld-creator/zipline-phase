import { trollStore, TrollLink, TrollMediaType } from '@/lib/trollStore';
import { hashPassword } from '@/lib/crypto';
import { administratorMiddleware } from '@/server/middleware/administrator';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

const MEDIA_TYPES: [TrollMediaType, ...TrollMediaType[]] = ['image', 'gif', 'video', 'youtube', 'audio'];

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
            expiresAt: z.string().datetime().optional().nullable(),
            tags: z.array(z.string()).optional().default([]),
            displayMode: z.enum(['fullscreen', 'redirect']).optional().default('fullscreen'),
            password: z.string().optional().nullable(),
          }),
        },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (req, res) => {
        const { alias, mediaUrl, mediaType, label, expiresAt, tags, displayMode, password } = req.body;

        if (trollStore.hasAlias(alias)) {
          return res.conflict(`Alias "${alias}" is already in use`);
        }

        // Hash password if provided
        const hashedPassword = password ? await hashPassword(password) : null;

        const link: TrollLink = {
          id: crypto.randomUUID(),
          alias,
          mediaUrl,
          mediaType,
          label: label || alias,
          createdAt: new Date().toISOString(),
          views: 0,
          expiresAt: expiresAt ?? null,
          tags: tags ?? [],
          displayMode: displayMode ?? 'fullscreen',
          password: hashedPassword,
          viewTimestamps: [],
          viewedIpHashes: [],
        };

        trollStore.add(link);
        return res.status(201).send(link);
      },
    );

    /** PATCH /api/troll/:alias — update a troll link (admin only) */
    server.patch(
      `${PATH}/:alias`,
      {
        schema: {
          tags: ['admin'],
          body: z.object({
            mediaUrl: z.string().url().optional(),
            mediaType: z.enum(MEDIA_TYPES).optional(),
            label: z.string().max(80).optional(),
            expiresAt: z.string().datetime().optional().nullable(),
            tags: z.array(z.string()).optional(),
            displayMode: z.enum(['fullscreen', 'redirect']).optional(),
            password: z.string().optional().nullable(),
          }),
        },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (req, res) => {
        const { alias } = req.params as { alias: string };
        const updates = req.body;

        const link = trollStore.get(alias);
        if (!link) return res.notFound(`Alias "${alias}" not found`);

        // Hash password if being updated
        if (updates.password !== undefined) {
          updates.password = updates.password ? await hashPassword(updates.password) : null;
        }

        const updated = trollStore.update(alias, updates);
        if (!updated) return res.internalServerError('Failed to update');

        return res.send(trollStore.get(alias));
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
