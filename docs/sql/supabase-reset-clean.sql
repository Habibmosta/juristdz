-- ═══════════════════════════════════════════════════════════════════════════
-- RESET COMPLET: Supprimer les anciennes tables et recréer
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️ ATTENTION: Ce script supprime TOUTES les données existantes
-- ═══════════════════════════════════════════════════════════════════════════

-- Supprimer les anciennes tables (dans l'ordre à cause des foreign keys)
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer la table profiles (nouvelle structure)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profession TEXT NOT NULL DEFAULT 'avocat',
  registration_number TEXT,
  barreau_id TEXT,
  organization_name TEXT,
  phone_number TEXT,
  languages TEXT[] DEFAULT ARRAY['fr'],
  specializations TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  mfa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table cases
CREATE TABLE public.cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table documents
CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_id UUID,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT NOT NULL,
  language TEXT DEFAULT 'fr',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table subscriptions
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  documents_used INTEGER DEFAULT 0,
  documents_limit INTEGER DEFAULT 5,
  cases_limit INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les fonctions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id::text = (auth.uid())::text
    AND is_admin = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_document_quota(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  SELECT * INTO subscription_record
  FROM public.subscriptions
  WHERE user_id = user_id_param
  AND status = 'active'
  AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF subscription_record.expires_at IS NOT NULL 
     AND subscription_record.expires_at < NOW() THEN
    RETURN false;
  END IF;
  
  IF subscription_record.documents_limit = -1 THEN
    RETURN true;
  END IF;
  
  RETURN subscription_record.documents_used < subscription_record.documents_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_document_usage(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.subscriptions
  SET documents_used = documents_used + 1
  WHERE user_id = user_id_param
  AND status = 'active';
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DU RESET
-- ═══════════════════════════════════════════════════════════════════════════
-- Tables recréées avec la nouvelle structure
-- Fonctions créées
-- Prochaine étape: Créer les comptes utilisateurs
-- ═══════════════════════════════════════════════════════════════════════════
