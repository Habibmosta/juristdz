-- ============================================================
-- Ajout colonne professional_info dans profiles
-- Exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Ajouter la colonne JSONB pour stocker les infos professionnelles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS professional_info JSONB DEFAULT NULL;

-- 2. Vérifier
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'professional_info';
