-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "contact_page_url" TEXT,
    "rating" DOUBLE PRECISION,
    "review_count" INTEGER,
    "source" TEXT NOT NULL,
    "source_url" TEXT,
    "place_id" TEXT,
    "yelp_id" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_lead" BOOLEAN NOT NULL DEFAULT false,
    "discovered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enriched_leads" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "contact_page_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contact_form_url" TEXT,
    "emails_found" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "phones_found" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "social_links" JSONB NOT NULL DEFAULT '{}',
    "address_found" JSONB,
    "enrichment_status" TEXT NOT NULL,
    "enrichment_log" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pages_crawled" INTEGER NOT NULL DEFAULT 0,
    "crawl_depth" INTEGER NOT NULL DEFAULT 0,
    "crawl_duration_ms" INTEGER NOT NULL DEFAULT 0,
    "bot_detected" BOOLEAN NOT NULL DEFAULT false,
    "fallback_used" BOOLEAN NOT NULL DEFAULT false,
    "enriched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enriched_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocklists" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "reason" TEXT,
    "added_by" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocklists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_place_id_key" ON "leads"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_yelp_id_key" ON "leads"("yelp_id");

-- CreateIndex
CREATE INDEX "leads_name_address_idx" ON "leads"("name", "address");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE INDEX "leads_is_lead_idx" ON "leads"("is_lead");

-- CreateIndex
CREATE INDEX "leads_discovered_at_idx" ON "leads"("discovered_at");

-- CreateIndex
CREATE UNIQUE INDEX "enriched_leads_lead_id_key" ON "enriched_leads"("lead_id");

-- CreateIndex
CREATE INDEX "enriched_leads_lead_id_idx" ON "enriched_leads"("lead_id");

-- CreateIndex
CREATE INDEX "enriched_leads_enrichment_status_idx" ON "enriched_leads"("enrichment_status");

-- CreateIndex
CREATE INDEX "enriched_leads_enriched_at_idx" ON "enriched_leads"("enriched_at");

-- CreateIndex
CREATE UNIQUE INDEX "blocklists_domain_key" ON "blocklists"("domain");

-- CreateIndex
CREATE INDEX "blocklists_domain_idx" ON "blocklists"("domain");

-- AddForeignKey
ALTER TABLE "enriched_leads" ADD CONSTRAINT "enriched_leads_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
