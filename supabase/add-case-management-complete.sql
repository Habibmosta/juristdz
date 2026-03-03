-- ═══════════════════════════════════════════════════════════════════════════
-- GESTION COMPLÈTE DES DOSSIERS - CE QUI MANQUE VRAIMENT
-- ═══════════════════════════════════════════════════════════════════════════
-- Pour concurrencer Clio/MyCase, il faut la gestion de dossiers COMPLÈTE
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. TABLE DOSSIERS (CASES) - COMPLÈTE
-- ═══════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.cases CASCADE;

CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- L'avocat/notaire/huissier propriétaire
  
  -- Informations de base
  case_number TEXT NOT NULL, -- Numéro de dossier (ex: 2026/001)
  title TEXT NOT NULL, -- Titre du dossier
  description TEXT,
  case_type TEXT NOT NULL, -- 'civil', 'penal', 'commercial', 'administratif', 'famille', etc.
  
  -- Statut et priorité
  status TEXT DEFAULT 'nouveau', -- 'nouveau', 'en_cours', 'audience', 'jugement', 'cloture', 'archive'
  priority TEXT DEFAULT 'normale', -- 'basse', 'normale', 'haute', 'urgente'
  
  -- Dates importantes
  opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_date DATE,
  next_hearing_date DATE,
  statute_of_limitations DATE, -- Date de prescription
  
  -- Juridiction
  court_name TEXT, -- Nom du tribunal
  court_location TEXT, -- Ville du tribunal
  judge_name TEXT, -- Nom du juge
  case_reference TEXT, -- Référence du tribunal
  
  -- Parties
  client_role TEXT, -- 'demandeur', 'defendeur', 'plaignant', 'accuse', etc.
  adverse_party_name TEXT, -- Nom de la partie adverse
  adverse_party_lawyer TEXT, -- Avocat de la partie adverse
  
  -- Financier
  estimated_value DECIMAL(12,2), -- Valeur estimée du litige
  court_fees DECIMAL(10,2), -- Frais de justice
  
  -- Organisation
  tags TEXT[], -- Tags pour recherche (ex: ['urgent', 'appel', 'commercial'])
  folder_path TEXT, -- Chemin du dossier physique
  
  -- Notes
  notes TEXT,
  internal_notes TEXT, -- Notes privées, non visibles par le client
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  
  -- Contrainte unique sur le numéro de dossier par utilisateur
  UNIQUE(user_id, case_number)
);

CREATE INDEX idx_cases_user_id ON public.cases(user_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_priority ON public.cases(priority);
CREATE INDEX idx_cases_case_type ON public.cases(case_type);
CREATE INDEX idx_cases_opened_date ON public.cases(opened_date DESC);
CREATE INDEX idx_cases_next_hearing ON public.cases(next_hearing_date) WHERE next_hearing_date IS NOT NULL;
CREATE INDEX idx_cases_tags ON public.cases USING GIN(tags);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. TABLE LIAISON DOSSIERS-CLIENTS
-- ═══════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.case_clients CASCADE;

CREATE TABLE public.case_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  client_id UUID NOT NULL,
  role TEXT DEFAULT 'client', -- 'client', 'partie_adverse', 'temoin', 'expert', etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(case_id, client_id)
);

