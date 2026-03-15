# 🎮 EXEMPLES DE TESTS MANUELS - INTERFACE UTILISATEUR

## 📅 Date: 8 Mars 2026

Guide pratique pour tester le système de limites directement dans l'interface utilisateur.

---

## 🎯 PRÉPARATION

### 1. Obtenir votre User ID

```javascript
// Dans la console du navigateur (F12)
console.log('Mon User ID:', localStorage.getItem('user_id'));
// Ou si vous utilisez Supabase Auth:
console.log('Mon User ID:', (await supabase.auth.getUser()).data.user?.id);
```

### 2. Ouvrir Supabase SQL Editor

1. Aller sur https://supabase.com
2. Sélectionner votre projet
3. Cliquer sur "SQL Editor" dans le menu gauche
4. Créer une nouvelle requête

---

## 🧪 TEST 1: Crédits Épuisés - Recherche Bloquée

### Étape 1: Préparer les données
```sql
-- Remplacer 'VOTRE_USER_ID' par votre vrai user_id
UPDATE subscriptions 
SET credits_remaining = 0 
WHERE user_id = 'VOTRE_USER_ID';
```

### Étape 2: Tester dans l'interface
1. Aller sur l'application
2. Cliquer sur "Recherche Juridique"
3. Taper: "Quelles sont les conditions du divorce en Algérie?"
4. Cliquer sur "Envoyer"

### ✅ Résultat Attendu:
```
┌─────────────────────────────────────────┐
│  🚫 LIMITE ATTEINTE                     │
├─────────────────────────────────────────┤
│                                         │
│  💳 Vous avez épuisé tous vos crédits  │
│                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 0/50 (100%)      │
│                                         │
│  📊 Avantages du Plan Pro:              │
│  ✓ 500 crédits mensuels                │
│  ✓ 100 requêtes par jour               │
│  ✓ 10 GB de stockage                   │
│                                         │
│  [Fermer]  [Passer au Plan Pro]        │
└─────────────────────────────────────────┘
```

### 📸 Capture d'écran attendue:
- Modal centré avec fond semi-transparent
- Icône de carte de crédit rouge
- Barre de progression à 100% (rouge)
- Comparaison des 3 plans (Free, Pro, Cabinet)
- Bouton "Passer au Plan Pro" en bleu

### 🔍 Vérifier dans la console:
```
🔍 Vérification des limites pour recherche juridique...
❌ Action bloquée par les limites
```

---

## 🧪 TEST 2: Avertissement à 80% - Rédaction

### Étape 1: Préparer les données
```sql
UPDATE subscriptions 
SET credits_remaining = 10 
WHERE user_id = 'VOTRE_USER_ID';
```

### Étape 2: Tester dans l'interface
1. Aller sur "Rédaction"
2. Sélectionner "Requête en Référé"
3. Remplir le formulaire
4. Cliquer sur "Générer le Document"

### ✅ Résultat Attendu:
```
┌─────────────────────────────────────────┐
│  ⚠️ AVERTISSEMENT                       │
├─────────────────────────────────────────┤
│                                         │
│  Attention, il vous reste seulement     │
│  10 crédits sur 50.                     │
│                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░ 40/50 (80%)      │
│                                         │
│  💡 Conseil: Passez au Plan Pro pour    │
│  500 crédits mensuels                   │
│                                         │
│  [Continuer]  [Voir les Plans]          │
└─────────────────────────────────────────┘
```

### 📸 Capture d'écran attendue:
- Modal avec fond jaune clair
- Icône d'avertissement jaune
- Barre de progression à 80% (jaune)
- Message d'avertissement doux
- Possibilité de continuer l'action

### 🔍 Après avoir cliqué "Continuer":
- Le document se génère normalement
- Les crédits passent de 10 à 8 (coût: 2 crédits)
- Console affiche:
```
🔍 Vérification des limites pour rédaction...
✅ Limites OK, génération du document...
💰 Déduction de 2 crédits pour rédaction...
✅ Crédits déduits avec succès
```

