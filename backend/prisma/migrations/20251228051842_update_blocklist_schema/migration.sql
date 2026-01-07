-- Drop existing blocklist table and recreate with proper schema
DROP TABLE IF EXISTS "blocklists";

-- CreateTable: blocklist with organization support
CREATE TABLE "blocklists" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocklists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blocklists_organization_id_domain_key" ON "blocklists"("organization_id", "domain");
CREATE INDEX "blocklists_organization_id_idx" ON "blocklists"("organization_id");
CREATE INDEX "blocklists_domain_idx" ON "blocklists"("domain");
