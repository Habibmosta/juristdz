-- ═══════════════════════════════════════════════════════════════════════════
-- CRÉER UN ÉVÉNEMENT DE TEST - EXÉCUTER MAINTENANT
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer dans calendar_events avec le bon user_id
INSERT INTO calendar_events (
  user_id,
  title,
  description,
  event_type,
  start_time,
  end_time,
  location,
  is_all_day,
  status
) VALUES (
  '3ba9195c-8cdb-4f8c-b682-73d172cf4f17',
  'Appellez Youbia',
  'Compléter le dossier avec les documents suivants: 1 - actes 1, 2 - Attestation de .., 3- les fiches de ..',
  'call',
  NOW() + INTERVAL '1 day',  -- Demain
  NOW() + INTERVAL '1 day' + INTERVAL '30 minutes',  -- Demain + 30 min
  NULL,
  false,
  'scheduled'
);

-- Vérifier que l'événement a été créé
SELECT 
  id,
  title,
  event_type,
  start_time,
  start_time::date as date_seule,
  start_time::time as heure_seule,
  CASE 
    WHEN start_time >= NOW() THEN 'FUTUR ✅'
    ELSE 'PASSÉ ❌'
  END as statut
FROM calendar_events
WHERE user_id = '3ba9195c-8cdb-4f8c-b682-73d172cf4f17'
ORDER BY start_time DESC;
