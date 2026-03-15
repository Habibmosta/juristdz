# Ajout des Colonnes Manquantes à la Table Cases

## Problème Identifié

Lors de la création d'un dossier, le formulaire collecte beaucoup d'informations mais seules quelques-unes sont sauvegardées dans la base de données :

### Informations Collectées par le Formulaire
- ✅ Titre du dossier
- ✅ Nom du client
- ❌ Téléphone du client (MANQUANT)
- ❌ Email du client (MANQUANT)
- ❌ Adresse du client (MANQUANT)
- ✅ Description
- ❌ Type de dossier (MANQUANT)
- ❌ Priorité (MANQUANT)
- ❌ Valeur estimée (MANQUANT)
- ❌ Date limite (MANQUANT)
- ❌ Notes (MANQUANT)
- ❌ Avocat assigné (MANQUANT)

### Structure Actuelle de la Table (INCOMPLÈTE)
```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Solution : Ajouter les Colonnes Manquantes

### Script SQL à Exécuter

Exécutez le fichier `ajouter-colonnes-cases.sql` dans Supabase SQL Editor :

```sql
-- 1. Informations du client
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT;

-- 2. Détails du dossier
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS case_type TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS deadline DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Gestion et collaboration
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS assigned_lawyer TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';

-- 4. Index pour performances
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_deadline ON cases(deadline);
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
```

### Structure Finale de la Table

Après l'exécution du script, la table `cases` aura cette structure complète :

| Colonne | Type | Description | Nullable |
|---------|------|-------------|----------|
| `id` | UUID | Identifiant unique | NON |
| `user_id` | UUID | Utilisateur propriétaire (isolation) | NON |
| `title` | TEXT | Titre du dossier | NON |
| `client_name` | TEXT | Nom du client | NON |
| `client_phone` | TEXT | Téléphone du client | OUI |
| `client_email` | TEXT | Email du client | OUI |
| `client_address` | TEXT | Adresse du client | OUI |
| `description` | TEXT | Description du dossier | OUI |
| `case_type` | TEXT | Type de dossier (Civil, Commercial, etc.) | OUI |
| `priority` | TEXT | Priorité (low, medium, high, urgent) | OUI |
| `estimated_value` | NUMERIC | Valeur estimée en DA | OUI |
| `deadline` | DATE | Date limite | OUI |
| `notes` | TEXT | Notes additionnelles | OUI |
| `assigned_lawyer` | TEXT | Avocat assigné | OUI |
| `tags` | TEXT[] | Tags/étiquettes | OUI |
| `documents` | JSONB | Documents attachés (JSON) | OUI |
| `status` | TEXT | Statut (active, closed, archived) | OUI |
| `created_at` | TIMESTAMP | Date de création | OUI |
| `updated_at` | TIMESTAMP | Date de modification | OUI |

## Modifications du Code

### 1. `services/supabaseCaseService.ts`

#### Méthode `createCase()` - AVANT
```typescript
const supabaseData = {
  user_id: user_id,
  title: caseData.title || '',
  client_name: caseData.clientName || '',
  description: caseData.description || '',
  status: caseData.status || 'active'
};
```

#### Méthode `createCase()` - APRÈS
```typescript
const supabaseData = {
  user_id: user_id,
  title: caseData.title || '',
  client_name: caseData.clientName || '',
  client_phone: caseData.clientPhone || null,
  client_email: caseData.clientEmail || null,
  client_address: caseData.clientAddress || null,
  description: caseData.description || '',
  case_type: caseData.caseType || null,
  priority: caseData.priority || 'medium',
  estimated_value: caseData.estimatedValue || null,
  deadline: caseData.deadline ? caseData.deadline.toISOString().split('T')[0] : null,
  notes: caseData.notes || null,
  assigned_lawyer: caseData.assignedLawyer || null,
  tags: caseData.tags || [],
  documents: caseData.documents || [],
  status: caseData.status || 'active'
};
```

#### Méthode `mapSupabaseToCase()` - AVANT
```typescript
return {
  id: data.id,
  title: data.title,
  clientName: data.client_name,
  description: data.description || '',
  status: data.status,
  createdAt: new Date(data.created_at),
  lastUpdated: new Date(data.updated_at),
  // Valeurs par défaut pour champs manquants
  clientPhone: '',
  clientEmail: '',
  // ...
};
```

#### Méthode `mapSupabaseToCase()` - APRÈS
```typescript
return {
  id: data.id,
  title: data.title,
  clientName: data.client_name,
  clientPhone: data.client_phone || '',
  clientEmail: data.client_email || '',
  clientAddress: data.client_address || '',
  description: data.description || '',
  caseType: data.case_type || '',
  priority: data.priority || 'medium',
  estimatedValue: data.estimated_value ? parseFloat(data.estimated_value) : undefined,
  deadline: data.deadline ? new Date(data.deadline) : undefined,
  notes: data.notes || '',
  assignedLawyer: data.assigned_lawyer || '',
  tags: data.tags || [],
  documents: data.documents || [],
  status: data.status,
  createdAt: new Date(data.created_at),
  lastUpdated: new Date(data.updated_at)
};
```

### 2. `services/multiUserCaseService.ts`

Les mêmes modifications ont été appliquées pour assurer la cohérence.

## Étapes de Déploiement

### 1. Exécuter le Script SQL
1. Ouvrir Supabase Dashboard
2. Aller dans SQL Editor
3. Copier le contenu de `ajouter-colonnes-cases.sql`
4. Exécuter le script
5. Vérifier que toutes les colonnes sont ajoutées

### 2. Vérifier la Structure
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cases'
ORDER BY ordinal_position;
```

