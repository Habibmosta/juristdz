-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT DE VÉRIFICATION DES TABLES JURISTDZ
-- ═══════════════════════════════════════════════════════════════════════════
-- Ce script vérifie que toutes les tables ont été créées correctement
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. VÉRIFIER L'EXISTENCE DE TOUTES LES TABLES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'VÉRIFICATION DES TABLES' as verification,
  '========================' as separator;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'cases', 'clients', 'documents', 'case_events', 
      'reminders', 'calendar_events', 'invoices', 'invoice_items'
    ) THEN '✅ EXISTE'
    ELSE '❌ MANQUANTE'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'cases', 'clients', 'documents', 'case_events', 
    'reminders', 'calendar_events', 'invoices', 'invoice_items'
  )
ORDER BY table_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. COMPTER LES TABLES CRÉÉES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'RÉSUMÉ' as verification,
  '=======' as separator;

SELECT 
  COUNT(*) as tables_creees,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ TOUTES LES TABLES SONT CRÉÉES (8/8)'
    ELSE '❌ IL MANQUE ' || (8 - COUNT(*)) || ' TABLE(S)'
  END as resultat
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'cases', 'clients', 'documents', 'case_events', 
    'reminders', 'calendar_events', 'invoices', 'invoice_items'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. VÉRIFIER LES COLONNES DE LA TABLE DOCUMENTS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'COLONNES DE DOCUMENTS' as verification,
  '======================' as separator;

SELECT 
  column_name,
  data_type,
  '✅' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'documents'
  AND column_name IN (
    'id', 'user_id', 'title', 'content', 'document_type', 
    'case_id', 'category', 'file_url', 'file_size', 'mime_type', 
    'version', 'created_at', 'updated_at'
  )
ORDER BY 
  CASE column_name
    WHEN 'id' THEN 1
    WHEN 'user_id' THEN 2
    WHEN 'case_id' THEN 3
    WHEN 'title' THEN 4
    WHEN 'content' THEN 5
    WHEN 'document_type' THEN 6
    WHEN 'category' THEN 7
    WHEN 'file_url' THEN 8
    WHEN 'file_size' THEN 9
    WHEN 'mime_type' THEN 10
    WHEN 'version' THEN 11
    WHEN 'created_at' THEN 12
    WHEN 'updated_at' THEN 13
  END;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. VÉRIFIER LES COLONNES IMPORTANTES DE CHAQUE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'COLONNES CLÉS PAR TABLE' as verification,
  '========================' as separator;

-- Cases
SELECT 
  'cases' as table_name,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ OK'
    ELSE '❌ INCOMPLET'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cases'

UNION ALL

-- Clients
SELECT 
  'clients' as table_name,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) >= 13 THEN '✅ OK'
    ELSE '❌ INCOMPLET'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'clients'

UNION ALL

-- Documents
SELECT 
  'documents' as table_name,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) >= 11 THEN '✅ OK'
    ELSE '❌ INCOMPLET'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'documents'

UNION ALL

-- Case Events
SELECT 
  'case_events' as table_name,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ OK'
    ELSE '❌ INCOMPLET'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'case_events'

UNION ALL

-- Reminders
SELECT 
  'reminders' as table_name,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) >= 9 THEN '✅ OK'
    ELSE '❌ INCOMPLET'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reminders'

UNION ALL

-- Calendar Events
SELECT 
  'calendar_events' as table_name,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) >= 12 THEN '✅ OK'
    ELSE '❌ INCOMPLET'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'calendar_events'

UNION ALL

-- Invoices
SELECT 
  'invoices' as table_name,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ OK'
    ELSE '❌ INCOMPLET'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'invoices'

UNION ALL

-- Invoice Items
SELECT 
  'invoice_items' as table_name,
  COUNT(*) as colonnes_trouvees,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ OK'
    ELSE '❌ INCOMPLET'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'invoice_items';

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. VÉRIFIER QUE RLS EST ACTIVÉ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'ROW LEVEL SECURITY (RLS)' as verification,
  '=========================' as separator;

