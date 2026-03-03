# Correction de la Création de Dossiers

## Problèmes Identifiés

### 1. Erreur "User not authenticated"
**Cause** : `authService.getCurrentUser()` cherchait dans la table `user_profiles` au lieu de `profiles`

**Solution** : Correction de la requête pour utiliser la bonne table :
```typescript
// AVANT (INCORRECT)
const { data: profile } = await supabase
  ?.from('user_profiles')  // ❌ Table inexistante
  .select('*')
  .eq('id', user.id)
  .single();

// APRÈS (CORRECT)
const { data: profile } = await supabase
  ?.from('profiles')  // ✅ Table correcte
  .select('*')
  .eq('id', user.id)
  .single();
```

### 2. Erreur "Could not find the 'assigned_lawyer' column"
**Cause** : `supabaseCaseService.ts` essayait d'insérer des colonnes qui n'existent pas dans la table `cases`

**Structure réelle de la table** :
- `id` (uuid)
- `user_id` (uuid) - IMPORTANT pour l'isolation
- `title` (text)
- `client_name` (text)
- `description` (text)
- `status` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Solution** : Simplification du mapping pour n'utiliser que les colonnes existantes :
```typescript
// AVANT (INCORRECT)
const supabaseData = {
  title: caseData.title,
  client_name: caseData.clientName,
  client_phone: caseData.clientPhone,      // ❌ N'existe pas
  client_email: caseData.clientEmail,      // ❌ N'existe pas
  client_address: caseData.clientAddress,  // ❌ N'existe pas
  case_type: caseData.caseType,            // ❌ N'existe pas
  priority: caseData.priority,             // ❌ N'existe pas
  assigned_lawyer: caseData.assignedLawyer,// ❌ N'existe pas
  // ... autres colonnes inexistantes
};

// APRÈS (CORRECT)
const supabaseData = {
  user_id: user_id,              // ✅ ESSENTIEL pour l'isolation
  title: caseData.title,         // ✅ Existe
  client_name: caseData.clientName, // ✅ Existe
  description: caseData.description, // ✅ Existe
  status: caseData.status || 'active' // ✅ Existe
};
```

### 3. Pas de filtrage par user_id
**Cause** : Les requêtes ne filtraient pas par `user_id`, donc tous les utilisateurs voyaient tous les dossiers

**Solution** : Ajout du filtrage par `user_id` dans toutes les méthodes :
```typescript
// Création
const { data } = await supabase
  .from('cases')
  .insert([{ user_id: user_id, ...caseData }])
  .select()
  .single();

// Lecture
const { data } = await supabase
  .from('cases')
  .select('*')
  .eq('user_id', user_id)  // ✅ Filtrage par utilisateur
  .order('created_at', { ascending: false });

// Mise à jour
const { data } = await supabase
  .from('cases')
  .update(updates)
  .eq('id', id)
  .eq('user_id', user_id)  // ✅ Sécurité : ne peut modifier que ses propres dossiers
  .select()
  .single();
```

## Fichiers Corrigés

### 1. `services/authService.ts`
- ✅ Correction de la table `user_profiles` → `profiles`
- ✅ Mapping correct des champs du profil
- ✅ Gestion des erreurs améliorée

### 2. `services/supabaseCaseService.ts`
- ✅ Méthode `createCase()` : Utilise uniquement les colonnes existantes + `user_id`
- ✅ Méthode `getAllCases()` : Filtre par `user_id`
- ✅ Méthode `getActiveCases()` : Filtre par `user_id`
- ✅ Méthode `updateCase()` : Filtre par `user_id` pour la sécurité
- ✅ Méthode `mapSupabaseToCase()` : Simplifié pour correspondre à la structure réelle
- ✅ Suppression de `mapCaseToSupabase()` qui générait des colonnes inexistantes

### 3. `services/multiUserCaseService.ts`
- ✅ Déjà correct : utilise la structure simple
- ✅ Filtre correctement par `user_id`

## Test de Vérification

### Scénario 1 : Création de dossier
1. Avocat A se connecte
2. Avocat A crée un dossier "Litige L1"
3. ✅ Le dossier est inséré dans la table `cases` avec `user_id` de l'Avocat A
4. ✅ Le dossier apparaît dans la liste de l'Avocat A

### Scénario 2 : Isolation des données
1. Avocat A crée un dossier "Dossier A"
2. Avocat B se connecte
3. ✅ Avocat B ne voit PAS le "Dossier A"
4. Avocat B crée un dossier "Dossier B"
5. ✅ Avocat A ne voit PAS le "Dossier B"

### Scénario 3 : Persistance
1. Avocat A crée un dossier
2. Avocat A se déconnecte
3. Avocat A se reconnecte
4. ✅ Le dossier est toujours présent (pas de disparition)

## Requêtes SQL de Vérification

### Vérifier les dossiers créés
```sql
SELECT id, user_id, title, client_name, status, created_at 
FROM cases 
ORDER BY created_at DESC;
```

### Vérifier l'isolation par utilisateur
```sql
-- Dossiers de l'Avocat A
SELECT * FROM cases WHERE user_id = 'fa4ef014-f3e2-496f-b341-ea427e1d2bf2';

-- Dossiers de l'Avocat B
SELECT * FROM cases WHERE user_id = '3ba9195c-8cdb-4f8c-b682-73d172cf4f17';
```

### Vérifier les profils utilisateurs
```sql
SELECT id, email, first_name, last_name, profession, is_active 
FROM profiles 
WHERE is_active = true;
```

## Prochaines Étapes

1. ✅ Tester la création de dossier avec un utilisateur connecté
2. ✅ Vérifier que le dossier apparaît dans la table `cases`
3. ✅ Tester l'isolation : User A ne voit pas les dossiers de User B
4. ✅ Tester la persistance : Les dossiers restent après déconnexion/reconnexion

## Notes Importantes

- **RLS (Row Level Security)** : Les policies RLS sont activées et bloquent l'accès anonyme
- **Authentification** : L'utilisateur DOIT être connecté pour créer/voir des dossiers
- **Isolation** : Chaque utilisateur voit UNIQUEMENT ses propres dossiers via `user_id`
- **Structure simple** : La table `cases` a une structure minimale pour l'instant
- **Évolution future** : On pourra ajouter des colonnes supplémentaires plus tard si nécessaire

## Commandes de Test

### Créer un dossier via l'application
1. Se connecter avec un compte avocat
2. Cliquer sur "Nouveau dossier"
3. Remplir le formulaire
4. Vérifier dans Supabase Dashboard → Table Editor → cases

### Vérifier l'isolation
1. Se connecter avec Avocat A
2. Créer un dossier "Test A"
3. Se déconnecter
4. Se connecter avec Avocat B
5. Vérifier que "Test A" n'apparaît PAS
6. Créer un dossier "Test B"
7. Se déconnecter
8. Se reconnecter avec Avocat A
9. Vérifier que "Test B" n'apparaît PAS et que "Test A" est toujours là
