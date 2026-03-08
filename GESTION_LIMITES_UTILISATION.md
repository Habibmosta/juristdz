# 📊 GESTION DES LIMITES D'UTILISATION - DOCUMENTATION COMPLÈTE

## 🎯 Vue d'Ensemble

Ce système gère tous les cas où un utilisateur atteint ses limites d'utilisation de l'application JuristDZ, avec des messages clairs et des actions appropriées selon le contexte.

---

## 📋 TYPES DE LIMITES

### 1. 💳 CRÉDITS (LimitType.CREDITS)

**Description**: Nombre de crédits disponibles pour effectuer des actions (recherches, rédactions, analyses)

**Limites par plan**:
- **Free**: 50 crédits
- **Pro**: 500 crédits
- **Cabinet**: Illimité

**Cas de figure**:

#### ✅ Cas 1: Crédits OK (> 20%)
```
Status: OK
Message FR: "45 crédits disponibles"
Message AR: "45 نقطة متاحة"
Action: Autoriser l'action
```

#### ⚠️ Cas 2: Avertissement (10-20 crédits restants)
```
Status: WARNING
Message FR: "⚠️ Il vous reste 15 crédits sur 50. Pensez à recharger bientôt."
Message AR: "⚠️ لديك 15 نقطة متبقية من 50. فكر في إعادة الشحن قريباً."
Action: Autoriser mais afficher avertissement
```

#### 🚨 Cas 3: Critique (< 10 crédits)
```
Status: CRITICAL
Message FR: "🚨 Attention! Il ne vous reste que 5 crédits sur 50. Rechargez rapidement pour éviter toute interruption."
Message AR: "🚨 تنبيه! لم يتبق لك سوى 5 نقاط من 50. قم بإعادة الشحن بسرعة لتجنب أي انقطاع."
Action: Autoriser mais afficher modal d'upgrade
```

#### ❌ Cas 4: Épuisés (0 crédits)
```
Status: EXCEEDED
Message FR: "Vous avez épuisé vos 50 crédits. Passez à un plan supérieur pour continuer à utiliser JuristDZ sans interruption."
Message AR: "لقد استنفدت رصيدك البالغ 50 نقطة. قم بالترقية إلى خطة أعلى لمواصلة استخدام المنصة دون انقطاع."
Action: BLOQUER l'action + Rediriger vers /billing
```

---

### 2. ⏰ EXPIRATION (LimitType.EXPIRATION)

**Description**: Date d'expiration de l'abonnement

**Limites par plan**:
- **Free**: 30 jours
- **Pro**: 365 jours
- **Cabinet**: 365 jours

**Cas de figure**:

#### ✅ Cas 1: Abonnement actif (> 7 jours)
```
Status: OK
Message FR: "Abonnement actif"
Message AR: "الاشتراك نشط"
Action: Autoriser l'action
```

#### ⚠️ Cas 2: Expiration proche (1-7 jours)
```
Status: WARNING
Message FR: "⚠️ Votre abonnement expire dans 3 jours. Pensez à le renouveler pour éviter toute interruption de service."
Message AR: "⚠️ ينتهي اشتراكك خلال 3 أيام. فكر في تجديده لتجنب أي انقطاع في الخدمة."
Action: Autoriser mais afficher avertissement
```

#### ❌ Cas 3: Expiré
```
Status: EXCEEDED
Message FR: "Votre abonnement a expiré le 15/03/2025. Veuillez renouveler votre abonnement pour continuer à utiliser JuristDZ."
Message AR: "انتهت صلاحية اشتراكك في 15/03/2025. يرجى تجديد اشتراكك لمواصلة استخدام منصة القانون الجزائري."
Action: BLOQUER l'action + Rediriger vers /billing
```

---

### 3. 📅 QUOTA JOURNALIER (LimitType.DAILY_QUOTA)

**Description**: Nombre maximum de requêtes par jour

**Limites par plan**:
- **Free**: 10 requêtes/jour
- **Pro**: 100 requêtes/jour
- **Cabinet**: Illimité

**Cas de figure**:

#### ✅ Cas 1: Quota OK (< 80%)
```
Status: OK
Message FR: "5/10 requêtes aujourd'hui"
Message AR: "5/10 طلب اليوم"
Action: Autoriser l'action
```

#### ⚠️ Cas 2: Quota élevé (80-99%)
```
Status: WARNING
Message FR: "⚠️ Vous avez utilisé 9/10 requêtes aujourd'hui (90%)."
Message AR: "⚠️ لقد استخدمت 9/10 طلب اليوم (90%)."
Action: Autoriser mais afficher avertissement
```

#### ❌ Cas 3: Quota dépassé
```
Status: EXCEEDED
Message FR: "Vous avez atteint votre limite journalière de 10 requêtes. Votre quota sera réinitialisé dans 8h. Passez au plan Pro pour des quotas plus élevés."
Message AR: "لقد وصلت إلى حدك اليومي البالغ 10 طلبات. سيتم إعادة تعيين حصتك خلال 8 ساعات. قم بالترقية إلى الخطة الاحترافية للحصول على حصص أعلى."
Action: BLOQUER l'action + Afficher temps restant avant reset
```

