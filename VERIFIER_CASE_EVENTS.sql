-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFIER LA TABLE case_events
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'case_events'
ORDER BY ordinal_position;

-- 2. Compter les événements existants
SELECT COUNT(*) as total_events
FROM case_events;

-- 3. Voir tous les événements pour ton user_id
SELECT 
  id,
  title,
  event_type,
  event_date,
  event_time,
  status,
  case_id,
  created_at
FROM case_events
WHERE user_id = '3ba9195c-8cdb-4f8c-b682-73d172cf4f17'
ORDER BY event_date DESC, event_time DESC;

-- 4. Voir les événements futurs (à partir d'aujourd'hui)
SELECT 
  id,
  title,
  event_type,
  event_date,
  event_time,
  CASE 
    WHEN event_date >= CURRENT_DATE THEN 'FUTUR ✅'
    ELSE 'PASSÉ ❌'
  END as statut,
  case_id
FROM case_events
WHERE user_id = '3ba9195c-8cdb-4f8c-b682-73d172cf4f17'
  AND event_date >= CURRENT_DATE
ORDER BY event_date ASC, event_time ASC;
