-- ═══════════════════════════════════════════════════════════════════════════
-- CRÉER UN ÉVÉNEMENT DE TEST
-- ═══════════════════════════════════════════════════════════════════════════

-- Option 1: Créer dans calendar_events (utilise start_time)
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
  auth.uid(),
  'Appellez Youbia',
  'Compléter le dossier avec les documents suivants: 1 - actes 1, 2 - Attestation de .., 3- les fiches de ..',
  'call',
  NOW() + INTERVAL '1 day',  -- Demain
  NOW() + INTERVAL '1 day' + INTERVAL '30 minutes',  -- Demain + 30 min
  NULL,
  false,
  'scheduled'
);

-- Option 2: Créer dans case_events (utilise event_date + event_time)
-- Décommentez si vous voulez l'ajouter aussi dans case_events
/*
INSERT INTO case_events (
  user_id,
  case_id,
  title,
  description,
  event_type,
  event_date,
  event_time,
  location,
  status
) VALUES (
  auth.uid(),
  (SELECT id FROM cases WHERE user_id = auth.uid() LIMIT 1),  -- Premier dossier
  'Appellez Youbia',
  'Compléter le dossier avec les documents suivants',
  'call',
  CURRENT_DATE + 1,  -- Demain
  '14:00:00',  -- 14h00
  NULL,
  'prevu'
);
*/

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
WHERE user_id = auth.uid()
ORDER BY start_time DESC;
