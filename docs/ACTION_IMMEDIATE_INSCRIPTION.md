# ⚡ ACTION IMMÉDIATE - Corriger l'Inscription

## 🎯 Ce qui a été fait

✅ **Code modifié**: `src/components/auth/AuthForm.tsx` utilise maintenant une fonction RPC
✅ **Script SQL prêt**: `database/create-rpc-function-profile.sql`
✅ **Documentation créée**: `SOLUTION_RPC_INSCRIPTION.md`

## 🚀 CE QUE VOUS DEVEZ FAIRE MAINTENANT

### 1️⃣ Exécuter le Script SQL (2 minutes)

1. Ouvrez Supabase: https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Cliquez sur **New Query**
5. Copiez TOUT le contenu du fichier `database/create-rpc-function-profile.sql`
6. Collez dans l'éditeur SQL
7. Cliquez sur **Run** (ou Ctrl+Enter)
8. Vérifiez le message de succès

### 2️⃣ Tester l'Inscription (1 minute)

1. Ouvrez votre application dans le navigateur
2. Allez sur le formulaire d'inscription
3. Remplissez les champs:
   - Prénom: Test
   - Nom: User
   - Email: test@example.com (utilisez un email unique)
   - Mot de passe: test123
   - Profession: Avocat
4. Cliquez sur "Créer mon compte"
5. Ouvrez la console (F12) et vérifiez les logs

### 3️⃣ Vérifier le Résultat

**Dans la Console du Navigateur:**
```
✅ User created in auth.users: [id]
✅ Profile created successfully via RPC: {success: true, ...}
```

**Dans Supabase (Table Editor > profiles):**
- Un nouveau profil doit apparaître avec `is_active = false`

**Dans Supabase (Table Editor > subscriptions):**
- Une nouvelle subscription doit apparaître avec `status = pending`

## ❌ Si ça ne fonctionne pas

### Erreur: "function create_user_profile does not exist"
➡️ Le script SQL n'a pas été exécuté correctement
➡️ Retournez à l'étape 1 et réessayez

### Erreur: "Unauthorized: You can only create your own profile"
➡️ Problème de session utilisateur
➡️ Déconnectez-vous et réessayez l'inscription

### Erreur: "Profile already exists for this user"
➡️ L'utilisateur existe déjà
➡️ Utilisez un autre email ou supprimez l'ancien utilisateur

### Erreur 429: "Rate limit exceeded"
➡️ Trop de tentatives d'inscription
➡️ Attendez 5 minutes et réessayez

## 📊 Vérification Complète

Exécutez cette requête SQL dans Supabase pour vérifier:

```sql
-- Vérifier que la fonction existe
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'create_user_profile';

-- Vérifier les permissions
SELECT grantee, privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_name = 'create_user_profile';

-- Compter les profils créés aujourd'hui
SELECT COUNT(*) as new_profiles_today
FROM profiles
WHERE created_at::date = CURRENT_DATE;
```

## 🎉 Succès!

Si vous voyez:
- ✅ Message de succès dans la console
- ✅ Profil créé dans la table `profiles`
- ✅ Subscription créée dans la table `subscriptions`
- ✅ Modal de vérification d'email affiché

**L'inscription fonctionne maintenant correctement!**

## 📝 Notes Importantes

1. **Le trigger existe toujours** mais n'est plus utilisé (on peut le garder comme backup)
2. **La fonction RPC est plus fiable** car elle s'exécute avec les privilèges système
3. **Les nouveaux comptes sont inactifs** jusqu'à validation par un admin
4. **L'email doit être vérifié** avant la première connexion

## 🔄 Prochaines Étapes

1. ✅ Inscription fonctionnelle
2. ⏳ Tester la validation admin
3. ⏳ Configurer SMTP personnalisé
4. ⏳ Tester le système d'essai gratuit

---

**Temps estimé total: 3 minutes**
**Difficulté: Facile** 🟢
