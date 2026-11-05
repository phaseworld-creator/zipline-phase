-- CreateTable: UploadToken
CREATE TABLE IF NOT EXISTS "UploadToken" (
    "id"        TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name"      TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "maxUses"   INTEGER,
    "uses"      INTEGER NOT NULL DEFAULT 0,
    "folderId"  TEXT,
    "userId"    TEXT NOT NULL,

    CONSTRAINT "UploadToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UploadToken_token_key" ON "UploadToken"("token");

ALTER TABLE "UploadToken"
    ADD CONSTRAINT "UploadToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
