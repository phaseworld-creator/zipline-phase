import { ApiError } from '@/lib/api/errors';
import { datasource } from '@/lib/datasource';
import { prisma } from '@/lib/db';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import archiver from 'archiver';
import { Readable } from 'stream';
import z from 'zod';

export const PATH = '/api/user/files/zip';

export default typedPlugin(
  async (server) => {
    server.post(
      PATH,
      {
        schema: {
          description: 'Download multiple files as a ZIP archive.',
          body: z.object({
            files: z.array(z.string()).min(1).max(500),
          }),
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        const { files: fileIds } = req.body;

        // Fetch files from DB — must belong to the requesting user
        const files = await prisma.file.findMany({
          where: { id: { in: fileIds }, userId: req.user.id },
          select: { id: true, name: true, originalName: true },
        });

        if (!files.length) throw new ApiError(4000);

        const archive = archiver('zip', { zlib: { level: 6 } });

        // Track seen names and deduplicate with a counter suffix
        const seen = new Map<string, number>();
        const getUniqueName = (name: string) => {
          const count = seen.get(name) ?? 0;
          seen.set(name, count + 1);
          if (count === 0) return name;
          const dot = name.lastIndexOf('.');
          return dot === -1 ? `${name} (${count})` : `${name.slice(0, dot)} (${count})${name.slice(dot)}`;
        };

        res.raw.setHeader('Content-Type', 'application/zip');
        res.raw.setHeader(
          'Content-Disposition',
          `attachment; filename="zipline-files-${Date.now()}.zip"`,
        );

        archive.pipe(res.raw);

        for (const file of files) {
          const stream = await datasource.get(file.name);
          if (!stream) continue;

          const entryName = getUniqueName(file.originalName || file.name);
          archive.append(stream instanceof Readable ? stream : Readable.from(stream as any), {
            name: entryName,
          });
        }

        await archive.finalize();
      },
    );
  },
  { name: PATH },
);
