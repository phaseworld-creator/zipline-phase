import { ApiError } from '@/lib/api/errors';
import { config } from '@/lib/config';
import { datasource } from '@/lib/datasource';
import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import { z } from 'zod';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

export const PATH = '/api/user/download';
export type ApiDownloadResponse = { url: string };

const downloadResponseSchema = z.object({ url: z.string() });

const logger = log('api').c('user').c('download');

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default typedPlugin(
  async (server) => {
    server.post<{
      Body: z.ZodTypeAny,
      Querystring: z.ZodTypeAny,
      Response: { 200: typeof downloadResponseSchema },
    }>(
      PATH,
      {
        schema: {
          description: 'Generate a ZIP download for a folder or tag collection.',
          body: z.object({
            type: z.enum(['folder', 'tag']),
            id: z.string().min(1),
          }),
          response: { 200: z.object({ url: z.string() }) },
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        const { type, id } = req.body as unknown as { type: 'folder' | 'tag'; id: string };

        const files: { name: string; path: string }[] = [];

        if (type === 'folder') {
          const folder = await prisma.folder.findFirst({
            where: { id, userId: req.user.id },
            include: { files: true },
          });

          if (!folder) throw new ApiError(4001);

          for (const file of folder.files) {
            const buf = await datasource.get(file.name);
            if (!buf) continue;

            const buffer = await streamToBuffer(buf);
            const tempDir = join(config.core.tempDirectory, 'zip-' + randomUUID());
            if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

            const filePath = join(tempDir, file.originalName ?? file.name);
            writeFileSync(filePath, buffer);

            files.push({ name: file.originalName ?? file.name, path: filePath });
          }
        } else if (type === 'tag') {
          const tag = await prisma.tag.findFirst({
            where: { id, userId: req.user.id },
            include: { files: true },
          });

          if (!tag) throw new ApiError(4002);

          for (const file of tag.files) {
            const buf = await datasource.get(file.name);
            if (!buf) continue;

            const buffer = await streamToBuffer(buf);
            const tempDir = join(config.core.tempDirectory, 'zip-' + randomUUID());
            if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

            const filePath = join(tempDir, file.originalName ?? file.name);
            writeFileSync(filePath, buffer);

            files.push({ name: file.originalName ?? file.name, path: filePath });
          }
        }

        if (!files.length) throw new ApiError(1062, 'No files found to download');

        const zipFileName = `${type}-${id}-${Date.now()}.zip`;
        const zipPath = join(config.core.tempDirectory, zipFileName);

        try {
          const { default: archiver } = await import('archiver');
          const output = (await import('fs')).createWriteStream(zipPath);

          const archive = archiver('zip', { zlib: { level: 9 } });
          archive.pipe(output);

          for (const file of files) {
            archive.file(file.path, { name: file.name });
          }

          await archive.finalize();
          await new Promise<void>((resolve, reject) => {
            output.on('close', resolve);
            output.on('error', reject);
          });
        } catch {
          throw new ApiError(5000, 'Failed to create ZIP archive');
        }

        const domain = `${config.core.returnHttpsUrls ? 'https' : 'http'}://${req.headers.host}`;
        const url = `${domain}/raw/${encodeURIComponent(zipFileName)}`;

        logger.info(`generated zip download for ${type} ${id}`, { userId: req.user.id });

        return res.send({ url });
      }
    );
  },
  { name: PATH },
);
