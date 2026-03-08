# 🔧 Intégration des Tâches dans CaseDetailView

## Objectif
Ajouter un onglet "Tâches" dans la vue détaillée d'un dossier pour afficher et gérer les tâches associées.

---

## Étapes d'Intégration

### 1. Importer le composant TaskList

Dans `src/components/cases/CaseDetailView.tsx`, ajouter l'import:

```typescript
import TaskList from '../tasks/TaskList';
```

### 2. Ajouter l'onglet "Tâches"

Localiser la section des onglets (tabs) et ajouter un nouvel onglet:

```typescript
// Trouver la liste des onglets existants:
const tabs = [
  'overview',      // Vue d'ensemble
  'documents',     // Documents
  'agenda',        // Agenda/Timeline
  'tasks',         // ← NOUVEAU: Tâches
  'billing',       // Facturation
  'notes'          // Notes
];
```

### 3. Ajouter le label de l'onglet

Dans la section de rendu des onglets, ajouter:

```typescript
{activeTab === 'tasks' && (
  <button
    onClick={() => setActiveTab('tasks')}
    className={`px-4 py-2 rounded-lg transition-colors ${
      activeTab === 'tasks'
        ? 'bg-legal-gold text-white'
        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    <CheckSquare size={18} className="inline mr-2" />
    {t.tasks || (isAr ? 'المهام' : 'Tâches')}
  </button>
)}
```

### 4. Ajouter le contenu de l'onglet

Dans la section de contenu des onglets, ajouter:

```typescript
{activeTab === 'tasks' && (
  <div className="p-6">
    <TaskList
      caseId={caseData.id}
      userId={user.id}
      language={language}
    />
  </div>
)}
```

### 5. Ajouter l'icône CheckSquare

Dans les imports de lucide-react, ajouter:

```typescript
import { 
  // ... autres icônes
  CheckSquare,
  // ... autres icônes
} from 'lucide-react';
```

### 6. Ajouter le compteur de tâches dans l'overview (optionnel)

Dans la section "Vue d'ensemble", ajouter une carte pour les tâches:

```typescript
// Charger les statistiques de tâches
const [taskStats, setTaskStats] = useState<any>(null);

useEffect(() => {
  loadTaskStats();
}, [caseData.id]);

const loadTaskStats = async () => {
  const { data } = await supabase
    .rpc('get_case_task_stats', { p_case_id: caseData.id });
  
  if (data && data.length > 0) {
    setTaskStats(data[0]);
  }
};

// Dans le rendu de l'overview:
{taskStats && (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-bold">{isAr ? 'المهام' : 'Tâches'}</h3>
      <CheckSquare size={20} className="text-legal-gold" />
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{isAr ? 'المجموع' : 'Total'}</span>
        <span className="font-bold">{taskStats.total}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{isAr ? 'منتهي' : 'Terminé'}</span>
        <span className="font-bold text-green-600">{taskStats.done}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{isAr ? 'متأخر' : 'En retard'}</span>
        <span className="font-bold text-red-600">{taskStats.overdue}</span>
      </div>
      <div className="mt-3 pt-3 border-t dark:border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{isAr ? 'معدل الإنجاز' : 'Taux de complétion'}</span>
          <span className="font-bold text-legal-gold">{taskStats.completion_rate}%</span>
        </div>
        <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-legal-gold transition-all duration-500"
            style={{ width: `${taskStats.completion_rate}%` }}
          />
        </div>
      </div>
    </div>
    <button
      onClick={() => setActiveTab('tasks')}
      className="w-full mt-4 px-4 py-2 bg-legal-gold/10 text-legal-gold rounded-lg hover:bg-legal-gold/20 transition-colors text-sm font-medium"
    >
      {isAr ? 'عرض جميع المهام' : 'Voir toutes les tâches'}
    </button>
  </div>
)}
```

---

## Code Complet à Ajouter

### Imports
```typescript
import TaskList from '../tasks/TaskList';
import { CheckSquare } from 'lucide-react';
```

### État
```typescript
const [taskStats, setTaskStats] = useState<any>(null);
```

### Effet pour charger les stats
```typescript
useEffect(() => {
  if (caseData?.id) {
    loadTaskStats();
  }
}, [caseData?.id]);

const loadTaskStats = async () => {
  try {
    const { data } = await supabase
      .rpc('get_case_task_stats', { p_case_id: caseData.id });
    
    if (data && data.length > 0) {
      setTaskStats(data[0]);
    }
  } catch (error) {
    console.error('Error loading task stats:', error);
  }
};
```

### Onglet dans la navigation
```typescript
<button
  onClick={() => setActiveTab('tasks')}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
    activeTab === 'tasks'
      ? 'bg-legal-gold text-white'
      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
  }`}
>
  <CheckSquare size={18} />
  <span>{isAr ? 'المهام' : 'Tâches'}</span>
  {taskStats && taskStats.total > 0 && (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
      activeTab === 'tasks'
        ? 'bg-white/20'
        : 'bg-legal-gold/10 text-legal-gold'
    }`}>
      {taskStats.total}
    </span>
  )}
