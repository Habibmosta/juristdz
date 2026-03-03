-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT COMPLET À EXÉCUTER - COPIER/COLLER TOUT CE FICHIER
-- ═══════════════════════════════════════════════════════════════════════════

-- ÉTAPE 2: TABLE CLIENTS
DROP TABLE IF EXISTS public.clients CASCADE;

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  client_type TEXT NOT NULL DEFAULT 'individual',
  cin TEXT,
  nif TEXT,
  rc TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  address TEXT,
  city TEXT,
  wilaya TEXT,
  postal_code TEXT,
  profession TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_status ON public.clients(status);

-- ÉTAPE 3: TABLE TIME_ENTRIES
DROP TABLE IF EXISTS public.time_entries CASCADE;

CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  description TEXT NOT NULL,
  activity_type TEXT,
  billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  amount DECIMAL(10,2),
  invoiced BOOLEAN DEFAULT false,
  invoice_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX idx_time_entries_client_id ON public.time_entries(client_id);
CREATE INDEX idx_time_entries_start_time ON public.time_entries(start_time DESC);

-- ÉTAPE 4: TABLE INVOICES
DROP TABLE IF EXISTS public.invoices CASCADE;

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 19.00,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  paid_amount DECIMAL(10,2) DEFAULT 0,
  paid_date DATE,
  payment_method TEXT,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- ÉTAPE 5: TABLE INVOICE_ITEMS
DROP TABLE IF EXISTS public.invoice_items CASCADE;

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  time_entry_id UUID,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- ÉTAPE 6: TABLE PAYMENTS
DROP TABLE IF EXISTS public.payments CASCADE;

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  client_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);

-- ÉTAPE 8: FONCTIONS
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

CREATE OR REPLACE FUNCTION update_invoice_total()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal DECIMAL(10,2);
  v_tax_amount DECIMAL(10,2);
  v_total DECIMAL(10,2);
  v_invoice_id UUID;
  v_tax_rate DECIMAL(5,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;
  
  SELECT COALESCE(SUM(amount), 0) INTO v_subtotal
  FROM public.invoice_items
  WHERE invoice_id = v_invoice_id;
  
  SELECT tax_rate INTO v_tax_rate
  FROM public.invoices
  WHERE id = v_invoice_id;
  
  v_tax_amount := v_subtotal * (v_tax_rate / 100);
  v_total := v_subtotal + v_tax_amount;
  
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

-- ÉTAPE 9: VUES
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

-- VÉRIFICATION FINALE
SELECT 
  'Tables créées: ' || COUNT(*) as message
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('clients', 'time_entries', 'invoices', 'invoice_items', 'payments');
