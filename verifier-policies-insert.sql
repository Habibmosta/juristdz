-- Vérifier les policies INSERT sur la table cases
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'cases'
AND cmd = 'INSERT';

-- Résultat attendu : Une policy "Users can create own cases"
-- avec with_check = "((user_id)::text = (auth.uid())::text)"