</button>
```

### Contenu de l'onglet
```typescript
{activeTab === 'tasks' && (
  <div className="p-6">
    <TaskList
      caseId={caseData.id}
      userId={user.id}
      language={language}
    />
  </div>
)}
```

---

## Résultat Attendu

### Navigation des Onglets
```
[Vue d'ensemble] [Documents] [Agenda] [Tâches (5)] [Facturation] [Notes]
                                         ↑
                                    Nouvel onglet
```

### Vue d'ensemble avec Widget Tâches
```
┌─────────────────────────────────┐
│ Tâches                      ✓   │
├─────────────────────────────────┤
│ Total:              10          │
│ Terminé:            5           │
│ En retard:          1           │
├─────────────────────────────────┤
│ Taux de complétion: 50%         │
│ [████████░░░░░░░░░░] 50%        │
├─────────────────────────────────┤
│ [Voir toutes les tâches]        │
└─────────────────────────────────┘
```

### Onglet Tâches
```
┌─────────────────────────────────────────────────────┐
│ Stats: Total: 10 | À faire: 3 | En cours: 2 | ...  │
├─────────────────────────────────────────────────────┤
│ Filtres: [Tous] [Urgent] [Haute]  [+ Ajouter]      │
├─────────────────────────────────────────────────────┤
│ À FAIRE (3)    │ EN COURS (2)   │ TERMINÉ (5)      │
├────────────────┼────────────────┼──────────────────┤
│ ○ Tâche 1      │ ⏱ Tâche 4     │ ✓ Tâche 7        │
│   [Urgent]     │   [Haute]      │   [Normal]       │
│   📅 Demain    │   📅 Auj.      │   ✓ Fait         │
└────────────────┴────────────────┴──────────────────┘
```

---

## Tests à Effectuer

### Après Intégration
1. ✅ Ouvrir un dossier
2. ✅ Vérifier que l'onglet "Tâches" est visible
3. ✅ Cliquer sur l'onglet "Tâches"
4. ✅ Vérifier que TaskList s'affiche correctement
5. ✅ Créer une nouvelle tâche
6. ✅ Modifier une tâche existante
7. ✅ Marquer une tâche comme terminée
8. ✅ Supprimer une tâche
9. ✅ Vérifier les statistiques dans l'overview
10. ✅ Vérifier le compteur dans l'onglet

### Responsive
1. ✅ Tester sur mobile (320px)
2. ✅ Tester sur tablette (768px)
3. ✅ Tester sur desktop (1920px)

### Bilingue
1. ✅ Tester en français
2. ✅ Tester en arabe (RTL)

---

## Dépannage

### Erreur: "Cannot find module '../tasks/TaskList'"
**Solution**: Vérifier que le fichier `components/tasks/TaskList.tsx` existe

### Erreur: "get_case_task_stats is not a function"
**Solution**: Exécuter le fichier SQL `CREER_TABLE_TASKS.sql` dans Supabase

### Les tâches ne s'affichent pas
**Solution**: 
1. Vérifier que la table `case_tasks` existe
2. Vérifier les politiques RLS
3. Vérifier que `caseId` et `userId` sont corrects

### Les statistiques ne se chargent pas
**Solution**: Vérifier que la fonction SQL `get_case_task_stats` existe

---

## Améliorations Futures (Optionnel)

### 1. Drag & Drop
Permettre de réorganiser les tâches par glisser-déposer entre les colonnes.

### 2. Assignation de Tâches
Permettre d'assigner des tâches à des collaborateurs.

### 3. Templates de Checklist
Bouton "Appliquer un template" pour créer automatiquement une checklist procédurale (divorce, vente, etc.).

### 4. Sous-tâches
Permettre de créer des sous-tâches pour décomposer les tâches complexes.

### 5. Pièces Jointes
Permettre d'attacher des documents aux tâches.

---

## Conclusion

L'intégration de TaskList dans CaseDetailView est simple et rapide:
1. Importer le composant
2. Ajouter l'onglet
3. Afficher le composant

**Temps estimé**: 30 minutes

Une fois intégré, les utilisateurs pourront gérer leurs tâches directement depuis la vue détaillée du dossier, avec une interface intuitive et des statistiques en temps réel.

---

**Date**: 5 mars 2026
**Statut**: 📋 GUIDE D'INTÉGRATION
**Difficulté**: ⭐ Facile
**Temps**: 30 minutes
