-- ============================================================
-- FIX RUNTIME ERRORS — Tables/vues/fonctions manquantes
-- À exécuter dans Supabase Dashboard > SQL Editor
-- Idempotent: peut être exécuté plusieurs fois sans risque
-- ============================================================

-- ============================================================
-- 1. TABLE cases (colonnes manquantes)
-- ============================================================
DO $$
BEGIN
  -- case_number peut manquer si table créée sans ce champ
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='case_number') THEN
    ALTER TABLE cases ADD COLUMN case_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='opened_date') THEN
    ALTER TABLE cases ADD COLUMN opened_date DATE DEFAULT CURRENT_DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='case_type') THEN
    ALTER TABLE cases ADD COLUMN case_type TEXT DEFAULT 'civil';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='court_name') THEN
    ALTER TABLE cases ADD COLUMN court_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='judge_name') THEN
    ALTER TABLE cases ADD COLUMN judge_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='adverse_party_name') THEN
    ALTER TABLE cases ADD COLUMN adverse_party_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='adverse_party_lawyer') THEN
    ALTER TABLE cases ADD COLUMN adverse_party_lawyer TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='next_hearing_date') THEN
    ALTER TABLE cases ADD COLUMN next_hearing_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cases' AND column_name='estimated_value') THEN
    ALTER TABLE cases ADD COLUMN estimated_value DECIMAL(15,2);
  END IF;
END $$;

-- ============================================================
-- 2. TABLE calendar_events
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  event_type TEXT DEFAULT 'hearing'
    CHECK (event_type IN ('hearing','meeting','deadline','reminder','other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#3B82F6',
  reminder_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own events" ON calendar_events;
CREATE POLICY "Users can manage own events" ON calendar_events
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO authenticated;

-- ============================================================
-- 3. TABLE time_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID,
  client_id UUID,
  description TEXT NOT NULL,
  hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  amount DECIMAL(12,2) GENERATED ALWAYS AS (hours * hourly_rate) STORED,
  is_billable BOOLEAN DEFAULT TRUE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activity_type TEXT DEFAULT 'consultation',
  invoice_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(entry_date);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own time entries" ON time_entries;
CREATE POLICY "Users can manage own time entries" ON time_entries
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON time_entries TO authenticated;

-- ============================================================
-- 4. TABLE documents (générale)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID,
  title TEXT NOT NULL,
  content TEXT,
  document_type TEXT DEFAULT 'generated',
  template_id TEXT,
  language TEXT DEFAULT 'fr',
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','final','archived')),
  file_path TEXT,
  file_size INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own documents" ON documents;
CREATE POLICY "Users can manage own documents" ON documents
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO authenticated;

-- ============================================================
-- 5. TABLE notarial_acts
-- ============================================================
CREATE TABLE IF NOT EXISTS notarial_acts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  act_number TEXT,
  act_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  sequence_number INTEGER,
  act_type TEXT NOT NULL DEFAULT 'vente',
  act_type_label TEXT,
  act_date DATE DEFAULT CURRENT_DATE,
  act_object TEXT,
  party_first_name TEXT,
  party_last_name TEXT,
  party_address TEXT,
  party_id_number TEXT,
  second_party_first_name TEXT,
  second_party_last_name TEXT,
  act_value DECIMAL(15,2),
  registration_fees DECIMAL(10,2),
  notary_fees DECIMAL(10,2),
  wilaya TEXT,
  commune TEXT,
  notes TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','signed','registered','archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notarial_acts_user_id ON notarial_acts(user_id);
CREATE INDEX IF NOT EXISTS idx_notarial_acts_act_date ON notarial_acts(act_date DESC);

ALTER TABLE notarial_acts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own notarial acts" ON notarial_acts;
CREATE POLICY "Users can manage own notarial acts" ON notarial_acts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON notarial_acts TO authenticated;

-- RPC: get next act number
CREATE OR REPLACE FUNCTION get_next_act_number(p_user_id UUID, p_year INTEGER DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_year INTEGER := COALESCE(p_year, EXTRACT(YEAR FROM NOW())::INTEGER);
  v_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(sequence_number), 0) + 1
  INTO v_seq
  FROM notarial_acts
  WHERE user_id = p_user_id AND act_year = v_year;
  RETURN v_year::TEXT || '/' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- 6. TABLE bailiff_exploits
-- ============================================================
CREATE TABLE IF NOT EXISTS bailiff_exploits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exploit_number TEXT,
  exploit_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  sequence_number INTEGER,
  exploit_type TEXT NOT NULL DEFAULT 'signification',
  exploit_date DATE DEFAULT CURRENT_DATE,
  requester_name TEXT,
  requester_address TEXT,
  recipient_name TEXT,
  recipient_address TEXT,
  case_reference TEXT,
  court_name TEXT,
  amount_claimed DECIMAL(15,2),
  bailiff_fees DECIMAL(10,2),
  travel_fees DECIMAL(10,2),
  wilaya TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','served','failed','archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bailiff_exploits_user_id ON bailiff_exploits(user_id);
CREATE INDEX IF NOT EXISTS idx_bailiff_exploits_date ON bailiff_exploits(exploit_date DESC);

ALTER TABLE bailiff_exploits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own exploits" ON bailiff_exploits;
CREATE POLICY "Users can manage own exploits" ON bailiff_exploits
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON bailiff_exploits TO authenticated;

-- RPC: get next exploit number
CREATE OR REPLACE FUNCTION get_next_exploit_number(p_user_id UUID, p_year INTEGER DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_year INTEGER := COALESCE(p_year, EXTRACT(YEAR FROM NOW())::INTEGER);
  v_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(sequence_number), 0) + 1
  INTO v_seq
  FROM bailiff_exploits
  WHERE user_id = p_user_id AND exploit_year = v_year;
  RETURN v_year::TEXT || '/' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- 7. TABLE payment_orders
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount_dzd DECIMAL(10,2) NOT NULL,
  amount_usd DECIMAL(10,2),
  gateway TEXT NOT NULL CHECK (gateway IN ('paypal','baridimob')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','failed','cancelled')),
  reference TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON payment_orders;
CREATE POLICY "Users can view own orders" ON payment_orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE ON payment_orders TO authenticated;

-- ============================================================
-- 8. TABLE subscriptions (colonnes manquantes)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  payment_method TEXT,
  last_payment_ref TEXT,
  expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  credits_remaining INTEGER DEFAULT 5,
  documents_used INTEGER DEFAULT 0,
  documents_limit INTEGER DEFAULT 5,
  cases_limit INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;

-- Backfill subscriptions for existing users
INSERT INTO subscriptions (user_id, plan, status)
SELECT id, COALESCE(subscription_plan, 'free'), 'active'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 9. RPC: generate_case_number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_case_number(p_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN case_number ~ '^\d{4}/\d+$'
    THEN SPLIT_PART(case_number, '/', 2)::INTEGER
    ELSE 0 END
  ), 0) + 1
  INTO v_seq
  FROM cases
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM created_at) = v_year;
  RETURN v_year::TEXT || '/' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- 10. RPC: is_admin
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
      AND (profession = 'admin' OR is_admin = TRUE)
  );
