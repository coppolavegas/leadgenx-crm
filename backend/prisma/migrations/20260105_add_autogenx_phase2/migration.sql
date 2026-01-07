-- AutoGenX Phase 2: Workflow Rules and Execution Engine

-- Table: automation_workflows
CREATE TABLE "automation_workflows" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_event_type" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_workflows_pkey" PRIMARY KEY ("id")
);

-- Table: automation_steps
CREATE TABLE "automation_steps" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_steps_pkey" PRIMARY KEY ("id")
);

-- Table: automation_enrollments
CREATE TABLE "automation_enrollments" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "event_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "last_error" TEXT,

    CONSTRAINT "automation_enrollments_pkey" PRIMARY KEY ("id")
);

-- Table: automation_runs
CREATE TABLE "automation_runs" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'started',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

-- Unique constraint for idempotency: one enrollment per event+workflow
CREATE UNIQUE INDEX "automation_enrollments_event_id_workflow_id_key" ON "automation_enrollments"("event_id", "workflow_id");

-- Indexes for automation_workflows
CREATE INDEX "automation_workflows_workspace_id_idx" ON "automation_workflows"("workspace_id");
CREATE INDEX "automation_workflows_trigger_event_type_idx" ON "automation_workflows"("trigger_event_type");
CREATE INDEX "automation_workflows_is_enabled_idx" ON "automation_workflows"("is_enabled");

-- Indexes for automation_steps
CREATE INDEX "automation_steps_workflow_id_idx" ON "automation_steps"("workflow_id");
CREATE INDEX "automation_steps_step_order_idx" ON "automation_steps"("step_order");

-- Indexes for automation_enrollments
CREATE INDEX "automation_enrollments_workflow_id_idx" ON "automation_enrollments"("workflow_id");
CREATE INDEX "automation_enrollments_workspace_id_idx" ON "automation_enrollments"("workspace_id");
CREATE INDEX "automation_enrollments_lead_id_idx" ON "automation_enrollments"("lead_id");
CREATE INDEX "automation_enrollments_status_idx" ON "automation_enrollments"("status");

-- Indexes for automation_runs
CREATE INDEX "automation_runs_enrollment_id_idx" ON "automation_runs"("enrollment_id");
CREATE INDEX "automation_runs_step_id_idx" ON "automation_runs"("step_id");
CREATE INDEX "automation_runs_status_idx" ON "automation_runs"("status");

-- Foreign Keys
ALTER TABLE "automation_workflows" ADD CONSTRAINT "automation_workflows_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_steps" ADD CONSTRAINT "automation_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "automation_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "automation_enrollments" ADD CONSTRAINT "automation_enrollments_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "automation_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_enrollments" ADD CONSTRAINT "automation_enrollments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_enrollments" ADD CONSTRAINT "automation_enrollments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "automation_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "automation_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
