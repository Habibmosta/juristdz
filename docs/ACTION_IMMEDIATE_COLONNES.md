# ⚡ ACTION IMMÉDIATE : Ajouter les Colonnes Manquantes

## 🎯 Problème
Les informations du client (téléphone, email, adresse) et autres détails ne sont pas sauvegardés car les colonnes n'existent pas dans la table `cases`.

## ✅ Solution en 2 Minutes

### Étape 1 : Copier ce Script SQL

```sql
-- Ajouter les colonnes manquantes à la table cases
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS case_type TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS deadline DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS assigned_lawyer TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_deadline ON cases(deadline);
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
```

### Étape 2 : Exécuter dans Supabase

1. Ouvrir https://supabase.com/dashboard
2. Sélectionner votre projet
3. Cliquer sur **SQL Editor** (menu gauche)
4. Cliquer sur **New Query**
5. Coller le script ci-dessus
6. Cliquer sur **Run** (ou appuyer sur F5)
7. Attendre le message "Success"

### Étape 3 : Rafraîchir l'Application

1. Ouvrir votre application dans le navigateur
2. Appuyer sur **F5** pour rafraîchir
3. Se reconnecter si nécessaire

### Étape 4 : Tester

1. Créer un nouveau dossier avec TOUTES les informations
2. Vérifier dans Supabase → Table Editor → cases
3. Toutes les informations doivent être présentes

## ✅ C'est Tout !

Après ces 4 étapes, toutes les informations du formulaire seront sauvegardées.

## 🔍 Vérification Rapide

Dans Supabase SQL Editor, exécuter :

```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'cases'
ORDER BY ordinal_position;
```

Vous devez voir ces colonnes :
- ✅ client_phone
- ✅ client_email
- ✅ client_address
- ✅ case_type
- ✅ priority
- ✅ estimated_value
- ✅ deadline
- ✅ notes
- ✅ assigned_lawyer
- ✅ tags
- ✅ documents

## 📝 Fichiers de Référence

- **`ajouter-colonnes-cases.sql`** : Script complet avec commentaires
- **`GUIDE_RAPIDE_RESOLUTION.md`** : Guide détaillé
- **`RESUME_CORRECTIONS_COMPLETES.md`** : Vue d'ensemble complète
