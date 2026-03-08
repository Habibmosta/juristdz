# 🧪 GUIDE DE TEST - SYSTÈME DE LIMITES D'UTILISATION

## 📅 Date: 8 Mars 2026

Ce guide vous permet de tester tous les cas de figures du système de limites en moins de 15 minutes.

---

## 🎯 PRÉREQUIS

1. ✅ Migrations SQL exécutées dans Supabase
2. ✅ Application démarrée en local
3. ✅ Compte utilisateur de test créé
4. ✅ Accès au SQL Editor de Supabase

---

## 📋 SCÉNARIOS DE TEST

### SCÉNARIO 1: Utilisateur avec Crédits Suffisants ✅

**Objectif**: Vérifier que l'utilisateur peut utiliser l'application normalement

#### Étape 1: Préparer les données
```sql
-- Dans Supabase SQL Editor
UPDATE subscriptions 
SET 
  credits_remaining = 50,
  plan = 'free',
  expires_at = NOW() + INTERVAL '30 days'
WHERE user_id = 'VOTRE_USER_ID';

UPDATE usage_stats 
SET 
  credits_used_today = 0,
  credits_used_this_month = 0
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester ChatInterface (Recherche)
1. Ouvrir l'application
2. Aller dans "Recherche Juridique"
3. Taper une question: "Quelles sont les conditions du divorce en Algérie?"
4. Cliquer sur "Envoyer"

**✅ Résultat attendu**:
- Aucun modal ne s'affiche
- La recherche s'exécute normalement
- La réponse s'affiche
- Console affiche:
  ```
  🔍 Vérification des limites pour recherche juridique...
  ✅ Limites OK, envoi du message...
  💰 Déduction de 1 crédit pour recherche...
  ✅ Crédit déduit avec succès
  ```

#### Étape 3: Vérifier la déduction
```sql
SELECT credits_remaining, credits_used_today 
FROM v_usage_overview 
WHERE user_id = 'VOTRE_USER_ID';
```

**✅ Résultat attendu**:
- `credits_remaining` = 49 (50 - 1)
- `credits_used_today` = 1

---

### SCÉNARIO 2: Crédits Épuisés (Blocage Total) 🚫

**Objectif**: Vérifier que l'utilisateur est bloqué quand il n'a plus de crédits

#### Étape 1: Épuiser les crédits
```sql
UPDATE subscriptions 
SET credits_remaining = 0
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester ChatInterface
1. Aller dans "Recherche Juridique"
2. Taper une question
3. Cliquer sur "Envoyer"

**✅ Résultat attendu**:
- ❌ Modal de blocage s'affiche immédiatement
- Titre: "Limite Atteinte" (FR) ou "تم الوصول إلى الحد الأقصى" (AR)
- Message: "Vous avez épuisé tous vos crédits..."
- Barre de progression: 0/50 (100%)
- Bouton "Passer au Plan Pro" visible
- Console affiche:
  ```
  🔍 Vérification des limites pour recherche juridique...
  ❌ Action bloquée par les limites
  ```
- La recherche ne s'exécute PAS

#### Étape 3: Tester DraftingInterface
1. Aller dans "Rédaction"
2. Sélectionner un template
3. Remplir le formulaire
4. Cliquer sur "Générer le Document"

**✅ Résultat attendu**:
- ❌ Modal de blocage s'affiche
- Message adapté pour la rédaction
- Le document ne se génère PAS

#### Étape 4: Tester AnalysisInterface
1. Aller dans "Analyse"
2. Coller un texte juridique
3. Cliquer sur "Lancer l'Audit"

**✅ Résultat attendu**:
- ❌ Modal de blocage s'affiche
- Message adapté pour l'analyse
- L'analyse ne s'exécute PAS

---

### SCÉNARIO 3: Quota Journalier Dépassé (Plan Free) 📊

**Objectif**: Vérifier que le quota journalier de 10 crédits est respecté

