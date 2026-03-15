-- Table: cabinet_settings
-- Stores per-user cabinet configuration and preferences

CREATE TABLE IF NOT EXISTS cabinet_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cabinet_name TEXT DEFAULT '',
  cabinet_address TEXT DEFAULT '',
  cabinet_phone TEXT DEFAULT '',
  cabinet_email TEXT DEFAULT '',
  cabinet_website TEXT DEFAULT '',
  wilaya TEXT DEFAULT '',
  hourly_rate NUMERIC DEFAULT 5000,
  currency TEXT DEFAULT 'DZD',
  tva_rate NUMERIC DEFAULT 19,
  payment_terms INTEGER DEFAULT 30,
  default_language TEXT DEFAULT 'fr',
  notifications_email BOOLEAN DEFAULT true,
  notifications_deadlines BOOLEAN DEFAULT true,
  notifications_invoices BOOLEAN DEFAULT true,
  auto_reminder_days INTEGER DEFAULT 3,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE cabinet_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings" ON cabinet_settings
  FOR ALL USING (auth.uid() = user_id);
