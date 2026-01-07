-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "website_analysis" JSONB,
ADD COLUMN     "website_analysis_updated_at" TIMESTAMP(3),
ADD COLUMN     "website_url" TEXT;