#### Étape 1: Simuler quota dépassé
```sql
UPDATE subscriptions 
SET 
  credits_remaining = 50,
  plan = 'free'
WHERE user_id = 'VOTRE_USER_ID';

UPDATE usage_stats 
SET credits_used_today = 10
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester une action
1. Aller dans "Recherche Juridique"
2. Taper une question
3. Cliquer sur "Envoyer"

**✅ Résultat attendu**:
- ❌ Modal de blocage s'affiche
- Message: "Vous avez atteint votre quota journalier de 10 crédits..."
- Barre de progression: 10/10 (100%)
- Suggestion: "Revenez demain ou passez au Plan Pro"
- L'action ne s'exécute PAS

---

### SCÉNARIO 4: Quota Mensuel Dépassé (Plan Pro) 📅

**Objectif**: Vérifier que le quota mensuel de 500 crédits est respecté

#### Étape 1: Simuler quota mensuel dépassé
```sql
UPDATE subscriptions 
SET 
  credits_remaining = 50,
  plan = 'pro'
WHERE user_id = 'VOTRE_USER_ID';

UPDATE usage_stats 
SET credits_used_this_month = 500
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester une action
1. Effectuer une recherche

**✅ Résultat attendu**:
- ❌ Modal de blocage s'affiche
- Message: "Vous avez atteint votre quota mensuel de 500 crédits..."
- Barre de progression: 500/500 (100%)
- Suggestion: "Attendez le prochain cycle ou passez au Plan Cabinet"

---

### SCÉNARIO 5: Abonnement Expiré ⏰

**Objectif**: Vérifier que les utilisateurs avec abonnement expiré sont bloqués

#### Étape 1: Expirer l'abonnement
```sql
UPDATE subscriptions 
SET 
  credits_remaining = 50,
  expires_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester une action
1. Effectuer une recherche

**✅ Résultat attendu**:
- ❌ Modal de blocage s'affiche
- Icône: Horloge (Clock)
- Message: "Votre abonnement a expiré le [date]..."
- Bouton "Renouveler l'Abonnement"
- L'action ne s'exécute PAS

---

### SCÉNARIO 6: Avertissement - Proche de la Limite (80%) ⚠️

**Objectif**: Vérifier que l'utilisateur reçoit un avertissement à 80%

#### Étape 1: Simuler 80% d'utilisation
```sql
UPDATE subscriptions 
SET credits_remaining = 10
WHERE user_id = 'VOTRE_USER_ID';

UPDATE usage_stats 
SET credits_used_today = 0
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester une action
1. Effectuer une recherche

**✅ Résultat attendu**:
- ⚠️ Modal d'avertissement s'affiche
- Statut: WARNING (jaune)
- Message: "Attention, il vous reste seulement 10 crédits..."
- Barre de progression: 40/50 (80%)
- Bouton "Continuer" ET "Voir les Plans"
- L'action s'exécute APRÈS fermeture du modal

---

### SCÉNARIO 7: Avertissement Critique (95%) 🔴

**Objectif**: Vérifier l'avertissement critique à 95%

#### Étape 1: Simuler 95% d'utilisation
```sql
UPDATE subscriptions 
SET credits_remaining = 2
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester une action
1. Effectuer une recherche

**✅ Résultat attendu**:
- 🔴 Modal d'avertissement critique s'affiche
- Statut: CRITICAL (orange)
- Message: "Alerte! Il ne vous reste que 2 crédits..."
- Barre de progression: 48/50 (96%)
- Suggestion forte d'upgrade
- L'action s'exécute APRÈS fermeture du modal

---

### SCÉNARIO 8: Stockage Plein (Plan Free) 💾

**Objectif**: Vérifier la limite de stockage de 1 GB

#### Étape 1: Simuler stockage plein
```sql
UPDATE usage_stats 
SET storage_used_gb = 1.0
WHERE user_id = 'VOTRE_USER_ID';

