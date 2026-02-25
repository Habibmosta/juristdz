# Guide de Test - Interface Admin SaaS

## 🎯 Objectif
Tester les nouvelles fonctionnalités de gestion des organisations et abonnements dans l'interface Admin.

## 📋 Prérequis

1. **Serveur démarré:**
   ```bash
   yarn dev
   ```
   Serveur sur: http://localhost:5174/

2. **Base de données Supabase:**
   - URL: https://fcteljnmcdelbratudnc.supabase.co
   - Migrations exécutées (saas-complete-schema.sql)

3. **Données de test:**
   Les plans d'abonnement sont déjà insérés via le schéma SQL:
   - Starter (2,900 DZD/mois)
   - Professional (9,900 DZD/mois)
   - Enterprise (29,900 DZD/mois)

## 🧪 Tests à effectuer

### 1. Accéder à l'interface Admin

**Étapes:**
1. Ouvrir l'application: http://localhost:5174/
2. Se connecter avec un compte Admin
3. Utiliser le RoleSwitcher (sidebar) pour passer en mode "Admin"
4. Vérifier que l'interface Admin s'affiche

**Résultat attendu:**
- Interface Admin avec 3 onglets visibles:
  - Vue d'ensemble
  - Organisations
  - Abonnements

### 2. Tester l'onglet "Vue d'ensemble"

**Étapes:**
1. Cliquer sur l'onglet "Vue d'ensemble"
2. Observer les métriques système

**Résultat attendu:**
- 4 cartes de statistiques:
  - Utilisateurs Total
  - Requêtes/Jour
  - Uptime Système
  - Alertes Actives
- Section "Alertes Système" avec liste des alertes
- Section "Gestion Utilisateurs" avec liste des utilisateurs
- Section "Métriques Système" (sidebar)
- Section "Actions Rapides" (sidebar)
- Section "État du Système" (sidebar)

### 3. Tester l'onglet "Organisations"

**Étapes:**
1. Cliquer sur l'onglet "Organisations"
2. Observer la liste des organisations

**Résultat attendu:**
- Titre: "Gestion des Organisations"
- Bouton "Nouvelle Organisation" (rouge)
- Barre de recherche fonctionnelle
- Filtre par statut (dropdown)
- Grille d'organisations (2 colonnes sur desktop)
- Chaque carte d'organisation affiche:
  - Nom de l'organisation
  - Type (Cabinet Avocat, Étude Notaire, etc.)
  - Statut (badge coloré: actif, trial, etc.)
  - Plan d'abonnement (badge bleu)
  - 3 barres de progression:
    - Utilisateurs (current/max)
    - Dossiers (current/max)
    - Stockage (current/max)
  - Date de création
  - Date d'expiration (si trial)
  - Boutons d'action: Voir, Éditer, Supprimer

**Tests de filtrage:**
- Taper dans la recherche → Les organisations se filtrent
- Changer le filtre de statut → Les organisations se filtrent

**Couleurs des barres de progression:**
- Vert: < 70% d'usage
- Orange: 70-90% d'usage
- Rouge: > 90% d'usage

### 4. Tester l'onglet "Abonnements"

**Étapes:**
1. Cliquer sur l'onglet "Abonnements"
2. Observer les plans et statistiques

**Résultat attendu:**
- Titre: "Gestion des Abonnements"
- Bouton "Nouveau Plan" (rouge)
- 4 cartes de statistiques financières:
  - MRR (Monthly Recurring Revenue) - vert
  - Abonnements Actifs - bleu
  - Essais Gratuits - orange
  - ARR (Annual Recurring Revenue) - violet
- Grille de plans d'abonnement (3 colonnes)
- Chaque carte de plan affiche:
  - Nom du plan
  - Badge "Populaire" (si applicable)
  - Description
  - Prix mensuel (grand)
  - Prix annuel avec % d'économie
  - Limites:
    - Utilisateurs
    - Dossiers
    - Stockage
  - Features (liste avec checkmarks)
  - Nombre d'abonnés
  - Statut (Actif/Inactif)
  - Boutons: Éditer, Supprimer

