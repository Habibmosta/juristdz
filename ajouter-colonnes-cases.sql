-- Script pour ajouter les colonnes manquantes à la table cases
-- Ces colonnes sont nécessaires pour stocker toutes les informations du formulaire

-- 1. Informations du client
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT;

-- 2. Détails du dossier
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS case_type TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS deadline DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Gestion et collaboration
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS assigned_lawyer TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';

-- 4. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_deadline ON cases(deadline);
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);

-- 5. Créer un index de recherche full-text pour title, client_name, description
CREATE INDEX IF NOT EXISTS idx_cases_search ON cases 
USING gin(to_tsvector('french', coalesce(title, '') || ' ' || coalesce(client_name, '') || ' ' || coalesce(description, '')));

-- 6. Vérifier la structure finale
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cases'
ORDER BY ordinal_position;

-- 7. Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Colonnes ajoutées avec succès à la table cases!';
  RAISE NOTICE 'Structure complète:';
  RAISE NOTICE '  - id (uuid)';
  RAISE NOTICE '  - user_id (uuid) - Isolation des données';
  RAISE NOTICE '  - title (text) - Titre du dossier';
  RAISE NOTICE '  - client_name (text) - Nom du client';
  RAISE NOTICE '  - client_phone (text) - Téléphone du client';
  RAISE NOTICE '  - client_email (text) - Email du client';
  RAISE NOTICE '  - client_address (text) - Adresse du client';
  RAISE NOTICE '  - description (text) - Description du dossier';
  RAISE NOTICE '  - case_type (text) - Type de dossier';
  RAISE NOTICE '  - priority (text) - Priorité (low, medium, high, urgent)';
  RAISE NOTICE '  - estimated_value (numeric) - Valeur estimée';
  RAISE NOTICE '  - deadline (date) - Date limite';
  RAISE NOTICE '  - notes (text) - Notes additionnelles';
  RAISE NOTICE '  - assigned_lawyer (text) - Avocat assigné';
  RAISE NOTICE '  - tags (text[]) - Tags/étiquettes';
  RAISE NOTICE '  - documents (jsonb) - Documents attachés';
  RAISE NOTICE '  - status (text) - Statut du dossier';
  RAISE NOTICE '  - created_at (timestamp) - Date de création';
  RAISE NOTICE '  - updated_at (timestamp) - Date de modification';
END $$;
