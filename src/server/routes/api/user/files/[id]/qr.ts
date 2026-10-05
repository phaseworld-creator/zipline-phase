import { ApiError } from '@/lib/api/errors';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { formatRootUrl } from '@/lib/url';
import { canInteract } from '@/lib/role';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import QRCode from 'qrcode';
import z from 'zod';

export const PATH = '/api/user/files/:id/qr';
export default typedPlugin(
  async (server) => {
    server.get(
      PATH,
      {
        schema: {
          description: 'Generate a QR code (PNG) for the public URL of a file.',
          params: z.object({ id: z.string() }),
          querystring: z.object({
            format: z.enum(['png', 'svg', 'utf8']).default('png'),
            size: z.coerce.number().min(50).max(1000).default(256),
          }),
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        const file = await prisma.file.findFirst({
          where: { OR: [{ id: req.params.id }, { name: req.params.id }] },
          select: { id: true, name: true, userId: true, User: { select: { role: true } } },
        });
        if (!file) throw new ApiError(4000);

        if (
          req.user.id !== file.userId &&
          !canInteract(req.user.role, file.User?.role ?? 'USER')
        )
          throw new ApiError(4000);

        const host = config.core.defaultDomain || req.headers.host || 'localhost';
        const proto = config.core.returnHttpsUrls ? 'https' : 'http';
        const fileUrl = `${proto}://${host}${formatRootUrl(config.files.route, file.name)}`;

        const { format, size } = req.query;

        if (format === 'svg') {
          const svg = await QRCode.toString(fileUrl, { type: 'svg', width: size });
          return res.type('image/svg+xml').send(svg);
        }

        if (format === 'utf8') {
          const text = await QRCode.toString(fileUrl, { type: 'utf8' });
          return res.type('text/plain').send(text);
        }

        const buf = await QRCode.toBuffer(fileUrl, { width: size });
        return res.type('image/png').send(buf);
      },
    );
  },
  { name: PATH },
);
