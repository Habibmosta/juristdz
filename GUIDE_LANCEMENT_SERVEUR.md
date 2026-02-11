# Guide de Lancement du Serveur - JuristDZ

## 🚀 Pour Tester les Nouveaux Formulaires Professionnels

### Méthode 1: Lancement Manuel (Recommandé)

1. **Ouvrir un terminal PowerShell ou CMD**
   - Appuyez sur `Win + R`
   - Tapez `powershell` ou `cmd`
   - Appuyez sur Entrée

2. **Naviguer vers le projet**
   ```bash
   cd "C:\Users\SERVICE-INFO\Downloads\juristdz-ia-juridique-algérienne"
   ```

3. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

4. **Ouvrir le navigateur**
   - Le serveur devrait démarrer sur `http://localhost:5173`
   - Ouvrez cette URL dans votre navigateur

### Méthode 2: Si npm run dev ne fonctionne pas

Si vous avez l'erreur "Le chemin d'accès spécifié est introuvable", essayez:

```bash
# Réinstaller les dépendances
npm install --force

# Puis lancer
npm run dev
```

### Méthode 3: Utiliser Vercel (Production)

Si le serveur local ne fonctionne pas, vous pouvez tester directement sur Vercel:

1. Le code a déjà été poussé sur GitHub
2. Vercel devrait automatiquement déployer
3. Accédez à votre URL Vercel

---

## 🎯 Ce Que Vous Allez Voir

### Nouveaux Formulaires Professionnels

Quand vous ouvrez l'application:

1. **Aller dans "Rédaction"**
2. **Sélectionner "Acte de Vente Immobilière"**
3. **Vous verrez le NOUVEAU formulaire avec:**

#### ✅ Barre de Progression (5 Étapes)
```
[Vendeur] → [Acheteur] → [Bien] → [Prix] → [Garanties]
```

#### ✅ Validation en Temps Réel
- ✓ Icône verte quand le champ est valide
- ✗ Icône rouge avec message d'erreur si invalide
- Exemples: "CIN doit contenir exactement 18 chiffres"

#### ✅ Aide Contextuelle
- Cliquez sur le `?` à côté de chaque champ
- Voir: Description, Exemple, Référence légale

#### ✅ Champs Professionnels

**Étape 1 - Vendeur:**
- Nom et prénom (validation lettres uniquement)
- Filiation complète (père et mère) - OBLIGATOIRE
- CIN (18 chiffres exactement)
- Date et lieu de naissance
- Adresse complète avec commune et wilaya
- Téléphone (format algérien: 05XX, 06XX, 07XX)

**Étape 2 - Acheteur:**
- Mêmes informations que le vendeur

**Étape 3 - Bien:**
- Nature du bien (Appartement, Villa, Terrain, Local commercial)
- Superficie en m²
- Adresse du bien
- Références cadastrales
- Numéro titre foncier

**Étape 4 - Prix:**
- Montant en DA
- **NOUVEAU**: Conversion automatique en lettres!
  - Ex: 5000000 → "cinq millions dinars algériens"
- Modalité de paiement
- Date de signature

**Étape 5 - Garanties:**
- Garantie d'éviction
- Garantie des vices cachés
- Servitudes
- Charges

---

## 🎨 Design Professionnel

### Avant (Ancien Formulaire)
```
❌ Tous les champs en vrac
❌ Pas de validation
❌ Pas d'aide
❌ Interface basique
```

### Après (Nouveau Formulaire)
```
✅ Progression par étapes
✅ Validation temps réel
✅ Aide contextuelle
✅ Design moderne
✅ Feedback visuel
✅ Conforme codes algériens
```

---

## 🐛 Dépannage

### Erreur: "Le chemin d'accès spécifié est introuvable"

**Solution 1:**
```bash
npm cache clean --force
npm install --force
npm run dev
```

**Solution 2:**
```bash
# Supprimer node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Réinstaller
npm install
npm run dev
```

**Solution 3:**
Utiliser yarn au lieu de npm:
```bash
npm install -g yarn
yarn install
yarn dev
```

### Port 5173 déjà utilisé

```bash
# Tuer le processus sur le port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Ou utiliser un autre port
npm run dev -- --port 3000
```

---

## 📱 Test sur Mobile

Pour tester sur mobile (même réseau WiFi):

1. Trouver votre IP locale:
   ```bash
   ipconfig
   ```
   Cherchez "Adresse IPv4" (ex: 192.168.1.100)

2. Sur mobile, ouvrir:
   ```
   http://192.168.1.100:5173
   ```

---

## ✅ Checklist de Test

Une fois le serveur lancé, testez:

- [ ] Ouvrir l'application
- [ ] Aller dans "Rédaction"
- [ ] Sélectionner "Acte de Vente Immobilière"
- [ ] Voir la barre de progression (5 étapes)
- [ ] Remplir le nom (tester validation)
- [ ] Remplir CIN avec moins de 18 chiffres (voir erreur)
- [ ] Remplir CIN avec 18 chiffres (voir ✓ vert)
- [ ] Cliquer sur `?` pour voir l'aide
- [ ] Remplir un montant (voir conversion en lettres)
- [ ] Naviguer entre les étapes
- [ ] Tester en arabe (changer la langue)

---

## 🎉 Résultat Attendu

Vous devriez voir un formulaire **PROFESSIONNEL** qui:
- Guide l'utilisateur étape par étape
- Valide chaque champ en temps réel
- Affiche des messages d'erreur clairs
- Fournit de l'aide contextuelle
- Convertit automatiquement les montants en lettres
- Est conforme aux codes juridiques algériens

**C'est maintenant une application digne d'un cabinet juridique professionnel!**

