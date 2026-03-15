-- LEGAL DEADLINES TABLE - Idempotent
-- Délais légaux algériens (appel, cassation, prescription, etc.)

DROP POLICY IF EXISTS "Users can view own deadlines" ON legal_deadlines;
DROP POLICY IF EXISTS "Users can insert own deadlines" ON legal_deadlines;
DROP POLICY IF EXISTS "Users can update own deadlines" ON legal_deadlines;
DROP POLICY IF EXISTS "Users can delete own deadlines" ON legal_deadlines;
DROP TABLE IF EXISTS legal_deadlines CASCADE;

CREATE TABLE legal_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID,  -- FK to cases added after cases table exists
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom'
    CHECK (category IN ('appel','cassation','opposition','prescription','signification','execution','administratif','penal','custom')),
  base_date DATE NOT NULL,
  deadline_date DATE NOT NULL,
  days_total INTEGER NOT NULL DEFAULT 30,
  legal_reference TEXT,
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','critical')),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_legal_deadlines_user_id ON legal_deadlines(user_id);
CREATE INDEX idx_legal_deadlines_deadline_date ON legal_deadlines(deadline_date ASC);
CREATE INDEX idx_legal_deadlines_is_completed ON legal_deadlines(user_id, is_completed);

ALTER TABLE legal_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deadlines"
  ON legal_deadlines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deadlines"
  ON legal_deadlines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deadlines"
  ON legal_deadlines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deadlines"
  ON legal_deadlines FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON legal_deadlines TO authenticated;
