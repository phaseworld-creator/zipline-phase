-- AlterTable
ALTER TABLE "Zipline" ADD COLUMN     "featuresPublicUploadPortal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "featuresOneTimeShareLinks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "featuresSoundboard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "featuresAdvancedAnalytics" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "featuresWatermarkEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "featuresWatermarkText" TEXT,
ADD COLUMN     "featuresWatermarkImage" TEXT,
ADD COLUMN     "featuresWatermarkPosition" TEXT NOT NULL DEFAULT 'center',
ADD COLUMN     "featuresWatermarkOpacity" INTEGER NOT NULL DEFAULT 50;
