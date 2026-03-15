# 💬 EXEMPLES DE MESSAGES - TOUS LES CAS DE FIGURE

## 📋 TABLE DES MATIÈRES

1. [Crédits](#-crédits)
2. [Expiration](#-expiration)
3. [Quota Journalier](#-quota-journalier)
4. [Quota Mensuel](#-quota-mensuel)
5. [Stockage](#-stockage)
6. [Appels API](#-appels-api)

---

## 💳 CRÉDITS

### ✅ Cas 1: Crédits OK (45/50)

**Français**
```
✓ 45 crédits disponibles
```

**Arabe**
```
✓ 45 نقطة متاحة
```

**Action**: Aucun message affiché, action autorisée

---

### ⚠️ Cas 2: Avertissement (15/50)

**Français**
```
⚠️ Attention

Il vous reste 15 crédits sur 50. 
Pensez à recharger bientôt.

Utilisation: 35 / 50 (70%)
[██████████████      ] 70%
```

**Arabe**
```
⚠️ تنبيه

لديك 15 نقطة متبقية من 50. 
فكر في إعادة الشحن قريباً.

الاستخدام: 35 / 50 (70%)
[██████████████      ] 70%
```

**Action**: Badge jaune en haut de l'écran

---

### 🚨 Cas 3: Critique (5/50)

**Français**
```
🚨 Avertissement Critique

Attention! Il ne vous reste que 5 crédits sur 50. 
Rechargez rapidement pour éviter toute interruption.

Utilisation: 45 / 50 (90%)
[██████████████████  ] 90%

Avantages du Plan Pro:
✓ 500 crédits mensuels
✓ 100 requêtes par jour
✓ 10 GB de stockage
✓ Accès illimité aux fonctionnalités
✓ Support prioritaire
✓ Analyses avancées

[Fermer] [Voir les Plans]
```

**Arabe**
```
🚨 تحذير حرج

تنبيه! لم يتبق لك سوى 5 نقاط من 50. 
قم بإعادة الشحن بسرعة لتجنب أي انقطاع.

الاستخدام: 45 / 50 (90%)
[██████████████████  ] 90%

مزايا الخطة الاحترافية:
✓ 500 نقطة شهرياً
✓ 100 طلب يومي
✓ 10 جيجابايت تخزين
✓ وصول غير محدود للميزات
✓ دعم ذو أولوية
✓ تحليلات متقدمة

[إغلاق] [عرض الخطط]
```

**Action**: Modal orange avec bouton d'upgrade

---

### ❌ Cas 4: Épuisés (0/50)

**Français**
```
🚨 Limite Atteinte

Vous avez épuisé vos 50 crédits. 
Passez à un plan supérieur pour continuer à utiliser 
JuristDZ sans interruption.

Utilisation: 50 / 50 (100%)
[████████████████████] 100%

Comparaison des Plans:

┌─────────────────────────────────────────────┐
│ FREE          │ PRO ⭐        │ CABINET     │
├───────────────┼───────────────┼─────────────┤
│ 0 DA          │ 4,900 DA/mois │ 14,900 DA   │
│ 50 crédits    │ 500 crédits   │ Illimité    │
│ 10 req/jour   │ 100 req/jour  │ Illimité    │
│ 1 GB          │ 10 GB         │ 100 GB      │
└───────────────┴───────────────┴─────────────┘

[Fermer] [Passer au Plan Pro →]
```

**Arabe**
```
🚨 تم الوصول إلى الحد الأقصى

لقد استنفدت رصيدك البالغ 50 نقطة. 
قم بالترقية إلى خطة أعلى لمواصلة استخدام المنصة 
دون انقطاع.

الاستخدام: 50 / 50 (100%)
[████████████████████] 100%

مقارنة الخطط:

┌─────────────────────────────────────────────┐
│ مجاني        │ احترافي ⭐    │ مكتب        │
├───────────────┼───────────────┼─────────────┤
│ 0 دج          │ 4,900 دج/شهر  │ 14,900 دج   │
│ 50 نقطة       │ 500 نقطة      │ غير محدود   │
│ 10 طلب/يوم    │ 100 طلب/يوم   │ غير محدود   │
│ 1 جيجابايت    │ 10 جيجابايت   │ 100 جيجابايت│
└───────────────┴───────────────┴─────────────┘

[إغلاق] [ترقية الآن ←]
```

**Action**: Modal rouge BLOQUANT + Redirection vers /billing

---

## ⏰ EXPIRATION

### ✅ Cas 1: Abonnement actif (25 jours restants)

**Français**
```
✓ Abonnement actif
Expire le: 02/04/2026 (25 jours)
```

**Arabe**
```
✓ الاشتراك نشط
ينتهي في: 02/04/2026 (25 يوم)
```

**Action**: Aucun message

---

### ⚠️ Cas 2: Expiration proche (3 jours)

**Français**
```
⚠️ Expiration Proche

Votre abonnement expire dans 3 jours. 
Pensez à le renouveler pour éviter toute interruption 
de service.

Date d'expiration: 11/03/2026

[Renouveler maintenant]
```

**Arabe**
```
⚠️ انتهاء قريب

ينتهي اشتراكك خلال 3 أيام. 
فكر في تجديده لتجنب أي انقطاع في الخدمة.

تاريخ الانتهاء: 11/03/2026

[جدد الآن]
```

**Action**: Banner jaune en haut de toutes les pages

---

### ❌ Cas 3: Expiré

**Français**
```
🚨 Abonnement Expiré

Votre abonnement a expiré le 15/03/2025. 
Veuillez renouveler votre abonnement pour continuer 
à utiliser JuristDZ.

Fonctionnalités bloquées:
❌ Recherche juridique
❌ Rédaction de documents
❌ Analyse de contrats
❌ Gestion de dossiers

Pour réactiver votre compte:
1. Choisissez un plan
2. Effectuez le paiement
3. Accès immédiat

[Renouveler mon abonnement →]
```

**Arabe**
```
🚨 انتهى الاشتراك

انتهت صلاحية اشتراكك في 15/03/2025. 
يرجى تجديد اشتراكك لمواصلة استخدام منصة القانون 
الجزائري.

الميزات المحظورة:
❌ البحث القانوني
❌ تحرير الوثائق
❌ تحليل العقود
❌ إدارة الملفات

لإعادة تفعيل حسابك:
1. اختر خطة
2. قم بالدفع
3. وصول فوري

[جدد اشتراكي ←]
```

**Action**: Page de blocage complète avec redirection forcée

---

## 📅 QUOTA JOURNALIER

### ✅ Cas 1: Quota OK (5/10)

**Français**
```
✓ 5/10 requêtes aujourd'hui
Reset dans: 14h 32min
```

**Arabe**
```
✓ 5/10 طلب اليوم
إعادة التعيين خلال: 14 ساعة 32 دقيقة
```

**Action**: Aucun message

---

### ⚠️ Cas 2: Quota élevé (9/10)

**Français**
```
⚠️ Quota Journalier Élevé

Vous avez utilisé 9/10 requêtes aujourd'hui (90%).

Utilisation: 9 / 10 (90%)
[██████████████████  ] 90%

Reset automatique dans: 8h 15min

Conseil: Passez au plan Pro pour 100 requêtes/jour
```

**Arabe**
```
⚠️ حصة يومية عالية

لقد استخدمت 9/10 طلبات اليوم (90%).

الاستخدام: 9 / 10 (90%)
[██████████████████  ] 90%

إعادة التعيين التلقائي خلال: 8 ساعات 15 دقيقة

نصيحة: قم بالترقية إلى الخطة الاحترافية للحصول على 
100 طلب/يوم
```

**Action**: Notification en bas à droite

---

### ❌ Cas 3: Quota dépassé (10/10)

**Français**
```
🚨 Quota Journalier Atteint

Vous avez atteint votre limite journalière de 10 requêtes.

Utilisation: 10 / 10 (100%)
[████████████████████] 100%

Votre quota sera réinitialisé automatiquement dans:
⏰ 8 heures 15 minutes

Options:
1. Attendre le reset automatique (gratuit)
2. Passer au plan Pro (100 requêtes/jour)

Plan Pro: 4,900 DA/mois
✓ 500 crédits
✓ 100 requêtes/jour
✓ 10 GB stockage

[Attendre] [Passer au Pro →]
```

**Arabe**
```
🚨 تم الوصول إلى الحصة اليومية

لقد وصلت إلى حدك اليومي البالغ 10 طلبات.

الاستخدام: 10 / 10 (100%)
[████████████████████] 100%

سيتم إعادة تعيين حصتك تلقائياً خلال:
⏰ 8 ساعات 15 دقيقة

الخيارات:
1. انتظر إعادة التعيين التلقائي (مجاني)
2. قم بالترقية إلى الخطة الاحترافية (100 طلب/يوم)

الخطة الاحترافية: 4,900 دج/شهر
✓ 500 نقطة
✓ 100 طلب/يوم
✓ 10 جيجابايت تخزين

[انتظر] [ترقية ←]
```

**Action**: Modal BLOQUANT avec compte à rebours

---

## 📆 QUOTA MENSUEL

### ✅ Cas 1: Quota OK (45/100)

**Français**
```
✓ 45/100 requêtes ce mois
Reset le: 01/04/2026
```

**Arabe**
```
✓ 45/100 طلب هذا الشهر
إعادة التعيين في: 01/04/2026
```

**Action**: Aucun message

---

### 🚨 Cas 2: Quota critique (95/100)

**Français**
```
🚨 Quota Mensuel Critique

Vous avez utilisé 95/100 requêtes ce mois (95%). 
Limite presque atteinte!

Utilisation: 95 / 100 (95%)
[███████████████████ ] 95%

Il vous reste: 5 requêtes
Reset le: 01/04/2026 (dans 23 jours)

⚠️ Risque de blocage avant la fin du mois!

Solution: Passez au plan Pro
✓ 1000 requêtes/mois
✓ 500 crédits
✓ Support prioritaire

[Fermer] [Passer au Pro →]
```

**Arabe**
```
🚨 حصة شهرية حرجة

لقد استخدمت 95/100 طلب هذا الشهر (95%). 
الحد على وشك الوصول!

الاستخدام: 95 / 100 (95%)
[███████████████████ ] 95%

المتبقي: 5 طلبات
إعادة التعيين في: 01/04/2026 (خلال 23 يوم)

⚠️ خطر الحظر قبل نهاية الشهر!

الحل: قم بالترقية إلى الخطة الاحترافية
✓ 1000 طلب/شهر
✓ 500 نقطة
✓ دعم ذو أولوية

[إغلاق] [ترقية ←]
```

**Action**: Modal orange avec urgence

---

### ❌ Cas 3: Quota dépassé (100/100)

**Français**
```
🚨 Quota Mensuel Atteint

Vous avez atteint votre limite mensuelle de 100 requêtes.

Utilisation: 100 / 100 (100%)
[████████████████████] 100%

Votre quota sera réinitialisé le: 01/04/2026
⏰ Dans 23 jours

Vous ne pouvez plus effectuer de recherches jusqu'au 
reset automatique.

Solution immédiate: Passez au plan Pro
✓ 1000 requêtes/mois (10x plus)
✓ 500 crédits mensuels
✓ 100 requêtes/jour
✓ Accès immédiat

Prix: 4,900 DA/mois

[Passer au Plan Pro →]
```

**Arabe**
```
🚨 تم الوصول إلى الحصة الشهرية

لقد وصلت إلى حدك الشهري البالغ 100 طلب.

الاستخدام: 100 / 100 (100%)
[████████████████████] 100%

سيتم إعادة تعيين حصتك في: 01/04/2026
⏰ خلال 23 يوم

لا يمكنك إجراء المزيد من عمليات البحث حتى إعادة 
التعيين التلقائي.

الحل الفوري: قم بالترقية إلى الخطة الاحترافية
✓ 1000 طلب/شهر (10 أضعاف)
✓ 500 نقطة شهرياً
✓ 100 طلب/يوم
✓ وصول فوري

السعر: 4,900 دج/شهر

[ترقية الآن ←]
```

**Action**: Modal rouge BLOQUANT

---

## 💾 STOCKAGE

### ✅ Cas 1: Stockage OK (0.45/1 GB)

**Français**
```
✓ 0.45/1 GB utilisés (45%)
```

**Arabe**
```
✓ 0.45/1 جيجابايت مستخدم (45%)
```

**Action**: Aucun message

---

### ⚠️ Cas 2: Stockage élevé (0.92/1 GB)

**Français**
```
⚠️ Stockage Presque Plein

Stockage: 0.92/1 GB (92%)
[██████████████████  ] 92%

Espace restant: 80 MB

Actions recommandées:
1. Supprimer les anciens documents
2. Archiver les dossiers fermés
3. Passer au plan Pro (10 GB)

[Gérer mes fichiers] [Voir les plans]
```

**Arabe**
```
⚠️ التخزين شبه ممتلئ

التخزين: 0.92/1 جيجابايت (92%)
[██████████████████  ] 92%

المساحة المتبقية: 80 ميجابايت

الإجراءات الموصى بها:
1. احذف المستندات القديمة
2. أرشف الملفات المغلقة
3. قم بالترقية إلى الخطة الاحترافية (10 جيجابايت)

[إدارة ملفاتي] [عرض الخطط]
```

**Action**: Banner orange persistant

---

### ❌ Cas 3: Stockage plein (1/1 GB)

**Français**
```
🚨 Stockage Plein

Votre espace de stockage est plein (1/1 GB).

Stockage: 1.00/1 GB (100%)
[████████████████████] 100%

Vous ne pouvez plus:
❌ Uploader de nouveaux documents
❌ Sauvegarder des brouillons
❌ Recevoir des pièces jointes

Solutions:
1. Supprimer des fichiers (gratuit)
   → Libérer de l'espace immédiatement
   
2. Passer au plan Pro (recommandé)
   → 10 GB de stockage (10x plus)
   → 4,900 DA/mois

[Gérer mes fichiers] [Passer au Pro →]
```

**Arabe**
```
🚨 التخزين ممتلئ

مساحة التخزين الخاصة بك ممتلئة (1/1 جيجابايت).

التخزين: 1.00/1 جيجابايت (100%)
[████████████████████] 100%

لا يمكنك:
❌ رفع مستندات جديدة
❌ حفظ المسودات
❌ استقبال المرفقات

الحلول:
1. احذف الملفات (مجاني)
   ← تحرير المساحة فوراً
   
2. قم بالترقية إلى الخطة الاحترافية (موصى به)
   ← 10 جيجابايت تخزين (10 أضعاف)
   ← 4,900 دج/شهر

[إدارة ملفاتي] [ترقية ←]
```

**Action**: Modal rouge BLOQUANT l'upload

---

## ⚡ APPELS API

### ✅ Cas 1: API OK (25/50)

**Français**
```
✓ 25/50 appels API aujourd'hui
```

**Arabe**
```
✓ 25/50 مكالمة API اليوم
```

**Action**: Aucun message

---

### ❌ Cas 2: Limite API dépassée (50/50)

**Français**
```
🚨 Limite API Atteinte

Vous avez atteint votre limite d'appels API (50/jour).

Utilisation: 50 / 50 (100%)
[████████████████████] 100%

Les fonctionnalités suivantes sont temporairement 
indisponibles:
❌ Recherche juridique IA
❌ Rédaction automatique
❌ Analyse de documents
❌ Traduction

Reset automatique dans: 6h 45min

Options:
1. Attendre le reset (gratuit)
2. Passer au plan Pro (500 appels/jour)

[Attendre] [Passer au Pro →]
```

**Arabe**
```
🚨 تم الوصول إلى حد API

لقد وصلت إلى حد مكالمات API الخاص بك (50/يوم).

الاستخدام: 50 / 50 (100%)
[████████████████████] 100%

الميزات التالية غير متاحة مؤقتاً:
❌ البحث القانوني بالذكاء الاصطناعي
❌ التحرير التلقائي
❌ تحليل المستندات
❌ الترجمة

إعادة التعيين التلقائي خلال: 6 ساعات 45 دقيقة

الخيارات:
1. انتظر إعادة التعيين (مجاني)
2. قم بالترقية إلى الخطة الاحترافية (500 مكالمة/يوم)

[انتظر] [ترقية ←]
```

**Action**: Modal BLOQUANT avec compte à rebours

---

## 📊 RÉSUMÉ DES ACTIONS

| Status | Couleur | Affichage | Blocage |
|--------|---------|-----------|---------|
| ✅ OK | Vert | Aucun | Non |
| ⚠️ WARNING | Jaune | Badge/Banner | Non |
| 🚨 CRITICAL | Orange | Modal | Non |
| ❌ EXCEEDED | Rouge | Modal | **OUI** |

---

**Date**: 8 Mars 2026
**Version**: 1.0
