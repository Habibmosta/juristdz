## 🚀 IMPLÉMENTATION SYSTÈME D'ESSAI GRATUIT

**Date**: 8 Mars 2026  
**Status**: ✅ Prêt à déployer

---

## 📦 FICHIERS CRÉÉS

### 1. Backend SQL
**`supabase-enable-trial-system.sql`** (À exécuter dans Supabase)

**Contenu**:
- ✅ Fonction `handle_new_user()` modifiée pour supporter les essais
- ✅ Fonction `suspend_expired_trials()` pour suspendre les essais expirés
- ✅ Fonction `convert_trial_to_paid()` pour convertir essai → payant
- ✅ Fonction `downgrade_to_free()` pour retourner au plan gratuit
- ✅ Vue `v_active_trials` pour voir les essais en cours
- ✅ Vue `v_expired_trials` pour voir les essais expirés
- ✅ CRON job pour suspendre automatiquement les essais expirés (tous les jours à 2h)

---

### 2. Frontend React

#### **`src/components/auth/PlanSelectionModal.tsx`**
Modal de sélection de plan lors de l'inscription

**Fonctionnalités**:
- 3 plans: Gratuit, Pro (recommandé), Cabinet
- Design moderne avec badges "RECOMMANDÉ"
- Support bilingue FR/AR
- Sélection visuelle avec checkmarks
- Informations claires sur chaque plan

---

#### **`src/components/trial/TrialExpiredModal.tsx`**
Modal affiché quand l'essai expire

**Fonctionnalités**:
- 2 options: Continuer avec plan payant ou retour au gratuit
- Appel aux fonctions SQL `convert_trial_to_paid()` et `downgrade_to_free()`
- Design persuasif avec mise en avant du plan payant
- Support bilingue FR/AR
- Gestion des états de chargement

---

## 🔄 PARCOURS UTILISATEUR

### Scénario 1: Inscription avec Essai Gratuit Pro

```
1. Utilisateur arrive sur la page d'inscription
   ↓
2. Modal PlanSelectionModal s'affiche
   ↓
3. Utilisateur sélectionne "Pro" (essai 7 jours)
   ↓
4. Inscription avec metadata: { plan: 'pro' }
   ↓
5. Trigger handle_new_user() crée:
   - Profil
   - Abonnement: plan='pro', status='trial', trial_ends_at=NOW()+7 jours
   ↓
6. Utilisateur connecté avec accès complet Pro
   ↓
7. Bannière TrialBanner affiche: "⏰ Essai gratuit: 7 jours restants"
   ↓
8. Après 7 jours:
   - CRON job suspend l'essai (status='expired')
   - Modal TrialExpiredModal s'affiche
   ↓
9. Utilisateur choisit:
   Option A: Continuer avec Pro → convert_trial_to_paid()
   Option B: Retour au gratuit → downgrade_to_free()
```

---

### Scénario 2: Inscription avec Plan Gratuit

```
1. Utilisateur arrive sur la page d'inscription
   ↓
2. Modal PlanSelectionModal s'affiche
   ↓
3. Utilisateur sélectionne "Gratuit"
   ↓
4. Inscription avec metadata: { plan: 'free' }
   ↓
5. Trigger handle_new_user() crée:
   - Profil
   - Abonnement: plan='free', status='active', trial_ends_at=NULL
   ↓
6. Utilisateur connecté avec plan gratuit permanent
   ↓
7. Pas de bannière d'essai
   ↓
8. Peut upgrader vers Pro/Cabinet à tout moment
```

---

## 🛠️ ÉTAPES D'INSTALLATION

### Étape 1: Exécuter le Script SQL ⭐

```sql
-- Dans Supabase SQL Editor
-- Copier et exécuter: supabase-enable-trial-system.sql
```

**Ce que ça fait**:
- Modifie la fonction d'inscription
- Crée les fonctions de gestion des essais
- Active le CRON job automatique
- Crée les vues pour le dashboard admin

---

### Étape 2: Intégrer PlanSelectionModal dans l'Inscription

**Fichier à modifier**: `src/components/auth/SignUp.tsx` (ou équivalent)

