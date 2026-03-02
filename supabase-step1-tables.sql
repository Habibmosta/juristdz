-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 1: Création des Tables UNIQUEMENT
-- ═══════════════════════════════════════════════════════════════════════════
-- Exécutez ce script en premier
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Create cases table
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
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

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
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

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN ÉTAPE 1
-- ═══════════════════════════════════════════════════════════════════════════
-- Tables créées: profiles, cases, documents, subscriptions
-- Prochaine étape: Exécuter supabase-step2-security.sql
-- ═══════════════════════════════════════════════════════════════════════════
