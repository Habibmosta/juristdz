# 🔧 Solution RPC pour l'Inscription - Guide d'Implémentation

## 📋 Problème Résolu
L'erreur 401 "new row violates row-level security policy" lors de l'inscription est causée par le fait que le trigger PostgreSQL ne se déclenche pas correctement ou n'a pas les bonnes permissions.

## ✅ Solution Implémentée
Utilisation d'une fonction RPC (Remote Procedure Call) avec `SECURITY DEFINER` qui s'exécute avec les privilèges système, contournant ainsi les politiques RLS.

## 🚀 Étapes d'Implémentation

### Étape 1: Exécuter le Script SQL dans Supabase

1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez et exécutez le contenu du fichier `database/create-rpc-function-profile.sql`
4. Vérifiez que la fonction est créée avec succès

### Étape 2: Vérifier la Fonction RPC

Exécutez cette requête pour vérifier que la fonction existe:

```sql
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'create_user_profile';
```

Résultat attendu:
- `function_name`: create_user_profile
- `is_security_definer`: true

### Étape 3: Tester l'Inscription

1. Ouvrez l'application dans votre navigateur
2. Allez sur le formulaire d'inscription
3. Remplissez tous les champs requis
4. Cliquez sur "Créer mon compte"

### Étape 4: Vérifier dans la Console

Ouvrez la console du navigateur (F12) et vérifiez les logs:

✅ **Succès attendu:**
```
✅ User created in auth.users: [user-id]
✅ Profile created successfully via RPC: {success: true, user_id: "...", message: "..."}
```

❌ **En cas d'erreur:**
```
❌ Profile creation error: [error details]
❌ RPC function returned error: [error message]
```

### Étape 5: Vérifier dans Supabase

1. Allez dans **Table Editor** > **profiles**
2. Vérifiez qu'un nouveau profil a été créé avec:
   - `id` = ID de l'utilisateur
   - `email` = Email saisi
   - `first_name`, `last_name`, etc.
   - `is_active` = false (en attente de validation)

3. Allez dans **Table Editor** > **subscriptions**
4. Vérifiez qu'une subscription a été créée avec:
   - `user_id` = ID de l'utilisateur
   - `plan` = 'free'
   - `status` = 'pending'
   - `is_active` = false

## 🔍 Comment ça Fonctionne

### Avant (Trigger - Ne fonctionnait pas)
```
1. User s'inscrit → auth.users créé
2. Trigger se déclenche (ou pas) → Profil créé (ou pas)
3. ❌ Erreur 401 si le trigger échoue
```

### Maintenant (RPC - Fonctionne)
```
1. User s'inscrit → auth.users créé
2. Client appelle RPC create_user_profile
3. Fonction RPC s'exécute avec privilèges système
4. ✅ Profil et subscription créés avec succès
```

## 🛠️ Avantages de la Solution RPC

1. **Contrôle Total**: Le client appelle explicitement la création du profil
2. **Gestion d'Erreurs**: Meilleure gestion des erreurs avec retour JSON
3. **Sécurité**: `SECURITY DEFINER` donne les privilèges nécessaires
4. **Vérification**: Vérifie que l'utilisateur crée bien son propre profil
5. **Pas de Doublons**: Vérifie si le profil existe déjà

## 📝 Code Modifié

### AuthForm.tsx
- Appel de `supabase.rpc('create_user_profile', {...})` après signUp
- Gestion des erreurs améliorée
- Logs détaillés pour le debugging

### Fonction RPC (SQL)
- `SECURITY DEFINER`: S'exécute avec privilèges du créateur
- Vérification de sécurité: `auth.uid() = user_id`
- Vérification de doublons
- Création du profil ET de la subscription
- Retour JSON avec succès/erreur

## 🔐 Sécurité

La fonction RPC est sécurisée car:
1. Vérifie que `auth.uid()` correspond au `user_id` passé
2. Un utilisateur ne peut créer QUE son propre profil
3. Vérifie si le profil existe déjà
4. Gère les erreurs sans exposer d'informations sensibles

## 🐛 Debugging

Si l'inscription échoue encore:

1. **Vérifier les logs PostgreSQL** dans Supabase:
   - Allez dans **Logs** > **Postgres Logs**
   - Cherchez les erreurs liées à `create_user_profile`

2. **Tester la fonction RPC manuellement**:
```sql
-- Après avoir créé un utilisateur de test
SELECT public.create_user_profile(
  auth.uid(),
  'test@example.com',
  'Test',
  'User',
  'avocat',
  NULL,
  NULL,
  NULL
);
```

3. **Vérifier les permissions**:
```sql
SELECT grantee, privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_name = 'create_user_profile';
```

## 📊 Comparaison Trigger vs RPC

| Aspect | Trigger | RPC |
|--------|---------|-----|
| Déclenchement | Automatique | Manuel (client) |
| Contrôle | Limité | Total |
| Debugging | Difficile | Facile |
| Gestion erreurs | Limitée | Complète |
| Fiabilité | Variable | Élevée |
| Notre choix | ❌ | ✅ |

## ✅ Checklist de Vérification

- [ ] Script SQL exécuté dans Supabase
- [ ] Fonction `create_user_profile` existe
- [ ] Permission `EXECUTE` donnée à `authenticated`
- [ ] Code `AuthForm.tsx` modifié
- [ ] Application redémarrée (si nécessaire)
- [ ] Test d'inscription effectué
- [ ] Profil créé dans la table `profiles`
- [ ] Subscription créée dans la table `subscriptions`
- [ ] Email de vérification reçu

## 🎯 Prochaines Étapes

Une fois l'inscription fonctionnelle:
1. Tester avec plusieurs utilisateurs
2. Vérifier le système de validation admin
3. Tester l'activation des comptes
4. Configurer SMTP personnalisé (voir `GUIDE_CONFIGURATION_SMTP_SUPABASE.md`)

---

**Note**: Cette solution remplace le trigger automatique par un appel RPC explicite, offrant plus de contrôle et de fiabilité.
