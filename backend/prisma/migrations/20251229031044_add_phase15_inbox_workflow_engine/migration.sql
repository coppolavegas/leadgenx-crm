-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "is_overdue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_touch_at" TIMESTAMP(3),
ADD COLUMN     "overdue_since" TIMESTAMP(3),
ADD COLUMN     "overdue_threshold_hours" INTEGER NOT NULL DEFAULT 48;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "auto_created" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "auto_rule" TEXT,
ADD COLUMN     "related_task_id" TEXT,
ADD COLUMN     "snoozed_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "inbox_items" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "activity_id" TEXT,
    "task_id" TEXT,
    "message_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbox_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inbox_items_client_id_created_at_idx" ON "inbox_items"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "inbox_items_lead_id_idx" ON "inbox_items"("lead_id");

-- CreateIndex
CREATE INDEX "inbox_items_type_idx" ON "inbox_items"("type");

-- CreateIndex
CREATE INDEX "inbox_items_read_idx" ON "inbox_items"("read");

-- CreateIndex
CREATE INDEX "inbox_items_starred_idx" ON "inbox_items"("starred");

-- CreateIndex
CREATE INDEX "leads_last_touch_at_idx" ON "leads"("last_touch_at");

-- CreateIndex
CREATE INDEX "leads_is_overdue_idx" ON "leads"("is_overdue");

-- CreateIndex
CREATE INDEX "tasks_snoozed_until_idx" ON "tasks"("snoozed_until");

-- CreateIndex
CREATE INDEX "tasks_auto_created_idx" ON "tasks"("auto_created");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_related_task_id_fkey" FOREIGN KEY ("related_task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "message_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
