-- AlterTable: Drop old key column and add new security columns
ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "key";

-- Add new columns
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "key_hash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "key_prefix" TEXT NOT NULL DEFAULT '';
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "rate_limit_rpm" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "rate_limit_daily_jobs" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX IF NOT EXISTS "api_keys_key_prefix_idx" ON "api_keys"("key_prefix");

-- CreateTable: audit_log
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "api_key_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_logs_organization_id_idx" ON "audit_logs"("organization_id");
CREATE INDEX IF NOT EXISTS "audit_logs_api_key_id_idx" ON "audit_logs"("api_key_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
