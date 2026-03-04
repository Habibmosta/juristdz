-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT FINAL - AJOUT PROGRESSIF DES TABLES ET COLONNES
-- ═══════════════════════════════════════════════════════════════════════════
-- Ce script ajoute uniquement ce qui manque, sans erreur
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. TABLE CASES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter colonnes manquantes à cases
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'client_phone') THEN ALTER TABLE cases ADD COLUMN client_phone TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXI