-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFIER LE STATUT RÉEL DE RLS
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Vérifier si RLS est activé sur les tables
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'cases', 'documents', 'subscriptions')
ORDER BY tablename;

-- Résultat attendu : rls_enabled = true pour toutes les tables
-- Si false, RLS n'est PAS activé malgré l'interface

-- ═══════════════════════════════════════════════════════════════════════════

-- 2. Lister toutes les policies existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'cases', 'documents', 'subscriptions')
ORDER BY tablename, policyname;

-- Vérifier le nombre de policies par table

-- ═══════════════════════════════════════════════════════════════════════════

-- 3. Forcer l'activation de RLS (au cas où)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════

-- 4. Vérifier à nouveau après activation forcée
SELECT 
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'cases', 'documents', 'subscriptions')
ORDER BY tablename;

-- Si rls_enabled = true maintenant, le problème était que RLS n'était pas vraiment activé