---

### 4. 📆 QUOTA MENSUEL (LimitType.MONTHLY_QUOTA)

**Description**: Nombre maximum de requêtes par mois

**Limites par plan**:
- **Free**: 100 requêtes/mois
- **Pro**: 1000 requêtes/mois
- **Cabinet**: Illimité

**Cas de figure**:

#### ✅ Cas 1: Quota OK (< 90%)
```
Status: OK
Message FR: "45/100 requêtes ce mois"
Message AR: "45/100 طلب هذا الشهر"
Action: Autoriser l'action
```

#### 🚨 Cas 2: Quota critique (90-99%)
```
Status: CRITICAL
Message FR: "🚨 Vous avez utilisé 95/100 requêtes ce mois (95%). Limite presque atteinte!"
Message AR: "🚨 لقد استخدمت 95/100 طلب هذا الشهر (95%). الحد على وشك الوصول!"
Action: Autoriser mais afficher modal d'upgrade
```

#### ❌ Cas 3: Quota dépassé
```
Status: EXCEEDED
Message FR: "Vous avez atteint votre limite mensuelle de 100 requêtes. Passez au plan Pro pour continuer sans interruption."
Message AR: "لقد وصلت إلى حدك الشهري البالغ 100 طلب. قم بالترقية إلى الخطة الاحترافية للمتابعة دون انقطاع."
Action: BLOQUER l'action + Rediriger vers /billing
```

---

### 5. 💾 STOCKAGE (LimitType.STORAGE)

**Description**: Espace de stockage utilisé pour les documents

**Limites par plan**:
- **Free**: 1 GB
- **Pro**: 10 GB
- **Cabinet**: 100 GB

**Cas de figure**:

#### ✅ Cas 1: Stockage OK (< 85%)
```
Status: OK
Message FR: "0.45/1 GB utilisés"
Message AR: "0.45/1 جيجابايت مستخدم"
Action: Autoriser l'action
```

#### ⚠️ Cas 2: Stockage élevé (85-99%)
```
Status: WARNING
Message FR: "⚠️ Stockage presque plein: 0.92/1 GB (92%)."
Message AR: "⚠️ التخزين شبه ممتلئ: 0.92/1 جيجابايت (92%)."
Action: Autoriser mais afficher avertissement
```

#### ❌ Cas 3: Stockage plein
```
Status: EXCEEDED
Message FR: "Votre espace de stockage est plein (1/1 GB). Supprimez des fichiers ou passez à un plan supérieur."
Message AR: "مساحة التخزين الخاصة بك ممتلئة (1/1 جيجابايت). احذف الملفات أو قم بالترقية إلى خطة أعلى."
Action: BLOQUER l'upload + Rediriger vers /billing
```

---

### 6. ⚡ APPELS API (LimitType.API_CALLS)

**Description**: Nombre d'appels API par jour (Gemini, Groq, etc.)

**Limites par plan**:
- **Free**: 50 appels/jour
- **Pro**: 500 appels/jour
- **Cabinet**: Illimité

**Cas de figure**:

#### ✅ Cas 1: API OK
```
Status: OK
Message FR: "25/50 appels API aujourd'hui"
Message AR: "25/50 مكالمة API اليوم"
Action: Autoriser l'action
```

#### ❌ Cas 2: Limite API dépassée
```
Status: EXCEEDED
Message FR: "Vous avez atteint votre limite d'appels API (50/jour). Réessayez demain ou passez au plan Pro."
Message AR: "لقد وصلت إلى حد مكالمات API الخاص بك (50/يوم). حاول مرة أخرى غداً أو قم بالترقية إلى الخطة الاحترافية."
Action: BLOQUER l'action + Afficher temps avant reset
```

---

## 🔧 INTÉGRATION DANS LES COMPOSANTS

### Exemple 1: Vérifier avant une recherche juridique

```typescript
import { useUsageLimits } from '../hooks/useUsageLimits';
import LimitReachedModal from './LimitReachedModal';

const ChatInterface = () => {
  const { checkLimits, deductCredits, limitResult, showLimitModal, closeLimitModal } = useUsageLimits();
  const { language } = useLanguage();
  
  const handleSend = async () => {
    // 1. Vérifier les limites AVANT l'action
    const allowed = await checkLimits('research');
    
    if (!allowed) {
      console.log('Action bloquée par les limites');
      return; // Le modal s'affiche automatiquement
    }
    
    // 2. Effectuer l'action
    const response = await sendMessageToGemini(input);
    
    // 3. Déduire les crédits APRÈS succès
    await deductCredits(1);
    
    // 4. Afficher la réponse
    setMessages([...messages, response]);
  };
  
  return (
    <>
      {/* Votre interface */}
      <button onClick={handleSend}>Envoyer</button>
      
      {/* Modal de limite */}
      {showLimitModal && limitResult && (
        <LimitReachedModal
          limitResult={limitResult}
          language={language}
          onClose={closeLimitModal}
          onUpgrade={() => navigate('/billing')}
        />
      )}
    </>
  );
};
```

