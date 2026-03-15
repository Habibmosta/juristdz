# 🚨 CORRECTIONS URGENTES - Formulaire d'inscription

## PROBLÈME 1: Erreur 429 (Rate Limit) ⚠️

**Cause:** Trop de tentatives d'inscription (max 4/heure)

**Solutions:**
1. **Attendre 1 heure** avant de réessayer
2. **OU utiliser un autre email** pour tester
3. **OU désactiver temporairement le rate limit** dans Supabase:
   - Authentication → Rate Limits
   - Augmenter les limites pour le développement

---

## PROBLÈME 2: Erreur 401 sur profiles ⚠️⚠️⚠️

**Cause:** Politiques RLS manquantes

**Solution IMMÉDIATE:**

1. **Ouvre Supabase SQL Editor**
2. **Copie et exécute** le script `fix-rls-profiles.sql`
3. **Vérifie** que les 3 politiques sont créées

---

## PROBLÈME 3: Formulaire trop long

**Solution temporaire:**

Le formulaire d'inscription est dans une div avec `max-h-[90vh]` et `overflow-y-auto`.

**Pour tester rapidement:**
- Utilise la molette de la souris pour scroller dans le formulaire
- OU zoom out du navigateur (Ctrl + Molette vers le bas)

**Solution permanente:** Je vais créer un formulaire en 2 étapes (à faire après les tests)

---

## PROBLÈME 4: Pas de sélecteur de langue

**Solution temporaire:**
Le formulaire est en français par défaut.

**Solution permanente:** Ajouter un toggle FR/AR en haut (à faire après les tests)

---

## 🎯 ACTIONS IMMÉDIATES

### 1. Exécuter le script RLS (2 min)
```sql
-- Copie le contenu de fix-rls-profiles.sql
-- Exécute dans Supabase SQL Editor
```

### 2. Attendre ou changer d'email (1 min)
- Utilise un autre email: test2@gmail.com, test3@gmail.com, etc.
- OU attends 1 heure

### 3. Réessayer l'inscription
- Scroll dans le formulaire pour voir tous les champs
- Remplis tous les champs obligatoires
- Clique sur "Créer un compte"

---

## ✅ VÉRIFICATION

Après avoir exécuté le script RLS, vérifie:

```sql
-- Voir les politiques sur profiles
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
```

**Résultat attendu:**
```
Users can insert their own profile | INSERT
Users can view their own profile   | SELECT
Users can update their own profile | UPDATE
```

---

## 🚀 APRÈS CORRECTION

Une fois que l'inscription fonctionne, on pourra:
1. Améliorer le formulaire (2 étapes)
2. Ajouter le sélecteur de langue
3. Améliorer le responsive

**Mais d'abord, faisons fonctionner l'inscription!**

---

**PRIORITÉ 1:** Exécute `fix-rls-profiles.sql` MAINTENANT!
