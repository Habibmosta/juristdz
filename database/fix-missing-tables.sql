-- ============================================================
-- FIX: Tables manquantes causant les erreurs 400/406
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- 1. COLONNE profession dans profiles (si manquante)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profession'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profession TEXT DEFAULT 'avocat';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'credits_remaining'
  ) THEN
    ALTER TABLE profiles ADD COLUMN credits_remaining INTEGER DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_status TEXT DEFAULT 'trial';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'suspension_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN suspension_reason TEXT;
  END IF;
END $$;

-- ============================================================
-- 2. TABLE legal_deadlines
-- ============================================================
CREATE TABLE IF NOT EXISTS legal_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom'
    CHECK (category IN ('appel','cassation','opposition','prescription','signification','execution','administratif','penal','custom')),
  base_date DATE NOT NULL DEFAULT CURRENT_DATE,
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

-- Ajouter la colonne status si elle n'existe pas (table déjà créée sans elle)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'legal_deadlines' AND column_name = 'status'
  ) THEN
    ALTER TABLE legal_deadlines
      ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','urgent','overdue','completed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_legal_deadlines_user_id ON legal_deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_deadline_date ON legal_deadlines(deadline_date ASC);
CREATE INDEX IF NOT EXISTS idx_legal_deadlines_status ON legal_deadlines(user_id, status);

ALTER TABLE legal_deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deadlines" ON legal_deadlines;
DROP POLICY IF EXISTS "Users can insert own deadlines" ON legal_deadlines;
DROP POLICY IF EXISTS "Users can update own deadlines" ON legal_deadlines;
DROP POLICY IF EXISTS "Users can delete own deadlines" ON legal_deadlines;

CREATE POLICY "Users can view own deadlines"   ON legal_deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deadlines" ON legal_deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deadlines" ON legal_deadlines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deadlines" ON legal_deadlines FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON legal_deadlines TO authenticated;

-- ============================================================
-- 3. TABLE usage_stats
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  credits_used_today INTEGER DEFAULT 0,
  credits_used_this_month INTEGER DEFAULT 0,
  api_calls_today INTEGER DEFAULT 0,
  api_calls_this_month INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,4) DEFAULT 0,
  documents_generated INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_monthly_reset DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON usage_stats(user_id);

ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage" ON usage_stats;
DROP POLICY IF EXISTS "Users can insert own usage" ON usage_stats;
DROP POLICY IF EXISTS "Users can update own usage" ON usage_stats;

CREATE POLICY "Users can view own usage"   ON usage_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON usage_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON usage_stats FOR UPDATE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON usage_stats TO authenticated;

-- Auto-create usage_stats row when profile is created
CREATE OR REPLACE FUNCTION create_usage_stats_for_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO usage_stats (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_usage_stats ON profiles;
CREATE TRIGGER on_profile_created_usage_stats
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_usage_stats_for_user();

-- Backfill usage_stats for existing users
INSERT INTO usage_stats (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM usage_stats)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 4. TABLE invoices (si manquante)
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID,
  case_id UUID,
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 19.00,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Ajouter les colonnes manquantes si la table existait déjà
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='invoice_date') THEN
    ALTER TABLE invoices ADD COLUMN invoice_date DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='total_amount') THEN
    ALTER TABLE invoices ADD COLUMN total_amount DECIMAL(15,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='issue_date') THEN
    ALTER TABLE invoices ADD COLUMN issue_date DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can create own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;

CREATE POLICY "Users can view own invoices"   ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id AND status = 'draft');

GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO authenticated;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
SELECT 
  'legal_deadlines' as table_name, COUNT(*) as rows FROM legal_deadlines
UNION ALL
SELECT 'usage_stats', COUNT(*) FROM usage_stats
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices;