**Vérifications:**
- Les 3 plans sont affichés (Starter, Professional, Enterprise)
- Les prix sont formatés en DZD
- Le calcul d'économie annuelle est correct
- Le nombre d'abonnés par plan est affiché

### 5. Tester le support bilingue

**Étapes:**
1. Changer la langue de l'interface (FR ↔ AR)
2. Naviguer entre les onglets

**Résultat attendu:**
- Tous les textes sont traduits
- La direction du texte change (LTR pour FR, RTL pour AR)
- Les labels des statuts sont traduits
- Les labels des types d'organisation sont traduits

### 6. Tester la réactivité (responsive)

**Étapes:**
1. Redimensionner la fenêtre du navigateur
2. Tester sur mobile (DevTools)

**Résultat attendu:**
- Sur desktop: Grilles en 2-3 colonnes
- Sur mobile: Grilles en 1 colonne
- Les boutons s'adaptent
- Le texte reste lisible
- Pas de débordement horizontal

## 🐛 Problèmes potentiels et solutions

### Problème: "Aucune organisation trouvée"
**Cause:** Pas de données dans la table `organizations`
**Solution:** Insérer des données de test via Supabase SQL Editor:

```sql
-- Insérer un plan de test
INSERT INTO subscription_plans (name, display_name, description, monthly_price, yearly_price, max_users, max_cases, max_storage_gb)
VALUES ('starter', 'Starter', 'Plan de démarrage', 2900, 29000, 1, 50, 2)
ON CONFLICT (name) DO NOTHING;

-- Insérer une organisation de test
INSERT INTO organizations (
  name, 
  type, 
  subscription_plan_id, 
  subscription_status,
  current_users,
  current_cases,
  current_storage_mb
)
SELECT 
  'Cabinet Test',
  'cabinet_avocat',
  id,
  'trial',
  1,
  5,
  512
FROM subscription_plans 
WHERE name = 'starter'
LIMIT 1;
```

### Problème: Erreur de connexion Supabase
**Cause:** Variables d'environnement manquantes
**Solution:** Vérifier `.env.local`:
```
VITE_SUPABASE_URL=https://fcteljnmcdelbratudnc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Problème: Statistiques à 0
**Cause:** Pas d'organisations avec statut 'active'
**Solution:** Mettre à jour le statut d'une organisation:
```sql
UPDATE organizations 
SET subscription_status = 'active'
WHERE id = 'votre-org-id';
```

## ✅ Checklist de validation

- [ ] Interface Admin accessible via RoleSwitcher
- [ ] 3 onglets visibles et cliquables
- [ ] Onglet "Vue d'ensemble" affiche les métriques
- [ ] Onglet "Organisations" affiche la liste
- [ ] Filtres de recherche fonctionnels
- [ ] Barres de progression colorées selon l'usage
- [ ] Onglet "Abonnements" affiche les plans
- [ ] Statistiques financières calculées (MRR, ARR)
- [ ] Support bilingue FR/AR fonctionnel
- [ ] Interface responsive (desktop + mobile)
- [ ] Pas d'erreurs dans la console
- [ ] Pas d'erreurs TypeScript

## 📊 Données de test recommandées

Pour tester efficacement, créer:
- 3-5 organisations avec différents statuts (active, trial, past_due)
- Organisations avec différents niveaux d'usage (< 70%, 70-90%, > 90%)
- Au moins une organisation par type (cabinet_avocat, etude_notaire, etc.)
- Organisations sur différents plans (Starter, Professional, Enterprise)

## 🎯 Prochaine étape après validation

Une fois les tests validés, passer à la création du processus d'inscription automatique (SignupFlow.tsx) pour permettre aux nouveaux clients de s'inscrire sans intervention manuelle.

## 📞 Support

En cas de problème:
1. Vérifier la console du navigateur (F12)
2. Vérifier les logs Supabase
3. Vérifier que les migrations sont bien exécutées
4. Vérifier les variables d'environnement
