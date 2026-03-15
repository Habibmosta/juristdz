-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFIER LA STRUCTURE RÉELLE DES TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Voir toutes les tables qui existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Voir la structure de calendar_events (si elle existe)
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'calendar_events' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Voir la structure de case_events (si elle existe)
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'case_events' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Voir la structure de events (si elle existe)
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Chercher toutes les tables qui contiennent "event" dans le nom
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%event%'
ORDER BY table_name;

-- 6. Voir TOUS les événements dans calendar_events (peu importe la structure)
SELECT * FROM calendar_events LIMIT 5;

-- 7. Compter les événements par user
SELECT 
  user_id,
  COUNT(*) as total_events
FROM calendar_events
GROUP BY user_id;

-- 8. Voir vos événements spécifiquement
SELECT * 
FROM calendar_events 
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
