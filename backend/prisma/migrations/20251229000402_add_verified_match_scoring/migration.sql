-- AlterTable
ALTER TABLE "enriched_leads" ADD COLUMN     "feature_matches" JSONB[] DEFAULT ARRAY[]::JSONB[],
ADD COLUMN     "final_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "preference_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "scoring_breakdown" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "verified_score" DOUBLE PRECISION NOT NULL DEFAULT 0;
