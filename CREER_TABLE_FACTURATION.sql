-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE INVOICES - Système de facturation automatisée
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Créer la table invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Numérotation
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Montants
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 19.00, -- TVA algérienne 19%
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Paiements
  paid_amount NUMERIC(12,2) DEFAULT 0,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Statut
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
  
  -- Informations client (snapshot)
  client_name TEXT NOT NULL,
  client_address TEXT,
  client_email TEXT,
  client_phone TEXT,
  
  -- Notes
  notes TEXT,
  terms TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- 2. Créer la table invoice_items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Description
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  
  -- Type
  item_type TEXT DEFAULT 'service', -- 'service', 'expense', 'disbursement'
  
  -- Ordre
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Créer la table payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Montant
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Méthode
  payment_method TEXT DEFAULT 'bank_transfer', -- 'cash', 'check', 'bank_transfer', 'card'
  reference TEXT, -- Numéro de chèque, référence virement, etc.
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Créer la table time_entries (suivi du temps)
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  
  -- Temps
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER NOT NULL,
  hourly_rate NUMERIC(10,2),
  
  -- Description
  description TEXT NOT NULL,
  activity_type TEXT, -- 'consultation', 'research', 'drafting', 'court', 'meeting', 'phone', 'email'
  
  -- Facturation
  is_billable BOOLEAN DEFAULT true,
  is_invoiced BOOLEAN DEFAULT false,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Index pour performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_case_id ON public.invoices(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_case_id ON public.time_entries(case_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_is_invoiced ON public.time_entries(is_invoiced) WHERE is_invoiced = false;

-- 6. Activer RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- 7. Politiques RLS
CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own invoices"
  ON public.invoices FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own invoices"
  ON public.invoices FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own invoices"
  ON public.invoices FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view items of their invoices"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

CREATE POLICY "Users can manage items of their invoices"
  ON public.invoice_items FOR ALL
  USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

CREATE POLICY "Users can view their payments"
  ON public.payments FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their payments"
  ON public.payments FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their time entries"
  ON public.time_entries FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their time entries"
  ON public.time_entries FOR ALL USING (user_id = auth.uid());

-- 8. Triggers
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET 
    subtotal = (SELECT COALESCE(SUM(amount), 0) FROM invoice_items WHERE invoice_id = NEW.invoice_id),
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  UPDATE invoices
  SET 
    tax_amount = subtotal * (tax_rate / 100),
    total_amount = subtotal + (subtotal * (tax_rate / 100)),
    balance = subtotal + (subtotal * (tax_rate / 100)) - paid_amount
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_totals ON invoice_items;
CREATE TRIGGER trigger_update_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_totals();

CREATE OR REPLACE FUNCTION update_invoice_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET 
    paid_amount = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = NEW.invoice_id),
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  UPDATE invoices
  SET 
    balance = total_amount - paid_amount,
    payment_status = CASE
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'partial'
      ELSE 'unpaid'
    END,
    paid_at = CASE WHEN paid_amount >= total_amount THEN NOW() ELSE NULL END
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_payment ON payments;
CREATE TRIGGER trigger_update_invoice_payment
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_payment();

-- 9. Fonction pour générer un numéro de facture
CREATE OR REPLACE FUNCTION generate_invoice_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM invoices
  WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  v_number := 'FACT-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$;

-- 10. Fonction pour créer une facture depuis les heures facturables
CREATE OR REPLACE FUNCTION create_invoice_from_time_entries(
  p_case_id UUID,
  p_user_id UUID,
  p_due_days INTEGER DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice_id UUID;
  v_case RECORD;
  v_client RECORD;
  v_time_entry RECORD;
  v_invoice_number TEXT;
BEGIN
  -- Récupérer les infos du dossier et client
  SELECT * INTO v_case FROM cases WHERE id = p_case_id;
  SELECT * INTO v_client FROM clients WHERE id = v_case.client_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Case or client not found';
  END IF;
  
  -- Générer le numéro de facture
  v_invoice_number := generate_invoice_number(p_user_id);
  
  -- Créer la facture
  INSERT INTO invoices (
    user_id,
    case_id,
    client_id,
    invoice_number,
    invoice_date,
    due_date,
    client_name,
    client_address,
    client_email,
    client_phone
  ) VALUES (
    p_user_id,
    p_case_id,
    v_case.client_id,
    v_invoice_number,
    CURRENT_DATE,
    CURRENT_DATE + p_due_days,
    v_client.name,
    v_client.address,
    v_client.email,
    v_client.phone
  )
  RETURNING id INTO v_invoice_id;
  
  -- Ajouter les entrées de temps comme items
  FOR v_time_entry IN 
    SELECT * FROM time_entries
    WHERE case_id = p_case_id
      AND user_id = p_user_id
      AND is_billable = true
      AND is_invoiced = false
  LOOP
    INSERT INTO invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      amount
    ) VALUES (
      v_invoice_id,
      v_time_entry.description || ' (' || (v_time_entry.duration_minutes / 60.0)::NUMERIC(10,2) || 'h)',
      v_time_entry.duration_minutes / 60.0,
      v_time_entry.hourly_rate,
      (v_time_entry.duration_minutes / 60.0) * v_time_entry.hourly_rate
    );
    
    -- Marquer comme facturé
    UPDATE time_entries
    SET is_invoiced = true, invoice_id = v_invoice_id
    WHERE id = v_time_entry.id;
  END LOOP;
  
  RETURN v_invoice_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'Tables de facturation créées avec succès!' as status;
SELECT COUNT(*) as total_invoices FROM public.invoices;
SELECT COUNT(*) as total_time_entries FROM public.time_entries;
