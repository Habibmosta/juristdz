-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT DE DÉBOGAGE - Vérifier les événements
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Vérifier votre user_id
SELECT auth.uid() as mon_user_id;

-- 2. Voir TOUS vos événements dans case_events
SELECT 
  id,
  title,
  event_type,
  event_date,
  event_date::date as date_seule,
  event_date::time as heure_seule,
  CASE 
    WHEN event_date >= NOW() THEN 'FUTUR ✅'
    ELSE 'PASSÉ ❌'
  END as statut_date,
  case_id,
  created_at
FROM case_events
WHERE user_id = auth.uid()
ORDER BY event_date DESC;

-- 3. Voir TOUS vos événements dans events (si la table existe)
SELECT 
  id,
  title,
  event_type,
  event_date,
  event_time,
  CASE 
    WHEN event_date >= CURRENT_DATE THEN 'FUTUR ✅'
    ELSE 'PASSÉ ❌'
  END as statut_date,
  case_id,
  created_at
FROM events
WHERE user_id = auth.uid()
ORDER BY event_date DESC;

-- 4. Vérifier les événements des 30 prochains jours dans case_events
SELECT 
  id,
  title,
  event_type,
  event_date,
  event_date::date as date_seule,
  EXTRACT(DAY FROM (event_date - NOW())) as jours_restants,
  case_id
FROM case_events
WHERE user_id = auth.uid()
  AND event_date IS NOT NULL
  AND event_date >= NOW()
  AND event_date <= NOW() + INTERVAL '30 days'
ORDER BY event_date;

-- 5. Vérifier l'événement "Appellez Youbia" spécifiquement
SELECT 
  id,
  title,
  event_type,
  event_date,
  event_date AT TIME ZONE 'UTC' as event_date_utc,
  NOW() as maintenant,
  NOW() + INTERVAL '30 days' as dans_30_jours,
  CASE 
    WHEN event_date >= NOW() THEN '✅ FUTUR'
    ELSE '❌ PASSÉ'
  END as statut,
  CASE 
    WHEN event_date <= NOW() + INTERVAL '30 days' THEN '✅ DANS LES 30 JOURS'
    ELSE '❌ PLUS DE 30 JOURS'
  END as dans_periode,
  user_id,
  case_id
FROM case_events
WHERE title ILIKE '%Youbia%'
  OR title ILIKE '%Appel%';

-- 6. Compter les événements futurs
SELECT 
  COUNT(*) as total_evenements_futurs,
  COUNT(*) FILTER (WHERE event_date >= NOW() AND event_date <= NOW() + INTERVAL '30 days') as dans_30_jours
FROM case_events
WHERE user_id = auth.uid()
  AND event_date IS NOT NULL;

-- 7. Si l'événement est dans le passé, le mettre à jour pour demain
-- DÉCOMMENTEZ CETTE LIGNE SI NÉCESSAIRE:
/*
UPDATE case_events
SET event_date = NOW() + INTERVAL '1 day'
WHERE title ILIKE '%Youbia%'
  AND user_id = auth.uid();
*/

-- 8. Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('case_events', 'events');
