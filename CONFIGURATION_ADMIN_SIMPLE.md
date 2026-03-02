# 🔐 Configuration du Compte Administrateur - Guide Simple

## 🎯 OBJECTIF

Créer un compte administrateur qui pourra:
- Créer des comptes utilisateurs
- Gérer les quotas et abonnements
- Activer/Désactiver des comptes
- Voir toutes les statistiques

---

## ⚡ CONFIGURATION RAPIDE (15 MINUTES)

### ÉTAPE 1: Créer les Tables de Base (5 min)

1. **Ouvrir Supabase** → SQL Editor
2. **Copier-coller** le script depuis `SUPABASE_SETUP_GUIDE.md` (section "Étape 2.2")
3. **Cliquer sur "Run"**
4. ✅ Tables créées: profiles, cases, documents, subscriptions

### ÉTAPE 2: Ajouter les Fonctionnalités Admin (5 min)

1. **Toujours dans SQL Editor**
2. **Cliquer sur "New query"**
3. **Copier-coller** le contenu du fichier `supabase-admin-setup.sql`
4. **Cliquer sur "Run"**
5. ✅ Colonnes admin ajoutées, fonctions créées

### ÉTAPE 3: Créer le Compte Admin (5 min)

#### Option A: Via l'Interface Supabase (RECOMMANDÉ)

1. **Dans Supabase**, aller dans **Authentication** → **Users**
2. **Cliquer sur "Add user"** → **Create new user**
3. **Remplir**:
   - Email: `admin@juristdz.com`
   - Password: (choisir un mot de passe fort, ex: `Admin2024!JuristDZ`)
   - Auto Confirm User: ✅ (cocher)
