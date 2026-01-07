-- CreateTable
CREATE TABLE "outreach_sequences" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "max_daily_emails" INTEGER,
    "sending_hours" JSONB,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_steps" (
    "id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'email',
    "delay_days" INTEGER NOT NULL DEFAULT 0,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_enrollments" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paused_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "unsubscribed_at" TIMESTAMP(3),
    "last_message_at" TIMESTAMP(3),
    "next_scheduled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'email',
    "provider" TEXT,
    "provider_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "subject" TEXT,
    "body" TEXT,
    "recipient_email" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "replied_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outreach_sequences_client_id_idx" ON "outreach_sequences"("client_id");

-- CreateIndex
CREATE INDEX "outreach_sequences_status_idx" ON "outreach_sequences"("status");

-- CreateIndex
CREATE INDEX "outreach_sequences_created_by_user_id_idx" ON "outreach_sequences"("created_by_user_id");

-- CreateIndex
CREATE INDEX "outreach_steps_sequence_id_idx" ON "outreach_steps"("sequence_id");

-- CreateIndex
CREATE UNIQUE INDEX "outreach_steps_sequence_id_step_order_key" ON "outreach_steps"("sequence_id", "step_order");

-- CreateIndex
CREATE INDEX "outreach_enrollments_lead_id_idx" ON "outreach_enrollments"("lead_id");

-- CreateIndex
CREATE INDEX "outreach_enrollments_sequence_id_idx" ON "outreach_enrollments"("sequence_id");

-- CreateIndex
CREATE INDEX "outreach_enrollments_status_idx" ON "outreach_enrollments"("status");

-- CreateIndex
CREATE INDEX "outreach_enrollments_next_scheduled_at_idx" ON "outreach_enrollments"("next_scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "outreach_enrollments_lead_id_sequence_id_key" ON "outreach_enrollments"("lead_id", "sequence_id");

-- CreateIndex
CREATE INDEX "message_logs_lead_id_idx" ON "message_logs"("lead_id");

-- CreateIndex
CREATE INDEX "message_logs_sequence_id_idx" ON "message_logs"("sequence_id");

-- CreateIndex
CREATE INDEX "message_logs_enrollment_id_idx" ON "message_logs"("enrollment_id");

-- CreateIndex
CREATE INDEX "message_logs_status_idx" ON "message_logs"("status");

-- CreateIndex
CREATE INDEX "message_logs_sent_at_idx" ON "message_logs"("sent_at");

-- CreateIndex
CREATE INDEX "message_logs_provider_id_idx" ON "message_logs"("provider_id");

-- AddForeignKey
ALTER TABLE "outreach_sequences" ADD CONSTRAINT "outreach_sequences_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_sequences" ADD CONSTRAINT "outreach_sequences_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_steps" ADD CONSTRAINT "outreach_steps_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "outreach_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_enrollments" ADD CONSTRAINT "outreach_enrollments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_enrollments" ADD CONSTRAINT "outreach_enrollments_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "outreach_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "outreach_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "outreach_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "outreach_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
