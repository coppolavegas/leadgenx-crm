-- AutoGenX Phase 4.5: Messaging Compliance & Inbound Handling
-- Extends automation_message and lead models for production messaging

-- Add opt-out tracking to leads
ALTER TABLE "lead" ADD COLUMN IF NOT EXISTS "sms_opt_out" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lead" ADD COLUMN IF NOT EXISTS "email_opt_out" BOOLEAN NOT NULL DEFAULT false;

-- Add compliance and inbound fields to automation_message
ALTER TABLE "automation_message" ADD COLUMN IF NOT EXISTS "received_at" TIMESTAMP(3);
ALTER TABLE "automation_message" ADD COLUMN IF NOT EXISTS "metadata_json" JSONB;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "automation_message_channel_direction_idx" ON "automation_message"("channel", "direction");
CREATE INDEX IF NOT EXISTS "automation_message_created_at_idx" ON "automation_message"("created_at");

-- Create index for opt-out queries
CREATE INDEX IF NOT EXISTS "lead_sms_opt_out_idx" ON "lead"("sms_opt_out") WHERE "sms_opt_out" = true;
CREATE INDEX IF NOT EXISTS "lead_email_opt_out_idx" ON "lead"("email_opt_out") WHERE "email_opt_out" = true;

-- Comment on new fields
COMMENT ON COLUMN "lead"."sms_opt_out" IS 'Lead opted out of SMS messages via STOP keyword';
COMMENT ON COLUMN "lead"."email_opt_out" IS 'Lead opted out of email messages via UNSUBSCRIBE';
COMMENT ON COLUMN "automation_message"."received_at" IS 'When inbound message was received from lead';
COMMENT ON COLUMN "automation_message"."metadata_json" IS 'Provider-specific metadata (webhooks, raw payloads)';
