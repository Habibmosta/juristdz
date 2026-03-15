-- ═══════════════════════════════════════════════════════════════════════════
-- TIME TRACKING SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════

-- Nettoyage préalable (idempotent)
DROP VIEW IF EXISTS time_tracking_stats CASCADE;
DROP VIEW IF EXISTS time_by_case CASCADE;
DROP FUNCTION IF EXISTS get_case_time_summary(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_time_stats(UUID, DATE, DATE) CASCADE;
DROP TRIGGER IF EXISTS time_entries_updated_at ON time_entries;
DROP TRIGGER IF EXISTS time_entry_billing ON time_entries;
DROP FUNCTION IF EXISTS update_time_entries_updated_at() CASCADE;
DROP FUNCTION IF EXISTS calculate_time_entry_billing() CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;

-- Table: time_entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID,
  description TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  is_billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  amount DECIMAL(10,2),
  entry_status VARCHAR(20) DEFAULT 'stopped',
  invoice_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_entry_status CHECK (entry_status IN ('running', 'stopped', 'billed'))
);

-- Index
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_case ON time_entries(case_id);
CREATE INDEX idx_time_entries_status ON time_entries(entry_status);
CREATE INDEX idx_time_entries_created ON time_entries(created_at DESC);
CREATE INDEX idx_time_entries_invoice ON time_entries(invoice_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_time_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_time_entries_updated_at();

-- Trigger calcul durée/montant
CREATE OR REPLACE FUNCTION calculate_time_entry_billing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    IF NEW.is_billable AND NEW.hourly_rate IS NOT NULL THEN
      NEW.amount = (NEW.duration_minutes / 60.0) * NEW.hourly_rate;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_entry_billing
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_entry_billing();

-- Vue statistiques par jour
CREATE OR REPLACE VIEW time_tracking_stats AS
SELECT
  user_id,
  DATE(start_time) as date,
  COUNT(*) as total_entries,
  SUM(duration_minutes) as total_minutes,
  SUM(CASE WHEN is_billable THEN duration_minutes ELSE 0 END) as billable_minutes,
  SUM(CASE WHEN NOT is_billable THEN duration_minutes ELSE 0 END) as non_billable_minutes,
  SUM(CASE WHEN is_billable THEN amount ELSE 0 END) as total_billable_amount,
  COUNT(DISTINCT case_id) as cases_worked_on
FROM time_entries
WHERE entry_status != 'running'
GROUP BY user_id, DATE(start_time);

-- Vue temps par dossier
CREATE OR REPLACE VIEW time_by_case AS
SELECT
  case_id,
  user_id,
  COUNT(*) as total_entries,
  SUM(duration_minutes) as total_minutes,
  SUM(CASE WHEN is_billable THEN duration_minutes ELSE 0 END) as billable_minutes,
  SUM(CASE WHEN is_billable THEN amount ELSE 0 END) as total_amount,
  SUM(CASE WHEN entry_status = 'billed' THEN amount ELSE 0 END) as billed_amount,
  SUM(CASE WHEN entry_status = 'stopped' AND is_billable THEN amount ELSE 0 END) as unbilled_amount
FROM time_entries
WHERE case_id IS NOT NULL
GROUP BY case_id, user_id;

-- Fonction résumé temps par dossier
CREATE OR REPLACE FUNCTION get_case_time_summary(p_case_id UUID)
RETURNS TABLE (
  total_hours DECIMAL,
  billable_hours DECIMAL,
  total_amount DECIMAL,
  billed_amount DECIMAL,
  unbilled_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(duration_minutes) / 60.0, 0),
    COALESCE(SUM(CASE WHEN is_billable THEN duration_minutes ELSE 0 END) / 60.0, 0),
    COALESCE(SUM(CASE WHEN is_billable THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN entry_status = 'billed' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN entry_status = 'stopped' AND is_billable THEN amount ELSE 0 END), 0)
  FROM time_entries
  WHERE case_id = p_case_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction stats utilisateur
CREATE OR REPLACE FUNCTION get_user_time_stats(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_hours DECIMAL,
  billable_hours DECIMAL,
  non_billable_hours DECIMAL,
  total_amount DECIMAL,
  billed_amount DECIMAL,
  unbilled_amount DECIMAL,
  average_hourly_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(duration_minutes) / 60.0, 0),
    COALESCE(SUM(CASE WHEN is_billable THEN duration_minutes ELSE 0 END) / 60.0, 0),
    COALESCE(SUM(CASE WHEN NOT is_billable THEN duration_minutes ELSE 0 END) / 60.0, 0),
    COALESCE(SUM(CASE WHEN is_billable THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN entry_status = 'billed' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN entry_status = 'stopped' AND is_billable THEN amount ELSE 0 END), 0),
    CASE
      WHEN SUM(CASE WHEN is_billable THEN duration_minutes ELSE 0 END) > 0
      THEN SUM(CASE WHEN is_billable THEN amount ELSE 0 END) / (SUM(CASE WHEN is_billable THEN duration_minutes ELSE 0 END) / 60.0)
      ELSE 0
    END
  FROM time_entries
  WHERE user_id = p_user_id
    AND entry_status != 'running'
    AND (p_start_date IS NULL OR DATE(start_time) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(start_time) <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY time_entries_select_own ON time_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY time_entries_insert_own ON time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY time_entries_update_own ON time_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY time_entries_delete_own ON time_entries
  FOR DELETE USING (auth.uid() = user_id AND entry_status != 'billed');
