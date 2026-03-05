-- Vérifier la structure de la table case_events
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'case_events'
ORDER BY ordinal_position;
