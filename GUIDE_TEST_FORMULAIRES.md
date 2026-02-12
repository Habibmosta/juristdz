# 🧪 Guide de Test des Formulaires AVOCAT

## 🎯 Objectif

Tester les 15 formulaires dynamiques créés pour le rôle AVOCAT et vérifier que:
- Tous les formulaires s'affichent correctement
- Les champs sont visibles et fonctionnels
- Pas de perte de focus lors de la saisie
- La validation fonctionne
- Les données sont bien collectées

## 🚀 Démarrage

### 1. Lancer l'application

```bash
yarn dev
```

L'application devrait démarrer sur http://localhost:5174/

### 2. Se connecter avec le rôle AVOCAT

- Sélectionner "Avocat" dans le sélecteur de rôle
- Aller dans "Rédaction d'Actes"

## ✅ Tests à Effectuer

### Test 1: Vérifier la liste des documents

**Attendu**: Vous devriez voir 15 documents pour avocat:

**DROIT DE LA FAMILLE**
- Requête de Divorce
- Requête Pension Alimentaire
- Requête Garde d'Enfants
- Requête en Succession

**DROIT CIVIL**
- Conclusions Civiles
- Assignation Civile
- Requête Dommages-Intérêts
- Requête d'Expulsion

**DROIT PÉNAL**
- Requête Pénale
- Constitution de Partie Civile
- Mémoire de Défense Pénale

**DROIT COMMERCIAL**
- Requête Commerciale
- Requête en Faillite

**DROIT ADMINISTRATIF**
- Recours Administratif

**PROCÉDURES D'URGENCE**
- Requête en Référé

### Test 2: Tester un formulaire simple (Requête Pension Alimentaire)

1. Cliquer sur "Requête Pension Alimentaire"
2. Cliquer sur "Ouvrir le formulaire de saisie"
3. Vérifier que le formulaire s'affiche avec:
   - Titre: "Requête Pension Alimentaire" / "طلب نفقة"
   - Section Demandeur
   - Section Débiteur
   - Section Bénéficiaires
   - Section Montant demandé

4. Remplir quelques champs:
   - Nom du demandeur: "Benali"
   - Prénom: "Ahmed"
   - CIN: "123456789012345678"
   - Adresse: "Alger"

5. **VÉRIFIER**: Le curseur ne doit PAS perdre le focus entre les caractères

6. Essayer de valider sans remplir les champs requis
   - **ATTENDU**: Message d'erreur de validation HTML5

7. Remplir tous les champs requis et valider
   - **ATTENDU**: Le formulaire se ferme et les données sont enregistrées

### Test 3: Tester un formulaire complexe (Requête de Divorce)

1. Sélectionner "Requête de Divorce"
2. Ouvrir le formulaire
3. Vérifier les sections:
   - Époux
   - Épouse
   - Mariage
   - Type de divorce (dropdown avec Khol, Tatliq, Mubarat)
   - Motifs
   - Enfants

4. Tester le dropdown "Type de divorce"
   - **ATTENDU**: Options en français ET arabe

5. Remplir et valider

### Test 4: Tester un formulaire avec conditions (Requête d'Expulsion)

1. Sélectionner "Requête d'Expulsion"
2. Ouvrir le formulaire
3. Dans "Mises en demeure", sélectionner "Oui"
4. **VÉRIFIER**: Un nouveau champ "Date de la mise en demeure" apparaît
5. Sélectionner "Non"
6. **VÉRIFIER**: Le champ disparaît

### Test 5: Tester le changement de langue

1. Ouvrir n'importe quel formulaire
2. Changer la langue de FR à AR (ou vice versa)
3. **VÉRIFIER**: 
   - Tous les labels changent de langue
   - Les placeholders changent de langue
   - Le titre change de langue
   - Les options des dropdowns changent de langue

### Test 6: Tester tous les formulaires rapidement

Pour chaque formulaire, vérifier:
- ✅ Le formulaire s'ouvre
- ✅ Le titre est correct (FR + AR)
- ✅ Les champs sont visibles (texte noir sur fond blanc)
- ✅ Pas d'erreur console
- ✅ Le formulaire se ferme avec le bouton X

**Liste de vérification rapide:**

1. ✅ Requête Pension Alimentaire
2. ✅ Requête de Divorce
3. ✅ Requête Garde d'Enfants
4. ✅ Requête en Succession
5. ✅ Conclusions Civiles
6. ✅ Assignation Civile
7. ✅ Requête Dommages-Intérêts
8. ✅ Requête d'Expulsion
9. ✅ Requête Pénale
10. ✅ Constitution de Partie Civile
11. ✅ Mémoire de Défense Pénale
12. ✅ Requête Commerciale
13. ✅ Requête en Faillite
14. ✅ Recours Administratif
15. ✅ Requête en Référé

## 🐛 Problèmes Potentiels et Solutions

### Problème: Texte invisible dans les champs

**Solution**: Vérifier que les classes CSS incluent `text-slate-900 dark:text-slate-100`

### Problème: Perte de focus lors de la saisie

**Solution**: Vérifier que `handleChange` utilise `setFormData(prev => ...)`

### Problème: Formulaire ne s'affiche pas

**Vérifier**:
1. Le `templateId` correspond bien au `case` dans le switch
2. Pas d'erreur dans la console
3. Le composant `DynamicLegalForm` est bien importé

### Problème: Validation ne fonctionne pas

**Vérifier**:
1. Les champs requis ont l'attribut `required`
2. Le formulaire utilise `<form onSubmit={handleSubmit}>`
3. Le bouton de validation est de type `submit` ou appelle `handleSubmit`

## 📊 Checklist Finale

Avant de considérer les tests terminés:

- [ ] Tous les 15 formulaires s'ouvrent sans erreur
- [ ] Le texte est visible dans tous les champs
- [ ] Pas de perte de focus lors de la saisie
- [ ] La validation des champs requis fonctionne
- [ ] Le changement de langue fonctionne
- [ ] Les dropdowns affichent les bonnes options
- [ ] Les champs conditionnels apparaissent/disparaissent correctement
- [ ] Aucune erreur dans la console du navigateur
- [ ] Les formulaires se ferment correctement
- [ ] Les données sont bien collectées (vérifier dans le state)

## 🎉 Résultat Attendu

Si tous les tests passent:
- ✅ Les 15 formulaires AVOCAT sont fonctionnels
- ✅ L'expérience utilisateur est fluide
- ✅ L'application est prête pour la production
- ✅ Vous pouvez passer aux formulaires des autres rôles

## 📝 Rapport de Test

Après les tests, noter:
- Formulaires testés: __/15
- Problèmes trouvés: ____
- Problèmes résolus: ____
- Statut global: ✅ OK / ⚠️ Problèmes mineurs / ❌ Problèmes majeurs

---

**Bonne chance avec les tests! 🚀**
