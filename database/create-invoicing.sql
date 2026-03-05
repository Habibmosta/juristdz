-- =====================================================
-- SYSTÈME DE FACTURATION PROFESSIONNEL
-- Création des tables, fonctions et vues pour JuristDZ
-- =====================================================

-- Table principale des factures
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  
  -- Informations facture
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  
  -- Montants
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 19.00, -- TVA 19% en Algérie
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Éléments de la facture (JSONB pour flexibilité)
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Paiement
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  
  -- Notes et métadonnées
  notes TEXT,
  terms TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Index pour performance
  CONSTRAINT valid_dates CHECK (due_date >= issue_date),
  CONSTRAINT valid_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND total >= 0)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_case_id ON invoices(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- =====================================================
-- FONCTIONS AUTOMATIQUES
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_invoices_updated_at ON invoices;
CREATE TRIGGER trigger_update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- Fonction pour mettre à jour le statut en "overdue" automatiquement
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

-- Fonction pour calculer les statistiques de facturation
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
    COUNT(*)::BIGINT as total_invoices,
    COUNT(*) FILTER (WHERE status = 'draft')::BIGINT as draft_count,
    COUNT(*) FILTER (WHERE status = 'sent')::BIGINT as sent_count,
    COUNT(*) FILTER (WHERE status = 'paid')::BIGINT as paid_count,
    COUNT(*) FILTER (WHERE status = 'overdue')::BIGINT as overdue_count,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_count,
    COALESCE(SUM(total), 0) as total_amount,
    COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) as paid_amount,
    COALESCE(SUM(total) FILTER (WHERE status IN ('sent', 'overdue')), 0) as unpaid_amount,
    COALESCE(SUM(total) FILTER (WHERE status = 'overdue'), 0) as overdue_amount
  FROM invoices
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue pour les factures avec informations client et dossier
CREATE OR REPLACE VIEW invoices_with_details AS
SELECT 
  i.*,
  c.first_name || ' ' || c.last_name as client_name,
  c.company_name,
  c.email as client_email,
  c.phone as client_phone,
  cs.case_number,
  cs.title as case_title,
  cs.status as case_status,
  -- Calcul du nombre de jours avant/après échéance
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

-- Vue pour les statistiques mensuelles
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
GROUP BY user_id, DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur la table invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres factures
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent créer leurs propres factures
CREATE POLICY "Users can create own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leurs propres factures
CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres factures (brouillons uniquement)
CREATE POLICY "Users can delete own draft invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');

-- =====================================================
-- DONNÉES DE DÉMONSTRATION (OPTIONNEL)
-- =====================================================

-- Fonction pour créer des factures de démonstration
CREATE OR REPLACE FUNCTION create_demo_invoices(p_user_id UUID, p_client_id UUID, p_case_id UUID)
RETURNS void AS $$
DECLARE
  v_invoice_number VARCHAR(50);
  v_year INT := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  -- Facture 1: Payée
  v_invoice_number := 'INV-' || v_year || '-0001';
  INSERT INTO invoices (
    user_id, client_id, case_id, invoice_number,
    issue_date, due_date, status,
    subtotal, tax_rate, tax_amount, total,
    items, payment_date, payment_method,
    notes
  ) VALUES (
    p_user_id, p_client_id, p_case_id, v_invoice_number,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '15 days',
    'paid',
    50000, 19, 9500, 59500,
    '[
      {"description": "Consultation juridique initiale", "quantity": 2, "unit_price": 15000, "amount": 30000},
      {"description": "Rédaction de contrat", "quantity": 1, "unit_price": 20000, "amount": 20000}
    ]'::jsonb,
    CURRENT_DATE - INTERVAL '10 days',
    'Virement bancaire',
    'Merci pour votre confiance'
  );

  -- Facture 2: Envoyée (en attente)
  v_invoice_number := 'INV-' || v_year || '-0002';
  INSERT INTO invoices (
    user_id, client_id, case_id, invoice_number,
    issue_date, due_date, status,
    subtotal, tax_rate, tax_amount, total,
    items, sent_at,
    notes
  ) VALUES (
    p_user_id, p_client_id, p_case_id, v_invoice_number,
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '20 days',
    'sent',
    75000, 19, 14250, 89250,
    '[
      {"description": "Représentation en audience", "quantity": 3, "unit_price": 25000, "amount": 75000}
    ]'::jsonb,
    CURRENT_DATE - INTERVAL '10 days',
    'Paiement attendu sous 30 jours'
  );

  -- Facture 3: Brouillon
  v_invoice_number := 'INV-' || v_year || '-0003';
  INSERT INTO invoices (
    user_id, client_id, case_id, invoice_number,
    issue_date, due_date, status,
    subtotal, tax_rate, tax_amount, total,
    items,
    notes
  ) VALUES (
    p_user_id, p_client_id, p_case_id, v_invoice_number,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'draft',
    100000, 19, 19000, 119000,
    '[
      {"description": "Honoraires forfaitaires dossier complet", "quantity": 1, "unit_price": 100000, "amount": 100000}
    ]'::jsonb,
    'À finaliser avant envoi'
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE invoices IS 'Table principale pour la gestion des factures avocat';
COMMENT ON COLUMN invoices.invoice_number IS 'Numéro unique de facture (ex: INV-2026-0001)';
COMMENT ON COLUMN invoices.status IS 'Statut: draft, sent, paid, overdue, cancelled';
COMMENT ON COLUMN invoices.items IS 'Éléments de facturation en format JSON';
COMMENT ON COLUMN invoices.tax_rate IS 'Taux de TVA en pourcentage (19% par défaut en Algérie)';

-- =====================================================
-- SCRIPT TERMINÉ
-- =====================================================

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Système de facturation créé avec succès!';
  RAISE NOTICE '📊 Tables: invoices';
  RAISE NOTICE '🔒 RLS activé avec politiques de sécurité';
  RAISE NOTICE '📈 Vues: invoices_with_details, monthly_invoice_stats';
  RAISE NOTICE '⚙️ Fonctions: get_invoice_stats, update_invoice_overdue_status';
END $$;
