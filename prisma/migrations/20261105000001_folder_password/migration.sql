-- Add optional password to Folder
ALTER TABLE "Folder" ADD COLUMN IF NOT EXISTS "password" TEXT;
