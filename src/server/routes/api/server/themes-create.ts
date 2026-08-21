import { exists } from '@/lib/fs';
import { administratorMiddleware } from '@/server/middleware/administrator';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import { mkdir, readdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import z from 'zod';

const THEMES_DIR = './themes';

const colorArray = z
  .array(z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'Must be a valid hex color'))
  .length(10, 'Color array must have exactly 10 shades');

const themeBodySchema = z.object({
  name: z.string().min(1).max(80),
  colorScheme: z.enum(['light', 'dark']),
  primaryColor: z.string().min(1).max(40),
  mainBackgroundColor: z.string().min(1).max(120),
  colors: z.record(z.string(), colorArray),
  fontFamily: z.string().max(200).optional().default('system-ui, sans-serif'),
  headings: z
    .object({
      fontFamily: z.string().max(200).optional(),
      fontWeight: z.string().max(10).optional(),
    })
    .optional(),
  defaultRadius: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional().default('md'),
  extraCss: z.string().max(8000).optional().default(''),
});

export const PATH = '/api/server/themes/custom';
export default typedPlugin(
  async (server) => {
    /** POST — save a new custom theme to ./themes/ */
    server.post(
      PATH,
      {
        schema: {
          tags: ['admin'],
          body: themeBodySchema,
        },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (req, res) => {
        const body = req.body;

        // Derive a filesystem-safe slug from the name
        const slug = body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 40) || 'custom_theme';

        const dir = join(process.cwd(), THEMES_DIR);
        if (!(await exists(dir))) await mkdir(dir, { recursive: true });

        const filename = `${slug}.theme.json`;
        const filepath = join(dir, filename);

        // Remove id/builtin prefix if caller included it; id comes from filename
        const { id: _id, ...themeData } = body as any;

        await writeFile(filepath, JSON.stringify(themeData, null, 2), 'utf-8');

        return res.status(201).send({ id: slug, filename, path: filepath });
      },
    );

    /** DELETE — remove a custom theme file */
    server.delete(
      `${PATH}/:slug`,
      {
        schema: { tags: ['admin'] },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (req, res) => {
        const { slug } = req.params as { slug: string };

        // Safety: only allow deleting from the custom themes dir, no path traversal
        if (!/^[a-z0-9_-]+$/.test(slug)) return res.badRequest('Invalid slug');

        const dir = join(process.cwd(), THEMES_DIR);
        const filepath = join(dir, `${slug}.theme.json`);

        if (!(await exists(filepath))) return res.notFound('Theme file not found');

        await unlink(filepath);
        return res.status(204).send();
      },
    );

    /** GET — list only custom (non-builtin) theme slugs */
    server.get(
      PATH,
      {
        schema: { tags: ['admin'] },
        preHandler: [userMiddleware, administratorMiddleware],
      },
      async (_req, res) => {
        const dir = join(process.cwd(), THEMES_DIR);
        if (!(await exists(dir))) return res.send([]);

        const files = await readdir(dir);
        const slugs = files
          .filter((f) => f.endsWith('.theme.json'))
          .map((f) => f.replace('.theme.json', ''));

        return res.send(slugs);
      },
    );
  },
  { name: PATH },
);