---

## 🧪 TEST 3: Avertissement Critique à 95% - Analyse

### Étape 1: Préparer les données
```sql
UPDATE subscriptions 
SET credits_remaining = 2 
WHERE user_id = 'VOTRE_USER_ID';
```

### Étape 2: Tester dans l'interface
1. Aller sur "Analyse"
2. Coller un contrat de location
3. Sélectionner "Analyse des Risques"
4. Cliquer sur "Lancer l'Audit"

### ✅ Résultat Attendu:
```
┌─────────────────────────────────────────┐
│  🔴 AVERTISSEMENT CRITIQUE              │
├─────────────────────────────────────────┤
│                                         │
│  Alerte! Il ne vous reste que 2 crédits│
│  sur 50. Votre prochain action pourrait │
│  être bloquée.                          │
│                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░ 48/50 (96%)      │
│                                         │
│  ⚡ Action recommandée: Passez au Plan  │
│  Pro maintenant pour éviter toute       │
│  interruption de service.               │
│                                         │
│  [Continuer quand même]  [Upgrader]     │
└─────────────────────────────────────────┘
```

### 📸 Capture d'écran attendue:
- Modal avec fond orange clair
- Icône d'alerte orange
- Barre de progression à 96% (orange/rouge)
- Message d'urgence
- Bouton "Upgrader" mis en avant

---

## 🧪 TEST 4: Quota Journalier Dépassé (Plan Free)

### Étape 1: Préparer les données
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

### Étape 2: Tester dans l'interface
1. Effectuer une recherche

### ✅ Résultat Attendu:
```
┌─────────────────────────────────────────┐
│  📊 QUOTA JOURNALIER ATTEINT            │
├─────────────────────────────────────────┤
│                                         │
│  Vous avez atteint votre quota          │
│  journalier de 10 crédits.              │
│                                         │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 10/10 (100%)     │
│                                         │
│  ⏰ Revenez demain à 00:00 ou passez    │
│  au Plan Pro pour 100 crédits/jour      │
│                                         │
│  Plan Pro: 4,900 DA/mois                │
│  ✓ 100 requêtes par jour                │
│  ✓ 500 crédits mensuels                 │
│                                         │
│  [Fermer]  [Passer au Plan Pro]         │
└─────────────────────────────────────────┘
```

---

## 🧪 TEST 5: Abonnement Expiré

### Étape 1: Préparer les données
```sql
UPDATE subscriptions 
SET expires_at = NOW() - INTERVAL '1 day' 
WHERE user_id = 'VOTRE_USER_ID';
```

### Étape 2: Tester dans l'interface
1. Effectuer n'importe quelle action

### ✅ Résultat Attendu:
```
┌─────────────────────────────────────────┐
│  ⏰ ABONNEMENT EXPIRÉ                   │
├─────────────────────────────────────────┤
│                                         │
│  Votre abonnement a expiré le           │
│  7 Mars 2026.                           │
│                                         │
│  Pour continuer à utiliser l'application│
│  veuillez renouveler votre abonnement.  │
│                                         │
│  📅 Date d'expiration: 7 Mars 2026      │
│  💳 Plan actuel: Free                   │
│                                         │
│  [Fermer]  [Renouveler l'Abonnement]   │
└─────────────────────────────────────────┘
```

---

## 🧪 TEST 6: Déduction Progressive des Crédits

### Étape 1: Préparer les données
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

### Étape 2: Effectuer plusieurs actions

#### Action 1: Recherche (coût: 1 crédit)
1. Aller sur "Recherche"
2. Poser une question
3. Vérifier dans SQL:
```sql
SELECT credits_remaining FROM subscriptions WHERE user_id = 'VOTRE_USER_ID';
-- Résultat attendu: 9
```

#### Action 2: Rédaction (coût: 2 crédits)
1. Aller sur "Rédaction"
2. Générer un document
3. Vérifier dans SQL:
```sql
SELECT credits_remaining FROM subscriptions WHERE user_id = 'VOTRE_USER_ID';
-- Résultat attendu: 7
```

