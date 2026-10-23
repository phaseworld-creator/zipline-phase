-- AlterTable
ALTER TABLE "File" ADD COLUMN "allowedIps" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "File" ADD COLUMN "blockedReferers" TEXT[] DEFAULT ARRAY[]::TEXT[];