```typescript
import { PlanSelectionModal } from './PlanSelectionModal';

// Dans le composant
const [showPlanModal, setShowPlanModal] = useState(false);
const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'cabinet'>('free');

// Afficher le modal AVANT l'inscription
const handleSignUp = () => {
  setShowPlanModal(true);
};

// Quand l'utilisateur sélectionne un plan
const handlePlanSelected = async (plan: 'free' | 'pro' | 'cabinet') => {
  setSelectedPlan(plan);
  setShowPlanModal(false);
  
  // Inscription avec le plan choisi
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        profession: profession,
        plan: plan  // ← IMPORTANT: Passer le plan choisi
      }
    }
  });
};

// Dans le JSX
<PlanSelectionModal
  isOpen={showPlanModal}
  onClose={() => setShowPlanModal(false)}
  onSelectPlan={handlePlanSelected}
  isAr={isAr}
/>
```

---

### Étape 3: Intégrer TrialExpiredModal dans App.tsx

**Fichier à modifier**: `src/App.tsx`

```typescript
import { TrialExpiredModal } from './components/trial/TrialExpiredModal';

// Dans le composant
const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);

// Vérifier si l'essai a expiré
useEffect(() => {
  const checkTrialStatus = async () => {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (subscription?.status === 'expired') {
      setShowTrialExpiredModal(true);
    }
  };
  
  if (user) {
    checkTrialStatus();
  }
}, [user]);

// Dans le JSX
<TrialExpiredModal
  isOpen={showTrialExpiredModal}
  onClose={() => setShowTrialExpiredModal(false)}
  userPlan={subscription?.plan || 'pro'}
  isAr={isAr}
/>
```

---

### Étape 4: Vérifier que TrialBanner Fonctionne

**Fichier**: `src/components/trial/TrialBanner.tsx`

Ce composant existe déjà et devrait fonctionner automatiquement pour afficher:
- Le compte à rebours des jours restants
- L'alerte quand il reste ≤ 2 jours
- Le bouton "Continuer avec Pro"

---

## 📊 DASHBOARD ADMIN

Le dashboard admin affiche déjà les statistiques correctes:
- ✅ Essais Gratuits (7j): Nombre d'utilisateurs en essai
- ✅ Plan Gratuit: Nombre d'utilisateurs gratuits
- ✅ Payants: Nombre d'abonnements payants

**Nouvelles vues SQL disponibles**:

```sql
-- Voir les essais en cours
SELECT * FROM v_active_trials;

-- Voir les essais expirés
SELECT * FROM v_expired_trials;

-- Statistiques
SELECT 
  COUNT(*) FILTER (WHERE status = 'trial') as essais_actifs,
  COUNT(*) FILTER (WHERE status = 'expired') as essais_expires,
  COUNT(*) FILTER (WHERE status = 'active' AND plan != 'free') as convertis_payant
FROM subscriptions;
```

---

## 🧪 TESTS À EFFECTUER

### Test 1: Inscription avec Essai Pro

1. Créer un nouveau compte
2. Sélectionner "Pro" dans le modal
3. Vérifier dans Supabase:
   ```sql
   SELECT plan, status, trial_ends_at 
   FROM subscriptions 
   WHERE user_id = 'nouveau-user-id';
   ```
4. Résultat attendu: `plan='pro', status='trial', trial_ends_at=NOW()+7 jours`

---

### Test 2: Bannière d'Essai

1. Se connecter avec un compte en essai
2. Vérifier que la bannière bleue s'affiche
3. Vérifier le compte à rebours des jours

---

### Test 3: Expiration d'Essai (Simulation)

```sql
-- Simuler l'expiration d'un essai
UPDATE subscriptions
SET trial_ends_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'test-user-id';

-- Exécuter la fonction de suspension
SELECT suspend_expired_trials();

-- Vérifier le statut
SELECT status FROM subscriptions WHERE user_id = 'test-user-id';
-- Résultat attendu: status='expired'
```

---

### Test 4: Modal d'Expiration

1. Se connecter avec un compte expiré
2. Vérifier que le modal TrialExpiredModal s'affiche
3. Tester "Continuer avec Pro"
4. Tester "Retour au gratuit"

---

### Test 5: CRON Job

```sql
-- Vérifier que le CRON job est actif
SELECT * FROM cron.job WHERE jobname = 'suspend-expired-trials';

-- Exécuter manuellement
SELECT suspend_expired_trials();
```

---

## 📈 MÉTRIQUES À SUIVRE

### Taux de Conversion

```sql
-- Calculer le taux de conversion essai → payant
SELECT 
  COUNT(*) FILTER (WHERE status = 'trial') as essais_actifs,
  COUNT(*) FILTER (WHERE status = 'active' AND plan IN ('pro', 'cabinet')) as convertis,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'active' AND plan IN ('pro', 'cabinet'))::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE status = 'trial'), 0) * 100, 
    2
  ) as taux_conversion_pct
FROM subscriptions;
```