SELECT 
  tablename as table_name,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS ACTIVÉ'
    ELSE '❌ RLS DÉSACTIVÉ'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'cases', 'clients', 'documents', 'case_events', 
    'reminders', 'calendar_events', 'invoices', 'invoice_items'
  )
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. VÉRIFIER LES POLICIES (RÈGLES RLS)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'POLICIES RLS' as verification,
  '=============' as separator;

SELECT 
  tablename as table_name,
  COUNT(*) as nombre_policies,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ OK (au moins 2 policies)'
    WHEN COUNT(*) = 1 THEN '⚠️ PARTIEL (1 policy)'
    ELSE '❌ AUCUNE POLICY'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'cases', 'clients', 'documents', 'case_events', 
    'reminders', 'calendar_events', 'invoices', 'invoice_items'
  )
GROUP BY tablename
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. VÉRIFIER LES INDEX
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'INDEX CRÉÉS' as verification,
  '============' as separator;

SELECT 
  tablename as table_name,
  COUNT(*) as nombre_index,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ OK'
    WHEN COUNT(*) = 1 THEN '⚠️ PARTIEL'
    ELSE '❌ AUCUN INDEX'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'cases', 'clients', 'documents', 'case_events', 
    'reminders', 'calendar_events', 'invoices', 'invoice_items'
  )
GROUP BY tablename
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. VÉRIFIER LA FONCTION generate_invoice_number
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'FONCTIONS' as verification,
  '==========' as separator;

SELECT 
  proname as fonction_name,
  '✅ EXISTE' as status
FROM pg_proc
WHERE proname = 'generate_invoice_number';

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. VÉRIFIER LES TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'TRIGGERS' as verification,
  '========' as separator;

SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  '✅ EXISTE' as status
FROM pg_trigger
WHERE tgname LIKE '%updated_at%'
  AND tgrelid::regclass::text IN (
    'cases', 'clients', 'documents', 'invoices'
  )
ORDER BY tgrelid::regclass;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. RÉSUMÉ FINAL
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'RÉSUMÉ FINAL' as verification,
  '=============' as separator;

WITH verification AS (
  SELECT 
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('cases', 'clients', 'documents', 'case_events', 'reminders', 'calendar_events', 'invoices', 'invoice_items')
    ) as tables_count,
    
    (SELECT COUNT(*) FROM pg_tables 
     WHERE schemaname = 'public' 
     AND rowsecurity = true
     AND tablename IN ('cases', 'clients', 'documents', 'case_events', 'reminders', 'calendar_events', 'invoices', 'invoice_items')
    ) as rls_count,
    
    (SELECT COUNT(DISTINCT tablename) FROM pg_policies 
     WHERE schemaname = 'public'
     AND tablename IN ('cases', 'clients', 'documents', 'case_events', 'reminders', 'calendar_events', 'invoices', 'invoice_items')
    ) as policies_count,
    
    (SELECT COUNT(*) FROM pg_proc WHERE proname = 'generate_invoice_number') as function_count
)
SELECT 
  '📊 Tables créées: ' || tables_count || '/8' as ligne1,
  CASE WHEN tables_count = 8 THEN '✅' ELSE '❌' END as status1
FROM verification

UNION ALL

SELECT 
  '🔒 RLS activé: ' || rls_count || '/8' as ligne1,
  CASE WHEN rls_count = 8 THEN '✅' ELSE '❌' END as status1
FROM verification

UNION ALL

SELECT 
  '📋 Policies créées: ' || policies_count || '/8' as ligne1,
  CASE WHEN policies_count = 8 THEN '✅' ELSE '❌' END as status1
FROM verification

UNION ALL

SELECT 
  '⚙️ Fonctions: ' || function_count || '/1' as ligne1,
  CASE WHEN function_count = 1 THEN '✅' ELSE '❌' END as status1
FROM verification

UNION ALL

SELECT 
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as ligne1,
  '' as status1

UNION ALL

SELECT 
  CASE 
    WHEN (SELECT tables_count FROM verification) = 8 
     AND (SELECT rls_count FROM verification) = 8 
     AND (SELECT policies_count FROM verification) = 8 
     AND (SELECT function_count FROM verification) = 1
    THEN '🎉 TOUT EST CORRECT! Base de données prête!'
    ELSE '⚠️ Il manque des éléments. Vérifiez ci-dessus.'
  END as ligne1,
  '' as status1;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DE LA VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
