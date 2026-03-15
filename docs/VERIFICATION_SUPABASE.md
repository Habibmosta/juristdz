# ✅ Vérification de la Configuration Supabase

## 🎉 BONNE NOUVELLE!

Vos clés Supabase sont déjà configurées dans `.env.local`:
```
VITE_SUPABASE_URL=https://fcteljnmcdelbratudnc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ⚠️ PROCHAINE ÉTAPE IMPORTANTE

Il faut maintenant créer les tables dans Supabase.

### Option 1: Vérifier si les tables existent déjà

1. **Aller sur**: https://supabase.com/dashboard
2. **Se connecter** avec votre compte
3. **Sélectionner** le projet: fcteljnmcdelbratudnc
4. **Aller dans**: Table Editor (menu gauche)
5. **Vérifier** si ces tables existent:
   - profiles
   - cases
   - documents
   - subscriptions

### Option 2: Créer les tables (si elles n'existent pas)

1. **Dans Supabase**, aller dans **SQL Editor**
2. **Cliquer sur** "New query"
3. **Copier-coller** le script depuis `SUPABASE_SETUP_GUIDE.md` (section "Étape 2.2")
4. **Cliquer sur** "Run"
5. **Attendre** que le script s'exécute (30 secondes)

### Option 3: Ajouter les fonctionnalités admin

1. **Toujours dans SQL Editor**
2. **Cliquer sur** "New query"
3. **Copier-coller** le contenu de `supabase-admin-setup.sql`
4. **Cliquer sur** "Run"

## 🧪 TESTER L'APPLICATION

Une fois les tables créées:

```bash
npm run dev
```

Puis ouvrir: http://localhost:5173

Vous devriez voir:
- ✅ Page de connexion/inscription
- ✅ Formulaire d'authentification
- ✅ Possibilité de créer un compte

## 🔐 CRÉER LE COMPTE ADMIN

### Méthode 1: Via l'interface Supabase (RECOMMANDÉ)

1. **Dans Supabase**, aller dans **Authentication** → **Users**
2. **Cliquer sur** "Add user" → "Create new user"
3. **Remplir**:
   - Email: admin@juristdz.com
   - Password: Admin2024!JuristDZ
   - Auto Confirm User: ✅ (cocher)
4. **Cliquer sur** "Create user"
5. **Dans SQL Editor**, exécuter:

```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'admin@juristdz.com';
```

### Méthode 2: Via l'application

1. **Ouvrir** http://localhost:5173
2. **Cliquer sur** "Inscription"
3. **Créer un compte**:
   - Email: admin@juristdz.com
   - Mot de passe: Admin2024!JuristDZ
   - Prénom: Admin
   - Nom: JuristDZ
   - Profession: Avocat (temporaire)
4. **Dans Supabase SQL Editor**, exécuter:

```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'admin@juristdz.com';
```

## ✅ VÉRIFICATION FINALE

Pour vérifier que tout fonctionne:

1. **Se connecter** avec admin@juristdz.com
2. **Ouvrir la console** du navigateur (F12)
3. **Exécuter**:

```javascript
const { data } = await supabase.rpc('is_admin');
console.log('Is admin:', data); // Devrait afficher: true
```

## 📊 STATUT ACTUEL

- ✅ Supabase configuré (.env.local)
- ✅ Code d'authentification créé
- ✅ Imports corrigés
- ⏳ Tables à créer (si pas déjà fait)
- ⏳ Compte admin à créer

## 🚀 PROCHAINES ÉTAPES

1. Créer les tables Supabase
2. Créer le compte admin
3. Tester la connexion
4. Créer des comptes utilisateurs de test
5. Tester l'isolation des données

---

**Date**: 2 mars 2026
**Statut**: Configuration en cours
**Projet Supabase**: fcteljnmcdelbratudnc
