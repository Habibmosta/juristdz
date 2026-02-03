# Guide de Déploiement Vercel - JuristDZ

## 📋 Prérequis

1. **Compte Vercel** : Créez un compte sur [vercel.com](https://vercel.com)
2. **CLI Vercel** : Installez la CLI Vercel globalement
   ```bash
   npm install -g vercel
   ```

## 🚀 Étapes de Déploiement

### 1. Connexion à Vercel
```bash
vercel login
```

### 2. Configuration du Projet
```bash
vercel
```
Suivez les instructions :
- **Set up and deploy?** → Yes
- **Which scope?** → Votre compte personnel ou équipe
- **Link to existing project?** → No
- **Project name** → `juristdz-ia-juridique` (ou votre choix)
- **Directory** → `./` (racine du projet)
- **Override settings?** → No

### 3. Variables d'Environnement

Configurez les variables d'environnement sur Vercel :

```bash
# Variables essentielles pour le frontend
vercel env add VITE_GEMINI_API_KEY
# Entrez: AIzaSyDo5SPf1lh_7SU812VwweSHyoqCD1ViOGk

vercel env add VITE_GROQ_API_KEY  
# Entrez: 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

vercel env add NODE_ENV
# Entrez: production
```

### 4. Déploiement
```bash
vercel --prod
```

## 📁 Structure de Déploiement

```
dist/
├── index.html          # Point d'entrée
├── assets/
│   ├── index-*.js      # Bundle JavaScript (1.16MB)
│   └── index-*.css     # Styles CSS
└── ...
```

## ⚠️ Points d'Attention

### Bundle Size Warning
- **Taille actuelle** : 1.16MB (large)
- **Recommandation** : Optimiser si nécessaire avec code splitting
- **Impact** : Temps de chargement initial plus long

### Configuration Vercel
- **Framework** : Vite (détection automatique)
- **Build Command** : `yarn build`
- **Output Directory** : `dist`
- **Install Command** : `yarn install`

## 🔧 Configuration Avancée

### Optimisation des Performances
Si vous souhaitez optimiser la taille du bundle :

1. **Code Splitting** dans `vite.config.ts` :
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          markdown: ['react-markdown']
        }
      }
    }
  }
});
```

2. **Lazy Loading** des composants :
```typescript
const LazyComponent = React.lazy(() => import('./Component'));
```

### Domaine Personnalisé
1. Dans le dashboard Vercel → Settings → Domains
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS selon les instructions

## 🌐 URLs de Déploiement

Après déploiement, vous obtiendrez :
- **URL de production** : `https://votre-projet.vercel.app`
- **URLs de preview** : Pour chaque commit/PR
- **Dashboard** : `https://vercel.com/dashboard`

## 🔍 Vérification Post-Déploiement

1. **Fonctionnalités à tester** :
   - ✅ Interface multilingue (FR/AR)
   - ✅ Bouton de traduction avec Gemini AI
   - ✅ Navigation par sujets/historique
   - ✅ Toggle de langue fluide
   - ✅ Chat interface responsive

2. **Performance** :
   - Temps de chargement initial
   - Réactivité de l'interface
   - Fonctionnement des API (Gemini)

## 🐛 Dépannage

### Erreurs Communes

1. **Build Failed** :
   ```bash
   # Nettoyer et rebuilder
   rm -rf dist node_modules
   yarn install
   yarn build
   ```

2. **Variables d'environnement manquantes** :
   ```bash
   vercel env ls  # Lister les variables
   vercel env add VARIABLE_NAME  # Ajouter une variable
   ```

3. **Erreurs de déploiement** :
   ```bash
   vercel logs  # Voir les logs de déploiement
   ```

## 📞 Support

- **Documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)
- **Support Vercel** : [vercel.com/support](https://vercel.com/support)
- **Logs de déploiement** : Dashboard Vercel → Functions → View Logs

---

**Note** : Ce guide suppose que le build local fonctionne correctement. Assurez-vous que `yarn build` s'exécute sans erreur avant le déploiement.