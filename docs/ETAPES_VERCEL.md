# 🚀 Déploiement sur Vercel - Guide Pas à Pas

**Votre code est maintenant sur GitHub !** ✅  
**Repo:** https://github.com/Habibmosta/juristdz

---

## 📋 Étape 1: Aller sur Vercel

1. Ouvrez votre navigateur
2. Allez sur **https://vercel.com**
3. Cliquez sur **"Sign Up"** ou **"Log In"**
4. Connectez-vous avec votre compte GitHub

---

## 📋 Étape 2: Importer le Projet

1. Une fois connecté, cliquez sur **"Add New..."** > **"Project"**
2. Vous verrez la liste de vos repos GitHub
3. Trouvez **"juristdz"** dans la liste
4. Cliquez sur **"Import"**

---

## 📋 Étape 3: Configurer le Projet

### Configuration de Base

Vercel détectera automatiquement que c'est un projet Vite. Vérifiez :

- **Framework Preset:** Vite ✅
- **Root Directory:** ./ ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `dist` ✅
- **Install Command:** `npm install` ✅

### Variables d'Environnement

Cliquez sur **"Environment Variables"** et ajoutez :

```
VITE_SUPABASE_URL
https://fcteljnmcdelbratudnc.supabase.co

VITE_SUPABASE_ANON_KEY
your-supabase-anon-key

VITE_GEMINI_API_KEY
your-google-api-key

VITE_GROQ_API_KEY
your-groq-api-key
```

**Important:** Pour chaque variable :
1. Entrez le **nom** (ex: VITE_SUPABASE_URL)
2. Entrez la **valeur**
3. Sélectionnez **Production, Preview, Development**
4. Cliquez sur **"Add"**

---

## 📋 Étape 4: Déployer

1. Une fois toutes les variables ajoutées
2. Cliquez sur **"Deploy"**
3. Attendez 2-5 minutes pendant le build
4. ✅ Votre app sera déployée !

---

## 📋 Étape 5: Obtenir l'URL

Une fois le déploiement terminé :

1. Vous verrez un message **"Congratulations!"**
2. Votre URL sera affichée (ex: `juristdz.vercel.app`)
3. Cliquez sur **"Visit"** pour voir votre app

---

## 📋 Étape 6: Configurer Supabase

### 6.1 Aller sur Supabase

1. Ouvrez https://supabase.com
2. Connectez-vous
3. Sélectionnez votre projet

### 6.2 Configurer les URLs

Allez dans **Authentication** > **URL Configuration** :

**Site URL:**
```
https://votre-app.vercel.app
```
(Remplacez par votre vraie URL Vercel)

**Redirect URLs:**
```
https://votre-app.vercel.app/**
```

### 6.3 Configurer CORS

Allez dans **Settings** > **API** :

Sous **CORS Allowed Origins**, ajoutez :
```
https://votre-app.vercel.app
```

Cliquez sur **"Save"**

---

## 📋 Étape 7: Tester l'Application

1. Ouvrez votre URL Vercel
2. Testez :
   - ✅ La page se charge
   - ✅ Connexion/Inscription fonctionne
   - ✅ Upload de fichiers
   - ✅ Création de dossiers
   - ✅ Pas d'erreurs dans la console

---

## 📋 Étape 8: Créer des Comptes de Test

### Dans Supabase Dashboard

1. Allez dans **Authentication** > **Users**
2. Cliquez sur **"Add user"** > **"Create new user"**
3. Créez 3-5 utilisateurs avec différents rôles :
   - testeur1@juristdz.com (Avocat)
   - testeur2@juristdz.com (Juriste)
   - testeur3@juristdz.com (Étudiant)

---

## 📋 Étape 9: Inviter les Testeurs

### Email Type

```
Bonjour,

Nous testons notre nouveau système de gestion documentaire JuristDZ.

🔗 Application : https://votre-app.vercel.app
👤 Email : testeur@juristdz.com
🔑 Mot de passe : [mot de passe]

Merci de tester pendant 2-3 jours et de nous faire vos retours !

Fonctionnalités à tester :
- Upload de documents
- Organisation en dossiers
- Création de workflows
- Utilisation de templates
- Recherche et filtrage

Cordialement,
L'équipe JuristDZ
```

---

## 📋 Étape 10: Collecter les Feedbacks

### Créer un Google Form

1. Allez sur https://forms.google.com
2. Créez un nouveau formulaire
3. Ajoutez ces questions :
   - Facilité d'utilisation (1-5)
   - Fonctionnalités manquantes
   - Bugs rencontrés
   - Suggestions d'amélioration
   - Commentaires généraux

4. Partagez le lien avec les testeurs

---

## ✅ Checklist Complète

- [ ] Compte Vercel créé
- [ ] Projet importé depuis GitHub
- [ ] Variables d'environnement ajoutées
- [ ] Déploiement réussi
- [ ] URL obtenue
- [ ] Supabase configuré (URLs + CORS)
- [ ] Application testée
- [ ] Comptes de test créés
- [ ] Testeurs invités
- [ ] Formulaire de feedback créé

---

## 🎯 Prochaines Étapes

1. **Attendre les retours** (3-5 jours)
2. **Analyser les feedbacks**
3. **Corriger les bugs critiques**
4. **Améliorer selon les retours**
5. **Nouveau cycle de tests**
6. **Déploiement en production**

---

## 💡 Astuces Vercel

### Voir les Logs
Dashboard > Votre projet > **Deployments** > Cliquez sur un déploiement > **View Function Logs**

### Redéployer
Dashboard > Votre projet > **Deployments** > Trois points > **Redeploy**

### Domaine Personnalisé
Dashboard > Votre projet > **Settings** > **Domains** > **Add Domain**

### Analytics
Dashboard > Votre projet > **Analytics** (gratuit)

---

## 🆘 Problèmes Courants

### Build échoue
- Vérifier les logs de build
- Vérifier que toutes les dépendances sont dans package.json
- Essayer de redéployer

### Variables d'environnement ne fonctionnent pas
- Vérifier qu'elles commencent par `VITE_`
- Redéployer après avoir ajouté les variables

### Erreur 404
- Vérifier que le fichier `vercel.json` existe
- Vérifier la configuration de routing

### Erreur Supabase
- Vérifier les URLs de redirection
- Vérifier CORS
- Vérifier les clés API

---

**Votre application est maintenant en ligne !** 🎉

**URL de votre repo:** https://github.com/Habibmosta/juristdz  
**Prochaine étape:** Déployer sur Vercel en suivant ce guide !
