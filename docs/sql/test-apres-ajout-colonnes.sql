-- Script de test après l'ajout des colonnes à la table cases

-- 1. Vérifier que toutes les colonnes existent
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cases'
ORDER BY ordinal_position;

-- 2. Vérifier les index créés
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'cases'
ORDER BY indexname;

-- 3. Test d'insertion avec toutes les colonnes
-- Remplacer USER_ID par l'ID d'un utilisateur réel
INSERT INTO cases (
  user_id,
  title,
  client_name,
  client_phone,
  client_email,
  client_address,
  description,
  case_type,
  priority,
  estimated_value,
  deadline,
  notes,
  assigned_lawyer,
  tags,
  status
) VALUES (
  'fa4ef014-f3e2-496f-b341-ea427e1d2bf2',  -- Habib Belkacemi
  'Test Dossier Complet',
  'M. Client Test',
  '+213 555 123 456',
  'client.test@email.com',
  '123 Rue Test, Alger',
  'Description complète du dossier de test',
  'Droit Civil',
  'high',
  1500000.00,
  '2026-04-15',
  'Notes importantes sur ce dossier',
  'Maître Dupont',
  ARRAY['test', 'urgent', 'important'],
  'active'
)
RETURNING *;

-- 4. Vérifier que le dossier a été créé avec toutes les informations
SELECT 
  id,
  title,
  client_name,
  client_phone,
  client_email,
  client_address,
  case_type,
  priority,
  estimated_value,
  deadline,
  assigned_lawyer,
  tags,
  status,
  created_at
FROM cases
WHERE title = 'Test Dossier Complet';

-- 5. Test de mise à jour
UPDATE cases
SET 
  client_phone = '+213 555 999 888',
  priority = 'urgent',
  notes = 'Notes mises à jour'
WHERE title = 'Test Dossier Complet'
RETURNING *;

-- 6. Statistiques par type de dossier
SELECT 
  case_type,
  COUNT(*) as nombre_dossiers,
  AVG(estimated_value) as valeur_moyenne,
  SUM(estimated_value) as valeur_totale
FROM cases
WHERE status = 'active'
  AND case_type IS NOT NULL
GROUP BY case_type
ORDER BY nombre_dossiers DESC;

-- 7. Statistiques par priorité
SELECT 
  priority,
  COUNT(*) as nombre_dossiers,
  AVG(estimated_value) as valeur_moyenne
FROM cases
WHERE status = 'active'
GROUP BY priority
ORDER BY 
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- 8. Dossiers avec deadline dans les 30 prochains jours
SELECT 
  title,
  client_name,
  priority,
  deadline,
  deadline - CURRENT_DATE as jours_restants,
  assigned_lawyer
FROM cases
WHERE status = 'active'
  AND deadline IS NOT NULL
  AND deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY deadline ASC;

-- 9. Dossiers par avocat assigné
SELECT 
  assigned_lawyer,
  COUNT(*) as nombre_dossiers,
  SUM(estimated_value) as valeur_totale,
  COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as dossiers_urgents
FROM cases
WHERE status = 'active'
  AND assigned_lawyer IS NOT NULL
GROUP BY assigned_lawyer
ORDER BY nombre_dossiers DESC;

-- 10. Recherche full-text (si l'index a été créé)
SELECT 
  title,
  client_name,
  case_type,
  priority
FROM cases
WHERE to_tsvector('french', coalesce(title, '') || ' ' || coalesce(client_name, '') || ' ' || coalesce(description, ''))
  @@ to_tsquery('french', 'test')
ORDER BY created_at DESC;

-- 11. Nettoyer le dossier de test (optionnel)
-- DELETE FROM cases WHERE title = 'Test Dossier Complet';

-- 12. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Tests terminés avec succès!';
  RAISE NOTICE 'Vérifiez que:';
  RAISE NOTICE '  1. Toutes les colonnes existent';
  RAISE NOTICE '  2. Les index sont créés';
  RAISE NOTICE '  3. L''insertion fonctionne avec toutes les colonnes';
  RAISE NOTICE '  4. La mise à jour fonctionne';
  RAISE NOTICE '  5. Les statistiques sont calculées correctement';
END $$;
