-- ═══════════════════════════════════════════════════════════════════════════
-- TABLES AVANCÉES POUR GESTION DE CABINET PROFESSIONNEL
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: 3 Mars 2026
-- Description: Tables pour timeline, rappels, calendrier, factures
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. TIMELINE DES ÉVÉNEMENTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS case_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'updated', 'document_added', 'note_added', 'deadline_set', 'hearing', 'meeting'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB, -- Données supplémentaires flexibles
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_user_id ON case_events(user_id);
CREATE INDEX IF NOT EXISTS idx_case_events_created_at ON case_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_events_type ON case_events(event_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. SYSTÈME DE RAPPELS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_date TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_case_id ON reminders(case_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_date ON reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_is_completed ON reminders(is_completed);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. CALENDRIER/AGENDA
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'hearing', 'meeting', 'deadline', 'appointment', 'other'
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  reminder_minutes INTEGER DEFAULT 60, -- Rappel X minutes avant
  attendees TEXT[], -- Liste des participants
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_case_id ON calendar_events(case_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. FACTURATION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL, -- Montant HT
  tax_rate DECIMAL(5,2) DEFAULT 19.00, -- TVA 19% en Algérie
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL, -- Montant TTC
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
  payment_date DATE,
  payment_method TEXT, -- 'cash', 'check', 'transfer', 'other'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  item_type TEXT DEFAULT 'service', -- 'service', 'expense', 'other'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_case_id ON invoices(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. AMÉLIORER TABLE DOCUMENTS
-- ═══════════════════════════════════════════════════════════════════════════

-- Ajouter colonnes pour lier documents aux dossiers
ALTER TABLE documents ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT; -- 'pleading', 'evidence', 'correspondence', 'contract', 'other'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT; -- URL du fichier dans le stockage
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER; -- Taille en bytes
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type TEXT; -- Type MIME du fichier
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1; -- Versioning des documents

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. TABLE CLIENTS (Si elle n'existe pas déjà)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Algérie',
  company_name TEXT, -- Pour clients entreprises
  tax_id TEXT, -- NIF pour entreprises
  notes TEXT,
  tags TEXT[], -- Tags pour catégoriser les clients
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. ACTIVER ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. POLICIES POUR case_events
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their own case events" ON case_events;
CREATE POLICY "Users can view their own case events"
  ON case_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own case events" ON case_events;
CREATE POLICY "Users can create their own case events"
  ON case_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own case events" ON case_events;
CREATE POLICY "Users can update their own case events"
  ON case_events FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own case events" ON case_events;
CREATE POLICY "Users can delete their own case events"
  ON case_events FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. POLICIES POUR reminders
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their own reminders" ON reminders;
CREATE POLICY "Users can view their own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own reminders" ON reminders;
CREATE POLICY "Users can manage their own reminders"
  ON reminders FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. POLICIES POUR calendar_events
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
CREATE POLICY "Users can view their own calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own calendar events" ON calendar_events;
CREATE POLICY "Users can manage their own calendar events"
  ON calendar_events FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. POLICIES POUR invoices
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own invoices" ON invoices;
CREATE POLICY "Users can manage their own invoices"
  ON invoices FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. POLICIES POUR invoice_items
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view invoice items of their invoices" ON invoice_items;
CREATE POLICY "Users can view invoice items of their invoices"
  ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage invoice items of their invoices" ON invoice_items;
CREATE POLICY "Users can manage invoice items of their invoices"
  ON invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. POLICIES POUR clients
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
CREATE POLICY "Users can view their own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own clients" ON clients;
CREATE POLICY "Users can manage their own clients"
  ON clients FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 14. FONCTIONS UTILITAIRES
-- ═══════════════════════════════════════════════════════════════════════════

-- Fonction pour générer un numéro de facture unique
CREATE OR REPLACE FUNCTION generate_invoice_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  year_str TEXT;
  count_invoices INTEGER;
  invoice_num TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) INTO count_invoices
  FROM invoices
  WHERE user_id = user_uuid
  AND EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM NOW());
  
  invoice_num := 'INV-' || year_str || '-' || LPAD((count_invoices + 1)::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le total d'une facture
CREATE OR REPLACE FUNCTION calculate_invoice_total(invoice_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  subtotal DECIMAL;
  tax_rate DECIMAL;
  tax_amount DECIMAL;
  total DECIMAL;
BEGIN
  -- Calculer le sous-total
  SELECT COALESCE(SUM(total), 0) INTO subtotal
  FROM invoice_items
  WHERE invoice_id = invoice_uuid;
  
  -- Récupérer le taux de TVA
  SELECT COALESCE(invoices.tax_rate, 19.00) INTO tax_rate
  FROM invoices
  WHERE id = invoice_uuid;
  
  -- Calculer la TVA
  tax_amount := subtotal * (tax_rate / 100);
  
  -- Calculer le total TTC
  total := subtotal + tax_amount;
  
  -- Mettre à jour la facture
  UPDATE invoices
  SET amount = subtotal,
      tax_amount = tax_amount,
      total_amount = total,
      updated_at = NOW()
  WHERE id = invoice_uuid;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer les rappels comme complétés
CREATE OR REPLACE FUNCTION complete_reminder(reminder_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE reminders
  SET is_completed = TRUE,
      completed_at = NOW()
  WHERE id = reminder_uuid
  AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- 15. TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les tables concernées
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- TERMINÉ
-- ═══════════════════════════════════════════════════════════════════════════
-- Toutes les tables avancées ont été créées avec succès!
-- 
-- Tables créées:
-- ✅ case_events - Timeline des événements
-- ✅ reminders - Système de rappels
-- ✅ calendar_events - Calendrier/Agenda
-- ✅ invoices - Factures
-- ✅ invoice_items - Lignes de factures
-- ✅ clients - Gestion des clients
-- 
-- Améliorations:
-- ✅ documents - Colonnes ajoutées pour lier aux dossiers
-- 
-- Sécurité:
-- ✅ RLS activé sur toutes les tables
-- ✅ Policies créées pour isolation des données
-- 
-- Fonctions utilitaires:
-- ✅ generate_invoice_number() - Génération numéros de facture
-- ✅ calculate_invoice_total() - Calcul automatique des totaux
-- ✅ complete_reminder() - Marquer rappels comme complétés
-- 
-- Prochaine étape: Utiliser ces tables dans l'application React!
-- ═══════════════════════════════════════════════════════════════════════════

