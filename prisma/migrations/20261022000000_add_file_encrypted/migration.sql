-- AlterTable
-- Add missing encrypted column to File table
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "encrypted" BOOLEAN NOT NULL DEFAULT false;
