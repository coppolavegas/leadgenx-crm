-- CalGenX Phase 5: Appointments & Scheduling MVP
-- Add calgenx_enabled flag to organizations
ALTER TABLE "organizations" ADD COLUMN "calgenx_enabled" BOOLEAN NOT NULL DEFAULT false;

-- Create appointment_types table
CREATE TABLE "appointment_types" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "buffer_minutes" INTEGER NOT NULL DEFAULT 0,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_types_pkey" PRIMARY KEY ("id")
);

-- Create availability_rules table
CREATE TABLE "availability_rules" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "days_of_week" INTEGER[],
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);

-- Create appointments table
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "appointment_type_id" TEXT NOT NULL,
    "booked_by" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "cancel_reason" TEXT,
    "location_type" TEXT NOT NULL DEFAULT 'phone',
    "location_value" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- Create booking_links table
CREATE TABLE "booking_links" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "appointment_type_id" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_links_pkey" PRIMARY KEY ("id")
);

-- Create indexes for appointment_types
CREATE INDEX "appointment_types_workspace_id_idx" ON "appointment_types"("workspace_id");
CREATE INDEX "appointment_types_is_enabled_idx" ON "appointment_types"("is_enabled");

-- Create indexes for availability_rules
CREATE INDEX "availability_rules_workspace_id_idx" ON "availability_rules"("workspace_id");

-- Create indexes for appointments
CREATE INDEX "appointments_workspace_id_idx" ON "appointments"("workspace_id");
CREATE INDEX "appointments_lead_id_idx" ON "appointments"("lead_id");
CREATE INDEX "appointments_appointment_type_id_idx" ON "appointments"("appointment_type_id");
CREATE INDEX "appointments_start_at_idx" ON "appointments"("start_at");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");
CREATE INDEX "appointments_workspace_id_start_at_end_at_idx" ON "appointments"("workspace_id", "start_at", "end_at");

-- Create indexes for booking_links
CREATE INDEX "booking_links_workspace_id_idx" ON "booking_links"("workspace_id");
CREATE INDEX "booking_links_slug_idx" ON "booking_links"("slug");
CREATE INDEX "booking_links_is_enabled_idx" ON "booking_links"("is_enabled");

-- Create unique constraint for booking_links.slug
CREATE UNIQUE INDEX "booking_links_slug_key" ON "booking_links"("slug");

-- Add foreign key constraints
ALTER TABLE "appointment_types" ADD CONSTRAINT "appointment_types_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_appointment_type_id_fkey" FOREIGN KEY ("appointment_type_id") REFERENCES "appointment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "booking_links" ADD CONSTRAINT "booking_links_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_links" ADD CONSTRAINT "booking_links_appointment_type_id_fkey" FOREIGN KEY ("appointment_type_id") REFERENCES "appointment_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
