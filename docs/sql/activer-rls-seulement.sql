-- ═══════════════════════════════════════════════════════════════════════════
-- ACTIVER RLS UNIQUEMENT (Les policies existent déjà)
-- ═══════════════════════════════════════════════════════════════════════════
-- Exécutez ce script si vous avez l'erreur "policy already exists"
-- Cela signifie que les policies sont créées mais RLS n'est pas activé
-- ═══════════════════════════════════════════════════════════════════════════

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- TERMINÉ
-- ═══════════════════════════════════════════════════════════════════════════
-- RLS est maintenant activé sur toutes les tables
-- Les policies existantes vont maintenant s'appliquer
-- Re-testez avec test-rls-configuration.html
-- ═══════════════════════════════════════════════════════════════════════════