### Exemple 2: Vérifier avant un upload de document

```typescript
const DocumentUpload = () => {
  const { checkLimits, limitResult, showLimitModal, closeLimitModal } = useUsageLimits();
  
  const handleUpload = async (file: File) => {
    // Vérifier le stockage
    const allowed = await checkLimits('upload');
    
    if (!allowed) {
      return; // Bloqué
    }
    
    // Upload le fichier
    await uploadDocument(file);
  };
  
  return (
    <>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      
      {showLimitModal && limitResult && (
        <LimitReachedModal
          limitResult={limitResult}
          language={language}
          onClose={closeLimitModal}
          onUpgrade={() => navigate('/billing')}
        />
      )}
    </>
  );
};
```

---

## 🗄️ STRUCTURE BASE DE DONNÉES

### Table: `subscriptions`

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'cabinet')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Table: `usage_stats`

```sql
CREATE TABLE usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  credits_used_today INTEGER NOT NULL DEFAULT 0,
  credits_used_this_month INTEGER NOT NULL DEFAULT 0,
  api_calls_today INTEGER NOT NULL DEFAULT 0,
  storage_used_gb DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Fonction: Déduire des crédits

```sql
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Récupérer les crédits actuels
  SELECT credits_remaining INTO v_current_credits
  FROM subscriptions
  WHERE user_id = p_user_id AND status = 'active';
  
  -- Vérifier si suffisant
  IF v_current_credits < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Déduire
  UPDATE subscriptions
  SET credits_remaining = credits_remaining - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### Fonction: Incrémenter l'usage

```sql
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_type TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Créer l'enregistrement si n'existe pas
  INSERT INTO usage_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Incrémenter selon le type
  IF p_type = 'credits' THEN
    UPDATE usage_stats
    SET credits_used_today = credits_used_today + 1,
        credits_used_this_month = credits_used_this_month + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF p_type = 'api_calls' THEN
    UPDATE usage_stats
    SET api_calls_today = api_calls_today + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Fonction: Reset quotas journaliers (CRON)

```sql
CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS VOID AS $$
BEGIN
  UPDATE usage_stats
  SET credits_used_today = 0,
      api_calls_today = 0,
      last_reset_date = NOW(),
      updated_at = NOW()
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Créer un CRON job pour exécuter à minuit
SELECT cron.schedule(
  'reset-daily-quotas',
  '0 0 * * *', -- Tous les jours à minuit
  'SELECT reset_daily_quotas();'
);
```

---

## 📱 INTERFACE UTILISATEUR

### Composants créés:

1. **`LimitReachedModal.tsx`**: Modal principal d'affichage des limites
2. **`usageLimitService.ts`**: Service de gestion des limites
3. **`useUsageLimits.ts`**: Hook personnalisé pour faciliter l'intégration

### Affichage selon le statut:

- **OK**: Pas de message (action autorisée)
- **WARNING**: Badge jaune avec avertissement
- **CRITICAL**: Modal orange avec appel à l'action
- **EXCEEDED**: Modal rouge bloquant avec redirection

---

## 🎨 DESIGN DES MESSAGES

### Principes:
1. **Clarté**: Message explicite sur ce qui est bloqué
2. **Contexte**: Afficher les chiffres (X/Y utilisés)
3. **Action**: Indiquer clairement quoi faire
4. **Urgence**: Couleur selon la gravité
5. **Bilingue**: Français ET Arabe

### Exemple de message complet:

```
🚨 Limite Atteinte

Vous avez épuisé vos 50 crédits.

Utilisation: 50 / 50 (100%)
[████████████████████] 100%

Avantages du Plan Pro:
✓ 500 crédits mensuels
✓ 100 requêtes par jour
✓ 10 GB de stockage
✓ Accès illimité aux fonctionnalités
✓ Support prioritaire
✓ Analyses avancées

[Fermer] [Passer au Plan Pro →]
```

---

## ✅ CHECKLIST D'IMPLÉMENTATION

- [x] Service de gestion des limites créé
- [x] Hook personnalisé créé
- [x] Modal d'affichage créé
- [ ] Intégrer dans ChatInterface
- [ ] Intégrer dans DraftingInterface
- [ ] Intégrer dans AnalysisInterface
- [ ] Intégrer dans DocumentUpload
- [ ] Créer les tables Supabase
- [ ] Créer les fonctions SQL
- [ ] Configurer le CRON job
- [ ] Tester tous les cas de figure
- [ ] Traduire tous les messages en arabe
- [ ] Ajouter les analytics de limites

---

## 🚀 PROCHAINES ÉTAPES

1. Créer les tables et fonctions dans Supabase
2. Intégrer le hook dans les composants principaux
3. Tester chaque cas de figure
4. Ajouter des analytics pour suivre les limites atteintes
5. Créer une page de gestion d'abonnement complète

---

**Date de création**: 8 Mars 2026
**Version**: 1.0
**Auteur**: Système de gestion JuristDZ
