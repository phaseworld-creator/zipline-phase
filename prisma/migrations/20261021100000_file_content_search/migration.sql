-- AlterTable
ALTER TABLE "File" ADD COLUMN "content" TEXT;

-- CreateIndex (standard B-tree index on content for basic search; GIN full-text index
-- must be created manually after migration if needed, as Prisma's engine cannot handle
-- functional GIN index expressions during migration introspection)
CREATE INDEX IF NOT EXISTS "File_content_idx" ON "File"("content");
