# 🧪 Guide de Test - Option C Complète

## 🎯 Objectif

Tester la génération complète de documents juridiques professionnels avec:
- En-tête professionnel
- Corps du document
- Signature professionnelle
- Pièces jointes

---

## 📋 Scénario de Test 1: Avocat - Requête en Garde d'Enfants

### Étape 1: Accéder à l'interface
1. Ouvrir l'application JuristDZ
2. Se connecter en tant qu'Avocat
3. Aller dans "Rédaction" ou "Drafting"

### Étape 2: Configurer le profil professionnel
1. Cliquer sur le bouton **doré avec icône utilisateur** (en haut à droite)
2. Remplir le formulaire:
   - **Nom**: Belkacemi
   - **Prénom**: Habib
   - **Barreau d'inscription**: Barreau de Béjaïa
   - **N° d'inscription**: A/2456/2018
   - **Adresse du cabinet**: 15 Rue Didouche Mourad, Béjaïa
   - **Téléphone**: +213 34 21 XX XX
   - **Email**: h.belkacemi@avocat-dz.com
   - **Wilaya d'exercice**: Béjaïa
3. Cliquer sur "Enregistrer"
4. Vérifier le message de confirmation

### Étape 3: Sélectionner le modèle
1. Dans l'onglet "Modèle", choisir: **"Requête en Garde d'Enfants"**

### Étape 4: Sélectionner la Wilaya
1. Dans l'onglet "Wilaya", choisir: **"06 - Béjaïa"**
2. Sélectionner le tribunal: **"Tribunal de Béjaïa"**

### Étape 5: Remplir le formulaire
1. Cliquer sur "Ouvrir le formulaire"
2. Remplir les informations du demandeur:
   - **Nom**: Djillali
   - **Prénom**: Ahmed
   - **Date de naissance**: 21/06/1990
   - **Lieu de naissance**: Tiaret
   - **CIN**: 65312321
   - **Adresse**: Tamourassen
   - **Profession**: Taxieur
3. Remplir les informations de l'enfant:
   - **Nom**: Fatima
   - **Date de naissance**: 05/12/2020 (pour avoir 5 ans en 2026)
   - **Lieu de naissance**: Tiaret
4. Remplir les informations de la mère:
   - **Nom**: Fettah
   - **Prénom**: Djija
   - **Date de naissance**: 18/05/2000
   - **CIN**: 97613131
   - **Adresse**: Tadmait
   - **Profession**: Au foyer
5. Cliquer sur "Soumettre"

### Étape 6: Générer le document
1. Cliquer sur le bouton **"Générer"** (bouton doré en bas)
2. Attendre la génération (quelques secondes)

### Étape 7: Vérifier le document généré

#### ✅ Vérifications à faire:

**1. En-tête professionnel** (en haut du document):
```
RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
MINISTÈRE DE LA JUSTICE

Tribunal de Béjaïa
Wilaya de Béjaïa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Maître Habib BELKACEMI
Avocat inscrit au Barreau de Béjaïa
N° d'inscription: A/2456/2018
Cabinet Maître Belkacemi
15 Rue Didouche Mourad, Béjaïa
Tél: +213 34 21 XX XX
Email: h.belkacemi@avocat-dz.com

À Monsieur le Président du Tribunal de Béjaïa

Objet: Requête en garde d'enfants
Référence: [...]

Béjaïa, le 28 février 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**2. Corps du document**:
- ✅ Titre: "REQUÊTE EN GARDE D'ENFANTS"
- ✅ Identification du demandeur: "Monsieur Ahmed Djillali, né le 21/06/1990 à Tiaret..."
- ✅ Identification de l'enfant: "Fatima, âgée de 5 ans, née le 05/12/2020"
- ✅ Identification de la mère: "Madame Djija Fettah..."
- ✅ Pas de placeholders entre crochets []
- ✅ Genre correct: "sa fille Fatima" (pas "son fils")
- ✅ Âge correct: "5 ans" (calculé depuis 2020)

**3. Signature professionnelle** (en bas du document):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fait à Béjaïa, le 28 février 2026

Signature et cachet

Maître Habib BELKACEMI
Avocat au Barreau de Béjaïa
N° A/2456/2018

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PIÈCES JOINTES:
1. Copie CIN du demandeur
2. Actes de naissance des enfants
3. Certificat de résidence
4. Justificatifs de revenus
```

---

## 📋 Scénario de Test 2: Notaire - Acte de Vente

### Étape 1: Configurer le profil professionnel
1. Cliquer sur le bouton **doré avec icône utilisateur**
2. Remplir le formulaire:
   - **Nom**: Benali
   - **Prénom**: Karim
   - **Chambre Notariale**: Chambre Notariale de Constantine
   - **N° de matricule**: N/1234/2015
   - **Adresse de l'étude**: 25 Boulevard de l'Indépendance, Constantine
   - **Téléphone**: +213 31 XX XX XX
   - **Email**: k.benali@notaire-dz.com
   - **Wilaya d'exercice**: Constantine
3. Cliquer sur "Enregistrer"

### Étape 2: Sélectionner le modèle
1. Choisir: **"Acte de Vente de Fonds de Commerce"**

