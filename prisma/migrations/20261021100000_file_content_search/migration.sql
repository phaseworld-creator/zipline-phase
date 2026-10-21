-- AlterTable
ALTER TABLE "File" ADD COLUMN "content" TEXT;

-- CreateIndex
CREATE INDEX "File_search_vector_idx" ON "File" USING gin (to_tsvector('english', coalesce("content", '')));
