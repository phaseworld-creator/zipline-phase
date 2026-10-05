-- Add missing encrypted column to File table
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "encrypted" BOOLEAN NOT NULL DEFAULT false;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'File' AND column_name = 'encrypted';
