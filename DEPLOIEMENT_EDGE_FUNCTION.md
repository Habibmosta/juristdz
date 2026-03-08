# Déploiement des Edge Functions Admin

## Prérequis
1. Installer Supabase CLI: https://supabase.com/docs/guides/cli
   ```bash
   npm install -g supabase
   ```

2. Se connecter à Supabase:
   ```bash
   supabase login
   ```

3. Lier le projet:
   ```bash
   supabase link --project-ref fcteljnmcdelbratudnc
   ```

## Déploiement

Déployer les deux fonctions:
```bash
supabase functions deploy admin-update-user-password
supabase functions deploy admin-delete-user
```

## Alternative: Déploiement Manuel via Dashboard

Si tu préfères ne pas utiliser le CLI:

### Fonction 1: Changement de mot de passe

1. Va sur: https://supabase.com/dashboard/project/fcteljnmcdelbratudnc/functions

2. Clique sur "Create a new function"

3. Nom: `admin-update-user-password`

4. Copie le contenu du fichier `supabase/functions/admin-update-user-password/index.ts`

5. Clique sur "Deploy"

### Fonction 2: Suppression d'utilisateur

1. Clique sur "Create a new function"

2. Nom: `admin-delete-user`

3. Copie le contenu du fichier `supabase/functions/admin-delete-user/index.ts`

4. Clique sur "Deploy"

## Test

Une fois déployées, les fonctions seront accessibles à:
```
https://fcteljnmcdelbratudnc.supabase.co/functions/v1/admin-update-user-password
https://fcteljnmcdelbratudnc.supabase.co/functions/v1/admin-delete-user
```

## Utilisation dans l'application

L'application utilise automatiquement ces fonctions quand tu:
- Changes le mot de passe d'un utilisateur depuis l'interface admin
- Supprimes un utilisateur depuis l'interface admin

Les fonctions:
- Vérifient que tu es admin
- Effectuent l'opération demandée
- Retournent un message de succès ou d'erreur

## Sécurité

Les fonctions incluent:
- Vérification de l'authentification
- Vérification du rôle admin
- Protection contre l'auto-suppression (pour delete)
- Validation des données d'entrée
