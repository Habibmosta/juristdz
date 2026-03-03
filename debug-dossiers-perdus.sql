-- ═══════════════════════════════════════════════════════════════════════════
-- DEBUG : Trouver les dossiers "perdus"
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Voir TOUS les dossiers (bypass RLS avec votre session admin)
SELECT 
    id,
    user_id,
    title,
    client_name,
    status,
    created_at,
    updated_at
FROM cases
ORDER BY created_at DESC;

-- Vérifiez si le dossier créé par Avocat A existe
-- Notez son user_id

-- ═══════════════════════════════════════════════════════════════════════════

-- 2. Vérifier les user_id des avocats
SELECT 
    id,
    email,
    first_name,
    last_name,
    profession,
    is_active,
    created_at
FROM profiles
WHERE profession = 'avocat'
ORDER BY created_at DESC;

-- Comparez les user_id des avocats avec le user_id du dossier

-- ═══════════════════════════════════════════════════════════════════════════

-- 3. Si le dossier a un user_id qui ne correspond à aucun avocat,
--    c'est le problème : le dossier a été créé avec un mauvais user_id

-- ═══════════════════════════════════════════════════════════════════════════

-- 4. SOLUTION TEMPORAIRE : Désactiver RLS pour voir les dossiers
--    (NE PAS FAIRE EN PRODUCTION, juste pour debug)

-- ALTER TABLE public.cases DISABLE ROW LEVEL SECURITY;

-- Puis reconnectez-vous avec Avocat A et vérifiez si vous voyez le dossier

-- ═══════════════════════════════════════════════════════════════════════════
