-- Add tokenDisabled to User
ALTER TABLE "User" ADD COLUMN "tokenDisabled" BOOLEAN NOT NULL DEFAULT false;

-- Add new feature flags to Zipline
ALTER TABLE "Zipline" ADD COLUMN "featuresDownloadHistory" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Zipline" ADD COLUMN "featuresFileComments" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Zipline" ADD COLUMN "featuresAuditLog" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Zipline" ADD COLUMN "featuresQrCodes" BOOLEAN NOT NULL DEFAULT true;

-- Add new webhook fields to Zipline
ALTER TABLE "Zipline" ADD COLUMN "httpWebhookOnDelete" TEXT;
ALTER TABLE "Zipline" ADD COLUMN "httpWebhookOnSignup" TEXT;
ALTER TABLE "Zipline" ADD COLUMN "httpWebhookOnQuota"  TEXT;
ALTER TABLE "Zipline" ADD COLUMN "discordOnDeleteWebhookUrl" TEXT;
ALTER TABLE "Zipline" ADD COLUMN "discordOnDeleteUsername"   TEXT;
ALTER TABLE "Zipline" ADD COLUMN "discordOnDeleteAvatarUrl"  TEXT;
ALTER TABLE "Zipline" ADD COLUMN "discordOnDeleteContent"    TEXT;
ALTER TABLE "Zipline" ADD COLUMN "discordOnSignupWebhookUrl" TEXT;
ALTER TABLE "Zipline" ADD COLUMN "discordOnSignupUsername"   TEXT;
ALTER TABLE "Zipline" ADD COLUMN "discordOnSignupAvatarUrl"  TEXT;
ALTER TABLE "Zipline" ADD COLUMN "discordOnSignupContent"    TEXT;

-- CreateTable DownloadLog
CREATE TABLE "DownloadLog" (
    "id"        TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip"        TEXT,
    "userAgent" TEXT,
    "viewerId"  TEXT,
    "fileId"    TEXT NOT NULL,

    CONSTRAINT "DownloadLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DownloadLog_fileId_createdAt_idx" ON "DownloadLog"("fileId", "createdAt");

-- AddForeignKey
ALTER TABLE "DownloadLog" ADD CONSTRAINT "DownloadLog_fileId_fkey"
    FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable FileComment
CREATE TABLE "FileComment" (
    "id"        TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "body"      TEXT NOT NULL,
    "authorId"  TEXT,
    "fileId"    TEXT NOT NULL,

    CONSTRAINT "FileComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileComment_fileId_createdAt_idx" ON "FileComment"("fileId", "createdAt");

-- AddForeignKey
ALTER TABLE "FileComment" ADD CONSTRAINT "FileComment_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FileComment" ADD CONSTRAINT "FileComment_fileId_fkey"
    FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id"         TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action"     TEXT NOT NULL,
    "actorId"    TEXT,
    "actorName"  TEXT,
    "targetId"   TEXT,
    "targetType" TEXT,
    "meta"       JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