CREATE INDEX idx_case_clients_case_id ON public.case_clients(case_id);
CREATE INDEX idx_case_clients_client_id ON public.case_clients(client_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. TABLE DOCUMENTS DU DOSSIER
-- ═══════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.case_documents CASCADE;

CREATE TABLE public.case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID NOT NULL,
  
  -- Informations du document
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL, -- 'requete', 'jugement', 'piece', 'correspondance', 'contrat', etc.
  
  -- Fichier
  file_name TEXT NOT NULL,
  file_size BIGINT, -- Taille en bytes
  file_type TEXT, -- 'application/pdf', 'image/jpeg', etc.
  storage_path TEXT NOT NULL, -- Chemin dans Supabase Storage
  
  -- Métadonnées
  document_date DATE, -- Date du document (pas la date d'upload)
  received_date DATE, -- Date de réception
  sent_date DATE, -- Date d'envoi
  
  -- Organisation
  category TEXT, -- 'procedure', 'preuve', 'correspondance', etc.
  tags TEXT[],
  is_confidential BOOLEAN DEFAULT false,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_document_id UUID, -- Pour les versions
  
  -- Statut
  status TEXT DEFAULT 'actif', -- 'actif', 'archive', 'supprime'
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- Qui a uploadé
  
  -- Notes
  notes TEXT
);

CREATE INDEX idx_case_documents_user_id ON public.case_documents(user_id);
CREATE INDEX idx_case_documents_case_id ON public.case_documents(case_id);
CREATE INDEX idx_case_documents_document_type ON public.case_documents(document_type);
CREATE INDEX idx_case_documents_status ON public.case_documents(status);
CREATE INDEX idx_case_documents_tags ON public.case_documents USING GIN(tags);
CREATE INDEX idx_case_documents_created_at ON public.case_documents(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. TABLE ÉVÉNEMENTS DU DOSSIER (TIMELINE)
-- ═══════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.case_events CASCADE;

CREATE TABLE public.case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID NOT NULL,
  
  -- Événement
  event_type TEXT NOT NULL, -- 'audience', 'depot', 'decision', 'notification', 'reunion', 'appel', etc.
  title TEXT NOT NULL,
  description TEXT,
  
  -- Date et heure
  event_date DATE NOT NULL,
  event_time TIME,
  duration_minutes INTEGER,
  
  -- Localisation
  location TEXT, -- Salle d'audience, bureau, etc.
  
  -- Participants
  participants TEXT[], -- Liste des participants
  
  -- Résultat
  outcome TEXT, -- Résultat de l'événement
  outcome_type TEXT, -- 'favorable', 'defavorable', 'neutre', 'en_attente'
  
  -- Documents liés
  related_document_ids UUID[],
  
  -- Rappels
  reminder_date TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  
  -- Statut
  status TEXT DEFAULT 'prevu', -- 'prevu', 'termine', 'annule', 'reporte'
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Notes
  notes TEXT
);

CREATE INDEX idx_case_events_user_id ON public.case_events(user_id);
CREATE INDEX idx_case_events_case_id ON public.case_events(case_id);
CREATE INDEX idx_case_events_event_type ON public.case_events(event_type);
CREATE INDEX idx_case_events_event_date ON public.case_events(event_date DESC);
CREATE INDEX idx_case_events_status ON public.case_events(status);
CREATE INDEX idx_case_events_reminder ON public.case_events(reminder_date) WHERE reminder_sent = false;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. TABLE TÂCHES DU DOSSIER
-- ═══════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.case_tasks CASCADE;

CREATE TABLE public.case_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID NOT NULL,
  
  -- Tâche
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT, -- 'redaction', 'recherche', 'depot', 'appel', etc.
  
  -- Priorité et statut
  priority TEXT DEFAULT 'normale', -- 'basse', 'normale', 'haute', 'urgente'
  status TEXT DEFAULT 'a_faire', -- 'a_faire', 'en_cours', 'terminee', 'annulee'
  
  -- Dates
  due_date DATE,
  completed_date DATE,
  
  -- Assignation
  assigned_to UUID, -- Peut être assigné à un collaborateur
  
  -- Temps estimé vs réel
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  
  -- Rappels
  reminder_date TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Notes
  notes TEXT
);

CREATE INDEX idx_case_tasks_user_id ON public.case_tasks(user_id);
CREATE INDEX idx_case_tasks_case_id ON public.case_tasks(case_id);
CREATE INDEX idx_case_tasks_status ON public.case_tasks(status);
CREATE INDEX idx_case_tasks_priority ON public.case_tasks(priority);
CREATE INDEX idx_case_tasks_due_date ON public.case_tasks(due_date);
CREATE INDEX idx_case_tasks_assigned_to ON public.case_tasks(assigned_to);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. TABLE NOTES DU DOSSIER
-- ═══════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.case_notes CASCADE;

