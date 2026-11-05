-- Add componentEmbed JSON columns for all Discord webhook events
ALTER TABLE "Zipline" ADD COLUMN IF NOT EXISTS "discordOnUploadComponentEmbed"  JSONB;
ALTER TABLE "Zipline" ADD COLUMN IF NOT EXISTS "discordOnShortenComponentEmbed" JSONB;
ALTER TABLE "Zipline" ADD COLUMN IF NOT EXISTS "discordOnDeleteComponentEmbed"  JSONB;
ALTER TABLE "Zipline" ADD COLUMN IF NOT EXISTS "discordOnSignupComponentEmbed"  JSONB;
