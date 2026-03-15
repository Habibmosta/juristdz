-- CALENDAR SYSTEM - Idempotent version

-- Drop everything
DROP VIEW IF EXISTS calendar_events_with_details CASCADE;
DROP VIEW IF EXISTS events_needing_reminder CASCADE;
DROP FUNCTION IF EXISTS get_upcoming_events(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS check_schedule_conflict(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) CASCADE;
DROP FUNCTION IF EXISTS auto_complete_past_events() CASCADE;
DROP FUNCTION IF EXISTS get_calendar_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_demo_calendar_events(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS auto_create_case_events() CASCADE;
DROP TRIGGER IF EXISTS trigger_update_calendar_events_updated_at ON calendar_events;
DROP TRIGGER IF EXISTS trigger_auto_create_case_events ON cases;
DROP FUNCTION IF EXISTS update_calendar_events_updated_at() CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;

-- Main table
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL DEFAULT 'other',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  location VARCHAR(300),
  location_type VARCHAR(50),
  attendees JSONB DEFAULT '[]'::jsonb,
  reminder_minutes INTEGER,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(100),
  recurrence_end_date DATE,
  parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  event_status VARCHAR(50) DEFAULT 'scheduled',
  color VARCHAR(7),
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_event_type CHECK (event_type IN ('hearing', 'meeting', 'deadline', 'consultation', 'other')),
  CONSTRAINT valid_event_status CHECK (event_status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  CONSTRAINT valid_location_type CHECK (location_type IS NULL OR location_type IN ('court', 'office', 'client', 'online', 'other')),
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_reminder CHECK (reminder_minutes IS NULL OR reminder_minutes > 0)
);

-- Indexes
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_case_id ON calendar_events(case_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_status ON calendar_events(event_status);
CREATE INDEX idx_calendar_events_reminder ON calendar_events(reminder_minutes, reminder_sent) WHERE reminder_minutes IS NOT NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

-- Function: upcoming events
CREATE OR REPLACE FUNCTION get_upcoming_events(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID, title VARCHAR, event_type VARCHAR,
  start_time TIMESTAMPTZ, end_time TIMESTAMPTZ,
  location VARCHAR, case_title TEXT, days_until INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id, ce.title, ce.event_type,
    ce.start_time, ce.end_time, ce.location,
    CASE WHEN c.case_number IS NOT NULL THEN c.case_number || ' - ' || c.title ELSE NULL END,
    EXTRACT(DAY FROM (ce.start_time - NOW()))::INTEGER
  FROM calendar_events ce
  LEFT JOIN cases c ON ce.case_id = c.id
  WHERE ce.user_id = p_user_id
    AND ce.event_status = 'scheduled'
    AND ce.start_time >= NOW()
    AND ce.start_time <= NOW() + (p_days || ' days')::INTERVAL
  ORDER BY ce.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function: conflict check
CREATE OR REPLACE FUNCTION check_schedule_conflict(
  p_user_id UUID, p_start_time TIMESTAMPTZ, p_end_time TIMESTAMPTZ,
  p_exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflict_event_id UUID, conflict_title VARCHAR,
  conflict_start TIMESTAMPTZ, conflict_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, title, start_time, end_time
  FROM calendar_events
  WHERE user_id = p_user_id
    AND event_status = 'scheduled'
    AND (id != p_exclude_event_id OR p_exclude_event_id IS NULL)
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    );
END;
$$ LANGUAGE plpgsql;

-- Function: auto complete past events
CREATE OR REPLACE FUNCTION auto_complete_past_events()
RETURNS void AS $$
BEGIN
  UPDATE calendar_events
  SET event_status = 'completed'
  WHERE event_status = 'scheduled' AND end_time < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function: calendar stats
CREATE OR REPLACE FUNCTION get_calendar_stats(p_user_id UUID)
RETURNS TABLE (
  total_events BIGINT, scheduled_count BIGINT, completed_count BIGINT,
  cancelled_count BIGINT, hearings_count BIGINT, meetings_count BIGINT,
  deadlines_count BIGINT, upcoming_this_week BIGINT, upcoming_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE event_status = 'scheduled')::BIGINT,
    COUNT(*) FILTER (WHERE event_status = 'completed')::BIGINT,
    COUNT(*) FILTER (WHERE event_status = 'cancelled')::BIGINT,
    COUNT(*) FILTER (WHERE event_type = 'hearing')::BIGINT,
    COUNT(*) FILTER (WHERE event_type = 'meeting')::BIGINT,
    COUNT(*) FILTER (WHERE event_type = 'deadline')::BIGINT,
    COUNT(*) FILTER (WHERE event_status = 'scheduled' AND start_time >= NOW() AND start_time <= NOW() + INTERVAL '7 days')::BIGINT,
    COUNT(*) FILTER (WHERE event_status = 'scheduled' AND start_time >= NOW() AND start_time <= NOW() + INTERVAL '30 days')::BIGINT
  FROM calendar_events WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- View: events with details
CREATE OR REPLACE VIEW calendar_events_with_details AS
SELECT
  ce.*,
  c.case_number, c.title as case_title,
  cl.first_name || ' ' || cl.last_name as client_name,
  CASE WHEN ce.start_time > NOW() THEN EXTRACT(EPOCH FROM (ce.start_time - NOW()))::INTEGER ELSE 0 END as seconds_until_start,
  EXTRACT(EPOCH FROM (ce.end_time - ce.start_time))::INTEGER / 60 as duration_minutes
FROM calendar_events ce
LEFT JOIN cases c ON ce.case_id = c.id
LEFT JOIN clients cl ON c.client_id = cl.id;

-- View: events needing reminder
CREATE OR REPLACE VIEW events_needing_reminder AS
SELECT ce.*, c.case_number, c.title as case_title
FROM calendar_events ce
LEFT JOIN cases c ON ce.case_id = c.id
WHERE ce.reminder_minutes IS NOT NULL
  AND ce.reminder_sent = FALSE
  AND ce.event_status = 'scheduled'
  AND ce.start_time - (ce.reminder_minutes || ' minutes')::INTERVAL <= NOW()
  AND ce.start_time > NOW();

-- RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON calendar_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events"
  ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Function: auto create events from cases
CREATE OR REPLACE FUNCTION auto_create_case_events()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.next_hearing_date IS NOT NULL THEN
    INSERT INTO calendar_events (
      user_id, case_id, title, event_type,
      start_time, end_time, location, location_type, reminder_minutes, color
    ) VALUES (
      NEW.user_id, NEW.id, 'Audience - ' || NEW.title, 'hearing',
      NEW.next_hearing_date, NEW.next_hearing_date + INTERVAL '2 hours',
      NEW.court_name, 'court', 60, '#ef4444'
    ) ON CONFLICT DO NOTHING;
  END IF;
  IF NEW.deadline IS NOT NULL THEN
    INSERT INTO calendar_events (
      user_id, case_id, title, event_type,
      start_time, end_time, reminder_minutes, color, all_day
    ) VALUES (
      NEW.user_id, NEW.id, 'Date limite - ' || NEW.title, 'deadline',
      NEW.deadline, NEW.deadline + INTERVAL '1 hour',
      1440, '#f97316', TRUE
    ) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_case_events
  AFTER INSERT OR UPDATE OF next_hearing_date, deadline ON cases
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_case_events();