CREATE TABLE public.case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID NOT NULL,
  
  -- Note
  title TEXT,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'generale', -- 'generale', 'strategie', 'recherche', 'reunion', etc.
  
  -- Confidentialité
  is_private BOOLEAN DEFAULT true, -- Visible uniquement par le créateur
  
  -- Tags
  tags TEXT[],
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_case_notes_user_id ON public.case_notes(user_id);
CREATE INDEX idx_case_notes_case_id ON public.case_notes(case_id);
CREATE INDEX idx_case_notes_created_at ON public.case_notes(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- FONCTIONS UTILITAIRES
-- ═══════════════════════════════════════════════════════════════════════════

-- Fonction pour générer un numéro de dossier automatique
CREATE OR REPLACE FUNCTION generate_case_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.cases
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM opened_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_number := v_year || '/' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS trigger_cases_updated_at ON public.cases;
CREATE TRIGGER trigger_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_case_documents_updated_at ON public.case_documents;
CREATE TRIGGER trigger_case_documents_updated_at
  BEFORE UPDATE ON public.case_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_case_events_updated_at ON public.case_events;
CREATE TRIGGER trigger_case_events_updated_at
  BEFORE UPDATE ON public.case_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_case_tasks_updated_at ON public.case_tasks;
CREATE TRIGGER trigger_case_tasks_updated_at
  BEFORE UPDATE ON public.case_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- VUES UTILES
-- ═══════════════════════════════════════════════════════════════════════════

-- Vue: Dossiers avec statistiques
CREATE OR REPLACE VIEW case_stats AS
SELECT 
  c.id,
  c.user_id,
  c.case_number,
  c.title,
  c.status,
  c.priority,
  c.opened_date,
  c.next_hearing_date,
  COUNT(DISTINCT cd.id) as total_documents,
  COUNT(DISTINCT ce.id) as total_events,
  COUNT(DISTINCT ct.id) as total_tasks,
  COUNT(DISTINCT ct.id) FILTER (WHERE ct.status = 'terminee') as completed_tasks,
  COUNT(DISTINCT cc.client_id) as total_clients
FROM public.cases c
LEFT JOIN public.case_documents cd ON c.id = cd.case_id AND cd.status = 'actif'
LEFT JOIN public.case_events ce ON c.id = ce.case_id
LEFT JOIN public.case_tasks ct ON c.id = ct.case_id
LEFT JOIN public.case_clients cc ON c.id = cc.case_id
GROUP BY c.id;

-- Vue: Prochaines audiences
CREATE OR REPLACE VIEW upcoming_hearings AS
SELECT 
  c.id as case_id,
  c.case_number,
  c.title,
  c.next_hearing_date,
  c.court_name,
  c.court_location,
  c.status,
  c.user_id,
  CURRENT_DATE - c.next_hearing_date as days_until
FROM public.cases c
WHERE c.next_hearing_date >= CURRENT_DATE
  AND c.status NOT IN ('cloture', 'archive')
ORDER BY c.next_hearing_date;

-- Vue: Tâches en retard
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT 
  ct.*,
  c.case_number,
  c.title as case_title,
  CURRENT_DATE - ct.due_date as days_overdue
FROM public.case_tasks ct
JOIN public.cases c ON ct.case_id = c.id
WHERE ct.due_date < CURRENT_DATE
  AND ct.status NOT IN ('terminee', 'annulee')
ORDER BY ct.due_date;

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
  'Tables de gestion de dossiers créées: ' || COUNT(*) as message
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cases', 'case_clients', 'case_documents', 'case_events', 'case_tasks', 'case_notes');
