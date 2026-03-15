# Correction des Multiples Instances Supabase

## Problème Identifié

L'application créait plusieurs instances du client Supabase, ce qui causait l'avertissement :
```
Multiple GoTrueClient instances detected in the same browser context
```

## Cause

Plusieurs fichiers créaient leurs propres instances de Supabase au lieu d'utiliser l'instance centralisée :

1. `src/document-management/config/index.ts` - Créait une nouvelle instance avec `createClient()`
2. `src/document-management/services/workflowService.ts` - Créait sa propre instance
3. `src/document-management/services/signatureService.ts` - Créait sa propre instance
4. `src/document-management/services/caseIntegrationService.ts` - Créait sa propre instance

## Solution Appliquée

### 1. Modification de `src/document-management/config/index.ts`

**Avant :**
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {...});
  }
  return supabaseClient;
};
```

**Après :**
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as centralSupabase } from '../../lib/supabase';

export const getSupabaseClient = (): SupabaseClient => {
  return centralSupabase;
};
```

### 2. Modification des Services

Tous les services ont été modifiés pour utiliser `getSupabaseClient()` depuis la configuration centralisée :

**workflowService.ts, signatureService.ts, caseIntegrationService.ts :**

**Avant :**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
```

**Après :**
```typescript
import { getSupabaseClient } from '../config';

const supabase = getSupabaseClient();
```

## Architecture Finale

```
src/lib/supabase.ts (Instance Unique)
    ↓
src/document-management/config/index.ts (getSupabaseClient)
    ↓
Tous les services DMS utilisent getSupabaseClient()
```

## Avantages

1. ✅ Une seule instance Supabase dans toute l'application
2. ✅ Pas d'avertissements dans la console
3. ✅ Meilleure gestion de la session utilisateur
4. ✅ Configuration centralisée
5. ✅ Moins de consommation mémoire

## Vérification

Pour vérifier que le problème est résolu :
1. Ouvrir la console du navigateur
2. Recharger l'application
3. L'avertissement "Multiple GoTrueClient instances" ne devrait plus apparaître

## Fichiers Modifiés

- `src/document-management/config/index.ts`
- `src/document-management/services/workflowService.ts`
- `src/document-management/services/signatureService.ts`
- `src/document-management/services/caseIntegrationService.ts`

---

**Date :** 2 mars 2026
**Statut :** ✅ Corrigé