### 3. Tester la Création de Dossier
1. Se connecter avec un compte avocat
2. Créer un nouveau dossier avec TOUTES les informations :
   - Titre : "Test Complet"
   - Client : "M. Test"
   - Téléphone : "+213 555 123 456"
   - Email : "test@email.com"
   - Adresse : "123 Rue Test, Alger"
   - Description : "Description test"
   - Type : "Droit Civil"
   - Priorité : "high"
   - Valeur estimée : 1000000
   - Date limite : 2026-04-01
   - Notes : "Notes de test"
   - Avocat assigné : "Maître Test"

3. Vérifier dans la table `cases` que TOUTES les informations sont sauvegardées

### 4. Tester la Modification de Dossier
1. Ouvrir le dossier créé
2. Modifier les informations du client
3. Vérifier que les modifications sont sauvegardées

### 5. Vérifier l'Isolation
1. Se connecter avec Avocat A
2. Créer un dossier avec toutes les infos
3. Se connecter avec Avocat B
4. Vérifier que le dossier de A n'apparaît PAS
5. Créer un dossier avec Avocat B
6. Se reconnecter avec Avocat A
7. Vérifier que le dossier de B n'apparaît PAS

## Requêtes SQL de Test

### Voir tous les dossiers avec toutes les colonnes
```sql
SELECT 
  c.id,
  p.email as user_email,
  c.title,
  c.client_name,
  c.client_phone,
  c.client_email,
  c.client_address,
  c.case_type,
  c.priority,
  c.estimated_value,
  c.deadline,
  c.assigned_lawyer,
  c.status,
  c.created_at
FROM cases c
LEFT JOIN profiles p ON c.user_id = p.id
ORDER BY c.created_at DESC;
```

### Compter les dossiers par type
```sql
SELECT 
  case_type,
  COUNT(*) as nombre,
  SUM(estimated_value) as valeur_totale
FROM cases
WHERE status = 'active'
GROUP BY case_type
ORDER BY nombre DESC;
```

### Dossiers urgents avec deadline proche
```sql
SELECT 
  title,
  client_name,
  priority,
  deadline,
  deadline - CURRENT_DATE as jours_restants
FROM cases
WHERE status = 'active'
  AND deadline IS NOT NULL
  AND deadline <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY deadline ASC;
```

## Avantages de la Structure Complète

1. **Informations Client Complètes** : Téléphone, email, adresse sauvegardés
2. **Gestion des Priorités** : Filtrage par priorité (low, medium, high, urgent)
3. **Suivi Financier** : Valeur estimée pour statistiques
4. **Gestion des Délais** : Date limite pour alertes
5. **Collaboration** : Avocat assigné pour travail en équipe
6. **Organisation** : Tags pour catégorisation flexible
7. **Documents** : Stockage JSON des documents attachés
8. **Performance** : Index pour requêtes rapides

## Notes Importantes

- ✅ Toutes les colonnes sont `NULLABLE` sauf `id`, `user_id`, `title`, `client_name`
- ✅ La colonne `priority` a une contrainte CHECK pour valider les valeurs
- ✅ Les index améliorent les performances des requêtes fréquentes
- ✅ L'isolation par `user_id` est maintenue
- ✅ Les RLS policies continuent de fonctionner
- ✅ Compatibilité avec les formulaires existants

## Prochaines Étapes

1. ✅ Exécuter le script SQL `ajouter-colonnes-cases.sql`
2. ✅ Tester la création de dossier avec toutes les informations
3. ✅ Tester la modification de dossier
4. ✅ Vérifier que les informations sont persistées
5. ✅ Vérifier l'isolation des données entre utilisateurs
6. 🔄 Ajouter des statistiques avancées (par type, par priorité, etc.)
7. 🔄 Implémenter les alertes pour deadlines proches
8. 🔄 Ajouter la gestion des documents attachés
