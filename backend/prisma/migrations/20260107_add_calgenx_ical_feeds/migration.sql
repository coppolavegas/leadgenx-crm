-- CalGenX iCalendar Subscription Feeds
-- Enables secure, token-based .ics calendar subscription URLs

CREATE TABLE calgenx_ical_feed (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id      TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Security: Cryptographically random, unguessable token
  token             TEXT NOT NULL UNIQUE,
  
  -- Control
  is_enabled        BOOLEAN NOT NULL DEFAULT true,
  name              TEXT,
  
  -- Tracking
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_rotated_at   TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_calgenx_ical_feed_workspace ON calgenx_ical_feed(workspace_id);
CREATE INDEX idx_calgenx_ical_feed_token ON calgenx_ical_feed(token) WHERE is_enabled = true;
CREATE UNIQUE INDEX idx_calgenx_ical_feed_workspace_unique ON calgenx_ical_feed(workspace_id) WHERE is_enabled = true;

-- Comments
COMMENT ON TABLE calgenx_ical_feed IS 'iCalendar subscription feeds for workspace appointments';
COMMENT ON COLUMN calgenx_ical_feed.token IS 'Cryptographically random token (32+ chars) for secure public access';
COMMENT ON COLUMN calgenx_ical_feed.is_enabled IS 'When false, .ics endpoint returns 404';
