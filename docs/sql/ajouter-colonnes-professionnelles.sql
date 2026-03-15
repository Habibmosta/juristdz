-- =============================================
-- AJOUTER LES COLONNES PROFESSIONNELLES
-- =============================================
-- Transformation du système de dossiers pour être au niveau professionnel

-- 1. Ajouter case_number (numéro de dossier auto-généré)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'case_number'
    ) THEN
        ALTER TABLE cases 
        ADD COLUMN case_number TEXT UNIQUE;
        
        RAISE NOTICE '✅ Colonne case_number ajoutée';
    ELSE
        RAISE NOTICE '⚠️ La colonne case_number existe déjà';
    END IF;
END $$;

-- 2. Ajouter case_object (objet du dossier)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'case_object'
    ) THEN
        ALTER TABLE cases 
        ADD COLUMN case_object TEXT;
        
        RAISE NOTICE '✅ Colonne case_object ajoutée';
    ELSE
        RAISE NOTICE '⚠️ La colonne case_object existe déjà';
    END IF;
END $$;

-- 3. Ajouter court_reference (référence tribunal)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cases' AND column_name = 'court_reference'
    ) THEN
        ALTER TABLE cases 
        ADD COLUMN court_reference TEXT;
        
        RAISE NOTICE '✅ Colonne court_reference ajoutée';
    ELSE
        RAISE NOTICE '⚠️ La colonne court_reference existe déjà';
    END IF;
END $$;

-- 4. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_court_reference ON cases(court_reference);

-- 5. Créer une fonction pour générer automatiquement le numéro de dossier
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    current_year INTEGER;
    new_case_number TEXT;
BEGIN
    -- Si le numéro n'est pas fourni, le générer
    IF NEW.case_number IS NULL THEN
        current_year := EXTRACT(YEAR FROM CURRENT_DATE);
        
        -- Compter les dossiers de l'utilisateur
        SELECT COUNT(*) + 1 INTO next_number
        FROM cases
        WHERE user_id = NEW.user_id;
        
        -- Générer le numéro au format DZ-YYYY-NNNN
        new_case_number := 'DZ-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
        
        -- Vérifier l'unicité et incrémenter si nécessaire
        WHILE EXISTS (SELECT 1 FROM cases WHERE case_number = new_case_number) LOOP
            next_number := next_number + 1;
            new_case_number := 'DZ-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
        END LOOP;
        
        NEW.case_number := new_case_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger pour auto-générer le numéro
DROP TRIGGER IF EXISTS trigger_generate_case_number ON cases;
CREATE TRIGGER trigger_generate_case_number
    BEFORE INSERT ON cases
    FOR EACH ROW
    EXECUTE FUNCTION generate_case_number();

-- 7. Mettre à jour les dossiers existants sans numéro
DO $$
DECLARE
    case_record RECORD;
    next_number INTEGER := 1;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    new_case_number TEXT;
BEGIN
    FOR case_record IN 
        SELECT id, user_id 
        FROM cases 
        WHERE case_number IS NULL
        ORDER BY created_at
    LOOP
        -- Générer un numéro unique
        LOOP
            new_case_number := 'DZ-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM cases WHERE case_number = new_case_number);
            next_number := next_number + 1;
        END LOOP;
        
        -- Mettre à jour le dossier
        UPDATE cases 
        SET case_number = new_case_number
        WHERE id = case_record.id;
        
        next_number := next_number + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Numéros de dossiers générés pour les dossiers existants';
END $$;

-- =============================================
-- VÉRIFICATION
-- =============================================
SELECT 
    '✅ Colonnes professionnelles configurées' as status,
    COUNT(*) as total_dossiers,
    COUNT(case_number) as avec_numero,
    COUNT(case_object) as avec_objet,
    COUNT(court_reference) as avec_reference_tribunal
FROM cases;

-- Afficher quelques exemples
SELECT 
    case_number,
    case_object,
    court_reference,
    title,
    created_at
FROM cases
ORDER BY created_at DESC
LIMIT 5;
