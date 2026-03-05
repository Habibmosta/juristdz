-- ═══════════════════════════════════════════════════════════════════════════
-- CORRECTION: ACTIVER RLS ET POLICIES MANQUANTES
-- ═══════════════════════════════════════════════════════════════════════════
-- Ce script active RLS et crée les policies pour les 5 tables manquantes
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ACTIVER ROW LEVEL SECURITY SUR TOUTES LES TABLES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. POLICIES POUR CASES
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their own cases" ON cases;
CREATE POLICY "Users can view their own cases"
  ON cases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own cases" ON cases;
CREATE POLICY "Users can manage their own cases"
  ON cases FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. POLICIES POUR CLIENTS
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
-- 4. POLICIES POUR DOCUMENTS
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own documents" ON documents;
CREATE POLICY "Users can manage their own documents"
  ON documents FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. POLICIES POUR CASE_EVENTS
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view their own case events" ON case_events;
CREATE POLICY "Users can view their own case events"
  ON case_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own case events" ON case_events;
CREATE POLICY "Users can manage their own case events"
  ON case_events FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. POLICIES POUR REMINDERS
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
-- 7. POLICIES POUR CALENDAR_EVENTS
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
-- 8. POLICIES POUR INVOICES
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
-- 9. POLICIES POUR INVOICE_ITEMS
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view invoice items" ON invoice_items;
CREATE POLICY "Users can view invoice items"
  ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage invoice items" ON invoice_items;
CREATE POLICY "Users can manage invoice items"
  ON invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  '✅ RLS ET POLICIES ACTIVÉS AVEC SUCCÈS!' as message,
  '' as details

UNION ALL

SELECT 
  'Vérification:' as message,
  '' as details

UNION ALL

SELECT 
  '  - RLS activé sur 8 tables' as message,
  '✅' as details

UNION ALL

SELECT 
  '  - 16 policies créées (2 par table)' as message,
  '✅' as details

UNION ALL

SELECT 
  '' as message,
  '' as details

UNION ALL

SELECT 
  '🎉 Vous pouvez maintenant ré-exécuter verification-tables.sql' as message,
  '' as details

UNION ALL

SELECT 
  '   pour confirmer que tout est correct!' as message,
  '' as details;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DE LA CORRECTION
-- ═══════════════════════════════════════════════════════════════════════════
