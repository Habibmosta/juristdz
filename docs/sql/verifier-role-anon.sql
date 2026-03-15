-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFIER LES PERMISSIONS DU RÔLE ANON
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Vérifier les permissions du rôle anon sur les tables
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
AND table_schema = 'public'
AND table_name IN ('profiles', 'cases', 'documents', 'subscriptions')
ORDER BY table_name, privilege_type;

-- Si anon a SELECT, c'est normal (RLS devrait bloquer quand même)

-- ═══════════════════════════════════════════════════════════════════════════

-- 2. Vérifier si le rôle anon bypass RLS
SELECT 
    rolname,
    rolsuper,
    rolbypassrls
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'service_role');

-- Si rolbypassrls = true pour anon, c'est le problème !
-- anon ne devrait JAMAIS avoir rolbypassrls = true

-- ═══════════════════════════════════════════════════════════════════════════

-- 3. Si anon a rolbypassrls = true, le corriger
-- ATTENTION : Ne pas exécuter si rolbypassrls = false
-- ALTER ROLE anon NOBYPASSRLS;

-- ═══════════════════════════════════════════════════════════════════════════
