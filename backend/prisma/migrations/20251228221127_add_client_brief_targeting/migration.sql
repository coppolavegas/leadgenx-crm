-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "client_brief" TEXT,
ADD COLUMN     "targeting_profile" JSONB,
ADD COLUMN     "targeting_profile_updated_at" TIMESTAMP(3);