#### Action 3: Analyse (coût: 3 crédits)
1. Aller sur "Analyse"
2. Analyser un contrat
3. Vérifier dans SQL:
```sql
SELECT credits_remaining FROM subscriptions WHERE user_id = 'VOTRE_USER_ID';
-- Résultat attendu: 4
```

### ✅ Tableau de vérification:

| Action | Crédits Avant | Coût | Crédits Après | ✓ |
|--------|---------------|------|---------------|---|
| Recherche | 10 | -1 | 9 | ⬜ |
| Rédaction | 9 | -2 | 7 | ⬜ |
| Analyse | 7 | -3 | 4 | ⬜ |
| Recherche | 4 | -1 | 3 | ⬜ |

---

## 🧪 TEST 7: Modal en Arabe

### Étape 1: Changer la langue
1. Cliquer sur le sélecteur de langue
2. Choisir "العربية"

### Étape 2: Épuiser les crédits
```sql
UPDATE subscriptions 
SET credits_remaining = 0 
WHERE user_id = 'VOTRE_USER_ID';
```

### Étape 3: Tester une action
1. Effectuer une recherche

### ✅ Résultat Attendu:
```
┌─────────────────────────────────────────┐
│              تم الوصول إلى الحد الأقصى 🚫│
├─────────────────────────────────────────┤
│                                         │
│         لقد استنفدت جميع نقاطك 💳       │
│                                         │
│      (100%) 50/0 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                         │
│              :مزايا الخطة الاحترافية 📊  │
│                    500 نقطة شهرياً ✓    │
│                    100 طلب يومي ✓       │
│                    10 جيجابايت ✓        │
│                                         │
│         [الترقية الآن]  [إغلاق]         │
└─────────────────────────────────────────┘
```

### 📸 Vérifications:
- ✅ Texte en arabe
- ✅ Direction RTL (de droite à gauche)
- ✅ Chiffres affichés correctement
- ✅ Boutons inversés (Fermer à droite, Action à gauche)

---

## 🧪 TEST 8: Navigation vers Billing

### Étape 1: Épuiser les crédits
```sql
UPDATE subscriptions 
SET credits_remaining = 0 
WHERE user_id = 'VOTRE_USER_ID';
```

### Étape 2: Tester la navigation
1. Effectuer une recherche
2. Modal s'affiche
3. Cliquer sur "Passer au Plan Pro"

### ✅ Résultat Attendu:
- URL change vers `/billing`
- Page de facturation s'affiche
- Ou erreur 404 si la page n'existe pas encore

### 🔍 Vérifier dans la console:
```javascript
console.log('URL actuelle:', window.location.pathname);
// Résultat attendu: "/billing"
```

---

## 🧪 TEST 9: Plan Cabinet (Illimité)

### Étape 1: Passer en plan Cabinet
```sql
UPDATE subscriptions 
SET 
  plan = 'cabinet',
  credits_remaining = 999999,
  expires_at = NOW() + INTERVAL '365 days'
WHERE user_id = 'VOTRE_USER_ID';
```

### Étape 2: Effectuer 20 actions consécutives
1. Faire 10 recherches
2. Générer 5 documents
3. Analyser 5 contrats

### ✅ Résultat Attendu:
- ✅ Aucun modal ne s'affiche jamais
- ✅ Toutes les actions s'exécutent normalement
- ✅ Les crédits ne diminuent pas (ou très peu)
- ✅ Aucune limite journalière/mensuelle

### 🔍 Vérifier dans SQL:
```sql
SELECT 
  plan,
  credits_remaining,
  credits_used_today,
  credits_used_this_month
FROM v_usage_overview 
WHERE user_id = 'VOTRE_USER_ID';
```

**Résultat attendu**:
- `plan` = 'cabinet'
- `credits_remaining` ≈ 999999 (presque inchangé)
- Pas de limite

---