### Étape 3: Sélectionner la Wilaya
1. Choisir: **"25 - Constantine"**

### Étape 4: Remplir le formulaire
1. Remplir les informations du cédant (vendeur)
2. Remplir les informations du cessionnaire (acheteur)
3. Remplir les détails du fonds de commerce

### Étape 5: Générer et vérifier
1. Cliquer sur "Générer"
2. Vérifier:
   - ✅ En-tête avec "Maître Karim BENALI, Notaire assermenté"
   - ✅ Corps de l'acte
   - ✅ Signature: "Maître Karim BENALI, Notaire assermenté, N° de matricule: N/1234/2015"
   - ✅ Pièces jointes appropriées pour un acte de vente

---

## 📋 Scénario de Test 3: Huissier - Exploit d'Assignation

### Étape 1: Configurer le profil professionnel
1. Cliquer sur le bouton **doré avec icône utilisateur**
2. Remplir le formulaire:
   - **Nom**: Khelifi
   - **Prénom**: Rachid
   - **Chambre des Huissiers**: Chambre Nationale des Huissiers de Justice
   - **N° d'agrément**: H/789/2017
   - **Adresse du bureau**: 10 Rue Larbi Ben M'hidi, Oran
   - **Téléphone**: +213 41 XX XX XX
   - **Email**: r.khelifi@huissier-dz.com
   - **Wilaya d'exercice**: Oran
3. Cliquer sur "Enregistrer"

### Étape 2: Sélectionner le modèle
1. Choisir: **"Exploit d'Assignation"**

### Étape 3: Sélectionner la Wilaya
1. Choisir: **"31 - Oran"**

### Étape 4: Remplir le formulaire
1. Remplir les informations du demandeur
2. Remplir les informations du défendeur
3. Remplir les détails de l'assignation

### Étape 5: Générer et vérifier
1. Cliquer sur "Générer"
2. Vérifier:
   - ✅ En-tête avec "Maître Rachid KHELIFI, Huissier de Justice assermenté"
   - ✅ Corps de l'exploit
   - ✅ Signature: "Maître Rachid KHELIFI, Huissier de Justice assermenté, N° d'agrément: H/789/2017"
   - ✅ Pièces jointes appropriées pour un exploit

---

## 🔍 Points de Vérification Critiques

### ❌ Erreurs à NE PAS voir:
- [ ] Placeholders entre crochets: `[NOM]`, `[PRENOM]`, `[DATE_NAISSANCE]`
- [ ] En-têtes vides: "Monsieur/Madame, né(e) le à"
- [ ] Incohérences de genre: "son fils Fatima" (Fatima est féminin)
- [ ] Incohérences d'âge: "5 ans, né le 05/12/2001" (devrait être 23 ans)
- [ ] "Wilaya de 06" (devrait être "Wilaya de Béjaïa")
- [ ] Absence de signature professionnelle
- [ ] Absence de pièces jointes

### ✅ Éléments à VOIR:
- [x] En-tête professionnel complet avec logo/en-tête officiel
- [x] Identification du professionnel (Maître X, Avocat/Notaire/Huissier)
- [x] Destinataire clairement identifié
- [x] Objet et référence
- [x] Date et lieu
- [x] Corps du document sans placeholders
- [x] Signature professionnelle avec identité complète
- [x] Liste des pièces jointes standard

---

## 🐛 Problèmes Connus et Solutions

### Problème 1: "Profil incomplet"
**Symptôme**: Alert "Veuillez compléter votre profil professionnel"
**Solution**: Cliquer sur le bouton doré (icône utilisateur) et remplir tous les champs obligatoires

### Problème 2: Placeholders restants
**Symptôme**: Document contient `[NOM]` ou `[PRENOM]`
**Solution**: Vérifier que le formulaire a été rempli et soumis correctement

### Problème 3: Signature manquante
**Symptôme**: Document se termine sans signature
**Solution**: Vérifier que le profil professionnel est complet (tous les champs obligatoires)

---

## 📊 Rapport de Test

Après avoir effectué les tests, remplir ce rapport:

### Test 1: Avocat - Requête en Garde d'Enfants
- [ ] En-tête professionnel présent et correct
- [ ] Corps du document sans placeholders
- [ ] Signature professionnelle présente
- [ ] Pièces jointes listées
- [ ] Document prêt pour le tribunal

### Test 2: Notaire - Acte de Vente
- [ ] En-tête professionnel présent et correct
- [ ] Corps du document sans placeholders
- [ ] Signature professionnelle présente
- [ ] Pièces jointes listées
- [ ] Document prêt pour le tribunal

### Test 3: Huissier - Exploit d'Assignation
- [ ] En-tête professionnel présent et correct
- [ ] Corps du document sans placeholders
- [ ] Signature professionnelle présente
- [ ] Pièces jointes listées
- [ ] Document prêt pour le tribunal

---

## ✅ Conclusion

Si tous les tests passent, l'application est **PRÊTE POUR LES TESTS PROFESSIONNELS** chez les avocats, notaires et huissiers.

Les documents générés sont maintenant **dignes d'être déposés au tribunal** avec:
- Structure officielle complète
- Identification professionnelle
- Signature et cachet
- Pièces jointes requises

**Bon test!** 🎉