4. **Cliquer sur "Create user"**
5. **Copier l'ID** de l'utilisateur créé (ex: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

#### Option B: Via SQL

```sql
-- Dans SQL Editor, exécuter:
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@juristdz.com',
  crypt('Admin2024!JuristDZ', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
```

### ÉTAPE 4: Activer les Droits Admin (2 min)

1. **Dans SQL Editor**, exécuter:

```sql
-- Remplacer 'admin@juristdz.com' par votre email admin
UPDATE public.profiles
SET is_admin = true
WHERE email = 'admin@juristdz.com';
```

2. **Vérifier** que ça a fonctionné:

```sql
SELECT id, email, is_admin
FROM public.profiles
WHERE email = 'admin@juristdz.com';
```

Résultat attendu:
```
id                                   | email                | is_admin
-------------------------------------|----------------------|----------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | admin@juristdz.com   | true
```

✅ **C'est terminé!**

---

## 🧪 TESTER LE COMPTE ADMIN

### Test 1: Se Connecter

1. **Démarrer l'application**: `npm run dev`
2. **Ouvrir**: http://localhost:5173
3. **Se connecter avec**:
   - Email: `admin@juristdz.com`
   - Mot de passe: `Admin2024!JuristDZ` (ou celui que vous avez choisi)
4. ✅ Vous devriez être connecté

### Test 2: Vérifier les Permissions Admin

Dans la console du navigateur (F12), exécuter:

```javascript
// Vérifier si l'utilisateur est admin
const { data } = await supabase.rpc('is_admin');
console.log('Is admin:', data); // Devrait afficher: true
```

---

## 📋 PROCHAINES ÉTAPES

Maintenant que le compte admin est créé, vous pouvez:

1. **Créer l'interface admin** pour gérer les utilisateurs
2. **Créer des comptes utilisateurs** via l'interface
3. **Définir les quotas** selon les abonnements
4. **Tester l'isolation** des données

---

## 🔑 IDENTIFIANTS PAR DÉFAUT

### Compte Administrateur

```
Email: admin@juristdz.com
Mot de passe: Admin2024!JuristDZ
Rôle: ADMIN
Permissions: Toutes
```

⚠️ **IMPORTANT**: Changez ce mot de passe en production!

### Comptes de Test (À créer via l'interface admin)

```
AVOCAT 1:
Email: ahmed.benali@test.dz
Mot de passe: test123
Plan: Gratuit (5 documents)

AVOCAT 2:
Email: sarah.khelifi@test.dz
Mot de passe: test123
Plan: Pro (illimité)

NOTAIRE:
Email: mohamed.ziani@test.dz
Mot de passe: test123
Plan: Pro (illimité)

HUISSIER:
Email: karim.djahid@test.dz
Mot de passe: test123
Plan: Gratuit (5 documents)
```

---

## 🎯 WORKFLOW ADMIN

### Créer un Nouvel Utilisateur

1. **Se connecter** en tant qu'admin
2. **Aller dans** "Administration" → "Utilisateurs"
3. **Cliquer sur** "Créer un utilisateur"
4. **Remplir le formulaire**:
   - Prénom, Nom, Email
   - Profession (Avocat/Notaire/Huissier)
   - Plan (Gratuit/Pro/Cabinet)
   - Quotas (5 documents ou illimité)
   - Durée (30 jours ou 1 mois)
5. **Générer** un mot de passe automatique
6. **Envoyer** les identifiants par email
7. ✅ Utilisateur créé!

### Modifier un Abonnement

1. **Trouver l'utilisateur** dans la liste
2. **Cliquer sur** "Modifier"
3. **Changer**:
   - Plan: Gratuit → Pro
   - Quotas: 5 → Illimité (-1)
   - Date d'expiration: +30 jours
4. **Enregistrer**
5. ✅ Abonnement mis à jour!

### Désactiver un Compte

1. **Trouver l'utilisateur** dans la liste
2. **Cliquer sur** "Désactiver"
3. **Confirmer**
4. ✅ L'utilisateur ne peut plus se connecter

---

## 📊 QUOTAS PAR PLAN

### Plan GRATUIT (Essai)
```
documents_limit: 5
cases_limit: 3
expires_at: NOW() + 30 days
```

### Plan PRO
```
documents_limit: -1 (illimité)
cases_limit: -1 (illimité)
expires_at: NOW() + 30 days
```

### Plan CABINET
```
documents_limit: -1 (illimité)
cases_limit: -1 (illimité)
expires_at: NOW() + 30 days
multi_users: 5
```

---

## 🔧 COMMANDES SQL UTILES

### Voir tous les utilisateurs

```sql
SELECT * FROM public.admin_users_view
ORDER BY created_at DESC;
```

### Voir les statistiques

```sql
SELECT * FROM public.admin_stats;
```

### Activer un utilisateur

```sql
UPDATE public.profiles
SET is_active = true
WHERE email = 'user@example.com';

UPDATE public.subscriptions
SET is_active = true, status = 'active'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'user@example.com');
```

### Désactiver un utilisateur

```sql
UPDATE public.profiles
SET is_active = false
WHERE email = 'user@example.com';

UPDATE public.subscriptions
SET is_active = false, status = 'cancelled'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'user@example.com');
```

### Passer un utilisateur en Pro

```sql
UPDATE public.subscriptions
SET 
  plan = 'pro',
  documents_limit = -1,
  cases_limit = -1,
  documents_used = 0,
  expires_at = NOW() + INTERVAL '30 days'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'user@example.com');
```

### Voir l'historique des actions admin

```sql
SELECT 
  aa.*,
  p.email AS admin_email,
  tp.email AS target_email
FROM public.admin_actions aa
LEFT JOIN public.profiles p ON aa.admin_id = p.id
LEFT JOIN public.profiles tp ON aa.target_user_id = tp.id
ORDER BY aa.created_at DESC
LIMIT 50;
```

---

## ✅ CHECKLIST DE CONFIGURATION

- [ ] Tables de base créées (profiles, cases, documents, subscriptions)
- [ ] Script admin exécuté (colonnes, fonctions, policies)
- [ ] Compte admin créé (admin@juristdz.com)
- [ ] Droits admin activés (is_admin = true)
- [ ] Test de connexion réussi
- [ ] Permissions admin vérifiées

---

## 🆘 DÉPANNAGE

### Erreur: "is_admin column does not exist"
→ Exécuter le script `supabase-admin-setup.sql`

### Erreur: "permission denied for table profiles"
→ Vérifier que les policies admin sont créées

### Impossible de se connecter en tant qu'admin
→ Vérifier que `is_admin = true` dans la table profiles

### Les utilisateurs ne voient pas leurs données
→ Vérifier que Row Level Security est activé

---

**Date**: 2 mars 2026
**Statut**: ✅ Guide complet
**Temps estimé**: 15 minutes
**Prochaine étape**: Créer l'interface admin
