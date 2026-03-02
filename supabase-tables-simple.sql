-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT SQL SIMPLIFIÉ: Création des Tables JuristDZ
-- ═══════════════════════════════════════════════════════════════════════════
-- Version sans trigger (plus simple, moins d'erreurs possibles)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profession TEXT NOT NULL DEFAULT 'avocat' CHECK (profession IN ('avocat', 'notaire', 'huissier', 'magistrat', 'etudiant', 'juriste_entreprise')),
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

-- Create cases table
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  case_id UUID REFERENCES public.cases(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT NOT NULL,
  language TEXT DEFAULT 'fr',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'cabinet')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  documents_used INTEGER DEFAULT 0,
  documents_limit INTEGER DEFAULT 5,
  cases_limit INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies for cases
DROP POLICY IF EXISTS "Users can view own cases" ON public.cases;
CREATE POLICY "Users can view own cases" ON public.cases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own cases" ON public.cases;
CREATE POLICY "Users can create own cases" ON public.cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cases" ON public.cases;
CREATE POLICY "Users can update own cases" ON public.cases
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cases" ON public.cases;
CREATE POLICY "Users can delete own cases" ON public.cases
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own documents" ON public.documents;
CREATE POLICY "Users can create own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check document quota
CREATE OR REPLACE FUNCTION public.check_document_quota(user_id_param UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment document usage
CREATE OR REPLACE FUNCTION public.increment_document_usage(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.subscriptions
  SET documents_used = documents_used + 1
  WHERE user_id = user_id_param
  AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DU SCRIPT
-- ═══════════════════════════════════════════════════════════════════════════
-- Tables créées: profiles, cases, documents, subscriptions
-- Fonctions créées: is_admin, check_document_quota, increment_document_usage
-- Note: Les profils et subscriptions seront créés manuellement via l'interface
-- ═══════════════════════════════════════════════════════════════════════════
