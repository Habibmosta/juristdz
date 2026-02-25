-- Migration: Ajout du champ code_postal_prefix à la table wilayas
-- Date: 2025-02-25
-- Description: Ajout du préfixe de code postal pour chaque wilaya

-- ============================================
-- 1. AJOUT DE LA COLONNE code_postal_prefix
-- ============================================

ALTER TABLE wilayas 
ADD COLUMN IF NOT EXISTS code_postal_prefix VARCHAR(2);

-- ============================================
-- 2. MISE À JOUR DES VALEURS
-- ============================================

-- Le code_postal_prefix est identique au code de la wilaya
UPDATE wilayas 
SET code_postal_prefix = code
WHERE code_postal_prefix IS NULL;

-- ============================================
-- 3. CONTRAINTE NOT NULL
-- ============================================

ALTER TABLE wilayas 
ALTER COLUMN code_postal_prefix SET NOT NULL;

-- ============================================
-- 4. VÉRIFICATION
-- ============================================

-- Vérifier que toutes les wilayas ont un code_postal_prefix
SELECT 
  code, 
  name_fr, 
  code_postal_prefix,
  CASE 
    WHEN code_postal_prefix IS NOT NULL THEN '✅'
    ELSE '❌'
  END as status
FROM wilayas
ORDER BY code::INTEGER;

-- Compter les wilayas avec code_postal_prefix
SELECT 
  COUNT(*) as total_wilayas,
  COUNT(code_postal_prefix) as avec_prefix,
  COUNT(*) - COUNT(code_postal_prefix) as sans_prefix
FROM wilayas;

-- ============================================
-- 5. COMMENTAIRE
-- ============================================

COMMENT ON COLUMN wilayas.code_postal_prefix IS 'Préfixe du code postal de la wilaya (identique au code)';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
