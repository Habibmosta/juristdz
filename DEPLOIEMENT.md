# 🚀 Déploiement JuristDZ

## ✅ Git Push Réussi

Le code a été poussé sur GitHub avec succès:
- **Commit**: `8754c5d`
- **Branch**: `main`
- **Fichiers modifiés**: 19 fichiers
- **Insertions**: 4116 lignes
- **Repository**: `github.com:Habibmosta/juristdz.git`

---

## 🌐 Options de Déploiement

### Option 1: Vercel (Recommandé)

**Avantages**:
- Déploiement automatique depuis GitHub
- HTTPS gratuit
- CDN global
- Très rapide

**Étapes**:

1. **Aller sur Vercel**
   - https://vercel.com
   - Se connecter avec GitHub

2. **Importer le projet**
   - Cliquer sur "New Project"
   - Sélectionner le repository `juristdz`
   - Cliquer sur "Import"

3. **Configuration**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Variables d'environnement**
   Ajouter dans Vercel:
   ```
   VITE_GROQ_API_KEY=gsk_txwxctoWUM1...
   VITE_SUPABASE_URL=https://fcteljnmcdelbratudnc.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. **Déployer**
   - Cliquer sur "Deploy"
   - Attendre 2-3 minutes
   - Votre site sera disponible sur `https://juristdz.vercel.app`

**Déploiement automatique**: Chaque push sur `main` déclenchera un nouveau déploiement.

---

### Option 2: Netlify

**Avantages**:
- Interface simple
- Déploiement automatique
- Formulaires intégrés

**Étapes**:

1. **Aller sur Netlify**
   - https://netlify.com
   - Se connecter avec GitHub

2. **Nouveau site**
   - "Add new site" → "Import an existing project"
   - Sélectionner GitHub
   - Choisir `juristdz`

3. **Configuration**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

4. **Variables d'environnement**
   - Settings → Environment variables
   - Ajouter les mêmes variables que Vercel

5. **Déployer**
   - Cliquer sur "Deploy site"
   - Site disponible sur `https://juristdz.netlify.app`

---

### Option 3: GitHub Pages

**Avantages**:
- Gratuit
- Intégré à GitHub

**Étapes**:

1. **Installer gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Modifier package.json**
   Ajouter:
   ```json
   {
     "homepage": "https://habibmosta.github.io/juristdz",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Déployer**
   ```bash
   npm run deploy
   ```

4. **Activer GitHub Pages**
   - Repository → Settings → Pages
   - Source: `gh-pages` branch
   - Save

**Note**: Les variables d'environnement doivent être dans le code pour GitHub Pages (pas recommandé pour les clés API).

---

### Option 4: Serveur VPS (Production)

**Avantages**:
- Contrôle total
- Pas de limites
- Domaine personnalisé

**Étapes**:

1. **Préparer le serveur**
   ```bash
   # Sur le serveur
   sudo apt update
   sudo apt install nginx nodejs npm
   ```

2. **Cloner le repository**
   ```bash
   cd /var/www
   git clone https://github.com/Habibmosta/juristdz.git
   cd juristdz
   ```

3. **Installer et builder**
   ```bash
   npm install
   npm run build
   ```

4. **Configurer Nginx**
   ```nginx
   server {
       listen 80;
       server_name juristdz.com;
       root /var/www/juristdz/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

5. **Redémarrer Nginx**
   ```bash
   sudo systemctl restart nginx
   ```

6. **HTTPS avec Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d juristdz.com
   ```

---

## 🔧 Configuration Post-Déploiement

### 1. Vérifier les Variables d'Environnement

Assurez-vous que ces variables sont configurées:
- `VITE_GROQ_API_KEY` - Pour la génération et traduction
- `VITE_SUPABASE_URL` - Pour la base de données
- `VITE_SUPABASE_ANON_KEY` - Pour l'authentification

### 2. Tester les Fonctionnalités

Après le déploiement, testez:
- ✅ Génération de documents
- ✅ Traduction FR ↔ AR
- ✅ Formulaires
- ✅ Sauvegarde des données

### 3. Configurer le Domaine Personnalisé

Si vous avez un domaine (ex: juristdz.com):

**Sur Vercel**:
- Settings → Domains
- Ajouter votre domaine
- Configurer les DNS

**Sur Netlify**:
- Domain settings → Add custom domain
- Suivre les instructions DNS

---

## 📊 Monitoring

### Vercel Analytics

Activer dans le dashboard Vercel:
- Nombre de visiteurs
- Performance
- Erreurs

### Logs

Vérifier les logs pour détecter les erreurs:
- Vercel: Dashboard → Logs
- Netlify: Deploys → Function logs

---

## 🚨 Rollback en Cas de Problème

### Sur Vercel/Netlify

1. Aller dans Deployments
2. Trouver le déploiement précédent
3. Cliquer sur "Rollback"

### Sur Git

```bash
git revert HEAD
git push origin main
```

---

## ✅ Checklist de Déploiement

- [ ] Code poussé sur GitHub
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Site accessible
- [ ] Génération de documents fonctionne
- [ ] Traduction fonctionne
- [ ] Formulaires fonctionnent
- [ ] Responsive (mobile/desktop)
- [ ] HTTPS activé
- [ ] Domaine configuré (optionnel)

---

## 🎯 Recommandation

**Pour un déploiement rapide**: Utilisez **Vercel**
- Déploiement en 5 minutes
- Automatique depuis GitHub
- Gratuit pour les projets personnels
- Performance excellente

**Commande rapide**:
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Suivre les instructions
```

---

**Date**: 28 février 2026
**Commit**: 8754c5d
**Status**: ✅ Prêt pour le déploiement
