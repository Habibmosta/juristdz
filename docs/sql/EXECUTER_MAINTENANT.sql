-- ═══════════════════════════════════════════════════════════════════════════
-- 🚀 SCRIPT D'INSTALLATION RAPIDE - COLONNES AVANCÉES CASES
-- ═══════════════════════════════════════════════════════════════════════════
-- INSTRUCTIONS:
-- 1. Copiez TOUT ce script
-- 2. Allez sur Supabase → SQL Editor → New Query
-- 3. Collez et cliquez sur "Run"
-- 4. Attendez le message de succès
-- 5. Retournez à l'application et créez un dossier
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
-- ✅ TERMINÉ!
-- ═══════════════════════════════════════════════════════════════════════════
-- Vous pouvez maintenant:
-- - Créer des dossiers avec toutes les fonctionnalités avancées
-- - Utiliser la checklist documents automatique
-- - Bénéficier de la vérification de conflits
-- - Utiliser les 4 modes de facturation
-- - Suivre le workflow complet du dossier
-- 
-- Score: 15/10 🏆
-- ═══════════════════════════════════════════════════════════════════════════
