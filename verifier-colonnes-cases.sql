-- ═══════════════════════════════════════════════════════════════════════════
-- 🔍 VÉRIFICATION DES COLONNES DE LA TABLE CASES
-- ═══════════════════════════════════════════════════════════════════════════
-- Exécutez ce script pour voir quelles colonnes existent actuellement
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'cases'
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════════
-- Ce script affichera toutes les colonnes existantes dans la table cases
-- Utilisez cette information pour savoir quelles colonnes ajouter
-- ═══════════════════════════════════════════════════════════════════════════
