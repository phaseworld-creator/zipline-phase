import { ApiError } from '@/lib/api/errors';
import { prisma } from '@/lib/db';
import { canInteract } from '@/lib/role';
import { secondlyRatelimit } from '@/lib/ratelimits';
import { userMiddleware } from '@/server/middleware/user';
import typedPlugin from '@/server/typedPlugin';
import z from 'zod';

export type ApiUserFilesIdCommentsResponse = {
  total: number;
  comments: {
    id: string;
    createdAt: string;
    updatedAt: string;
    body: string;
    authorId: string | null;
    authorName: string | null;
    fileId: string;
  }[];
};

const commentSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  body: z.string(),
  authorId: z.string().nullable(),
  authorName: z.string().nullable(),
  fileId: z.string(),
});

const paramsSchema = z.object({ id: z.string() });
const commentParamsSchema = z.object({ id: z.string(), commentId: z.string() });

export const PATH = '/api/user/files/:id/comments';
export default typedPlugin(
  async (server) => {
    // GET all comments for a file
    server.get(
      PATH,
      {
        schema: {
          description: 'List comments on a file.',
          params: paramsSchema,
          querystring: z.object({
            page: z.coerce.number().min(0).default(0),
            perpage: z.coerce.number().min(1).max(50).default(20),
          }),
          response: {
            200: z.object({
              total: z.number(),
              comments: z.array(commentSchema),
            }),
          },
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        const file = await prisma.file.findFirst({
          where: { OR: [{ id: req.params.id }, { name: req.params.id }] },
          select: { id: true, userId: true, User: { select: { role: true } } },
        });
        if (!file) throw new ApiError(4000);

        if (
          req.user.id !== file.userId &&
          !canInteract(req.user.role, file.User?.role ?? 'USER')
        )
          throw new ApiError(4000);

        const { page, perpage } = req.query;
        const [total, comments] = await prisma.$transaction([
          prisma.fileComment.count({ where: { fileId: file.id } }),
          prisma.fileComment.findMany({
            where: { fileId: file.id },
            orderBy: { createdAt: 'asc' },
            skip: page * perpage,
            take: perpage,
            include: { author: { select: { id: true, username: true } } },
          }),
        ]);

        return res.send({
          total,
          comments: comments.map((c) => ({
            id: c.id,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            body: c.body,
            authorId: c.authorId,
            authorName: c.author?.username ?? null,
            fileId: c.fileId,
          })),
        });
      },
    );

    // POST create a comment
    server.post(
      PATH,
      {
        schema: {
          description: 'Add a comment to a file.',
          params: paramsSchema,
          body: z.object({ body: z.string().trim().min(1).max(2000) }),
          response: { 200: commentSchema },
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
        ...secondlyRatelimit(3, 5),
      },
      async (req, res) => {
        const file = await prisma.file.findFirst({
          where: { OR: [{ id: req.params.id }, { name: req.params.id }] },
          select: { id: true, userId: true, User: { select: { role: true } } },
        });
        if (!file) throw new ApiError(4000);

        if (
          req.user.id !== file.userId &&
          !canInteract(req.user.role, file.User?.role ?? 'USER')
        )
          throw new ApiError(4000);

        const comment = await prisma.fileComment.create({
          data: {
            body: req.body.body,
            fileId: file.id,
            authorId: req.user.id,
          },
          include: { author: { select: { id: true, username: true } } },
        });

        return res.send({
          id: comment.id,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          body: comment.body,
          authorId: comment.authorId,
          authorName: comment.author?.username ?? null,
          fileId: comment.fileId,
        });
      },
    );

    // DELETE a specific comment
    server.delete(
      `${PATH}/:commentId`,
      {
        schema: {
          description: 'Delete a comment by ID (author or file owner/admin).',
          params: commentParamsSchema,
          response: { 200: z.object({ id: z.string() }) },
          tags: ['auth'],
        },
        preHandler: [userMiddleware],
      },
      async (req, res) => {
        const file = await prisma.file.findFirst({
          where: { OR: [{ id: req.params.id }, { name: req.params.id }] },
          select: { id: true, userId: true, User: { select: { role: true } } },
        });
        if (!file) throw new ApiError(4000);

        const comment = await prisma.fileComment.findUnique({
          where: { id: req.params.commentId },
        });
        if (!comment || comment.fileId !== file.id) throw new ApiError(9002);

        // Allow deletion if: user is the comment author, file owner, or admin
        const isAuthor = comment.authorId === req.user.id;
        const isFileOwner = file.userId === req.user.id;
        const isAdmin = canInteract(req.user.role, 'USER');
        if (!isAuthor && !isFileOwner && !isAdmin) throw new ApiError(9001);

        await prisma.fileComment.delete({ where: { id: comment.id } });

        return res.send({ id: comment.id });
      },
    );
  },
  { name: PATH },
);
