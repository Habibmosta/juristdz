-- =====================================================
-- SCRIPT DE CORRECTION - CALENDRIER
-- À exécuter si la table calendar_events existe déjà
-- =====================================================

-- Option 1: Supprimer et recréer (ATTENTION: perte de données!)
-- Décommente si tu veux tout recommencer
/*
DROP TABLE IF EXISTS calendar_events CASCADE;
*/

-- Option 2: Vérifier et corriger la structure existante
DO $$
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    RAISE NOTICE 'Table calendar_events existe déjà';
    
    -- Ajouter les colonnes manquantes
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'reminder_sent') THEN
      RAISE NOTICE 'Ajout colonne reminder_sent...';
      ALTER TABLE calendar_events ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'reminder_sent_at') THEN
      ALTER TABLE calendar_events ADD COLUMN reminder_sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'is_recurring') THEN
      ALTER TABLE calendar_events ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'recurrence_rule') THEN
      ALTER TABLE calendar_events ADD COLUMN recurrence_rule VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'recurrence_end_date') THEN
      ALTER TABLE calendar_events ADD COLUMN recurrence_end_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'parent_event_id') THEN
      ALTER TABLE calendar_events ADD COLUMN parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'all_day') THEN
      ALTER TABLE calendar_events ADD COLUMN all_day BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'location_type') THEN
      ALTER TABLE calendar_events ADD COLUMN location_type VARCHAR(50) CHECK (location_type IN ('court', 'office', 'client', 'online', 'other'));
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'attendees') THEN
      ALTER TABLE calendar_events ADD COLUMN attendees JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'color') THEN
      ALTER TABLE calendar_events ADD COLUMN color VARCHAR(7);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'notes') THEN
      ALTER TABLE calendar_events ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'calendar_events' AND column_name = 'attachments') THEN
      ALTER TABLE calendar_events ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    RAISE NOTICE '✅ Colonnes vérifiées/ajoutées';
  ELSE
    RAISE NOTICE '❌ Table calendar_events n''existe pas, exécutez create-calendar.sql';
  END IF;
END $$;

-- Créer les index manquants
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_case_id ON calendar_events(case_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_reminder ON calendar_events(reminder_minutes, reminder_sent) WHERE reminder_minutes IS NOT NULL;

-- Recréer les fonctions
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER trigger_update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();

-- Fonction pour obtenir les événements à venir
CREATE OR REPLACE FUNCTION get_upcoming_events(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  event_type VARCHAR,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  location VARCHAR,
  case_title TEXT,
  days_until INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.title,
    ce.event_type,
    ce.start_time,
    ce.end_time,
    ce.location,
    CASE 
      WHEN c.case_number IS NOT NULL THEN c.case_number || ' - ' || c.title
      ELSE NULL
    END as case_title,
    EXTRACT(DAY FROM (ce.start_time - NOW()))::INTEGER as days_until
  FROM calendar_events ce
  LEFT JOIN cases c ON ce.case_id = c.id
  WHERE ce.user_id = p_user_id
    AND ce.status = 'scheduled'
    AND ce.start_time >= NOW()
    AND ce.start_time <= NOW() + (p_days || ' days')::INTERVAL
  ORDER BY ce.start_time;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour détecter les conflits d'horaire
CREATE OR REPLACE FUNCTION check_schedule_conflict(
  p_user_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflict_event_id UUID,
  conflict_title VARCHAR,
  conflict_start TIMESTAMP WITH TIME ZONE,
  conflict_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    title,
    start_time,
    end_time
  FROM calendar_events
  WHERE user_id = p_user_id
    AND status = 'scheduled'
    AND (id != p_exclude_event_id OR p_exclude_event_id IS NULL)
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer les événements passés comme complétés
CREATE OR REPLACE FUNCTION auto_complete_past_events()
RETURNS void AS $$
BEGIN
  UPDATE calendar_events
  SET status = 'completed'
  WHERE status = 'scheduled'
    AND end_time < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques du calendrier
CREATE OR REPLACE FUNCTION get_calendar_stats(p_user_id UUID)
RETURNS TABLE (
  total_events BIGINT,
  scheduled_count BIGINT,
  completed_count BIGINT,
  cancelled_count BIGINT,
  hearings_count BIGINT,
  meetings_count BIGINT,
  deadlines_count BIGINT,
  upcoming_this_week BIGINT,
  upcoming_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_events,
    COUNT(*) FILTER (WHERE status = 'scheduled')::BIGINT as scheduled_count,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_count,
    COUNT(*) FILTER (WHERE event_type = 'hearing')::BIGINT as hearings_count,
    COUNT(*) FILTER (WHERE event_type = 'meeting')::BIGINT as meetings_count,
    COUNT(*) FILTER (WHERE event_type = 'deadline')::BIGINT as deadlines_count,
    COUNT(*) FILTER (WHERE status = 'scheduled' AND start_time >= NOW() AND start_time <= NOW() + INTERVAL '7 days')::BIGINT as upcoming_this_week,
    COUNT(*) FILTER (WHERE status = 'scheduled' AND start_time >= NOW() AND start_time <= NOW() + INTERVAL '30 days')::BIGINT as upcoming_this_month
  FROM calendar_events
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Recréer les vues
DROP VIEW IF EXISTS calendar_events_with_details CASCADE;
CREATE OR REPLACE VIEW calendar_events_with_details AS
SELECT 
  ce.*,
  c.case_number,
  c.title as case_title,
  c.status as case_status,
  cl.first_name || ' ' || cl.last_name as client_name,
  CASE 
    WHEN ce.start_time > NOW() THEN 
      EXTRACT(EPOCH FROM (ce.start_time - NOW()))::INTEGER
    ELSE 0
  END as seconds_until_start,
  EXTRACT(EPOCH FROM (ce.end_time - ce.start_time))::INTEGER / 60 as duration_minutes
FROM calendar_events ce
LEFT JOIN cases c ON ce.case_id = c.id
LEFT JOIN clients cl ON c.client_id = cl.id;

DROP VIEW IF EXISTS events_needing_reminder CASCADE;
CREATE OR REPLACE VIEW events_needing_reminder AS
SELECT 
  ce.*,
  c.case_number,
  c.title as case_title
FROM calendar_events ce
LEFT JOIN cases c ON ce.case_id = c.id
WHERE ce.reminder_minutes IS NOT NULL
  AND ce.reminder_sent = FALSE
  AND ce.status = 'scheduled'
  AND ce.start_time - (ce.reminder_minutes || ' minutes')::INTERVAL <= NOW()
  AND ce.start_time > NOW();

-- Activer RLS si pas déjà fait
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Recréer les politiques RLS
DROP POLICY IF EXISTS "Users can view own events" ON calendar_events;
CREATE POLICY "Users can view own events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own events" ON calendar_events;
CREATE POLICY "Users can create own events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own events" ON calendar_events;
CREATE POLICY "Users can update own events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own events" ON calendar_events;
CREATE POLICY "Users can delete own events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Script de correction calendrier exécuté avec succès!';
  RAISE NOTICE 'Vous pouvez maintenant utiliser le système de calendrier';
END $$;
