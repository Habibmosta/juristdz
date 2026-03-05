-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE EVENTS - Système de gestion des événements et agenda
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS public.events CASCADE;

-- 2. Créer la table events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  
  -- Informations de l'événement
  title TEXT NOT NULL,
  description TEXT,
  
  -- Date et heure
  event_date DATE NOT NULL,
  event_time TIME,
  end_time TIME,
  
  -- Type d'événement
  event_type TEXT DEFAULT 'other', -- 'hearing', 'meeting', 'deadline', 'other'
  
  -- Localisation
  location TEXT,
  
  -- Statut
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  
  -- Rappels
  reminder_minutes INTEGER, -- Minutes avant l'événement pour le rappel
  reminder_sent BOOLEAN DEFAULT false,
  
  -- Métadonnées
  color TEXT, -- Couleur personnalisée pour l'événement
  is_all_day BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index pour performance
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_case_id ON public.events(case_id);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_status ON public.events(status);

-- 4. Activer RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 5. Politiques RLS
CREATE POLICY "Users can view their own events"
  ON public.events
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own events"
  ON public.events
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own events"
  ON public.events
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own events"
  ON public.events
  FOR DELETE
  USING (user_id = auth.uid());

-- 6. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_events_updated_at ON public.events;
CREATE TRIGGER trigger_update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- 7. Fonction pour créer un événement
CREATE OR REPLACE FUNCTION create_event(
  p_title TEXT,
  p_event_date DATE,
  p_event_time TIME DEFAULT NULL,
  p_event_type TEXT DEFAULT 'other',
  p_description TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_case_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.events (
    user_id,
    title,
    event_date,
    event_time,
    event_type,
    description,
    location,
    case_id
  ) VALUES (
    auth.uid(),
    p_title,
    p_event_date,
    p_event_time,
    p_event_type,
    p_description,
    p_location,
    p_case_id
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- 8. Fonction pour obtenir les événements à venir
CREATE OR REPLACE FUNCTION get_upcoming_events(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  event_date DATE,
  event_time TIME,
  event_type TEXT,
  location TEXT,
  case_id UUID,
  case_title TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.event_date,
    e.event_time,
    e.event_type,
    e.location,
    e.case_id,
    c.title as case_title,
    e.status
  FROM public.events e
  LEFT JOIN public.cases c ON c.id = e.case_id
  WHERE e.user_id = p_user_id
    AND e.event_date >= CURRENT_DATE
    AND e.event_date <= CURRENT_DATE + p_days
    AND e.status != 'cancelled'
  ORDER BY e.event_date ASC, e.event_time ASC NULLS LAST;
END;
$$;

-- 9. Migrer les données existantes depuis calendar_events si elle existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    INSERT INTO public.events (
      id,
      user_id,
      case_id,
      title,
      description,
      event_date,
      event_time,
      event_type,
      location,
      created_at
    )
    SELECT 
      id,
      user_id,
      case_id,
      title,
      description,
      event_date::DATE,
      event_time::TIME,
      event_type,
      location,
      created_at
    FROM calendar_events
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Données migrées depuis calendar_events';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONNÉES DE TEST (optionnel - à commenter en production)
-- ═══════════════════════════════════════════════════════════════════════════

-- Insérer quelques événements de test pour l'utilisateur actuel
-- Décommentez ces lignes pour tester:

/*
INSERT INTO public.events (user_id, title, event_date, event_time, event_type, location, description)
VALUES 
  (auth.uid(), 'Audience Tribunal', CURRENT_DATE + 1, '09:00', 'hearing', 'Tribunal d''Alger', 'Affaire divorce'),
  (auth.uid(), 'Réunion Client', CURRENT_DATE + 2, '14:30', 'meeting', 'Cabinet', 'Discussion contrat'),
  (auth.uid(), 'Échéance Dépôt Mémoire', CURRENT_DATE + 5, NULL, 'deadline', NULL, 'Mémoire en défense'),
  (auth.uid(), 'Audience Appel', CURRENT_DATE + 7, '10:00', 'hearing', 'Cour d''Alger', 'Affaire commerciale');
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'Table events créée avec succès!' as status;
SELECT COUNT(*) as total_events FROM public.events;

-- Afficher les événements à venir pour l'utilisateur actuel
-- SELECT * FROM get_upcoming_events(auth.uid(), 30);
