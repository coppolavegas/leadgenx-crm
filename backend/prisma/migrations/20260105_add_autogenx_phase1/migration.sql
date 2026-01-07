-- AutoGenX Phase 1: Event Spine
-- Create automation_events table
CREATE TABLE "automation_events" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT,
  "lead_id" TEXT,
  "event_type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),
  
  CONSTRAINT "automation_events_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX "automation_events_workspace_id_idx" ON "automation_events"("workspace_id");
CREATE INDEX "automation_events_lead_id_idx" ON "automation_events"("lead_id");
CREATE INDEX "automation_events_status_idx" ON "automation_events"("status");
CREATE INDEX "automation_events_event_type_idx" ON "automation_events"("event_type");
CREATE INDEX "automation_events_created_at_idx" ON "automation_events"("created_at");

-- Add foreign key constraints
ALTER TABLE "automation_events" ADD CONSTRAINT "automation_events_workspace_id_fkey" 
  FOREIGN KEY ("workspace_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_events" ADD CONSTRAINT "automation_events_lead_id_fkey" 
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
