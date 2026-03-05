-- ═══════════════════════════════════════════════════════════════════════════
-- AJOUT DES COLONNES MANQUANTES À LA TABLE CASES
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 4 Mars 2026
-- Description: Ajouter les colonnes professionnelles pour surpasser Clio
-- ═══════════════════════════════════════════════════════════════════════════

-- Ajouter client_id pour lier au client
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE cases ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
  END IF;
END $$;

-- Ajouter case_number (numéro de dossier unique)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'case_number'
  ) THEN
    ALTER TABLE cases ADD COLUMN case_number TEXT UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
  END IF;
END $$;

-- Ajouter case_object (objet du dossier)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'case_object'
  ) THEN
    ALTER TABLE cases ADD COLUMN case_object TEXT;
  END IF;
END $$;

-- Ajouter court_reference (référence tribunal)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'court_reference'
  ) THEN
    ALTER TABLE cases ADD COLUMN court_reference TEXT;
  END IF;
END $$;

-- Ajouter court_name (nom du tribunal)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'court_name'
  ) THEN
    ALTER TABLE cases ADD COLUMN court_name TEXT;
  END IF;
END $$;

-- Ajouter judge_name (nom du juge)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'judge_name'
  ) THEN
    ALTER TABLE cases ADD COLUMN judge_name TEXT;
  END IF;
END $$;

-- Ajouter opposing_party (partie adverse)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'opposing_party'
  ) THEN
    ALTER TABLE cases ADD COLUMN opposing_party TEXT;
  END IF;
END $$;

-- Ajouter opposing_lawyer (avocat adverse)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'opposing_lawyer'
  ) THEN
    ALTER TABLE cases ADD COLUMN opposing_lawyer TEXT;
  END IF;
END $$;

-- Ajouter case_stage (étape du dossier)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'case_stage'
  ) THEN
    ALTER TABLE cases ADD COLUMN case_stage TEXT DEFAULT 'initial_consultation';
    -- Stages: initial_consultation, investigation, filing, discovery, trial, appeal, closed
  END IF;
END $$;

-- Ajouter next_hearing_date (prochaine audience)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'next_hearing_date'
  ) THEN
    ALTER TABLE cases ADD COLUMN next_hearing_date TIMESTAMPTZ;
  END IF;
END $$;

-- Ajouter statute_of_limitations (délai de prescription)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'statute_of_limitations'
  ) THEN
    ALTER TABLE cases ADD COLUMN statute_of_limitations DATE;
  END IF;
END $$;

-- Ajouter billing_type (type de facturation)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'billing_type'
  ) THEN
    ALTER TABLE cases ADD COLUMN billing_type TEXT DEFAULT 'hourly';
    -- Types: hourly, flat_fee, contingency, pro_bono
  END IF;
END $$;

-- Ajouter hourly_rate (taux horaire)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE cases ADD COLUMN hourly_rate DECIMAL(10,2);
  END IF;
END $$;

-- Ajouter flat_fee (honoraires forfaitaires)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'flat_fee'
  ) THEN
    ALTER TABLE cases ADD COLUMN flat_fee DECIMAL(10,2);
  END IF;
END $$;

-- Ajouter contingency_percentage (pourcentage de contingence)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'contingency_percentage'
  ) THEN
    ALTER TABLE cases ADD COLUMN contingency_percentage DECIMAL(5,2);
  END IF;
END $$;

-- Ajouter retainer_amount (provision)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'retainer_amount'
  ) THEN
    ALTER TABLE cases ADD COLUMN retainer_amount DECIMAL(10,2);
  END IF;
END $$;

-- Ajouter conflict_checked (vérification de conflit)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'conflict_checked'
  ) THEN
    ALTER TABLE cases ADD COLUMN conflict_checked BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Ajouter conflict_check_date
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'conflict_check_date'
  ) THEN
    ALTER TABLE cases ADD COLUMN conflict_check_date TIMESTAMPTZ;
  END IF;
END $$;

-- Ajouter required_documents (checklist de documents)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'required_documents'
  ) THEN
    ALTER TABLE cases ADD COLUMN required_documents JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Ajouter related_cases (dossiers liés)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'related_cases'
  ) THEN
    ALTER TABLE cases ADD COLUMN related_cases UUID[];
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- TERMINÉ
-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ Colonnes professionnelles ajoutées
-- ✅ Index créés pour performance
-- 
-- Nouvelles fonctionnalités disponibles:
-- - Numéro de dossier unique
-- - Lien avec client
-- - Informations tribunal et parties
-- - Étapes du dossier
-- - Facturation avancée
-- - Vérification de conflits
-- - Checklist de documents
-- - Dossiers liés
-- ═══════════════════════════════════════════════════════════════════════════
