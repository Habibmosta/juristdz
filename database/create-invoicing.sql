-- =====================================================
-- INVOICING SYSTEM - Idempotent version
-- =====================================================

-- Drop existing objects
DROP VIEW IF EXISTS invoices_with_details CASCADE;
DROP VIEW IF EXISTS monthly_invoice_stats CASCADE;
DROP FUNCTION IF EXISTS get_invoice_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_invoice_overdue_status() CASCADE;
DROP FUNCTION IF EXISTS create_demo_invoices(UUID, UUID, UUID) CASCADE;
DROP TRIGGER IF EXISTS trigger_update_invoices_updated_at ON invoices;
DROP FUNCTION IF EXISTS update_invoices_updated_at() CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

-- Create table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 19.00,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  CONSTRAINT valid_dates CHECK (due_date >= issue_date),
  CONSTRAINT valid_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND total >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_case_id ON invoices(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- Function: mark overdue
CREATE OR REPLACE FUNCTION update_invoice_overdue_status()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'sent'
    AND due_date < CURRENT_DATE
    AND payment_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: stats
CREATE OR REPLACE FUNCTION get_invoice_stats(p_user_id UUID)
RETURNS TABLE (
  total_invoices BIGINT,
  draft_count BIGINT,
  sent_count BIGINT,
  paid_count BIGINT,
  overdue_count BIGINT,
  cancelled_count BIGINT,
  total_amount DECIMAL(15, 2),
  paid_amount DECIMAL(15, 2),
  unpaid_amount DECIMAL(15, 2),
  overdue_amount DECIMAL(15, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'draft')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'sent')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'paid')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'overdue')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT,
    COALESCE(SUM(total), 0),
    COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0),
    COALESCE(SUM(total) FILTER (WHERE status IN ('sent', 'overdue')), 0),
    COALESCE(SUM(total) FILTER (WHERE status = 'overdue'), 0)
  FROM invoices
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- View: invoices with details
CREATE OR REPLACE VIEW invoices_with_details AS
SELECT
  i.*,
  c.first_name || ' ' || c.last_name as client_name,
  c.company_name,
  c.email as client_email,
  c.phone as client_phone,
  cs.case_number,
  cs.title as case_title,
  CASE
    WHEN i.due_date >= CURRENT_DATE THEN i.due_date - CURRENT_DATE
    ELSE 0
  END as days_until_due,
  CASE
    WHEN i.due_date < CURRENT_DATE AND i.status != 'paid' THEN CURRENT_DATE - i.due_date
    ELSE 0
  END as days_overdue
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN cases cs ON i.case_id = cs.id;

-- View: monthly stats
CREATE OR REPLACE VIEW monthly_invoice_stats AS
SELECT
  user_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as invoice_count,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
  SUM(total) as total_amount,
  SUM(total) FILTER (WHERE status = 'paid') as paid_amount,
  AVG(total) as average_invoice
FROM invoices
GROUP BY user_id, DATE_TRUNC('month', created_at);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');