UPDATE subscriptions 
SET plan = 'free'
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester un upload
1. Aller dans une interface avec upload de fichier
2. Essayer d'uploader un document

**✅ Résultat attendu**:
- ❌ Modal de blocage s'affiche
- Icône: Database
- Message: "Vous avez atteint votre limite de stockage de 1 GB..."
- Barre de progression: 1.0/1.0 GB (100%)
- L'upload ne s'exécute PAS

---

### SCÉNARIO 9: Appels API Dépassés 🔌

**Objectif**: Vérifier la limite d'appels API

#### Étape 1: Simuler limite API atteinte
```sql
UPDATE usage_stats 
SET api_calls_today = 1000
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester une action
1. Effectuer une recherche

**✅ Résultat attendu**:
- ❌ Modal de blocage s'affiche
- Icône: Zap
- Message: "Vous avez atteint votre limite d'appels API..."
- L'action ne s'exécute PAS

---

### SCÉNARIO 10: Plan Cabinet (Illimité) ♾️

**Objectif**: Vérifier que le plan Cabinet n'a pas de limites

#### Étape 1: Passer en plan Cabinet
```sql
UPDATE subscriptions 
SET 
  plan = 'cabinet',
  credits_remaining = 999999,
  expires_at = NOW() + INTERVAL '365 days'
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester plusieurs actions
1. Effectuer 20 recherches consécutives
2. Générer 10 documents
3. Analyser 5 contrats

**✅ Résultat attendu**:
- ✅ Aucun modal ne s'affiche jamais
- Toutes les actions s'exécutent normalement
- Les crédits ne diminuent pas (ou très peu)
- Aucune limite journalière/mensuelle

---

### SCÉNARIO 11: Changement de Langue du Modal 🌐

**Objectif**: Vérifier que le modal s'affiche correctement en arabe

#### Étape 1: Épuiser les crédits
```sql
UPDATE subscriptions 
SET credits_remaining = 0
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Changer la langue en arabe
1. Cliquer sur le sélecteur de langue
2. Choisir "العربية"

#### Étape 3: Tester une action
1. Effectuer une recherche

**✅ Résultat attendu**:
- Modal s'affiche en arabe (RTL)
- Titre: "تم الوصول إلى الحد الأقصى"
- Message en arabe
- Boutons en arabe
- Mise en page RTL correcte

---

### SCÉNARIO 12: Navigation vers Billing 💳

**Objectif**: Vérifier la redirection vers la page de facturation

#### Étape 1: Épuiser les crédits
```sql
UPDATE subscriptions 
SET credits_remaining = 0
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester la navigation
1. Effectuer une recherche
2. Modal s'affiche
3. Cliquer sur "Passer au Plan Pro"

**✅ Résultat attendu**:
- Redirection vers `/billing`
- Page de facturation s'affiche (ou erreur 404 si pas encore créée)

---

### SCÉNARIO 13: Fermeture du Modal ❌

**Objectif**: Vérifier que le modal se ferme correctement

#### Étape 1: Afficher le modal
```sql
UPDATE subscriptions 
SET credits_remaining = 0
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Tester la fermeture
1. Effectuer une recherche
2. Modal s'affiche
3. Cliquer sur le bouton "Fermer" (X en haut à droite)

**✅ Résultat attendu**:
- Modal se ferme
- Retour à l'interface normale
- Aucune action n'a été exécutée

---

### SCÉNARIO 14: Déduction Progressive des Crédits 📉

**Objectif**: Vérifier que les crédits diminuent correctement

#### Étape 1: Réinitialiser les crédits
```sql
UPDATE subscriptions 
SET credits_remaining = 10
WHERE user_id = 'VOTRE_USER_ID';

UPDATE usage_stats 
SET 
  credits_used_today = 0,
  credits_used_this_month = 0
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Effectuer plusieurs actions
1. **Recherche** (coût: 1 crédit)
   - Vérifier: `credits_remaining` = 9
