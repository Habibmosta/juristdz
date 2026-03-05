# Instructions pour créer le bucket manuellement dans Supabase

## Étape 1: Aller dans Storage
1. Ouvrez votre projet Supabase: https://supabase.com/dashboard
2. Cliquez sur **Storage** dans le menu de gauche
3. Cliquez sur **New bucket**

## Étape 2: Configurer le bucket
Remplissez les champs suivants:

- **Name**: `case-documents`
- **Public bucket**: ✅ **COCHEZ CETTE CASE** (très important!)
- **File size limit**: `50` MB
- **Allowed MIME types**: Laissez vide (tous les types autorisés)

Cliquez sur **Create bucket**

## Étape 3: Vérifier les politiques
1. Cliquez sur le bucket `case-documents` que vous venez de créer
2. Cliquez sur **Policies** en haut
3. Vous devriez voir les politiques créées automatiquement

Si aucune politique n'existe, cliquez sur **New policy** et créez:

### Politique 1: Public Read Access
- **Policy name**: `Public Access`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**: `bucket_id = 'case-documents'`

### Politique 2: Authenticated Upload
- **Policy name**: `Authenticated users can upload`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK expression**: `bucket_id = 'case-documents'`

### Politique 3: Authenticated Delete
- **Policy name**: `Authenticated users can delete`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**: `bucket_id = 'case-documents'`

## Étape 4: Tester
Retournez dans l'application et essayez de:
1. Télécharger un document
2. Visualiser le document (icône œil)
3. Télécharger le document (icône download)

## Alternative: Bucket privé avec signed URLs
Si vous préférez garder le bucket privé pour plus de sécurité, décochez "Public bucket" et nous utiliserons des signed URLs dans le code.
