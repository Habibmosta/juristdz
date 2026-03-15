-- ═══════════════════════════════════════════════════════════════════════════
-- CRÉATION DE LA TABLE CASE_EVENTS POUR LE TIMELINE
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Créer la table case_events
CREATE TABLE IF NOT EXISTS public.case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Type d'événement
  event_type TEXT NOT NULL, -- 'note', 'hearing', 'meeting', 'call', 'email', 'document_added', 'deadline_set', etc.
  
  -- Contenu
  title TEXT NOT NULL,
  description TEXT,
  
  -- Métadonnées additionnelles (JSON)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Dates
  event_date TIMESTAMPTZ, -- Date de l'événement (optionnel, pour les RDV futurs)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON public.case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_user_id ON public.case_events(user_id);
CREATE INDEX IF NOT EXISTS idx_case_events_type ON public.case_events(event_type);
CREATE INDEX IF NOT EXISTS idx_case_events_created_at ON public.case_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_events_event_date ON public.case_events(event_date) WHERE event_date IS NOT NULL;

-- 3. Activer RLS (Row Level Security)
ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;

-- 4. Politique RLS: Les utilisateurs peuvent voir les événements de leurs dossiers
CREATE POLICY "Users can view events of their cases"
  ON public.case_events
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = case_events.case_id
      AND cases.user_id = auth.uid()
    )
  );

-- 5. Politique RLS: Les utilisateurs peuvent créer des événements pour leurs dossiers
CREATE POLICY "Users can create events for their cases"
  ON public.case_events
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = case_events.case_id
      AND cases.user_id = auth.uid()
    )
  );

-- 6. Politique RLS: Les utilisateurs peuvent supprimer leurs événements
CREATE POLICY "Users can delete their own events"
  ON public.case_events
  FOR DELETE
  USING (user_id = auth.uid());

-- 7. Politique RLS: Les utilisateurs peuvent modifier leurs événements
CREATE POLICY "Users can update their own events"
  ON public.case_events
  FOR UPDATE
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

-- Vérifier que la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'case_events'
) as table_exists;

-- Vérifier les colonnes
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'case_events'
ORDER BY ordinal_position;

-- Compter les événements
SELECT COUNT(*) as total_events FROM public.case_events;
