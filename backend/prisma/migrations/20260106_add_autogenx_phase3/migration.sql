-- AutoGenX Phase 3: AI-Powered Workflow Generation
-- Feature flag for AI workflow generation and audit log

-- Add autogenx_enabled feature flag to organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "autogenx_enabled" BOOLEAN NOT NULL DEFAULT true;

-- Create audit log table for prompt requests and generated workflows
CREATE TABLE IF NOT EXISTS "autogenx_prompt_logs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT,
    "prompt_text" TEXT NOT NULL,
    "generated_json" JSONB,
    "validation_errors" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "published_workflow_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autogenx_prompt_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes for querying
CREATE INDEX "autogenx_prompt_logs_workspace_id_idx" ON "autogenx_prompt_logs"("workspace_id");
CREATE INDEX "autogenx_prompt_logs_user_id_idx" ON "autogenx_prompt_logs"("user_id");
CREATE INDEX "autogenx_prompt_logs_created_at_idx" ON "autogenx_prompt_logs"("created_at" DESC);
CREATE INDEX "autogenx_prompt_logs_workspace_created_idx" ON "autogenx_prompt_logs"("workspace_id", "created_at" DESC);

-- Foreign key to workflows (optional, for tracking published workflows)
CREATE INDEX "autogenx_prompt_logs_published_workflow_id_idx" ON "autogenx_prompt_logs"("published_workflow_id");
