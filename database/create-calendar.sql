-- =====================================================
-- SYSTÈME DE CALENDRIER INTELLIGENT
-- Création des tables, fonctions et vues pour JuristDZ
-- =====================================================

-- Table principale des événements du calendrier
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  
  -- Informations de l'événement
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL DEFAULT 'other' CHECK (event_type IN ('hearing', 'meeting', 'deadline', 'consultation', 'other')),
  
  -- Date et heure
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  
  -- Localisation
  location VARCHAR(300),
  location_type VARCHAR(50) CHECK (location_type IN ('court', 'office', 'client', 'online', 'other')),
  
  -- Participants
  attendees JSONB DEFAULT '[]'::jsonb, -- Liste des participants
  
  -- Rappels
  reminder_minutes INTEGER, -- Minutes avant l'événement pour le rappel
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Récurrence (pour événements répétitifs)
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(100), -- Format: DAILY, WEEKLY, MONTHLY, etc.
  recurrence_end_date DATE,
  parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  -- Statut
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  
  -- Couleur personnalisée
  color VARCHAR(7), -- Format hex: #RRGGBB
  
  -- Notes et pièces jointes
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_reminder CHECK (reminder_minutes IS NULL OR reminder_minutes > 0)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_case_id ON calendar_events(case_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_reminder ON calendar_events(reminder_minutes, reminder_sent) WHERE reminder_minutes IS NOT NULL;

-- =====================================================
-- FONCTIONS AUTOMATIQUES
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
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

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue pour les événements avec informations de dossier
CREATE OR REPLACE VIEW calendar_events_with_details AS
SELECT 
  ce.*,
  c.case_number,
  c.title as case_title,
  c.status as case_status,
  cl.first_name || ' ' || cl.last_name as client_name,
  -- Calcul du temps restant
  CASE 
    WHEN ce.start_time > NOW() THEN 
      EXTRACT(EPOCH FROM (ce.start_time - NOW()))::INTEGER
    ELSE 0
  END as seconds_until_start,
  -- Durée de l'événement en minutes
  EXTRACT(EPOCH FROM (ce.end_time - ce.start_time))::INTEGER / 60 as duration_minutes
FROM calendar_events ce
LEFT JOIN cases c ON ce.case_id = c.id
LEFT JOIN clients cl ON c.client_id = cl.id;

-- Vue pour les événements nécessitant un rappel
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

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur la table calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres événements
CREATE POLICY "Users can view own events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent créer leurs propres événements
CREATE POLICY "Users can create own events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leurs propres événements
CREATE POLICY "Users can update own events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres événements
CREATE POLICY "Users can delete own events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- DONNÉES DE DÉMONSTRATION (OPTIONNEL)
-- =====================================================

-- Fonction pour créer des événements de démonstration
CREATE OR REPLACE FUNCTION create_demo_calendar_events(p_user_id UUID, p_case_id UUID)
RETURNS void AS $$
BEGIN
  -- Audience dans 3 jours
  INSERT INTO calendar_events (
    user_id, case_id, title, description, event_type,
    start_time, end_time, location, location_type,
    reminder_minutes, color
  ) VALUES (
    p_user_id, p_case_id,
    'Audience au tribunal',
    'Première audience pour le dossier',
    'hearing',
    NOW() + INTERVAL '3 days' + INTERVAL '9 hours',
    NOW() + INTERVAL '3 days' + INTERVAL '11 hours',
    'Tribunal de première instance - Alger',
    'court',
    60, -- Rappel 1h avant
    '#ef4444' -- Rouge
  );

  -- Réunion client demain
  INSERT INTO calendar_events (
    user_id, case_id, title, description, event_type,
    start_time, end_time, location, location_type,
    reminder_minutes, color
  ) VALUES (
    p_user_id, p_case_id,
    'Réunion avec le client',
    'Préparation de l''audience',
    'meeting',
    NOW() + INTERVAL '1 day' + INTERVAL '14 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '15 hours',
    'Cabinet d''avocat',
    'office',
    30, -- Rappel 30min avant
    '#3b82f6' -- Bleu
  );

  -- Deadline dans 5 jours
  INSERT INTO calendar_events (
    user_id, case_id, title, description, event_type,
    start_time, end_time, location, location_type,
    reminder_minutes, color, all_day
  ) VALUES (
    p_user_id, p_case_id,
    'Date limite dépôt conclusions',
    'Déposer les conclusions écrites au greffe',
    'deadline',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '5 days' + INTERVAL '1 hour',
    'Greffe du tribunal',
    'court',
    1440, -- Rappel 24h avant
    '#f97316', -- Orange
    TRUE
  );

  -- Consultation dans 1 semaine
  INSERT INTO calendar_events (
    user_id, title, description, event_type,
    start_time, end_time, location, location_type,
    reminder_minutes, color
  ) VALUES (
    p_user_id,
    'Consultation nouveau client',
    'Premier rendez-vous - Affaire commerciale',
    'consultation',
    NOW() + INTERVAL '7 days' + INTERVAL '10 hours',
    NOW() + INTERVAL '7 days' + INTERVAL '11 hours',
    'Cabinet d''avocat',
    'office',
    60,
    '#10b981' -- Vert
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INTÉGRATION AVEC LES DOSSIERS
-- =====================================================

-- Fonction pour créer automatiquement des événements depuis un dossier
CREATE OR REPLACE FUNCTION auto_create_case_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Si une date d'audience est définie, créer un événement
  IF NEW.next_hearing_date IS NOT NULL THEN
    INSERT INTO calendar_events (
      user_id, case_id, title, event_type,
      start_time, end_time, location, location_type,
      reminder_minutes, color
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'Audience - ' || NEW.title,
      'hearing',
      NEW.next_hearing_date,
      NEW.next_hearing_date + INTERVAL '2 hours',
      NEW.court_name,
      'court',
      60,
      '#ef4444'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Si une date limite est définie, créer un événement
  IF NEW.deadline IS NOT NULL THEN
    INSERT INTO calendar_events (
      user_id, case_id, title, event_type,
      start_time, end_time, reminder_minutes, color, all_day
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'Date limite - ' || NEW.title,
      'deadline',
      NEW.deadline,
      NEW.deadline + INTERVAL '1 hour',
      1440, -- 24h avant
      '#f97316',
      TRUE
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement des événements depuis les dossiers
DROP TRIGGER IF EXISTS trigger_auto_create_case_events ON cases;
CREATE TRIGGER trigger_auto_create_case_events
  AFTER INSERT OR UPDATE OF next_hearing_date, deadline ON cases
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_case_events();

-- =====================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE calendar_events IS 'Table principale pour la gestion du calendrier avocat';
COMMENT ON COLUMN calendar_events.event_type IS 'Type: hearing (audience), meeting (réunion), deadline (échéance), consultation, other';
COMMENT ON COLUMN calendar_events.reminder_minutes IS 'Minutes avant l''événement pour envoyer un rappel';
COMMENT ON COLUMN calendar_events.recurrence_rule IS 'Règle de récurrence pour événements répétitifs';
COMMENT ON COLUMN calendar_events.attendees IS 'Liste des participants en format JSON';

-- =====================================================
-- SCRIPT TERMINÉ
-- =====================================================

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Système de calendrier créé avec succès!';
  RAISE NOTICE '📊 Tables: calendar_events';
  RAISE NOTICE '🔒 RLS activé avec politiques de sécurité';
  RAISE NOTICE '📈 Vues: calendar_events_with_details, events_needing_reminder';
  RAISE NOTICE '⚙️ Fonctions: get_upcoming_events, check_schedule_conflict, get_calendar_stats';
  RAISE NOTICE '🔗 Intégration automatique avec les dossiers (audiences et deadlines)';
END $$;