2. **Rédaction** (coût: 2 crédits)
   - Vérifier: `credits_remaining` = 7
3. **Analyse** (coût: 3 crédits)
   - Vérifier: `credits_remaining` = 4
4. **Recherche** (coût: 1 crédit)
   - Vérifier: `credits_remaining` = 3

#### Étape 3: Vérifier dans la base
```sql
SELECT 
  credits_remaining,
  credits_used_today,
  credits_used_this_month
FROM v_usage_overview 
WHERE user_id = 'VOTRE_USER_ID';
```

**✅ Résultat attendu**:
- `credits_remaining` = 3
- `credits_used_today` = 7
- `credits_used_this_month` = 7

---

### SCÉNARIO 15: Réinitialisation Quotidienne (CRON) 🔄

**Objectif**: Vérifier que les compteurs journaliers se réinitialisent

#### Étape 1: Simuler usage d'hier
```sql
UPDATE usage_stats 
SET 
  credits_used_today = 10,
  last_reset_date = CURRENT_DATE - INTERVAL '1 day'
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Déclencher la réinitialisation manuellement
```sql
-- Appeler la fonction de reset
SELECT reset_daily_usage();
```

#### Étape 3: Vérifier le résultat
```sql
SELECT 
  credits_used_today,
  last_reset_date
FROM usage_stats 
WHERE user_id = 'VOTRE_USER_ID';
```

**✅ Résultat attendu**:
- `credits_used_today` = 0
- `last_reset_date` = CURRENT_DATE

---

### SCÉNARIO 16: Réinitialisation Mensuelle (CRON) 📆

**Objectif**: Vérifier que les compteurs mensuels se réinitialisent

#### Étape 1: Simuler usage du mois dernier
```sql
UPDATE usage_stats 
SET 
  credits_used_this_month = 500,
  last_monthly_reset = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
WHERE user_id = 'VOTRE_USER_ID';
```

#### Étape 2: Déclencher la réinitialisation
```sql
SELECT reset_monthly_usage();
```

#### Étape 3: Vérifier le résultat
```sql
SELECT 
  credits_used_this_month,
  last_monthly_reset
FROM usage_stats 
WHERE user_id = 'VOTRE_USER_ID';
```

**✅ Résultat attendu**:
- `credits_used_this_month` = 0
- `last_monthly_reset` = DATE_TRUNC('month', CURRENT_DATE)

---

## 🔍 TESTS DE PERFORMANCE

### Test 1: Temps de Vérification
**Objectif**: Vérifier que la vérification est rapide (< 500ms)

```javascript
// Dans la console du navigateur
console.time('checkLimits');
// Effectuer une action
console.timeEnd('checkLimits');
```

**✅ Résultat attendu**: < 500ms

---

### Test 2: Vérifications Concurrentes
**Objectif**: Vérifier que plusieurs vérifications simultanées fonctionnent

1. Ouvrir 3 onglets de l'application
2. Effectuer une action dans chaque onglet en même temps
3. Vérifier que toutes les actions sont traitées correctement

**✅ Résultat attendu**: Aucune erreur, toutes les actions réussies

---

## 📊 TABLEAU RÉCAPITULATIF DES TESTS

| # | Scénario | Interface | Résultat Attendu | Statut |
|---|----------|-----------|------------------|--------|
| 1 | Crédits suffisants | Toutes | Action réussie | ⬜ |
| 2 | Crédits épuisés | Toutes | Modal blocage | ⬜ |
| 3 | Quota journalier | Chat | Modal blocage | ⬜ |
| 4 | Quota mensuel | Drafting | Modal blocage | ⬜ |
| 5 | Abonnement expiré | Analysis | Modal blocage | ⬜ |
| 6 | Avertissement 80% | Chat | Modal warning | ⬜ |
| 7 | Avertissement 95% | Drafting | Modal critical | ⬜ |
| 8 | Stockage plein | Upload | Modal blocage | ⬜ |
| 9 | API dépassée | Toutes | Modal blocage | ⬜ |
| 10 | Plan Cabinet | Toutes | Aucune limite | ⬜ |
| 11 | Modal en arabe | Toutes | Texte AR + RTL | ⬜ |
| 12 | Navigation billing | Toutes | Redirect /billing | ⬜ |
| 13 | Fermeture modal | Toutes | Modal fermé | ⬜ |
| 14 | Déduction crédits | Toutes | Crédits -1/-2/-3 | ⬜ |
| 15 | Reset quotidien | CRON | Compteurs à 0 | ⬜ |
| 16 | Reset mensuel | CRON | Compteurs à 0 | ⬜ |

---

## 🛠️ SCRIPTS SQL UTILES

### Réinitialiser un utilisateur de test
```sql
-- Remettre à zéro pour un nouveau test
UPDATE subscriptions 
SET 
  credits_remaining = 50,
  plan = 'free',
  expires_at = NOW() + INTERVAL '30 days'
