-- CreateEnum for conversation status
CREATE TYPE "ConversationStatus" AS ENUM ('active', 'qualified', 'scheduled', 'converted', 'abandoned');

-- CreateEnum for lead tier
CREATE TYPE "LeadTier" AS ENUM ('solo_exploratory', 'enterprise_agency', 'undetermined');

-- CreateEnum for recommended action
CREATE TYPE "RecommendedAction" AS ENUM ('free_trial', 'live_demo', 'undecided');

-- CreateTable: genie_conversation
CREATE TABLE "genie_conversation" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "visitor_email" TEXT,
    "visitor_name" TEXT,
    "visitor_company" TEXT,
    "visitor_role" TEXT,
    "lead_id" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'active',
    "qualification_score" INTEGER DEFAULT 0,
    "lead_tier" "LeadTier" DEFAULT 'undetermined',
    "recommended_action" "RecommendedAction" DEFAULT 'undecided',
    "context_data" JSONB DEFAULT '{}',
    "session_metadata" JSONB DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genie_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: genie_message
CREATE TABLE "genie_message" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "intent_detected" TEXT,
    "sentiment_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "genie_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable: genie_qualification
CREATE TABLE "genie_qualification" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "qualification_score" INTEGER NOT NULL DEFAULT 0,
    "lead_tier" "LeadTier" NOT NULL DEFAULT 'undetermined',
    "recommended_action" "RecommendedAction" NOT NULL DEFAULT 'undecided',
    "company_size" TEXT,
    "industry" TEXT,
    "use_case" TEXT,
    "budget_range" TEXT,
    "timeline" TEXT,
    "decision_maker" BOOLEAN DEFAULT false,
    "pain_points" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objections_raised" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "signals_detected" JSONB DEFAULT '{}',
    "qualification_data" JSONB DEFAULT '{}',
    "qualified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genie_qualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: genie_demo_request
CREATE TABLE "genie_demo_request" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "contact_email" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_phone" TEXT,
    "company_name" TEXT NOT NULL,
    "company_size" TEXT,
    "industry" TEXT,
    "preferred_date" TIMESTAMP(3),
    "preferred_time_slot" TEXT,
    "timezone" TEXT,
    "use_case_description" TEXT,
    "additional_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduled_at" TIMESTAMP(3),
    "meeting_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genie_demo_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "genie_conversation_organization_id_idx" ON "genie_conversation"("organization_id");
CREATE INDEX "genie_conversation_visitor_email_idx" ON "genie_conversation"("visitor_email");
CREATE INDEX "genie_conversation_status_idx" ON "genie_conversation"("status");
CREATE INDEX "genie_conversation_lead_tier_idx" ON "genie_conversation"("lead_tier");
CREATE INDEX "genie_conversation_started_at_idx" ON "genie_conversation"("started_at");

CREATE INDEX "genie_message_conversation_id_idx" ON "genie_message"("conversation_id");
CREATE INDEX "genie_message_created_at_idx" ON "genie_message"("created_at");

CREATE INDEX "genie_qualification_conversation_id_idx" ON "genie_qualification"("conversation_id");
CREATE INDEX "genie_qualification_organization_id_idx" ON "genie_qualification"("organization_id");
CREATE INDEX "genie_qualification_lead_tier_idx" ON "genie_qualification"("lead_tier");

CREATE INDEX "genie_demo_request_organization_id_idx" ON "genie_demo_request"("organization_id");
CREATE INDEX "genie_demo_request_status_idx" ON "genie_demo_request"("status");
CREATE INDEX "genie_demo_request_contact_email_idx" ON "genie_demo_request"("contact_email");

-- AddForeignKey
ALTER TABLE "genie_conversation" ADD CONSTRAINT "genie_conversation_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "genie_conversation" ADD CONSTRAINT "genie_conversation_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "genie_message" ADD CONSTRAINT "genie_message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "genie_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "genie_qualification" ADD CONSTRAINT "genie_qualification_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "genie_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "genie_qualification" ADD CONSTRAINT "genie_qualification_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "genie_qualification" ADD CONSTRAINT "genie_qualification_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "genie_demo_request" ADD CONSTRAINT "genie_demo_request_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "genie_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "genie_demo_request" ADD CONSTRAINT "genie_demo_request_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "genie_demo_request" ADD CONSTRAINT "genie_demo_request_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
