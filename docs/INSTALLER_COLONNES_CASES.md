# 🔧 INSTALLATION DES COLONNES AVANCÉES

## ⚠️ ERREUR ACTUELLE
```
Could not find the 'billing_type' column of 'cases' in the schema cache
```

Cette erreur signifie que les nouvelles colonnes n'ont pas encore été ajoutées à votre base de données Supabase.

## ✅ SOLUTION

### Étape 1: Ouvrir Supabase SQL Editor
1. Allez sur https://supabase.com
2. Sélectionnez votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche
4. Cliquez sur "New query"

### Étape 2: Copier et Exécuter le Script
Copiez le contenu complet du fichier `ajouter-colonnes-cases.sql` et collez-le dans l'éditeur SQL.

Ou utilisez ce script simplifié:

```sql
-- SCRIPT SIMPLIFIÉ - COLONNES ESSENTIELLES
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Client ID
ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);

-- 2. Numéro de dossier
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_number TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);

-- 3. Objet du dossier
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_object TEXT;

-- 4. Informations tribunal
ALTER TABLE cases ADD COLUMN IF NOT EXISTS court_reference TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS court_name TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS judge_name TEXT;

-- 5. Parties
ALTER TABLE cases ADD COLUMN IF NOT EXISTS opposing_party TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS opposing_lawyer TEXT;

-- 6. Workflow
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_stage TEXT DEFAULT 'initial_consultation';

-- 7. Dates
ALTER TABLE cases ADD COLUMN IF NOT EXISTS next_hearing_date TIMESTAMPTZ;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS statute_of_limitations DATE;

-- 8. Facturation
ALTER TABLE cases ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'hourly';
ALTER TABLE cases ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS flat_fee DECIMAL(10,2);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS contingency_percentage DECIMAL(5,2);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS retainer_amount DECIMAL(10,2);

-- 9. Conflits
ALTER TABLE cases ADD COLUMN IF NOT EXISTS conflict_checked BOOLEAN DEFAULT FALSE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS conflict_check_date TIMESTAMPTZ;

-- 10. Documents et relations
ALTER TABLE cases ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS related_cases UUID[];

-- ✅ TERMINÉ!
```

### Étape 3: Exécuter
Cliquez sur le bouton "Run" (ou appuyez sur Ctrl+Enter)

### Étape 4: Vérifier
Vous devriez voir un message de succès. Ensuite, retournez à l'application et essayez de créer un nouveau dossier.

## 🎯 RÉSULTAT ATTENDU

Après l'exécution du script:
- ✅ Toutes les fonctionnalités avancées seront activées
- ✅ Checklist documents fonctionnera
- ✅ Vérification conflits fonctionnera
- ✅ Tous les modes de facturation seront disponibles
- ✅ Workflow complet sera actif

## 🔄 MODE DÉGRADÉ ACTUEL

En attendant l'exécution du script, l'application fonctionne en "mode dégradé":
- ✅ Création de dossier basique fonctionne
- ⚠️ Fonctionnalités avancées désactivées temporairement
- ⚠️ Message d'avertissement affiché lors de la création

## 📞 BESOIN D'AIDE?

Si vous rencontrez des problèmes:
1. Vérifiez que vous êtes connecté à Supabase
2. Vérifiez que vous avez les droits d'administration
3. Essayez d'exécuter les commandes une par une
4. Vérifiez les messages d'erreur dans la console SQL

---

**Note**: Ce script utilise `ADD COLUMN IF NOT EXISTS` donc il est sûr de l'exécuter plusieurs fois sans risque de duplication.
