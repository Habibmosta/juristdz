# 📖 Guide d'Utilisation - Données Réelles

## 🎯 Vue d'Ensemble

Toutes les interfaces professionnelles utilisent maintenant des données réelles depuis Supabase via le service `professionalDataService`.

---

## 🔄 Comment Ça Fonctionne

### 1. Connexion Utilisateur

Lorsqu'un utilisateur se connecte avec un rôle spécifique:

```typescript
// L'utilisateur a un profil avec:
user.id = "uuid-de-l-utilisateur"
user.profession = "notaire" | "huissier" | "magistrat" | "juriste_entreprise" | "etudiant"
```

### 2. Chargement Automatique

Au montage du composant, les données sont chargées automatiquement:

```typescript
useEffect(() => {
  loadData();
}, [user.id]);
```

### 3. Récupération des Données

Le service `professionalDataService` récupère les données de la table correspondante:

```typescript
const data = await professionalDataService.getByProfession(
  user.id,        // ID de l'utilisateur
  'notaire',      // Profession
  20              // Limite de résultats
);
```

### 4. Transformation

Les données brutes sont transformées pour correspondre à l'interface:

```typescript
const transformedData = data.map((item: any) => ({
  id: item.id,
  numero: item.metadata?.numero || `ACT-${item.id.slice(0, 8)}`,
  type: item.title,
  // ... autres champs
  statut: item.status === 'draft' ? 'brouillon' : 'signe'
}));
```

### 5. Affichage

L'interface affiche les données avec 3 états possibles:

- **Loading**: Spinner pendant le chargement
- **Empty**: Message si aucune donnée
- **Data**: Liste des éléments

---

## 📊 Tables Supabase

### Structure Commune

Toutes les tables professionnelles partagent cette structure de base:

```sql
CREATE TABLE professional_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  profession TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tables Spécifiques

| Profession | Table | Champs Metadata |
|-----------|-------|-----------------|
| Notaire | `acte_notarial` | numero, type_acte, parties, montant |
| Huissier | `constat` | numero, type_constat, lieu, temoins |
| Magistrat | `jugement` | numero_rg, parties, date_audience, urgence |
| Juriste Entreprise | `contrat_entreprise` | numero, cocontractant, montant, date_signature |
| Étudiant | `ressource_pedagogique` | matiere, niveau, duree, progression |

---

## 🎨 États de l'Interface

### 1. État Loading

```typescript
{loading && (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
    <p className="mt-4 text-slate-400">Chargement...</p>
  </div>
)}
```

### 2. État Vide

```typescript
{!loading && data.length === 0 && (
  <div className="text-center py-12">
    <FileSignature size={48} className="mx-auto text-slate-300 mb-4" />
    <p className="text-slate-400 mb-4">Aucun acte pour le moment</p>
    <button onClick={() => setShowModal(true)}>
      Créer votre premier acte
    </button>
  </div>
)}
```

### 3. État Données

```typescript
{!loading && data.length > 0 && (
  data.map(item => (
    <div key={item.id}>
      {/* Affichage de l'élément */}
    </div>
  ))
)}
```

---

## 🔐 Sécurité RLS (Row Level Security)

Chaque table a des politiques RLS pour garantir que:

1. **SELECT**: L'utilisateur ne voit que ses propres données
   ```sql
   CREATE POLICY "Users can view own data"
   ON professional_data FOR SELECT
   USING (auth.uid() = user_id);
   ```

2. **INSERT**: L'utilisateur peut créer ses propres données
   ```sql
   CREATE POLICY "Users can insert own data"
   ON professional_data FOR INSERT
   WITH CHECK (auth.uid() = user_id);
   ```

3. **UPDATE**: L'utilisateur peut modifier ses propres données
   ```sql
   CREATE POLICY "Users can update own data"
   ON professional_data FOR UPDATE
   USING (auth.uid() = user_id);
   ```

4. **DELETE**: L'utilisateur peut supprimer ses propres données
   ```sql
   CREATE POLICY "Users can delete own data"
   ON professional_data FOR DELETE
   USING (auth.uid() = user_id);
   ```

---

## 🛠️ Service professionalDataService

### Méthodes Disponibles

#### 1. getByProfession
```typescript
// Récupérer les données d'une profession
const data = await professionalDataService.getByProfession(
  userId: string,
  profession: string,
  limit?: number
);
```

#### 2. create
```typescript
// Créer une nouvelle entrée
const newItem = await professionalDataService.create(
  userId: string,
  profession: string,
  data: {
    title: string,
    description?: string,
    status?: string,
    metadata?: object
  }
);
```

#### 3. update
```typescript
// Mettre à jour une entrée
const updated = await professionalDataService.update(
  id: string,
  data: {
    title?: string,
    description?: string,
    status?: string,
    metadata?: object
  }
);
```

#### 4. delete
```typescript
// Supprimer une entrée
await professionalDataService.delete(id: string);
```

#### 5. getById
```typescript
// Récupérer une entrée spécifique
const item = await professionalDataService.getById(id: string);
```

#### 6. search
```typescript
// Rechercher dans les données
const results = await professionalDataService.search(
  userId: string,
  profession: string,
  query: string
);
```

#### 7. getStats
```typescript
// Obtenir les statistiques
const stats = await professionalDataService.getStats(
  userId: string,
  profession: string
);
// Retourne: { total, active, archived, thisMonth }
```

---

## 📝 Exemple Complet

### NotaireInterface

```typescript
// 1. Imports
import { useEffect } from 'react';
import { professionalDataService } from '../../src/services/professionalDataService';

