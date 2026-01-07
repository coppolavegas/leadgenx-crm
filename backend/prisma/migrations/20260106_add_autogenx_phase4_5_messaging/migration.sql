-- AutoGenX Phase 4.5: Messaging, Compliance & Inbound
-- This migration adds tables for outbound messaging (SMS/Email),
-- compliance tracking (opt-outs, quiet hours, rate limits),
-- and inbound message processing.

-- Table: automation_message
-- Stores outbound messages (SMS/Email) sent by workflows
CREATE TABLE IF NOT EXISTS "automation_message" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "workspace_id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "lead_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL, -- 'sms' or 'email'
    "direction" TEXT NOT NULL DEFAULT 'outbound', -- 'outbound' or 'inbound'
    "to_phone" TEXT,
    "to_email" TEXT,
    "from_phone" TEXT,
    "from_email" TEXT,
    "subject" TEXT, -- For emails
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending', -- pending, queued, sent, delivered, failed, bounced
    "external_id" TEXT, -- Twilio SID or email provider ID
    "error_message" TEXT,
    "sent_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "automation_message_workspace_id_idx" ON "automation_message"("workspace_id");
CREATE INDEX IF NOT EXISTS "automation_message_lead_id_idx" ON "automation_message"("lead_id");
CREATE INDEX IF NOT EXISTS "automation_message_enrollment_id_idx" ON "automation_message"("enrollment_id");
CREATE INDEX IF NOT EXISTS "automation_message_status_idx" ON "automation_message"("status");
CREATE INDEX IF NOT EXISTS "automation_message_external_id_idx" ON "automation_message"("external_id");

-- Table: messaging_settings
-- Per-workspace messaging configuration and limits
CREATE TABLE IF NOT EXISTS "messaging_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "workspace_id" TEXT NOT NULL UNIQUE,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "email_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sms_daily_limit" INTEGER NOT NULL DEFAULT 100,
    "email_daily_limit" INTEGER NOT NULL DEFAULT 500,
    "quiet_hours_enabled" BOOLEAN NOT NULL DEFAULT true,
    "quiet_hours_start" INTEGER NOT NULL DEFAULT 21, -- 9 PM (hour in 24-hour format)
    "quiet_hours_end" INTEGER NOT NULL DEFAULT 8, -- 8 AM
    "quiet_hours_timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "respect_opt_outs" BOOLEAN NOT NULL DEFAULT true,
    "twilio_account_sid" TEXT,
    "twilio_auth_token" TEXT,
    "twilio_from_phone" TEXT,
    "sendgrid_api_key" TEXT,
    "sendgrid_from_email" TEXT,
    "sendgrid_from_name" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "messaging_settings_workspace_id_idx" ON "messaging_settings"("workspace_id");

-- Table: messaging_daily_usage
-- Tracks daily message counts per workspace for rate limiting
CREATE TABLE IF NOT EXISTS "messaging_daily_usage" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "workspace_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "channel" TEXT NOT NULL, -- 'sms' or 'email'
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("workspace_id", "date", "channel")
);

CREATE INDEX IF NOT EXISTS "messaging_daily_usage_workspace_date_idx" ON "messaging_daily_usage"("workspace_id", "date");

-- Add foreign key constraints
ALTER TABLE "automation_message" ADD CONSTRAINT "automation_message_workspace_id_fkey" 
    FOREIGN KEY ("workspace_id") REFERENCES "organization"("id") ON DELETE CASCADE;

ALTER TABLE "automation_message" ADD CONSTRAINT "automation_message_enrollment_id_fkey" 
    FOREIGN KEY ("enrollment_id") REFERENCES "automation_enrollment"("id") ON DELETE SET NULL;

ALTER TABLE "automation_message" ADD CONSTRAINT "automation_message_lead_id_fkey" 
    FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE;

ALTER TABLE "messaging_settings" ADD CONSTRAINT "messaging_settings_workspace_id_fkey" 
    FOREIGN KEY ("workspace_id") REFERENCES "organization"("id") ON DELETE CASCADE;

ALTER TABLE "messaging_daily_usage" ADD CONSTRAINT "messaging_daily_usage_workspace_id_fkey" 
    FOREIGN KEY ("workspace_id") REFERENCES "organization"("id") ON DELETE CASCADE;
