-- CreateTable
CREATE TABLE "x_suite_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "api_base_url" TEXT NOT NULL,
    "webhook_secret" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "x_suite_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "x_suite_webhooks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "source_product" TEXT NOT NULL,
    "target_product" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "secret" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_triggered_at" TIMESTAMP(3),
    "last_success_at" TIMESTAMP(3),
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,

    CONSTRAINT "x_suite_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "x_suite_event_logs" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_version" TEXT NOT NULL DEFAULT '1.0',
    "source_product" TEXT NOT NULL,
    "target_product" TEXT,
    "organization_id" TEXT NOT NULL,
    "client_id" TEXT,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "delivery_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_delivery_attempt" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "x_suite_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "x_suite_products_slug_key" ON "x_suite_products"("slug");

-- CreateIndex
CREATE INDEX "x_suite_products_slug_idx" ON "x_suite_products"("slug");

-- CreateIndex
CREATE INDEX "x_suite_products_is_active_idx" ON "x_suite_products"("is_active");

-- CreateIndex
CREATE INDEX "x_suite_webhooks_organization_id_idx" ON "x_suite_webhooks"("organization_id");

-- CreateIndex
CREATE INDEX "x_suite_webhooks_source_product_idx" ON "x_suite_webhooks"("source_product");

-- CreateIndex
CREATE INDEX "x_suite_webhooks_target_product_idx" ON "x_suite_webhooks"("target_product");

-- CreateIndex
CREATE INDEX "x_suite_webhooks_is_active_idx" ON "x_suite_webhooks"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "x_suite_event_logs_event_id_key" ON "x_suite_event_logs"("event_id");

-- CreateIndex
CREATE INDEX "x_suite_event_logs_organization_id_idx" ON "x_suite_event_logs"("organization_id");

-- CreateIndex
CREATE INDEX "x_suite_event_logs_client_id_idx" ON "x_suite_event_logs"("client_id");

-- CreateIndex
CREATE INDEX "x_suite_event_logs_event_name_idx" ON "x_suite_event_logs"("event_name");

-- CreateIndex
CREATE INDEX "x_suite_event_logs_source_product_idx" ON "x_suite_event_logs"("source_product");

-- CreateIndex
CREATE INDEX "x_suite_event_logs_target_product_idx" ON "x_suite_event_logs"("target_product");

-- CreateIndex
CREATE INDEX "x_suite_event_logs_status_idx" ON "x_suite_event_logs"("status");

-- CreateIndex
CREATE INDEX "x_suite_event_logs_created_at_idx" ON "x_suite_event_logs"("created_at");