---

### Essais par Jour

```sql
-- Nombre d'essais démarrés par jour
SELECT 
  DATE(created_at) as date,
  COUNT(*) as nouveaux_essais
FROM subscriptions
WHERE status = 'trial'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### Essais Expirant Bientôt

```sql
-- Essais qui expirent dans les 2 prochains jours
SELECT 
  p.email,
  p.first_name,
  s.plan,
  s.trial_ends_at,
  EXTRACT(DAY FROM (s.trial_ends_at - NOW())) as jours_restants
FROM subscriptions s
INNER JOIN profiles p ON s.user_id = p.id
WHERE s.status = 'trial'
  AND s.trial_ends_at BETWEEN NOW() AND NOW() + INTERVAL '2 days'
ORDER BY s.trial_ends_at ASC;
```

---

## 📧 EMAILS AUTOMATIQUES (À IMPLÉMENTER)

### Email 1: Bienvenue Essai (Jour 0)

**Sujet**: 🎉 Votre essai Pro de 7 jours commence maintenant!

**Contenu**:
- Bienvenue
- Récapitulatif des fonctionnalités
- Guide de démarrage rapide
- Lien vers le support

---

### Email 2: Rappel Mi-Parcours (Jour 3)

**Sujet**: 4 jours restants - Avez-vous essayé la rédaction automatique?

**Contenu**:
- Rappel des jours restants
- Mise en avant d'une fonctionnalité
- Témoignages clients
- CTA: Continuer avec Pro

---

### Email 3: Alerte Expiration (Jour 5)

**Sujet**: ⚠️ 2 jours restants - Ne perdez pas l'accès

**Contenu**:
- Urgence: 2 jours restants
- Récapitulatif de l'utilisation
- Avantages de continuer
- CTA: Continuer avec Pro

---

### Email 4: Dernier Jour (Jour 7)

**Sujet**: 🚨 Dernier jour - Continuez avec Pro à 15,000 DZD/mois

**Contenu**:
- Dernier jour
- Offre spéciale (optionnel)
- Témoignages
- CTA urgent: Continuer maintenant

---

### Email 5: Essai Expiré (Jour 8)

**Sujet**: Votre essai est terminé - Revenez quand vous voulez!

**Contenu**:
- Essai terminé
- Retour au plan gratuit
- Possibilité de revenir
- Lien vers les plans

---

## 🎯 STRATÉGIE DE LANCEMENT

### Phase 1: Soft Launch (Semaine 1)

- ✅ Activer le système d'essai
- ✅ Offrir 14 jours au lieu de 7 (offre de lancement)
- ✅ Inviter 50 premiers utilisateurs
- ✅ Collecter les retours

---

### Phase 2: Optimisation (Semaine 2)

- ✅ Analyser les taux de conversion
- ✅ Ajuster les emails
- ✅ Optimiser le modal de sélection
- ✅ Améliorer la bannière

---

### Phase 3: Lancement Public (Semaine 3)

- ✅ Campagne marketing "Essai gratuit 7 jours"
- ✅ Webinaires de démonstration
- ✅ Programme de parrainage
- ✅ Publicité ciblée

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] Exécuter `supabase-enable-trial-system.sql` dans Supabase
- [ ] Vérifier que le CRON job est actif
- [ ] Intégrer `PlanSelectionModal` dans l'inscription
- [ ] Intégrer `TrialExpiredModal` dans App.tsx
- [ ] Vérifier que `TrialBanner` fonctionne
- [ ] Tester l'inscription avec essai Pro
- [ ] Tester l'inscription avec plan gratuit
- [ ] Simuler l'expiration d'un essai
- [ ] Tester la conversion essai → payant
- [ ] Tester le retour au plan gratuit
- [ ] Vérifier les statistiques dans le dashboard admin
- [ ] Configurer les emails automatiques (optionnel)
- [ ] Former l'équipe support
- [ ] Préparer la documentation utilisateur

---

## 🚀 PRÊT À LANCER!

Tout est prêt pour activer le système d'essai gratuit. Il suffit de:

1. **Exécuter le script SQL** (5 minutes)
2. **Intégrer les 2 modals** (30 minutes)
3. **Tester** (15 minutes)
4. **Lancer** 🎉

**Estimation totale**: 1 heure

---

**Questions?** Demande-moi et je t'aide à déployer! 🚀

