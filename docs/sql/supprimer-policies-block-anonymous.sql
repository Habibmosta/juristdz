-- ═══════════════════════════════════════════════════════════════════════════
-- SUPPRIMER LES POLICIES "Block anonymous access" INUTILES
-- ═══════════════════════════════════════════════════════════════════════════
-- Ces policies ne servent à rien car les autres policies vérifient déjà auth.uid()
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous access to cases" ON public.cases;
DROP POLICY IF EXISTS "Block anonymous access to documents" ON public.documents;
DROP POLICY IF EXISTS "Block anonymous access to subscriptions" ON public.subscriptions;

-- ═══════════════════════════════════════════════════════════════════════════
-- TERMINÉ
-- ═══════════════════════════════════════════════════════════════════════════
-- Les policies restantes vérifient déjà auth.uid() IS NOT NULL
-- Donc les accès anonymes sont bloqués
-- Re-testez avec test-rls-configuration.html
-- ═══════════════════════════════════════════════════════════════════════════
