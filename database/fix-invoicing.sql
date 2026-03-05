-- =====================================================
-- SCRIPT DE CORRECTION - FACTURATION
-- À exécuter si la table invoices existe déjà
-- =====================================================

-- Option 1: Supprimer et recréer (ATTENTION: perte de données!)
-- Décommente si tu veux tout recommencer
/*
DROP TABLE IF EXISTS invoices CASCADE;
*/

-- Option 2: Vérifier si la table existe et la structure
DO $$
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
    RAISE NOTICE 'Table invoices existe déjà';
    
    -- Vérifier si la colonne issue_date existe
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'issue_date') THEN
      RAISE NOTICE 'Colonne issue_date manquante, ajout...';
      ALTER TABLE invoices ADD COLUMN issue_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- Vérifier autres colonnes importantes
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'due_date') THEN
      ALTER TABLE invoices ADD COLUMN due_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '30 days';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'subtotal') THEN
      ALTER TABLE invoices ADD COLUMN subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'tax_rate') THEN
      ALTER TABLE invoices ADD COLUMN tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 19.00;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'tax_amount') THEN
      ALTER TABLE invoices ADD COLUMN tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'total') THEN
      ALTER TABLE invoices ADD COLUMN total DECIMAL(15, 2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'items') THEN
      ALTER TABLE invoices ADD COLUMN items JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'invoices' AND column_name = 'sent_at') THEN
      ALTER TABLE invoices ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    RAISE NOTICE '✅ Colonnes vérifiées/ajoutées';
  ELSE
    RAISE NOTICE '❌ Table invoices n''existe pas, exécutez create-invoicing.sql';
  END IF;
END $$;

-- Recréer la vue avec la bonne colonne
DROP VIEW IF EXISTS monthly_invoice_stats CASCADE;
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

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Script de correction exécuté avec succès!';
  RAISE NOTICE 'Vous pouvez maintenant utiliser le système de facturation';
END $$;
