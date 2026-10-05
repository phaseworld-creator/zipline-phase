import { ApiError } from '@/lib/api/errors';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { formatRootUrl } from '@/lib/url';
import { canInteract } from '@/lib/role';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import QRCode from 'qrcode';
import z from 'zod';

export const PATH = '/api/user/urls/:id/qr';
export default typedPlugin(
  async (server) => {
    server.get(
      PATH,
      {
        schema: {
          description: 'Generate a QR code (PNG) for a shortened URL.',
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
        const url = await prisma.url.findFirst({
          where: { id: req.params.id },
          select: {
            id: true,
            code: true,
            vanity: true,
            userId: true,
            User: { select: { role: true } },
          },
        });
        if (!url) throw new ApiError(9002);

        if (
          req.user.id !== url.userId &&
          !canInteract(req.user.role, url.User?.role ?? 'USER')
        )
          throw new ApiError(9002);

        const host = config.core.defaultDomain || req.headers.host || 'localhost';
        const proto = config.core.returnHttpsUrls ? 'https' : 'http';
        const shortUrl = `${proto}://${host}${formatRootUrl(config.urls.route, url.vanity ?? url.code)}`;

        const { format, size } = req.query;

        if (format === 'svg') {
          const svg = await QRCode.toString(shortUrl, { type: 'svg', width: size });
          return res.type('image/svg+xml').send(svg);
        }

        if (format === 'utf8') {
          const text = await QRCode.toString(shortUrl, { type: 'utf8' });
          return res.type('text/plain').send(text);
        }

        const buf = await QRCode.toBuffer(shortUrl, { width: size });
        return res.type('image/png').send(buf);
      },
    );
  },
  { name: PATH },
);
