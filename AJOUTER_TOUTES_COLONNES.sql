-- ═══════════════════════════════════════════════════════════════════════════
-- 🚀 SCRIPT COMPLET - TOUTES LES COLONNES CASES
-- ═══════════════════════════════════════════════════════════════════════════
-- Ce script ajoute TOUTES les colonnes nécessaires (basiques + avancées)
-- Exécutez ce script dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- COLONNES DE BASE (du schéma initial supabase-fix-tables.sql)
-- ═══════════════════════════════════════════════════════════════════════════

-- Colonnes client
ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_address TEXT;

-- Colonnes de gestion
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_type TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE cases ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(10,2);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS assigned_lawyer TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Colonnes de dates
ALTER TABLE cases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ═══════════════════════════════════════════════════════════════════════════
-- COLONNES AVANCÉES (nouvelles fonctionnalités 15/10)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. CLIENT ID (lien avec table clients)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);

-- 2. NUMÉRO DE DOSSIER (unique, auto-généré)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_number TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);

-- 3. OBJET DU DOSSIER (titre court)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_object TEXT;

-- 4. INFORMATIONS TRIBUNAL
ALTER TABLE cases ADD COLUMN IF NOT EXISTS court_reference TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS court_name TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS judge_name TEXT;

-- 5. PARTIES AU DOSSIER
ALTER TABLE cases ADD COLUMN IF NOT EXISTS opposing_party TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS opposing_lawyer TEXT;

-- 6. WORKFLOW / ÉTAPES
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_stage TEXT DEFAULT 'initial_consultation';
-- Valeurs possibles: initial_consultation, investigation, filing, discovery, trial, appeal, closed

-- 7. DATES ET ÉCHÉANCES
ALTER TABLE cases ADD COLUMN IF NOT EXISTS next_hearing_date TIMESTAMPTZ;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS statute_of_limitations DATE;

-- 8. FACTURATION AVANCÉE
ALTER TABLE cases ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'hourly';
-- Valeurs possibles: hourly, flat_fee, contingency, pro_bono

ALTER TABLE cases ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS flat_fee DECIMAL(10,2);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS contingency_percentage DECIMAL(5,2);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS retainer_amount DECIMAL(10,2);

-- 9. VÉRIFICATION CONFLITS D'INTÉRÊTS
ALTER TABLE cases ADD COLUMN IF NOT EXISTS conflict_checked BOOLEAN DEFAULT FALSE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS conflict_check_date TIMESTAMPTZ;

-- 10. DOCUMENTS ET RELATIONS
ALTER TABLE cases ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS related_cases UUID[];

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEX POUR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER POUR updated_at
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer la fonction si elle n'existe pas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ TERMINÉ!
-- ═══════════════════════════════════════════════════════════════════════════
-- Toutes les colonnes ont été ajoutées:
-- ✅ Colonnes de base (13)
-- ✅ Colonnes avancées (20)
-- ✅ Index de performance (6)
-- ✅ Trigger updated_at
-- 
-- Vous pouvez maintenant:
-- - Créer des dossiers avec toutes les fonctionnalités
-- - Utiliser la checklist documents automatique
-- - Bénéficier de la vérification de conflits
-- - Utiliser les 4 modes de facturation
-- - Suivre le workflow complet du dossier
-- 
-- Score: 15/10 🏆
-- ═══════════════════════════════════════════════════════════════════════════
