import { ApiError } from '@/lib/api/errors';
import { checkQuota, getFilename } from '@/lib/api/upload';
import { onUpload } from '@/lib/webhooks';
import typedPlugin from '@/server/typedPlugin';
import { z } from 'zod';

export const PATH = '/api/public/upload';
export type ApiPublicUploadResponse = {
  files: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
};

const publicUploadResponseSchema = z.object({
  files: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      url: z.string(),
    }),
  ),
});

export default typedPlugin(
  async (server) => {
    server.post<{
      Headers: UploadHeaders,
      Response: { 200: typeof publicUploadResponseSchema },
    }>(
      PATH,
      {
        schema: {
          description: 'Public upload endpoint for community uploads when enabled.',
          consumes: ['multipart/form-data'],
          response: {
            200: z.object({
              files: z.array(z.object({
                id: z.string(),
                name: z.string(),
                type: z.string(),
                url: z.string(),
              })),
            }),
          },
        },
      },
      async (req, res) => {
        if (!config.features.publicUploadPortal) {
          throw new ApiError(3002, 'Public upload portal is disabled');
        }

        const options = parseHeaders(req.headers, config.files);

        const { files } = await req.saveRequestFiles({ tmpdir: config.core.tempDirectory });

        if (!files.length) throw new ApiError(1062);

        const totalFileSize = files.reduce((acc, x) => acc + x.file.bytesRead, 0);
        const quotaCheck = await checkQuota(null, totalFileSize, files.length);
        if (quotaCheck !== true) throw new ApiError(5002, typeof quotaCheck === 'string' ? quotaCheck : undefined);

        const response: ApiPublicUploadResponse = {
          files: [],
        };

        const reservedNames = new Set<string>();
        const format = options.format || config.files.defaultFormat;
        const filesBefore: {
          file: typeof files[0];
          fileName: string;
          extension: string;
          mimetype: string;
        }[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const extension = file.filename.split('.').pop() || 'bin';
          const mimetype = file.mimetype || 'application/octet-stream';

          let fileName: string;
          try {
            fileName = await getFilename(format, file.filename, extension, undefined, reservedNames);
          } catch {
            throw new ApiError(1009, `file[${i}]: invalid file name`);
          }

          filesBefore.push({ file, fileName, extension, mimetype });
        }

        const created = [];
        for (const item of filesBefore) {
          const file = await prisma.file.create({
            data: {
              name: `${item.fileName}${item.extension}`,
              size: item.file.file.bytesRead,
              type: item.mimetype,
              anonymous: true,
            },
            select: fileSelect,
          });

          await datasource.put(file.name, item.file.filepath, { mimetype: file.type });

          const domain = `${config.core.returnHttpsUrls ? 'https' : 'http'}://${req.headers.host}`;
          const url = `${domain}${config.files.route}/${encodeURIComponent(file.name)}`;

          response.files.push({
            id: file.id,
            name: file.name,
            type: file.type,
            url,
          });

          created.push(file);
        }

        onUpload(config, {
          user: {
            id: 'anonymous',
            username: 'anonymous',
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'USER',
          },
          file: created[0],
          link: {
            raw: `${config.core.returnHttpsUrls ? 'https' : 'http'}://${req.headers.host}/raw/${encodeURIComponent(created[0].name)}`,
            returned: response.files[0].url,
          },
        });

        return res.send(response);
      }
    );
  },
  { name: PATH },
);
