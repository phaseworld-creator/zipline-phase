/**
 * POST /api/user/download/zip
 * Bulk-download selected files as a ZIP archive streamed to the client.
 */
import { ApiError } from '@/lib/api/errors';
import { datasource } from '@/lib/datasource';
import { prisma } from '@/lib/db';
import { canInteract } from '@/lib/role';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import { Readable } from 'stream';
import z from 'zod';
import archiver from 'archiver';

export const PATH = '/api/user/download/zip';
export default typedPlugin(
  async (server) => {
    server.post(
      PATH,
      {
        schema: {
          description: 'Stream a ZIP archive of the selected files to the client.',
          body: z.object({
            files: z.array(z.string()).min(1).max(500),
          }),
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        const { files: fileIds } = req.body;

        const dbFiles = await prisma.file.findMany({
          where: { id: { in: fileIds } },
          select: {
            id: true,
            name: true,
            type: true,
            userId: true,
            User: { select: { role: true } },
          },
        });

        if (!dbFiles.length) throw new ApiError(1026);

        // Verify the requester can see all files
        for (const f of dbFiles) {
          if (req.user.id !== f.userId && !canInteract(req.user.role, f.User?.role ?? 'USER'))
            throw new ApiError(3013);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipName = `zipline-export-${timestamp}.zip`;

        res.raw.setHeader('Content-Type', 'application/zip');
        res.raw.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
        res.raw.setHeader('Transfer-Encoding', 'chunked');

        const archive = archiver('zip', { zlib: { level: 5 } });
        archive.pipe(res.raw);

        for (const f of dbFiles) {
          const stream = await datasource.get(f.name);
          if (!stream) continue;
          archive.append(stream as Readable, { name: f.name });
        }

        await archive.finalize();
        // res is already sent via piping — do not call res.send()
      },
    );
  },
  { name: PATH },
);
