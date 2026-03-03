-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT SIMPLIFIÉ - CLIENTS + TIME TRACKING + FACTURATION
-- ═══════════════════════════════════════════════════════════════════════════
-- Version sans dépendance à la table cases
-- Exécuter ce script si vous avez l'erreur "column user_id does not exist"
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. TABLE CLIENTS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations personnelles
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  client_type TEXT NOT NULL DEFAULT 'individual', -- 'individual' ou 'company'
  
  -- Identification
  cin TEXT,
  nif TEXT,
  rc TEXT,
  
  -- Contact
  email TEXT,
  phone TEXT,
  mobile TEXT,
  address TEXT,
  city TEXT,
  wilaya TEXT,
  postal_code TEXT,
  
  -- Informations professionnelles
  profession TEXT,
  
  -- Notes et statut
  notes TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'archived'
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. TABLE GESTION DU TEMPS (TIME TRACKING)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Temps
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Description
  description TEXT NOT NULL,
  activity_type TEXT, -- 'consultation', 'research', 'drafting', 'court', 'phone', etc.
  
  -- Facturation
  billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  amount DECIMAL(10,2),
  invoiced BOOLEAN DEFAULT false,
  invoice_id UUID,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_client_id ON public.time_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON public.time_entries(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_billable ON public.time_entries(billable) WHERE billable = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. TABLE FACTURES (INVOICES)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Numérotation
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Montants
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 19.00, -- TVA 19% en Algérie
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Paiement
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  paid_amount DECIMAL(10,2) DEFAULT 0,
  paid_date DATE,
  payment_method TEXT,
  
  -- Notes
  notes TEXT,
  terms TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. TABLE LIGNES DE FACTURE (INVOICE ITEMS)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  -- Type de ligne
  item_type TEXT NOT NULL, -- 'service', 'expense', 'time_entry'
  time_entry_id UUID REFERENCES public.time_entries(id) ON DELETE SET NULL,
  
  -- Description
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  
  -- Ordre d'affichage
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. TABLE PAIEMENTS (PAYMENTS)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Montant
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL,
  
  -- Détails
  reference TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- FONCTIONS UTILITAIRES
-- ═══════════════════════════════════════════════════════════════════════════

-- Fonction pour calculer la durée d'une entrée de temps
CREATE OR REPLACE FUNCTION calculate_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    IF NEW.hourly_rate IS NOT NULL THEN
      NEW.amount := (NEW.duration_minutes / 60.0) * NEW.hourly_rate;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_time_entry_duration ON public.time_entries;
CREATE TRIGGER trigger_calculate_time_entry_duration
  BEFORE INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_entry_duration();

-- Fonction pour mettre à jour le total d'une facture
CREATE OR REPLACE FUNCTION update_invoice_total()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal DECIMAL(10,2);
  v_tax_amount DECIMAL(10,2);
  v_total DECIMAL(10,2);
  v_invoice_id UUID;
  v_tax_rate DECIMAL(5,2);
BEGIN
  -- Déterminer l'ID de la facture
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;
  
  -- Calculer le sous-total
  SELECT COALESCE(SUM(amount), 0) INTO v_subtotal
  FROM public.invoice_items
  WHERE invoice_id = v_invoice_id;
  
  -- Récupérer le taux de TVA
  SELECT tax_rate INTO v_tax_rate
  FROM public.invoices
  WHERE id = v_invoice_id;
  
  -- Calculer TVA et total
  v_tax_amount := v_subtotal * (v_tax_rate / 100);
  v_total := v_subtotal + v_tax_amount;
  
  -- Mettre à jour la facture
  UPDATE public.invoices
  SET 
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total = v_total,
    updated_at = NOW()
  WHERE id = v_invoice_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_total_insert ON public.invoice_items;
CREATE TRIGGER trigger_update_invoice_total_insert
  AFTER INSERT ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_total();

DROP TRIGGER IF EXISTS trigger_update_invoice_total_update ON public.invoice_items;
CREATE TRIGGER trigger_update_invoice_total_update
  AFTER UPDATE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_total();

DROP TRIGGER IF EXISTS trigger_update_invoice_total_delete ON public.invoice_items;
CREATE TRIGGER trigger_update_invoice_total_delete
  AFTER DELETE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_total();

-- Fonction pour générer un numéro de facture automatique
CREATE OR REPLACE FUNCTION generate_invoice_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.invoices
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_number := 'INV-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- VUES UTILES
-- ═══════════════════════════════════════════════════════════════════════════

-- Vue: Statistiques clients
CREATE OR REPLACE VIEW client_stats AS
SELECT 
  c.id,
  c.user_id,
  c.first_name,
  c.last_name,
  c.company_name,
  COUNT(DISTINCT i.id) as total_invoices,
  COALESCE(SUM(i.total), 0) as total_billed,
  COALESCE(SUM(i.paid_amount), 0) as total_paid,
  COALESCE(SUM(i.total - i.paid_amount), 0) as total_outstanding
FROM public.clients c
LEFT JOIN public.invoices i ON c.id = i.client_id
GROUP BY c.id;

-- Vue: Factures en retard
CREATE OR REPLACE VIEW overdue_invoices AS
SELECT 
  i.*,
  c.first_name || ' ' || c.last_name as client_name,
  CURRENT_DATE - i.due_date as days_overdue
FROM public.invoices i
JOIN public.clients c ON i.client_id = c.id
WHERE i.status IN ('sent', 'overdue')
  AND i.due_date < CURRENT_DATE
  AND i.total > i.paid_amount;

-- ═══════════════════════════════════════════════════════════════════════════
-- TERMINÉ
-- ═══════════════════════════════════════════════════════════════════════════
-- Tables créées:
-- ✅ clients - Gestion des clients
-- ✅ time_entries - Gestion du temps (comme Clio)
-- ✅ invoices - Factures
-- ✅ invoice_items - Lignes de facture
-- ✅ payments - Paiements
--
-- Fonctions créées:
-- ✅ calculate_time_entry_duration() - Calcul automatique durée/montant
-- ✅ update_invoice_total() - Mise à jour automatique totaux facture
-- ✅ generate_invoice_number() - Génération numéro facture
--
-- Vues créées:
-- ✅ client_stats - Statistiques par client
-- ✅ overdue_invoices - Factures en retard
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'Script exécuté avec succès! Tables créées: clients, time_entries, invoices, invoice_items, payments' as message;