WHERE user_id = 'VOTRE_USER_ID';

UPDATE usage_stats 
SET 
  credits_used_today = 0,
  credits_used_this_month = 0,
  storage_used_gb = 0,
  api_calls_today = 0
WHERE user_id = 'VOTRE_USER_ID';
```

---

### Voir l'état actuel d'un utilisateur
```sql
SELECT * FROM v_usage_overview WHERE user_id = 'VOTRE_USER_ID';
```

---

### Voir tous les utilisateurs proches des limites
```sql
SELECT * FROM v_users_near_limits;
```

---

### Historique des déductions
```sql
SELECT 
  created_at,
  credits_remaining,
  credits_used_today,
  credits_used_this_month
FROM subscriptions 
WHERE user_id = 'VOTRE_USER_ID'
ORDER BY created_at DESC;
```

---

## 🐛 DÉBOGAGE

### Problème: Modal ne s'affiche pas

**Vérifications**:
1. Vérifier que `showLimitModal` est `true` dans React DevTools
2. Vérifier que `limitResult` n'est pas `null`
3. Vérifier la console pour les erreurs
4. Vérifier que le composant `<LimitReachedModal />` est bien dans le JSX

---

### Problème: Crédits ne se déduisent pas

**Vérifications**:
1. Vérifier que `deductCredits()` est appelé APRÈS succès
2. Vérifier les logs dans la console
3. Vérifier la fonction `deduct_credits()` dans Supabase
4. Vérifier les permissions RLS

---

### Problème: Vérification trop lente

**Solutions**:
1. Ajouter un index sur `user_id` dans `subscriptions`
2. Ajouter un index sur `user_id` dans `usage_stats`
3. Optimiser les requêtes SQL
4. Ajouter du cache côté client

---

## ✅ CHECKLIST DE VALIDATION FINALE

Avant de déployer en production, vérifier:

- [ ] Tous les 16 scénarios testés et validés
- [ ] Modal s'affiche correctement en FR et AR
- [ ] Navigation vers `/billing` fonctionne
- [ ] Déduction des crédits correcte (1/2/3)
- [ ] Aucune erreur dans la console
- [ ] Temps de vérification < 500ms
- [ ] CRON jobs configurés dans Supabase
- [ ] RLS activé sur toutes les tables
- [ ] Logs de débogage fonctionnels
- [ ] Tests de performance OK
- [ ] Documentation à jour

---

## 📞 SUPPORT

En cas de problème lors des tests:

1. Vérifier les logs dans la console navigateur
2. Vérifier les logs dans Supabase (Logs & Analytics)
3. Consulter `GESTION_LIMITES_UTILISATION.md`
4. Consulter `GUIDE_INTEGRATION_RAPIDE_LIMITES.md`

---

**Date de création**: 8 Mars 2026
**Version**: 1.0
**Durée estimée des tests**: 15-20 minutes
**Niveau**: ⭐⭐⭐ (Intermédiaire)
