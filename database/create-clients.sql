-- CLIENTS TABLE - Idempotent

DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Identity
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  client_type TEXT NOT NULL DEFAULT 'individual'
    CHECK (client_type IN ('individual','company','association','public_entity')),
  -- Contact
  email TEXT,
  phone TEXT,
  phone_secondary TEXT,
  address TEXT,
  wilaya TEXT,
  commune TEXT,
  -- Legal identifiers
  national_id TEXT,
  tax_number TEXT,
  rc_number TEXT,  -- Registre de commerce
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_last_name ON clients(user_id, last_name);
CREATE INDEX idx_clients_company ON clients(user_id, company_name);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
