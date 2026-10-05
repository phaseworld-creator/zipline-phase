import { prisma } from '@/lib/db';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

export type ApiUserAnalyticsResponse = {
  topFiles: { id: string; name: string; type: string; views: number; size: number; url: string }[];
  downloadTrend: { date: string; count: number }[];
  storageGrowth: { date: string; bytes: number }[];
  typeBreakdown: { type: string; count: number; bytes: number }[];
};

export const PATH = '/api/user/analytics';
export default typedPlugin(
  async (server) => {
    server.get(
      PATH,
      {
        schema: {
          description: 'Per-user analytics: top files, download trend, storage growth, type breakdown.',
          querystring: z.object({
            days: z.coerce.number().min(1).max(365).default(30),
          }),
          response: {
            200: z.object({
              topFiles: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  type: z.string(),
                  views: z.number(),
                  size: z.number(),
                  url: z.string(),
                }),
              ),
              downloadTrend: z.array(z.object({ date: z.string(), count: z.number() })),
              storageGrowth: z.array(z.object({ date: z.string(), bytes: z.number() })),
              typeBreakdown: z.array(
                z.object({ type: z.string(), count: z.number(), bytes: z.number() }),
              ),
            }),
          },
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        const { days } = req.query;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [topFilesRaw, downloadLogsRaw, allFiles] = await Promise.all([
          // Top 10 most-viewed files
          prisma.file.findMany({
            where: { userId: req.user.id },
            orderBy: { views: 'desc' },
            take: 10,
            select: { id: true, name: true, type: true, views: true, size: true },
          }),
          // Download logs for trend (grouped by day)
          prisma.downloadLog.findMany({
            where: {
              file: { userId: req.user.id },
              createdAt: { gte: since },
            },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
          }),
          // All files for storage growth + type breakdown
          prisma.file.findMany({
            where: { userId: req.user.id },
            select: { createdAt: true, size: true, type: true },
            orderBy: { createdAt: 'asc' },
          }),
        ]);

        const { config } = await import('@/lib/config');
        const { formatRootUrl } = await import('@/lib/url');

        // Top files with URL
        const topFiles = topFilesRaw.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          views: f.views,
          size: Number(f.size),
          url: formatRootUrl(config.files.route, f.name),
        }));

        // Download trend — bucket by date
        const trendMap = new Map<string, number>();
        for (let i = 0; i < days; i++) {
          const d = new Date(since);
          d.setDate(d.getDate() + i);
          trendMap.set(d.toISOString().slice(0, 10), 0);
        }
        for (const log of downloadLogsRaw) {
          const key = log.createdAt.toISOString().slice(0, 10);
          trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
        }
        const downloadTrend = [...trendMap.entries()].map(([date, count]) => ({ date, count }));

        // Storage growth — cumulative bytes over time (all files)
        let cumulative = 0;
        const growthMap = new Map<string, number>();
        for (const f of allFiles) {
          const key = f.createdAt.toISOString().slice(0, 10);
          cumulative += Number(f.size);
          growthMap.set(key, cumulative);
        }
        const storageGrowth = [...growthMap.entries()].map(([date, bytes]) => ({ date, bytes }));

        // Type breakdown — group by MIME major type
        const typeMap = new Map<string, { count: number; bytes: number }>();
        for (const f of allFiles) {
          const major = f.type.split('/')[0] ?? f.type;
          const existing = typeMap.get(major) ?? { count: 0, bytes: 0 };
          typeMap.set(major, { count: existing.count + 1, bytes: existing.bytes + Number(f.size) });
        }
        const typeBreakdown = [...typeMap.entries()].map(([type, { count, bytes }]) => ({
          type,
          count,
          bytes,
        }));

        return res.send({ topFiles, downloadTrend, storageGrowth, typeBreakdown });
      },
    );
  },
  { name: PATH },
);
