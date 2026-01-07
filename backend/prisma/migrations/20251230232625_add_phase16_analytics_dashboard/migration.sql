-- CreateTable
CREATE TABLE "analytics_metrics" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "client_id" TEXT,
    "metric_name" TEXT NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "granularity" TEXT NOT NULL,
    "campaign_id" TEXT,
    "source" TEXT,
    "status" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_attributions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "client_id" TEXT,
    "lead_id" TEXT NOT NULL,
    "discovery_source" TEXT,
    "campaign_id" TEXT,
    "template_id" TEXT,
    "template_name" TEXT,
    "was_contacted" BOOLEAN NOT NULL DEFAULT false,
    "first_contact_at" TIMESTAMP(3),
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "first_reply_at" TIMESTAMP(3),
    "reply_time_hours" DOUBLE PRECISION,
    "meeting_booked" BOOLEAN NOT NULL DEFAULT false,
    "meeting_booked_at" TIMESTAMP(3),
    "meeting_time_hours" DOUBLE PRECISION,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "converted_at" TIMESTAMP(3),
    "conversion_value" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_funnel_stages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "client_id" TEXT,
    "stage_name" TEXT NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "lead_id" TEXT NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exited_at" TIMESTAMP(3),
    "time_in_stage_hours" DOUBLE PRECISION,
    "campaign_id" TEXT,

    CONSTRAINT "analytics_funnel_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_template_performance" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "client_id" TEXT,
    "template_id" TEXT,
    "template_name" TEXT NOT NULL,
    "template_type" TEXT NOT NULL,
    "sends_count" INTEGER NOT NULL DEFAULT 0,
    "opens_count" INTEGER NOT NULL DEFAULT 0,
    "clicks_count" INTEGER NOT NULL DEFAULT 0,
    "replies_count" INTEGER NOT NULL DEFAULT 0,
    "bounces_count" INTEGER NOT NULL DEFAULT 0,
    "open_rate" DOUBLE PRECISION,
    "click_rate" DOUBLE PRECISION,
    "reply_rate" DOUBLE PRECISION,
    "bounce_rate" DOUBLE PRECISION,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_template_performance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_metrics_organization_id_idx" ON "analytics_metrics"("organization_id");

-- CreateIndex
CREATE INDEX "analytics_metrics_client_id_idx" ON "analytics_metrics"("client_id");

-- CreateIndex
CREATE INDEX "analytics_metrics_metric_name_idx" ON "analytics_metrics"("metric_name");

-- CreateIndex
CREATE INDEX "analytics_metrics_date_idx" ON "analytics_metrics"("date");

-- CreateIndex
CREATE INDEX "analytics_metrics_granularity_idx" ON "analytics_metrics"("granularity");

-- CreateIndex
CREATE INDEX "analytics_metrics_campaign_id_idx" ON "analytics_metrics"("campaign_id");

-- CreateIndex
CREATE INDEX "analytics_metrics_source_idx" ON "analytics_metrics"("source");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_metrics_organization_id_client_id_metric_name_dat_key" ON "analytics_metrics"("organization_id", "client_id", "metric_name", "date", "granularity", "campaign_id", "source");

-- CreateIndex
CREATE INDEX "analytics_attributions_organization_id_idx" ON "analytics_attributions"("organization_id");

-- CreateIndex
CREATE INDEX "analytics_attributions_client_id_idx" ON "analytics_attributions"("client_id");

-- CreateIndex
CREATE INDEX "analytics_attributions_lead_id_idx" ON "analytics_attributions"("lead_id");

-- CreateIndex
CREATE INDEX "analytics_attributions_campaign_id_idx" ON "analytics_attributions"("campaign_id");

-- CreateIndex
CREATE INDEX "analytics_attributions_discovery_source_idx" ON "analytics_attributions"("discovery_source");

-- CreateIndex
CREATE INDEX "analytics_attributions_template_name_idx" ON "analytics_attributions"("template_name");

-- CreateIndex
CREATE INDEX "analytics_attributions_was_contacted_idx" ON "analytics_attributions"("was_contacted");

-- CreateIndex
CREATE INDEX "analytics_attributions_replied_idx" ON "analytics_attributions"("replied");

-- CreateIndex
CREATE INDEX "analytics_attributions_meeting_booked_idx" ON "analytics_attributions"("meeting_booked");

-- CreateIndex
CREATE INDEX "analytics_attributions_converted_idx" ON "analytics_attributions"("converted");

-- CreateIndex
CREATE INDEX "analytics_funnel_stages_organization_id_idx" ON "analytics_funnel_stages"("organization_id");

-- CreateIndex
CREATE INDEX "analytics_funnel_stages_client_id_idx" ON "analytics_funnel_stages"("client_id");

-- CreateIndex
CREATE INDEX "analytics_funnel_stages_stage_name_idx" ON "analytics_funnel_stages"("stage_name");

-- CreateIndex
CREATE INDEX "analytics_funnel_stages_stage_order_idx" ON "analytics_funnel_stages"("stage_order");

-- CreateIndex
CREATE INDEX "analytics_funnel_stages_lead_id_idx" ON "analytics_funnel_stages"("lead_id");

-- CreateIndex
CREATE INDEX "analytics_funnel_stages_campaign_id_idx" ON "analytics_funnel_stages"("campaign_id");

-- CreateIndex
CREATE INDEX "analytics_funnel_stages_entered_at_idx" ON "analytics_funnel_stages"("entered_at");

-- CreateIndex
CREATE INDEX "analytics_template_performance_organization_id_idx" ON "analytics_template_performance"("organization_id");

-- CreateIndex
CREATE INDEX "analytics_template_performance_client_id_idx" ON "analytics_template_performance"("client_id");

-- CreateIndex
CREATE INDEX "analytics_template_performance_template_name_idx" ON "analytics_template_performance"("template_name");

-- CreateIndex
CREATE INDEX "analytics_template_performance_template_type_idx" ON "analytics_template_performance"("template_type");

-- CreateIndex
CREATE INDEX "analytics_template_performance_period_start_idx" ON "analytics_template_performance"("period_start");

-- CreateIndex
CREATE INDEX "analytics_template_performance_period_end_idx" ON "analytics_template_performance"("period_end");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_template_performance_organization_id_client_id_te_key" ON "analytics_template_performance"("organization_id", "client_id", "template_name", "period_start", "period_end");

-- AddForeignKey
ALTER TABLE "analytics_metrics" ADD CONSTRAINT "analytics_metrics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_metrics" ADD CONSTRAINT "analytics_metrics_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_metrics" ADD CONSTRAINT "analytics_metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_attributions" ADD CONSTRAINT "analytics_attributions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_attributions" ADD CONSTRAINT "analytics_attributions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_attributions" ADD CONSTRAINT "analytics_attributions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_attributions" ADD CONSTRAINT "analytics_attributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_funnel_stages" ADD CONSTRAINT "analytics_funnel_stages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_funnel_stages" ADD CONSTRAINT "analytics_funnel_stages_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_funnel_stages" ADD CONSTRAINT "analytics_funnel_stages_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_funnel_stages" ADD CONSTRAINT "analytics_funnel_stages_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_template_performance" ADD CONSTRAINT "analytics_template_performance_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_template_performance" ADD CONSTRAINT "analytics_template_performance_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
