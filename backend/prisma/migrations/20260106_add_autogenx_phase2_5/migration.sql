-- AutoGenX Phase 2.5: Delayed Steps, Conditional Branching, No-Reply Tracking

-- Update automation_enrollments table with execution context and scheduling
ALTER TABLE "automation_enrollments" ADD COLUMN "context_json" JSONB;
ALTER TABLE "automation_enrollments" ADD COLUMN "current_step_order" INTEGER;
ALTER TABLE "automation_enrollments" ADD COLUMN "next_run_at" TIMESTAMP(3);
ALTER TABLE "automation_enrollments" ADD COLUMN "locked_at" TIMESTAMP(3);
ALTER TABLE "automation_enrollments" ADD COLUMN "lock_owner" TEXT;

-- Update status column comment (now includes 'paused')
COMMENT ON COLUMN "automation_enrollments"."status" IS 'active | completed | failed | paused';

-- Add index for efficient polling of due enrollments
CREATE INDEX "automation_enrollments_next_run_at_idx" ON "automation_enrollments"("next_run_at");

-- Update leads table with inbound/outbound message tracking for no-reply detection
ALTER TABLE "leads" ADD COLUMN "last_inbound_message_at" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN "last_inbound_message_text" TEXT;
ALTER TABLE "leads" ADD COLUMN "last_outbound_message_at" TIMESTAMP(3);

-- Add indexes for message timestamp queries
CREATE INDEX "leads_last_inbound_message_at_idx" ON "leads"("last_inbound_message_at");
CREATE INDEX "leads_last_outbound_message_at_idx" ON "leads"("last_outbound_message_at");
