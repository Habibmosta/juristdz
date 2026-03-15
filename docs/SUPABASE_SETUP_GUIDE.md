# 🚀 Guide de Configuration Supabase pour JuristDZ

## Étape 1: Créer un Projet Supabase (5 minutes)

### 1.1 Créer un compte
1. Aller sur **https://supabase.com**
2. Cliquer sur "Start your project"
3. Se connecter avec GitHub (recommandé) ou Email

### 1.2 Créer un nouveau projet
1. Cliquer sur "New Project"
2. Remplir les informations:
   - **Name**: juristdz-prod
   - **Database Password**: (générer un mot de passe fort et le SAUVEGARDER)
   - **Region**: Europe (Frankfurt) - le plus proche de l'Algérie
   - **Pricing Plan**: Free (gratuit jusqu'à 50k utilisateurs)
3. Cliquer sur "Create new project"
4. Attendre 2-3 minutes que le projet soit créé

### 1.3 Récupérer les clés API
1. Dans le menu gauche, cliquer sur "Settings" (icône engrenage)
2. Cliquer sur "API"
3. Copier ces 2 valeurs:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 1.4 Créer le fichier .env.local
Créer un fichier `.env.local` à la racine du projet avec:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT**: Remplacer les valeurs par vos vraies clés!

---

## Étape 2: Créer les Tables dans Supabase (10 minutes)

### 2.1 Accéder à l'éditeur SQL
1. Dans le menu gauche, cliquer sur "SQL Editor"
2. Cliquer sur "New query"

### 2.2 Exécuter le script SQL
Copier-coller ce script et cliquer sur "Run":

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profession TEXT NOT NULL CHECK (profession IN ('avocat', 'notaire', 'huissier', 'magistrat', 'etudiant', 'juriste_entreprise')),
  registration_number TEXT,
  barreau_id TEXT,
  organization_name TEXT,
  phone_number TEXT,
  languages TEXT[] DEFAULT ARRAY['fr'],
  specializations TEXT[],
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  mfa_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cases table
CREATE TABLE public.cases (
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
CREATE TABLE public.documents (
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
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'cabinet', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  credits_remaining INTEGER DEFAULT 5,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Cases policies
CREATE POLICY "Users can view own cases" ON public.cases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own cases" ON public.cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cases" ON public.cases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cases" ON public.cases
  FOR DELETE USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, profession, is_active, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    'avocat', -- Default profession
    true,
    false
  );
  
  INSERT INTO public.subscriptions (user_id, plan, credits_remaining)
  VALUES (
    NEW.id,
    'free',
    5
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_cases
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

3. Cliquer sur "Run" pour exécuter le script
4. Vérifier qu'il n'y a pas d'erreurs

---

## Étape 3: Configurer l'Authentification Email

### 3.1 Activer l'authentification par email
1. Dans le menu gauche, cliquer sur "Authentication"
2. Cliquer sur "Providers"
3. Vérifier que "Email" est activé (devrait l'être par défaut)

### 3.2 Configurer les emails (optionnel pour tests)
Pour les tests, vous pouvez utiliser les emails par défaut de Supabase.

Pour la production:
1. Aller dans "Authentication" → "Email Templates"
2. Personnaliser les templates si nécessaire

---

## Étape 4: Installer les Dépendances

Dans le terminal, exécuter:

```bash
npm install @supabase/supabase-js
```

---

## Étape 5: Tester la Configuration

Une fois les fichiers créés (prochaine étape), vous pourrez:

1. Créer un compte avocat
2. Créer un compte notaire
3. Créer un compte huissier
4. Vérifier que chacun voit uniquement ses propres dossiers

---

## 🔒 Sécurité

### Row Level Security (RLS)
✅ Activé sur toutes les tables
✅ Chaque utilisateur voit uniquement ses données
✅ Impossible d'accéder aux données d'un autre utilisateur

### Clés API
⚠️ **IMPORTANT**: 
- Ne JAMAIS commiter le fichier `.env.local`
- Le fichier `.env.local` est déjà dans `.gitignore`
- Utiliser uniquement la clé `anon` (publique) dans le frontend

---

## 📊 Limites du Plan Gratuit

- ✅ 50 000 utilisateurs actifs/mois
- ✅ 500 MB de stockage base de données
- ✅ 1 GB de stockage fichiers
- ✅ 2 GB de bande passante
- ✅ Authentification illimitée

**Largement suffisant pour vos tests et premiers clients!**

---

## 🆘 Support

- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

---

**Date**: 2 mars 2026
**Statut**: Configuration en cours
**Prochaine étape**: Créer les composants d'authentification
