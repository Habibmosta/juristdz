# 🚨 CONFIGURATION VERCEL - ACTION IMMÉDIATE REQUISE

## ❌ Problème Actuel

L'application en production sur Vercel ne peut pas se connecter à Supabase car:
- L'URL Supabase est incorrecte ou manquante
- Les variables d'environnement ne sont pas configurées sur Vercel

**Erreur**: `ERR_NAME_NOT_RESOLVED` sur `fcteljnmcdelbratudnc.supabase.c`  
**Cause**: URL tronquée (manque `.co` à la fin)

---

## ✅ Solution - Configurer les Variables d'Environnement sur Vercel

### Étape 1: Accéder aux Paramètres Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet **juristdz**
4. Cliquez sur **Settings** (Paramètres)
5. Dans le menu latéral, cliquez sur **Environment Variables**

### Étape 2: Ajouter les Variables d'Environnement

Ajoutez ces 5 variables **EXACTEMENT** comme indiqué:

#### Variable 1: VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://fcteljnmcdelbratudnc.supabase.co
Environment: Production, Preview, Development (cocher les 3)
```

#### Variable 2: VITE_SUPABASE_ANON_KEY
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdGVsam5tY2RlbGJyYXR1ZG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTkzMDQsImV4cCI6MjA4NTE5NTMwNH0.jbWM24_1ernpGVHS7i32Jx0W9K7yx8WdCLqq42tzwOo
Environment: Production, Preview, Development (cocher les 3)
```

#### Variable 3: VITE_GROQ_API_KEY
```
Name: VITE_GROQ_API_KEY
Value: [VOTRE_CLE_GROQ_ICI]
Environment: Production, Preview, Development (cocher les 3)
```

#### Variable 4: VITE_GEMINI_API_KEY
```
Name: VITE_GEMINI_API_KEY
Value: [VOTRE_CLE_GEMINI_ICI]
Environment: Production, Preview, Development (cocher les 3)
```

#### Variable 5: VITE_OPENAI_API_KEY
```
Name: VITE_OPENAI_API_KEY
Value: PLACEHOLDER_API_KEY
Environment: Production, Preview, Development (cocher les 3)
```

### Étape 3: Sauvegarder

1. Cliquez sur **Save** après chaque variable
2. Vérifiez que toutes les 5 variables sont bien listées

### Étape 4: Redéployer

**IMPORTANT**: Les variables d'environnement ne sont appliquées qu'au prochain déploiement!

#### Option A: Redéploiement Automatique
1. Allez dans l'onglet **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les 3 points (•••)
4. Cliquez sur **Redeploy**
5. Confirmez

#### Option B: Nouveau Commit (Recommandé)
```bash
# Dans votre terminal local
git commit --allow-empty -m "chore: trigger redeploy with env vars"
git push origin main
```

Vercel redéploiera automatiquement avec les nouvelles variables.

---

## 🔍 Vérification

### Après le Redéploiement

1. Attendez que le déploiement soit terminé (2-3 minutes)
2. Ouvrez votre site en production
3. Ouvrez la console du navigateur (F12)
4. Essayez de vous connecter
5. Vérifiez qu'il n'y a plus d'erreur `ERR_NAME_NOT_RESOLVED`

### Logs à Vérifier

Dans la console, vous devriez voir:
```
✅ Using Multi-User SAAS service for data persistence
✅ Simple translation system ready
🎨 Theme changed to: dark - Dark class: true
```

Et **PAS** d'erreur de type:
```
❌ Failed to load resource: net::ERR_NAME_NOT_RESOLVED
❌ TypeError: Failed to fetch
```

---

## 📸 Captures d'Écran (Guide Visuel)

### 1. Accéder aux Variables d'Environnement
```
Vercel Dashboard
└── Votre Projet (juristdz)
    └── Settings
        └── Environment Variables  ← Cliquez ici
```

### 2. Ajouter une Variable
```
┌─────────────────────────────────────────┐
│ Add New Environment Variable            │
├─────────────────────────────────────────┤
│ Name:  VITE_SUPABASE_URL               │
│ Value: https://fcteljnmcdelbratudnc... │
│                                         │
│ Environment:                            │
│ ☑ Production                           │
│ ☑ Preview                              │
│ ☑ Development                          │
│                                         │
│ [Save]                                  │
└─────────────────────────────────────────┘
```

