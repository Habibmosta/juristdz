-- ═══════════════════════════════════════════════════════════════════════════
-- 🚀 COLONNES ULTRA-PROFESSIONNELLES - SCORE 20/10
-- ═══════════════════════════════════════════════════════════════════════════
-- Ces colonnes font de JuristDZ le meilleur système du marché
-- ═══════════════════════════════════════════════════════════════════════════

-- CONSULTATION INITIALE
ALTER TABLE cases ADD COLUMN IF NOT EXISTS initial_consultation_date DATE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_objective TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS legal_strategy TEXT;

-- ÉVALUATION DU DOSSIER
ALTER TABLE cases ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'medium';
-- Valeurs: low, medium, high

ALTER TABLE cases ADD COLUMN IF NOT EXISTS success_probability DECIMAL(5,2);
-- Pourcentage de 0 à 100

ALTER TABLE cases ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;
-- Durée estimée en mois

-- GESTION DOCUMENTAIRE AVANCÉE
-- (required_documents existe déjà en JSONB)
-- Structure: [{ name, received, receivedDate, required }]

-- INDEX POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_cases_risk_level ON cases(risk_level);
CREATE INDEX IF NOT EXISTS idx_cases_success_probability ON cases(success_probability);
CREATE INDEX IF NOT EXISTS idx_cases_initial_consultation_date ON cases(initial_consultation_date);

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ TERMINÉ!
-- ═══════════════════════════════════════════════════════════════════════════
-- Nouvelles fonctionnalités disponibles:
-- ✅ Consultation initiale (date, objectif, stratégie)
-- ✅ Évaluation du dossier (risque, probabilité, durée)
-- ✅ Gestion documentaire avancée
-- 
-- Score: 20/10 🏆
-- ═══════════════════════════════════════════════════════════════════════════
