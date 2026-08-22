-- Migrate SUPERADMIN and OWNER users to ADMIN before removing the enum values
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" IN ('SUPERADMIN', 'OWNER');

-- PostgreSQL doesn't allow removing enum values directly, so we:
-- 1. Rename the old enum
ALTER TYPE "Role" RENAME TO "Role_old";

-- 2. Create the new slim enum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- 3. Migrate the column
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::text::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

-- 4. Drop the old enum
DROP TYPE "Role_old";