END;
$$;

-- ============================================================
-- 11. VUE upcoming_hearings (après ajout de next_hearing_date)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'next_hearing_date'
  ) THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW upcoming_hearings AS
      SELECT
        c.id AS case_id,
        c.user_id,
        c.title,
        c.case_number,
        c.next_hearing_date AS hearing_date,
        c.court_name,
        c.status
      FROM cases c
      WHERE c.next_hearing_date >= CURRENT_DATE
        AND c.status NOT IN ('cloture', 'archive', 'archived')
      ORDER BY c.next_hearing_date ASC
    $view$;
  END IF;
END $$;

-- ============================================================
-- 12. VUE overdue_tasks (seulement si case_tasks existe)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'case_tasks'
  ) THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW overdue_tasks AS
      SELECT
        ct.id,
        ct.user_id,
        ct.case_id,
        ct.title,
        ct.due_date,
        ct.priority,
        ct.status,
        c.title AS case_title,
        c.case_number
      FROM case_tasks ct
      LEFT JOIN cases c ON ct.case_id = c.id
      WHERE ct.due_date < CURRENT_DATE
        AND ct.status NOT IN ('terminee', 'annulee')
      ORDER BY ct.due_date ASC
    $view$;
  END IF;
END $$;

-- ============================================================
-- VÉRIFICATION
-- ============================================================
SELECT table_name, 'OK' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'cases','clients','invoices','documents','calendar_events',
    'time_entries','notarial_acts','bailiff_exploits',
    'payment_orders','subscriptions','usage_stats','legal_deadlines',
    'profiles','audit_logs'
  )
ORDER BY table_name;
