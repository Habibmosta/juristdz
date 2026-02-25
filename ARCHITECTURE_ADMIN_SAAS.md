# 🏗️ Architecture Admin SaaS - JuristDZ

## 📐 Structure des composants

```
components/
├── interfaces/
│   ├── AdminInterface.tsx (MODIFIÉ)
│   │   ├── État: activeTab ('overview' | 'organizations' | 'subscriptions')
│   │   ├── Navigation par onglets
│   │   └── Intégration des sous-composants
│   │
│   └── admin/ (NOUVEAU DOSSIER)
│       ├── index.ts
│       ├── OrganizationManagement.tsx
│       └── SubscriptionManagement.tsx
```

## 🔄 Flux de données

```
┌─────────────────────────────────────────────────────────────┐
│                     AdminInterface.tsx                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Navigation Tabs                                        │ │
│  │  [Vue d'ensemble] [Organisations] [Abonnements]        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  activeTab === 'overview'                              │ │
│  │  → Métriques système (existant)                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  activeTab === 'organizations'                         │ │
│  │  → <OrganizationManagement />                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  activeTab === 'subscriptions'                         │ │
│  │  → <SubscriptionManagement />                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📊 OrganizationManagement - Structure

```
┌─────────────────────────────────────────────────────────────┐
│  OrganizationManagement.tsx                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Header]                                                    │
│  ├── Titre: "Gestion des Organisations"                     │
│  ├── Compteur: "X organisations enregistrées"               │
│  └── Bouton: "Nouvelle Organisation"                        │
│                                                              │
│  [Filtres]                                                   │
│  ├── Recherche par nom (input)                              │
│  └── Filtre par statut (dropdown)                           │
│                                                              │
│  [Grille d'organisations] (2 colonnes sur desktop)          │
│  │                                                           │
│  │  ┌─────────────────────────────────────────────┐        │
│  │  │  Organisation Card                           │        │
│  │  ├─────────────────────────────────────────────┤        │
│  │  │  • Nom                                       │        │
│  │  │  • Type (badge)                              │        │
│  │  │  • Statut (badge coloré)                     │        │
│  │  │  • Plan (badge bleu)                         │        │
│  │  │                                              │        │
│  │  │  [Métriques d'usage]                         │        │
│  │  │  ├── Utilisateurs: [████░░] 4/5              │        │
│  │  │  ├── Dossiers:     [██████] 185/200          │        │
│  │  │  └── Stockage:     [███░░░] 7.5/10 GB        │        │
│  │  │                                              │        │
│  │  │  [Footer]                                    │        │
│  │  │  ├── Date création                           │        │
│  │  │  └── Date expiration (si trial)              │        │
│  │  │                                              │        │
│  │  │  [Actions] [👁️] [✏️] [🗑️]                   │        │
│  │  └─────────────────────────────────────────────┘        │
│  │                                                           │
│  └───────────────────────────────────────────────────────── │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 💳 SubscriptionManagement - Structure

```
┌─────────────────────────────────────────────────────────────┐
│  SubscriptionManagement.tsx                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Header]                                                    │
│  ├── Titre: "Gestion des Abonnements"                       │
│  ├── Compteur: "X plans disponibles"                        │
│  └── Bouton: "Nouveau Plan"                                 │
│                                                              │
│  [Statistiques financières] (4 cartes)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   MRR    │ │  Actifs  │ │  Trials  │ │   ARR    │      │
│  │ 42,700   │ │    3     │ │    2     │ │ 512,400  │      │
│  │   DZD    │ │  clients │ │  essais  │ │   DZD    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                              │
│  [Grille de plans] (3 colonnes sur desktop)                 │
│  │                                                           │
│  │  ┌─────────────────────────────────────────────┐        │
│  │  │  Plan Card                                   │        │
│  │  ├─────────────────────────────────────────────┤        │
│  │  │  • Nom du plan                               │        │
│  │  │  • Badge "Populaire" (si applicable)         │        │
│  │  │  • Description                               │        │
│  │  │                                              │        │
│  │  │  [Tarification]                              │        │
│  │  │  ├── 9,900 DZD / mois                        │        │
│  │  │  └── ou 99,000 DZD / an (Économisez 17%)    │        │
│  │  │                                              │        │
│  │  │  [Limites]                                   │        │
│  │  │  ├── Utilisateurs: 5                         │        │
│  │  │  ├── Dossiers: 200                           │        │
│  │  │  └── Stockage: 10 GB                         │        │
│  │  │                                              │        │
│  │  │  [Features]                                  │        │
│  │  │  ├── ✓ Assistant IA                          │        │
│  │  │  ├── ✓ Templates avancés                     │        │
│  │  │  ├── ✓ Collaboration                         │        │
│  │  │  └── ✓ Accès API                             │        │
│  │  │                                              │        │
│  │  │  [Footer]                                    │        │
│  │  │  ├── Abonnés: 2                              │        │
│  │  │  └── Statut: Actif                           │        │
│  │  │                                              │        │
│  │  │  [Actions] [✏️] [🗑️]                         │        │
│  │  └─────────────────────────────────────────────┘        │
│  │                                                           │
│  └───────────────────────────────────────────────────────── │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Schéma de base de données

```
┌─────────────────────────────────────────────────────────────┐
│                    subscription_plans                        │
├─────────────────────────────────────────────────────────────┤
│  id (UUID)                                                   │
│  name (VARCHAR)                                              │
│  display_name (VARCHAR)                                      │
│  description (TEXT)                                          │
│  monthly_price (DECIMAL)                                     │
│  yearly_price (DECIMAL)                                      │
│  max_users (INTEGER)                                         │
│  max_cases (INTEGER)                                         │
│  max_storage_gb (INTEGER)                                    │
│  features (JSONB)                                            │
│  is_active (BOOLEAN)                                         │
│  is_popular (BOOLEAN)                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      organizations                           │
├─────────────────────────────────────────────────────────────┤
│  id (UUID)                                                   │
│  name (VARCHAR)                                              │
│  type (VARCHAR)                                              │
│  subscription_plan_id (UUID) → subscription_plans.id        │
│  subscription_status (VARCHAR)                               │
│  trial_ends_at (TIMESTAMP)                                   │
│  current_users (INTEGER)                                     │
│  current_cases (INTEGER)                                     │
│  current_storage_mb (INTEGER)                                │
│  current_documents (INTEGER)                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   subscription_history                       │
├─────────────────────────────────────────────────────────────┤
│  id (UUID)                                                   │
│  organization_id (UUID) → organizations.id                  │
│  subscription_plan_id (UUID) → subscription_plans.id        │
│  period_start (TIMESTAMP)                                    │
│  period_end (TIMESTAMP)                                      │
│  amount (DECIMAL)                                            │
│  payment_status (VARCHAR)                                    │
│  invoice_number (VARCHAR)                                    │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flux de requêtes Supabase

### OrganizationManagement

```typescript
// 1. Chargement des organisations
const { data } = await supabase
  .from('organizations')
  .select(`
    *,
    subscription_plans (
      name,
      max_users,
      max_cases,
      max_storage_gb
    )
  `)
  .order('created_at', { ascending: false });

// 2. Filtrage côté client
const filtered = data.filter(org => {
  const matchesSearch = org.name.includes(searchTerm);
  const matchesStatus = filterStatus === 'all' || 
                        org.subscription_status === filterStatus;
  return matchesSearch && matchesStatus;
});

// 3. Calcul des pourcentages d'usage
const usersPercent = (org.current_users / org.max_users) * 100;
const casesPercent = (org.current_cases / org.max_cases) * 100;
const storagePercent = (org.current_storage_mb / (org.max_storage_gb * 1024)) * 100;
```

### SubscriptionManagement

```typescript
// 1. Chargement des plans
const { data: plans } = await supabase
  .from('subscription_plans')
  .select('*')
  .order('sort_order', { ascending: true });

// 2. Comptage des abonnés par plan
for (const plan of plans) {
  const { count } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_plan_id', plan.id)
    .eq('subscription_status', 'active');
  
  plan.subscriber_count = count;
}

// 3. Calcul du MRR
const { data: activeOrgs } = await supabase
  .from('organizations')
  .select(`subscription_plans (monthly_price)`)
  .eq('subscription_status', 'active');

const mrr = activeOrgs.reduce((sum, org) => 
  sum + org.subscription_plans.monthly_price, 0
);
```

## 🎨 Système de couleurs

### Statuts d'organisation
```
active     → bg-green-100  text-green-700  (Vert)
trial      → bg-blue-100   text-blue-700   (Bleu)
past_due   → bg-amber-100  text-amber-700  (Orange)
cancelled  → bg-red-100    text-red-700    (Rouge)
suspended  → bg-slate-100  text-slate-700  (Gris)
```

### Barres de progression
```
< 70%      → bg-green-500  (Vert)
70-90%     → bg-amber-500  (Orange)
> 90%      → bg-red-500    (Rouge)
```

### Statistiques financières
```
MRR        → bg-green-50   border-green-200  (Vert)
Actifs     → bg-blue-50    border-blue-200   (Bleu)
Trials     → bg-amber-50   border-amber-200  (Orange)
ARR        → bg-purple-50  border-purple-200 (Violet)
```

## 📱 Responsive Breakpoints

```
Mobile:    < 768px   → 1 colonne
Tablet:    768-1024px → 2 colonnes
Desktop:   > 1024px   → 2-3 colonnes

Navigation tabs:
Mobile:    Stacked vertically
Desktop:   Horizontal row
```

## 🌐 Support multilingue

```typescript
interface Translations {
  fr: {
    organizations: "Organisations",
    subscriptions: "Abonnements",
    active: "Actif",
    trial: "Essai",
    // ...
  },
  ar: {
    organizations: "المنظمات",
    subscriptions: "الاشتراكات",
    active: "نشط",
    trial: "تجريبي",
    // ...
  }
}

// Direction du texte
dir={language === 'ar' ? 'rtl' : 'ltr'}
```

## 🔐 Sécurité (à implémenter)

### Row Level Security (RLS)

```sql
-- Organizations: Accès uniquement à sa propre organisation
CREATE POLICY "org_isolation"
ON organizations FOR SELECT
USING (
  id = (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Admin: Accès à toutes les organisations
CREATE POLICY "admin_full_access"
ON organizations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

## 📊 Métriques calculées

### Financières
```typescript
// MRR (Monthly Recurring Revenue)
MRR = Σ(monthly_price) WHERE subscription_status = 'active'

// ARR (Annual Recurring Revenue)
ARR = MRR × 12

// Économie annuelle
savings = (1 - (yearly_price / (monthly_price × 12))) × 100
```

### Usage
```typescript
// Pourcentage d'usage
usage_percent = (current / max) × 100

// Couleur de la barre
color = usage_percent < 70 ? 'green' :
        usage_percent < 90 ? 'amber' : 'red'
```

## 🚀 Performance

### Optimisations implémentées
- ✅ Chargement unique au montage
- ✅ Filtrage côté client (pas de requête à chaque frappe)
- ✅ Jointures SQL optimisées
- ✅ Comptage avec `count: 'exact', head: true`

### Optimisations futures
- ⏳ Pagination pour grandes listes
- ⏳ Cache des requêtes fréquentes
- ⏳ Lazy loading des images
- ⏳ Virtualisation des listes longues

## 📝 Notes d'implémentation

1. **Supabase Client:** Créé localement dans chaque composant
2. **État local:** `useState` pour les données et filtres
3. **Effets:** `useEffect` pour le chargement initial
4. **Props:** `language` et `theme` passés depuis AdminInterface
5. **Types:** Interfaces TypeScript pour toutes les données
6. **Erreurs:** Gestion avec try/catch et console.error

## 🎯 Points d'extension

### Facile à ajouter:
- Pagination
- Tri des colonnes
- Export CSV/PDF
- Graphiques d'évolution
- Notifications en temps réel

### Nécessite plus de travail:
- Édition inline
- Drag & drop
- Webhooks
- Intégration paiement
- Audit logs

---

**Cette architecture est conçue pour être:**
- ✅ Modulaire (composants indépendants)
- ✅ Scalable (supporte des milliers d'organisations)
- ✅ Maintenable (code clair et documenté)
- ✅ Extensible (facile d'ajouter des fonctionnalités)
- ✅ Sécurisée (isolation multi-tenant)