## 🧪 TEST 10: Fermeture du Modal

### Étape 1: Afficher le modal
```sql
UPDATE subscriptions 
SET credits_remaining = 0 
WHERE user_id = 'VOTRE_USER_ID';
```

### Étape 2: Tester la fermeture
1. Effectuer une recherche
2. Modal s'affiche
3. Cliquer sur le X en haut à droite

### ✅ Résultat Attendu:
- Modal se ferme avec animation
- Retour à l'interface normale
- Aucune action n'a été exécutée
- Le message n'a pas été envoyé

### 🔍 Vérifier dans React DevTools:
```javascript
// État du composant
{
  showLimitModal: false,  // ✅ Modal fermé
  limitResult: {...},     // Résultat conservé
  isChecking: false
}
```

---

## 📊 CHECKLIST DE VALIDATION

Cocher après chaque test réussi:

### Tests de Blocage
- [ ] Crédits épuisés → Modal de blocage
- [ ] Quota journalier → Modal de blocage
- [ ] Quota mensuel → Modal de blocage
- [ ] Abonnement expiré → Modal de blocage
- [ ] Stockage plein → Modal de blocage

### Tests d'Avertissement
- [ ] 80% utilisés → Modal d'avertissement jaune
- [ ] 95% utilisés → Modal d'avertissement orange
- [ ] Action autorisée après avertissement

### Tests de Déduction
- [ ] Recherche → -1 crédit
- [ ] Rédaction → -2 crédits
- [ ] Analyse → -3 crédits
- [ ] Compteurs mis à jour

### Tests d'Interface
- [ ] Modal en français correct
- [ ] Modal en arabe correct (RTL)
- [ ] Navigation vers /billing
- [ ] Fermeture du modal
- [ ] Animations fluides

### Tests de Plans
- [ ] Plan Free → Limites respectées
- [ ] Plan Pro → Limites plus élevées
- [ ] Plan Cabinet → Aucune limite

---

## 🐛 PROBLÈMES COURANTS

### Problème 1: Modal ne s'affiche pas

**Diagnostic**:
```javascript
// Dans la console
console.log('showLimitModal:', showLimitModal);
console.log('limitResult:', limitResult);
```

**Solutions**:
1. Vérifier que le composant `<LimitReachedModal />` est dans le JSX
2. Vérifier que `showLimitModal` est `true`
3. Vérifier que `limitResult` n'est pas `null`
4. Vérifier le z-index du modal (doit être > 50)

---

### Problème 2: Crédits ne se déduisent pas

**Diagnostic**:
```sql
-- Vérifier les crédits avant et après
SELECT credits_remaining FROM subscriptions WHERE user_id = 'VOTRE_USER_ID';
```

**Solutions**:
1. Vérifier que `deductCredits()` est appelé APRÈS succès
2. Vérifier les logs dans la console
3. Vérifier la fonction SQL `deduct_credits()`
4. Vérifier les permissions RLS

---

### Problème 3: Modal en arabe mal affiché

**Diagnostic**:
```javascript
// Vérifier la langue
console.log('Langue actuelle:', language);
```

**Solutions**:
1. Vérifier l'attribut `dir="rtl"` sur le modal
2. Vérifier les traductions dans `limitResult.message.ar`
3. Vérifier le CSS pour RTL
4. Vérifier les polices arabes

---

## 📞 SUPPORT

Si un test échoue:

1. **Vérifier les logs** dans la console navigateur
2. **Vérifier les données** dans Supabase
3. **Consulter la documentation**:
   - `GESTION_LIMITES_UTILISATION.md`
   - `GUIDE_INTEGRATION_RAPIDE_LIMITES.md`
   - `TEST_SYSTEME_LIMITES.md`
4. **Exécuter les tests SQL** dans `test-limites-automatique.sql`

---

**Date de création**: 8 Mars 2026
**Version**: 1.0
**Durée estimée**: 30 minutes pour tous les tests
**Niveau**: ⭐⭐ (Facile)
