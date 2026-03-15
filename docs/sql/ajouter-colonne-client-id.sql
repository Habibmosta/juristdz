-- =============================================
-- AJOUTER LA COLONNE client_id À LA TABLE cases
-- =============================================
-- Cette colonne crée une relation entre les dossiers et les clients

-- Ajouter la colonne client_id si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE cases 
        ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Colonne client_id ajoutée à la table cases';
    ELSE
        RAISE NOTICE '⚠️ La colonne client_id existe déjà';
    END IF;
END $$;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);

-- Vérification
SELECT 
    '✅ Colonne client_id configurée' as status,
    COUNT(*) as nombre_dossiers,
    COUNT(client_id) as dossiers_avec_client
FROM cases;