// 2. État
const [recentActes, setRecentActes] = useState<Acte[]>([]);
const [loading, setLoading] = useState(true);

// 3. Chargement
useEffect(() => {
  loadData();
}, [user.id]);

const loadData = async () => {
  try {
    setLoading(true);
    
    // Récupérer les données
    const data = await professionalDataService.getByProfession(
      user.id,
      'notaire',
      20
    );
    
    // Transformer
    const transformedData = data.map((item: any) => ({
      id: item.id,
      numero: item.metadata?.numero || `ACT-${item.id.slice(0, 8)}`,
      type: item.metadata?.type_acte || item.title,
      parties: item.metadata?.parties || [],
      objet: item.description || '',
      dateCreation: new Date(item.created_at),
      montant: item.metadata?.montant,
      statut: item.status === 'draft' ? 'brouillon' : 
              item.status === 'archived' ? 'archive' : 'signe'
    }));
    
    setRecentActes(transformedData);
    
    // Charger les stats
    const stats = await professionalDataService.getStats(user.id, 'notaire');
    setMinutierStats({
      totalActes: stats.total,
      actesMois: stats.thisMonth,
      // ...
    });
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    setLoading(false);
  }
};

// 4. Affichage
{loading ? (
  <Spinner />
) : recentActes.length === 0 ? (
  <EmptyState />
) : (
  recentActes.map(acte => <ActeCard key={acte.id} acte={acte} />)
)}
```

---

## 🎯 Bonnes Pratiques

### 1. Toujours Gérer les 3 États
```typescript
✅ Loading state
✅ Empty state
✅ Data state
```

### 2. Gestion d'Erreurs
```typescript
try {
  // Opération
} catch (error) {
  console.error('Erreur:', error);
  // Optionnel: Afficher un toast/notification
} finally {
  setLoading(false);
}
```

### 3. Transformation des Données
```typescript
// Toujours fournir des valeurs par défaut
const numero = item.metadata?.numero || `DEFAULT-${item.id.slice(0, 8)}`;
const parties = item.metadata?.parties || [];
```

### 4. Rechargement
```typescript
// Exposer loadData pour permettre le rechargement
const handleCreate = async (newData) => {
  await professionalDataService.create(user.id, 'notaire', newData);
  loadData(); // Recharger après création
};
```

---

## 🚀 Prochaines Améliorations

1. **Cache**: Éviter de recharger si données récentes
2. **Pagination**: Charger plus de 20 éléments
3. **Recherche temps réel**: Filtrer côté client
4. **Optimistic updates**: Mise à jour UI avant confirmation
5. **Toast notifications**: Feedback visuel pour les actions

---

## 📞 Support

Pour toute question sur l'utilisation des données réelles:

1. Consulter `src/services/professionalDataService.ts`
2. Vérifier les politiques RLS dans Supabase
3. Tester avec des données de test
4. Consulter les logs de la console

---

**Date de création**: 7 mars 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
