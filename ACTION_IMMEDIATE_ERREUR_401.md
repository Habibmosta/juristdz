# 🚨 ACTION IMMÉDIATE: Corriger l'Erreur 401 lors de l'Inscription

## ⚡ Solution Rapide (5 minutes)

### Étape 1: Diagnostic (1 min)
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier/coller le contenu de `database/diagnostic-rls-policies.sql`
3. Cliquer sur "Run"
4. Vérifier les résultats

### Étape 2: Correction (2 min)
1. Dans SQL Editor, nouvelle requête
2. Copier/coller le contenu de `database/fix-signup-policies-complete.sql`
3. Cliquer sur "Run"
4. Attendre la fin de l'exécution

### Étape 3: Vérification (2 min)
1. Rafraîchir votre application (Ctrl+F5)
2. Tester l'inscription avec un nouvel email
3. ✅ Vérifier qu'il n'y a plus d'erreur 401
4. ✅ Vérifier que le modal de vérification s'affiche

---

## 📋 Fichiers Créés

### Scripts SQL
1. **database/diagnostic-rls-policies.sql**
   - Diagnostic complet des politiques RLS
   - Identifie les problèmes
   - Affiche un résumé clair

2. **database/fix-signup-policies-complete.sql**
   - Corrige toutes les politiques en une fois
   - Nettoie les doublons
   - Configure correctement profiles et subscriptions

3. **database/fix-profile-insert-policy.sql**
   - Correction spécifique pour profiles
   - Peut être utilisé séparément si besoin

4. **database/fix-subscriptions-insert-policy.sql**
   - Correction spécifique pour subscriptions
   - Peut être utilisé séparément si besoin

### Documentation
5. **FIX_ERREUR_401_INSCRIPTION.md**
   - Guide complet étape par étape
   - Explications détaillées
   - Dépannage et tests

---

## 🎯 Que Font Ces Scripts ?

### Problème Identifié
```
❌ Erreur 401 lors de l'inscription
❌ "Profile creation error"
❌ L'utilisateur ne peut pas créer son profil
```

### Cause
Les politiques RLS (Row Level Security) empêchent un utilisateur nouvellement inscrit d'insérer son propre profil dans la base de données.

### Solution
Créer des politiques qui permettent:
1. ✅ À un utilisateur authentifié d'insérer son propre profil
2. ✅ À un utilisateur authentifié d'insérer sa propre subscription
3. ✅ À un utilisateur de lire son propre profil
4. ✅ Aux admins de tout gérer

---

## 🔍 Vérification Rapide

### Dans Supabase Dashboard

**Table Editor → profiles:**
- Vérifier que le nouveau profil existe
- `is_active` devrait être `false`
- `is_admin` devrait être `false`

**Table Editor → subscriptions:**
- Vérifier que la subscription existe
- `status` devrait être `pending`
- `is_active` devrait être `false`

**SQL Editor → Exécuter:**
```sql
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles';
-- Résultat attendu: 7

SELECT COUNT(*) FROM pg_policies WHERE tablename = 'subscriptions';
-- Résultat attendu: 7
```

---

## 🚨 Si Ça Ne Marche Toujours Pas

### 1. Vérifier les Logs
**Supabase Dashboard → Logs → Auth**
- Chercher les erreurs récentes
- Noter le message d'erreur exact

### 2. Vérifier la Console Navigateur
**F12 → Console**
- Chercher les erreurs 401
- Noter l'URL qui échoue
- Vérifier le message d'erreur complet

### 3. Vérifier la Fonction is_admin()
```sql
-- Dans SQL Editor
SELECT proname FROM pg_proc WHERE proname = 'is_admin';
-- Si vide, la fonction n'existe pas
```

**Si la fonction n'existe pas:**
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_admin 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Réinitialiser Complètement les Politiques

**⚠️ ATTENTION: Cela supprime TOUTES les politiques**

```sql
-- Supprimer toutes les politiques profiles
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
  END LOOP;
END $$;

-- Supprimer toutes les politiques subscriptions
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subscriptions') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON subscriptions';
  END LOOP;
END $$;

-- Puis exécuter fix-signup-policies-complete.sql
```

---

## ✅ Checklist de Vérification

Après avoir appliqué le fix:

- [ ] Script de diagnostic exécuté
- [ ] Script de correction exécuté
- [ ] 7 politiques pour profiles
- [ ] 7 politiques pour subscriptions
- [ ] RLS activé sur les deux tables
- [ ] Fonction is_admin() existe
- [ ] Application rafraîchie (Ctrl+F5)
- [ ] Test d'inscription réussi
- [ ] Pas d'erreur 401 dans la console
- [ ] Modal de vérification affiché
- [ ] Profil créé dans la DB
- [ ] Subscription créée dans la DB

---

## 📊 Résultat Attendu

### Avant le Fix
```javascript
// Console
❌ Failed to load resource: 401
❌ Profile creation error: Object
```

### Après le Fix
```javascript
// Console
✅ Using Multi-User SAAS service
✅ Simple translation system ready
✅ Theme changed to: dark
// Pas d'erreur 401
```

### Dans l'Application
1. ✅ Formulaire d'inscription rempli
2. ✅ Clic sur "Créer mon compte"
3. ✅ Modal de vérification d'email affiché
4. ✅ Message de succès
5. ✅ Email de confirmation reçu

---

## 🎯 Prochaines Étapes

Une fois l'inscription fonctionnelle:

1. **Tester le flux complet:**
   - Inscription → Email → Confirmation → Attente validation admin

2. **Tester la validation admin:**
   - Se connecter en tant qu'admin
   - Aller dans "Comptes en Attente"
   - Activer le nouveau compte
   - Vérifier que l'utilisateur peut se connecter

3. **Tester les limites du trial:**
   - Créer 3 dossiers (limite)
   - Créer 5 clients (limite)
   - Vérifier que les limites sont respectées

---

## 📞 Support

Si vous avez encore des problèmes après avoir suivi toutes ces étapes:

1. Exécuter le script de diagnostic
2. Copier tous les résultats
3. Copier les erreurs de la console
4. Copier les logs Supabase
5. Documenter les étapes exactes qui causent l'erreur

Le problème devrait être résolu! 🎉
