# 🎯 PROCHAINES ÉTAPES - Configuration Supabase

## 📊 ÉTAT ACTUEL (d'après les logs)

✅ **Ce qui fonctionne:**
- Supabase est connecté (`✅ Test Supabase réussi`)
- L'application se lance correctement
- Le système de traduction est prêt
- Les clés API sont configurées dans `.env.local`

❌ **Ce qui manque:**
- Les tables Supabase n'existent pas encore
- Aucun compte utilisateur créé
- Erreur 400 lors de la tentative de connexion (normal sans compte)

⚠️ **Avertissement non bloquant:**
- "Multiple GoTrueClient instances" - Ceci est juste un avertissement, pas une erreur

---

## 🚀 OPTION 1: Configuration Rapide (RECOMMANDÉ - 5 minutes)

### Étape 1: Ouvrir le fichier de test
1. **Ouvrir** le fichier `test-supabase-tables.html` dans votre navigateur
2. **Cliquer sur** "▶️ Lancer tous les tests"
3. **Observer** les résultats:
   - Si les tables existent → Passer à l'Étape 2
   - Si les tables n'existent pas → Passer à l'Option 2

### Étape 2: Créer le compte admin
1. **Dans le même fichier**, cliquer sur "👤 Créer le compte admin"
2. **Copier** la commande SQL affichée
3. **Aller sur** https://supabase.com/dashboard
4. **Ouvrir** votre projet: fcteljnmcdelbratudnc
5. **Aller dans** SQL Editor
6. **Coller** la commande SQL et cliquer sur "Run"

### Étape 3: Créer des comptes de test
1. **Cliquer sur** "👥 Créer des comptes de test"
2. **Attendre** que les 4 comptes soient créés

### Étape 4: Tester la connexion
1. **Retourner** sur http://localhost:5173
2. **Se connecter** avec:
   - Email: `admin@juristdz.com`
   - Mot de passe: `Admin2024!JuristDZ`
3. ✅ **Vous êtes connecté!**

---

## 🛠️ OPTION 2: Configuration Manuelle (si les tables n'existent pas - 15 minutes)

### Étape 1: Créer les tables de base
1. **Aller sur** https://supabase.com/dashboard
2. **Ouvrir** votre projet: fcteljnmcdelbratudnc
3. **Aller dans** SQL Editor
4. **Cliquer sur** "New query"
5. **Ouvrir** le fichier `SUPABASE_SETUP_GUIDE.md`
6. **Copier** tout le script SQL de la section "Étape 2.2"
7. **Coller** dans SQL Editor
8. **Cliquer sur** "Run"
9. **Attendre** 30 secondes

### Étape 2: Ajouter les fonctionnalités admin
1. **Toujours dans SQL Editor**
2. **Cliquer sur** "New query"
3. **Ouvrir** le fichier `supabase-admin-setup.sql`
4. **Copier** tout le contenu
5. **Coller** dans SQL Editor
6. **Cliquer sur** "Run"

### Étape 3: Créer le compte admin
1. **Dans SQL Editor**, cliquer sur "New query"
2. **Copier-coller** ce script:

```sql
-- Créer le compte admin
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
  '{"first_name":"Admin","last_name":"JuristDZ"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Activer les droits admin
UPDATE public.profiles
SET is_admin = true
WHERE email = 'admin@juristdz.com';
```

3. **Cliquer sur** "Run"

### Étape 4: Créer des comptes de test
1. **Dans SQL Editor**, cliquer sur "New query"
2. **Copier-coller** ce script:

```sql
-- Avocat 1
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ahmed.benali@test.dz', crypt('test123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Ahmed","last_name":"Benali"}', NOW(), NOW());

-- Avocat 2
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sarah.khelifi@test.dz', crypt('test123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Sarah","last_name":"Khelifi"}', NOW(), NOW());

-- Notaire
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'mohamed.ziani@test.dz', crypt('test123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Mohamed","last_name":"Ziani"}', NOW(), NOW());

-- Huissier
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'karim.djahid@test.dz', crypt('test123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"first_name":"Karim","last_name":"Djahid"}', NOW(), NOW());
```

3. **Cliquer sur** "Run"

---

## 🧪 TESTER L'APPLICATION

### Test 1: Connexion Admin
1. **Ouvrir** http://localhost:5173
2. **Se connecter** avec:
   - Email: `admin@juristdz.com`
   - Mot de passe: `Admin2024!JuristDZ`
3. ✅ Vous devriez voir le dashboard

### Test 2: Connexion Avocat
1. **Se déconnecter**
2. **Se connecter** avec:
   - Email: `ahmed.benali@test.dz`
   - Mot de passe: `test123`
3. ✅ Vous devriez voir l'interface avocat

### Test 3: Isolation des données
1. **Connecté en tant qu'Ahmed**, créer un dossier
2. **Se déconnecter**
3. **Se connecter** en tant que Sarah (`sarah.khelifi@test.dz` / `test123`)
4. ✅ Vous ne devriez PAS voir le dossier d'Ahmed

---

## 📋 IDENTIFIANTS DE CONNEXION

### Compte Administrateur
```
Email: admin@juristdz.com
Mot de passe: Admin2024!JuristDZ
Rôle: ADMIN
Permissions: Toutes
```

### Comptes de Test

**Avocat 1:**
```
Email: ahmed.benali@test.dz
Mot de passe: test123
Profession: Avocat
Plan: Gratuit (5 documents)
```

**Avocat 2:**
```
Email: sarah.khelifi@test.dz
Mot de passe: test123
Profession: Avocat
Plan: Gratuit (5 documents)
```

**Notaire:**
```
Email: mohamed.ziani@test.dz
Mot de passe: test123
Profession: Notaire
Plan: Gratuit (5 documents)
```

**Huissier:**
```
Email: karim.djahid@test.dz
Mot de passe: test123
Profession: Huissier
Plan: Gratuit (5 documents)
```

---

## 🆘 DÉPANNAGE

### Erreur: "relation does not exist"
→ Les tables n'existent pas. Suivre l'Option 2, Étape 1.

### Erreur: "Invalid login credentials"
→ Le compte n'existe pas. Suivre l'Option 2, Étape 3 ou 4.

### Erreur: "is_admin column does not exist"
→ Le script admin n'a pas été exécuté. Suivre l'Option 2, Étape 2.

### L'application ne se lance pas
→ Vérifier que `npm run dev` est en cours d'exécution.

---

## ✅ CHECKLIST

- [ ] Tables Supabase créées
- [ ] Script admin exécuté
- [ ] Compte admin créé
- [ ] Droits admin activés
- [ ] Comptes de test créés
- [ ] Test de connexion admin réussi
- [ ] Test de connexion utilisateur réussi
- [ ] Test d'isolation des données réussi

---

**Date**: 2 mars 2026
**Temps estimé**: 5-15 minutes selon l'option choisie
**Prochaine étape**: Créer l'interface admin pour gérer les utilisateurs
