-- CalGenX Phase 5.5A: Google Calendar Integration
-- Add Google Calendar connection support for busy-time blocking and event creation

-- Create google_calendar_connections table
CREATE TABLE IF NOT EXISTS "google_calendar_connections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspace_id" TEXT NOT NULL UNIQUE,
    "created_by_user_id" TEXT,
    "google_user_email" TEXT,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(3) NOT NULL,
    "calendar_id" TEXT NOT NULL DEFAULT 'primary',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_synced_at" TIMESTAMP(3),
    CONSTRAINT "google_calendar_connections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add indexes for google_calendar_connections
CREATE INDEX IF NOT EXISTS "google_calendar_connections_workspace_id_idx" ON "google_calendar_connections"("workspace_id");
CREATE INDEX IF NOT EXISTS "google_calendar_connections_is_enabled_idx" ON "google_calendar_connections"("is_enabled");

-- Add Google Calendar fields to appointments table
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "google_event_id" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "google_calendar_id" TEXT;

-- Add index for google_event_id for faster lookups
CREATE INDEX IF NOT EXISTS "appointments_google_event_id_idx" ON "appointments"("google_event_id");
