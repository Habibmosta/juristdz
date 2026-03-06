# 🚀 GUIDE D'EXÉCUTION - Script SQL Système Trial

## ⚠️ IMPORTANT - À FAIRE MAINTENANT

Le système d'essai gratuit est prêt, mais vous devez exécuter le script SQL sur Supabase pour créer les colonnes et fonctions nécessaires.

---

## 📋 ÉTAPES D'EXÉCUTION

### 1. Ouvrir Supabase Dashboard
1. Allez sur https://supabase.com
2. Connectez-vous à votre compte
3. Sélectionnez votre projet JuristDZ

### 2. Ouvrir SQL Editor
1. Dans le menu latéral gauche, cliquez sur **SQL Editor**
2. Cliquez sur **New Query** (Nouvelle requête)

### 3. Copier le script
1. Ouvrez le fichier `database/create-trial-system.sql`
2. Copiez TOUT le contenu (Ctrl+A puis Ctrl+C)

### 4. Coller et exécuter
1. Collez le contenu dans l'éditeur SQL de Supabase
2. Cliquez sur **Run** (Exécuter) en bas à droite
3. Attendez la confirmation ✅

### 5. Vérifier l'exécution
Vous devriez voir des messages comme:
```
✅ Système d'essai gratuit créé avec succès!
📊 Colonnes ajoutées: account_status, trial_ends_at, payment_status, etc.
⚙️ Fonctions: suspend_expired_trials, activate_account, check_account_limit
📈 Vues: pending_accounts, expired_trials
```

---

## 🔍 VÉRIFICATION

### Vérifier que les colonnes ont été ajoutées:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('account_status', 'trial_ends_at', 'max_cases');
```

Résultat attendu:
```
account_status | character varying
trial_ends_at  | timestamp with time zone
max_cases      | integer
```

### Vérifier que les fonctions existent:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%account%';
```

Résultat attendu:
```
activate_account
block_account
check_account_limit
get_account_usage
is_trial_expired
suspend_expired_trials
```

### Vérifier que les vues existent:
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('pending_accounts', 'expired_trials');
```

Résultat attendu:
```
pending_accounts
expired_trials
```

---

## 🔧 MISE À JOUR DES COMPTES EXISTANTS (Optionnel)

Si vous avez déjà des utilisateurs dans la base, vous pouvez les activer automatiquement:

```sql
-- Activer tous les comptes existants
UPDATE profiles 
SET 
  account_status = 'active',
  max_cases = NULL,
  max_clients = NULL,
  max_documents = NULL,
  max_invoices = NULL
WHERE account_status IS NULL;
```

---

## 🧪 TESTER LE SYSTÈME

### 1. Créer un compte test
1. Déconnectez-vous de l'application
2. Créez un nouveau compte via l'inscription
3. Le compte sera automatiquement en mode trial

### 2. Vérifier le compte test
```sql
SELECT 
  email,
  account_status,
  trial_ends_at,
  max_cases,
  max_clients,
  max_invoices
FROM profiles
WHERE email = 'votre-email-test@example.com';
```

Résultat attendu:
```
email                    | account_status | trial_ends_at        | max_cases | max_clients | max_invoices
votre-email-test@...     | trial          | 2026-03-13 10:00:00  | 3         | 5           | 3
```

### 3. Tester les limites
1. Connectez-vous avec le compte test
2. Essayez de créer 4 dossiers → Le 4ème devrait être bloqué ✅
3. Vérifiez que la bannière trial s'affiche en haut ✅

### 4. Tester l'interface admin
1. Connectez-vous avec un compte admin
2. Allez dans le menu "Comptes en Attente"
3. Vous devriez voir le compte test
4. Testez l'activation du compte

---

## ⚠️ EN CAS D'ERREUR

### Erreur: "column already exists"
Si vous voyez cette erreur, c'est que le script a déjà été exécuté partiellement.

**Solution**: Exécuter ce script de nettoyage d'abord:
```sql
-- Supprimer les colonnes existantes (si nécessaire)
ALTER TABLE profiles DROP COLUMN IF EXISTS account_status CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS trial_ends_at CASCADE;
ALTER TABLE profiles DROP COLUMN IF EXISTS max_cases CASCADE;
-- ... etc pour toutes les colonnes

-- Puis réexécuter le script complet
```

### Erreur: "function already exists"
**Solution**: Ajouter `OR REPLACE` dans les définitions de fonctions (déjà fait dans le script)

### Erreur: "permission denied"
**Solution**: Vous devez être connecté avec un compte ayant les droits d'administration sur Supabase

---

## 📊 STATISTIQUES APRÈS INSTALLATION

Après l'exécution, vous pouvez voir les statistiques:

```sql
-- Comptes par statut
SELECT 
  account_status,
  COUNT(*) as count
FROM profiles
GROUP BY account_status;
```

```sql
-- Comptes expirant bientôt
SELECT 
  email,
  first_name,
  last_name,
  EXTRACT(DAY FROM (trial_ends_at - NOW()))::INTEGER as days_remaining
FROM profiles
WHERE account_status = 'trial'
  AND trial_ends_at < NOW() + INTERVAL '3 days'
ORDER BY trial_ends_at;
```

---

## 🎉 CONFIRMATION DE SUCCÈS

Vous saurez que tout fonctionne si:
1. ✅ Le script s'exécute sans erreur
2. ✅ Les colonnes sont créées dans la table profiles
3. ✅ Les fonctions SQL sont disponibles
4. ✅ Les vues pending_accounts et expired_trials existent
5. ✅ Un nouveau compte créé a automatiquement account_status='trial'
6. ✅ La bannière trial s'affiche pour les nouveaux comptes
7. ✅ Le modal de bienvenue s'affiche à la première connexion
8. ✅ Les limites de création fonctionnent
9. ✅ L'interface admin "Comptes en Attente" est accessible

---

## 📞 BESOIN D'AIDE?

Si vous rencontrez des problèmes:
1. Vérifiez les logs d'erreur dans Supabase
2. Vérifiez que vous avez les droits d'administration
3. Essayez d'exécuter le script section par section
4. Contactez le support Supabase si nécessaire

---

**Date**: 6 mars 2026
**Statut**: ⏳ En attente d'exécution
**Fichier**: `database/create-trial-system.sql`
