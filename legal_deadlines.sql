-- ============================================================
-- Table: legal_deadlines
-- Délais légaux algériens — JuristDZ
-- ============================================================

CREATE TABLE IF NOT EXISTS legal_deadlines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id         UUID REFERENCES cases(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  title_ar        TEXT,
  description     TEXT,
  category        TEXT NOT NULL CHECK (category IN (
                    'appel','cassation','opposition','prescription',
                    'signification','execution','administratif','penal','custom'
                  )),
  base_date       DATE NOT NULL,
  deadline_date   DATE NOT NULL,
  days_total      INTEGER NOT NULL,
  legal_reference TEXT,
  notes           TEXT,
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_user_id      ON legal_deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_deadline_date ON legal_deadlines(deadline_date);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_is_completed  ON legal_deadlines(is_completed);

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_legal_deadlines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_legal_deadlines_updated_at
  BEFORE UPDATE ON legal_deadlines
  FOR EACH ROW EXECUTE FUNCTION update_legal_deadlines_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE legal_deadlines ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur ne voit que ses propres délais
CREATE POLICY "legal_deadlines_select_own"
  ON legal_deadlines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "legal_deadlines_insert_own"
  ON legal_deadlines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "legal_deadlines_update_own"
  ON legal_deadlines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "legal_deadlines_delete_own"
  ON legal_deadlines FOR DELETE
  USING (auth.uid() = user_id);
