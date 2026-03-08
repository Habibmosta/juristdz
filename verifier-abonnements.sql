-- ============================================
-- VÉRIFIER L'ÉTAT DES ABONNEMENTS
-- ============================================

-- 1. Voir tous les utilisateurs avec leur plan et statut
SELECT 
  p.email,
  p.first_name,
  p.last_name,
  s.plan,
  s.status,
  s.trial_ends_at,
  s.expires_at,
  CASE 
    WHEN s.plan IS NULL THEN 'Pas d''abonnement'
    WHEN s.status = 'trial' OR s.status = 'pending' THEN 'Essai gratuit'
    WHEN s.plan = 'free' AND s.status = 'active' THEN 'Plan gratuit'
    WHEN s.plan IN ('pro', 'cabinet') AND s.status = 'active' THEN 'Plan payant'
    ELSE 'Autre'
  END as categorie
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
ORDER BY p.created_at DESC;

-- 2. Compter par catégorie
SELECT 
  CASE 
    WHEN s.plan IS NULL THEN 'Pas d''abonnement'
    WHEN s.status = 'trial' OR s.status = 'pending' THEN 'Essai gratuit'
    WHEN s.plan = 'free' AND s.status = 'active' THEN 'Plan gratuit'
    WHEN s.plan IN ('pro', 'cabinet') AND s.status = 'active' THEN 'Plan payant'
    ELSE 'Autre'
  END as categorie,
  COUNT(*) as nombre
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
GROUP BY categorie
ORDER BY nombre DESC;

-- 3. Détail des plans
SELECT 
  s.plan,
  s.status,
  COUNT(*) as nombre
FROM subscriptions s
GROUP BY s.plan, s.status
ORDER BY s.plan, s.status;
