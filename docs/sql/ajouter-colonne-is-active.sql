-- ═══════════════════════════════════════════════════════════════════════════
-- AJOUTER LA COLONNE is_active À LA TABLE CLIENTS
-- ═══════════════════════════════════════════════════════════════════════════

-- Vérifier si la colonne existe déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'is_active'
  ) THEN
    -- Ajouter la colonne is_active
    ALTER TABLE clients ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    
    -- Mettre à jour les clients existants
    UPDATE clients SET is_active = TRUE WHERE is_active IS NULL;
    
    RAISE NOTICE '✅ Colonne is_active ajoutée avec succès à la table clients';
  ELSE
    RAISE NOTICE '✅ La colonne is_active existe déjà';
  END IF;
END $$;

-- Vérification
SELECT 
  'VÉRIFICATION' as status,
  column_name,
  data_type,
  column_default,
  '✅' as result
FROM information_schema.columns
WHERE table_name = 'clients' 
  AND column_name = 'is_active';

-- Afficher un message de confirmation
SELECT 
  '🎉 Colonne is_active ajoutée avec succès!' as message,
  'Vous pouvez maintenant créer des clients.' as details;