### 3. Liste Finale
Vous devriez voir ces 5 variables:
```
✓ VITE_SUPABASE_URL
✓ VITE_SUPABASE_ANON_KEY
✓ VITE_GROQ_API_KEY
✓ VITE_GEMINI_API_KEY
✓ VITE_OPENAI_API_KEY
```

---

## ⚠️ Points Importants

### 1. Préfixe VITE_
**CRITIQUE**: Toutes les variables doivent commencer par `VITE_`
- ✅ `VITE_SUPABASE_URL`
- ❌ `SUPABASE_URL`

Vite.js n'expose que les variables avec le préfixe `VITE_` au frontend.

### 2. Environnements
Cochez **les 3 environnements** pour chaque variable:
- Production (site en ligne)
- Preview (branches de test)
- Development (développement local)

### 3. Redéploiement Obligatoire
Les variables ne sont **PAS** appliquées automatiquement. Vous **DEVEZ** redéployer!

### 4. Sensibilité
Les variables sont **sensibles à la casse**:
- ✅ `VITE_SUPABASE_URL`
- ❌ `vite_supabase_url`
- ❌ `Vite_Supabase_Url`

---

## 🐛 Dépannage

### Problème: Variables ajoutées mais erreur persiste

**Solution**:
1. Vérifiez que vous avez bien redéployé
2. Videz le cache du navigateur (Ctrl+Shift+Delete)
3. Rechargez la page en mode incognito
4. Vérifiez les logs de build Vercel

### Problème: "Variable not found" dans les logs Vercel

**Solution**:
1. Vérifiez l'orthographe exacte
2. Vérifiez le préfixe `VITE_`
3. Vérifiez que l'environnement "Production" est coché
4. Supprimez et recréez la variable

### Problème: Build réussit mais erreur au runtime

**Solution**:
1. Les variables sont bien configurées
2. Le problème est ailleurs (vérifiez Supabase)
3. Consultez les logs de la console navigateur

---

## 📋 Checklist de Vérification

Avant de considérer la configuration comme terminée:

- [ ] Les 5 variables sont ajoutées sur Vercel
- [ ] Chaque variable a le préfixe `VITE_`
- [ ] Les 3 environnements sont cochés pour chaque variable
- [ ] Les valeurs sont exactement celles du fichier .env.local
- [ ] Un redéploiement a été effectué
- [ ] Le déploiement est terminé avec succès
- [ ] Le site en production se charge sans erreur
- [ ] La connexion fonctionne
- [ ] Pas d'erreur dans la console du navigateur

---

## 🚀 Commande Rapide (Terminal)

Si vous préférez utiliser Vercel CLI:

```bash
# Installer Vercel CLI (si pas déjà fait)
npm i -g vercel

# Se connecter
vercel login

# Ajouter les variables
vercel env add VITE_SUPABASE_URL production
# Coller: https://fcteljnmcdelbratudnc.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Coller: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add VITE_GROQ_API_KEY production
# Coller: gsk_txwxctoWUM1i0rBDhztIWGdyb3FY...

vercel env add VITE_GEMINI_API_KEY production
# Coller: AIzaSyAvFa1kO9MkT4xZ31_67Cgxv8uJ...

vercel env add VITE_OPENAI_API_KEY production
# Coller: PLACEHOLDER_API_KEY

# Redéployer
vercel --prod
```

---

## 📞 Support

Si le problème persiste après avoir suivi ces étapes:

1. **Vérifiez les logs Vercel**:
   - Allez dans Deployments
   - Cliquez sur le dernier déploiement
   - Consultez les logs de build

2. **Vérifiez Supabase**:
   - Allez sur [app.supabase.com](https://app.supabase.com)
   - Vérifiez que votre projet est actif
   - Vérifiez l'URL et la clé dans Settings > API

3. **Testez localement**:
   ```bash
   npm run build
   npm run preview
   ```
   Si ça fonctionne localement, le problème est bien sur Vercel.

---

## ⏱️ Temps Estimé

- Configuration des variables: 5 minutes
- Redéploiement: 2-3 minutes
- Vérification: 2 minutes

**Total**: ~10 minutes

---

**Date**: 7 mars 2026  
**Priorité**: 🚨 URGENT  
**Status**: Action Requise

🔧 **Suivez ces étapes et votre application fonctionnera en production!**
