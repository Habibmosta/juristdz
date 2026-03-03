# 🔧 Correction Erreur SQL - "column case_id does not exist"

## 🐛 PROBLÈME

```
Error: Failed to run sql query: ERROR: 42703: column "case_id" does not exist
```

Cette erreur signifie que la table `documents` existe déjà mais n'a pas la colonne `case_id`.

---

## ✅ SOLUTION RAPIDE (5 minutes)

### Étape 1: Utiliser le Script Corrigé

Au lieu d'utiliser `supabase-tables-avancees.sql`, utilisez:

```
supabase-fix-tables.sql
```

Ce script:
- ✅ Vérifie si les tables existent avant de les créer
- ✅ Vérifie si les colonnes existent avant de les ajouter
- ✅ Ne génère pas d'erreurs si les tables/colonnes existent déjà
- ✅ Ajoute uniquement ce qui manque

### Étape 2: Exécuter le Script

1. Ouvrir **Supabase Dashboard**
2. Aller dans **SQL Editor**
3. Cliquer sur **New Query**
4. Copier TOUT le contenu de `supabase-fix-tables.sql`
5. Coller dans l'éditeur
6. Cliquer sur **Run** (ou F5)

### Étape 3: Vérifier

Vous devriez voir:
```
✅ CREATE TABLE IF NOT EXISTS cases
✅ CREATE TABLE IF NOT EXISTS clients
✅ CREATE TABLE IF NOT EXISTS documents
✅ ALTER TABLE documents ADD COLUMN case_id (si elle n'existait pas)
✅ ALTER TABLE documents ADD COLUMN category (si elle n'existait pas)
✅ CREATE TABLE IF NOT EXISTS case_events
✅ CREATE TABLE IF NOT EXISTS reminders
✅ CREATE TABLE IF NOT EXISTS calendar_events
✅ CREATE TABLE IF NOT EXISTS invoices
✅ CREATE TABLE IF NOT EXISTS invoice_items
✅ CREATE POLICY (plusieurs)
✅ CREATE FUNCTION (plusieurs)
```

---

## 🔍 EXPLICATION TECHNIQUE

### Pourquoi l'erreur?

Le script original `supabase-tables-avancees.sql` essayait d'ajouter la colonne `case_id` à la table `documents` avec cette commande:

```sql
ALTER TABLE documents ADD COLUMN case_id UUID REFERENCES cases(id);
```

Mais si:
1. La table `documents` n'existe pas → Erreur
2. La table `cases` n'existe pas → Erreur
3. La colonne `case_id` existe déjà → Erreur

### Solution

Le nouveau script `supabase-fix-tables.sql` utilise:

```sql
-- 1. Créer la table cases d'abord
CREATE TABLE IF NOT EXISTS cases (...);

-- 2. Créer la table documents si elle n'existe pas
CREATE TABLE IF NOT EXISTS documents (...);

-- 3. Ajouter case_id SEULEMENT si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'case_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN case_id UUID REFERENCES cases(id);
  END IF;
END $$;
```

Cela vérifie d'abord si la colonne existe avant de l'ajouter.

---

## 📊 STRUCTURE DES TABLES

Après l'exécution du script, vous aurez:

### Tables Principales
```
cases               -- Dossiers
├── id
├── user_id
├── title
├── client_name
├── client_phone
├── client_email
├── description
├── case_type
├── priority
├── status
└── created_at

clients             -- Clients
├── id
├── user_id
├── first_name
├── last_name
├── email
├── phone
└── address

documents           -- Documents
├── id
├── user_id
├── case_id         ← NOUVELLE COLONNE
├── category        ← NOUVELLE COLONNE
├── file_url        ← NOUVELLE COLONNE
├── file_size       ← NOUVELLE COLONNE
├── title
└── content
```

### Tables Avancées
```
case_events         -- Timeline
reminders           -- Rappels
calendar_events     -- Calendrier
invoices            -- Factures
invoice_items       -- Lignes factures
```

---

## 🧪 VÉRIFICATION

### Vérifier que les tables sont créées

Dans Supabase Dashboard:
1. Aller dans **Table Editor**
2. Vous devriez voir toutes ces tables:
   - cases ✅
   - clients ✅
   - documents ✅
   - case_events ✅
   - reminders ✅
   - calendar_events ✅
   - invoices ✅
   - invoice_items ✅

### Vérifier que les colonnes sont ajoutées

1. Cliquer sur la table **documents**
2. Vérifier que ces colonnes existent:
   - case_id ✅
   - category ✅
   - file_url ✅
   - file_size ✅
   - mime_type ✅
   - version ✅

### Vérifier que RLS est activé

1. Aller dans **Authentication** → **Policies**
2. Sélectionner chaque table
3. Vérifier que RLS est activé (bouton vert)
4. Vérifier que les policies existent

---

## 🚨 SI ÇA NE FONCTIONNE TOUJOURS PAS

### Option 1: Supprimer et Recréer (ATTENTION: Perte de données!)

Si vous êtes en développement et n'avez pas de données importantes:

```sql
-- ATTENTION: Cela supprime TOUTES les données!
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS case_events CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS cases CASCADE;

-- Puis exécuter supabase-fix-tables.sql
```

### Option 2: Ajouter Manuellement les Colonnes

Si vous avez des données importantes:

```sql
-- Vérifier si la table cases existe
SELECT * FROM cases LIMIT 1;

-- Si elle n'existe pas, la créer:
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter case_id à documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER;
```

### Option 3: Vérifier l'Ordre d'Exécution

Le script doit créer les tables dans cet ordre:
1. cases (d'abord)
2. clients
3. documents
4. Ajouter case_id à documents (après que cases existe)
5. case_events, reminders, etc.

---

## ✅ APRÈS LA CORRECTION

Une fois le script exécuté avec succès:

1. **Vérifier dans Table Editor** que toutes les tables existent
2. **Tester l'application**:
   ```bash
   npm run dev
   ```
3. **Se connecter** avec un compte avocat
4. **Créer un dossier** de test
5. **Vérifier** que le dossier apparaît dans la base de données

---

## 📞 BESOIN D'AIDE?

Si l'erreur persiste:

1. **Copier l'erreur complète** (tout le message)
2. **Vérifier dans Table Editor** quelles tables existent
3. **Vérifier dans SQL Editor** en exécutant:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
4. **Demander de l'aide** avec ces informations

---

**Date:** 3 Mars 2026  
**Fichier à utiliser:** `supabase-fix-tables.sql`  
**Temps estimé:** 5 minutes  
**Statut:** ✅ Script corrigé prêt

