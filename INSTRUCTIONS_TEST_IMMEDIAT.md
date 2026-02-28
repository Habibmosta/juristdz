# 🚨 INSTRUCTIONS DE TEST IMMÉDIAT

## ⚡ ACTION URGENTE #1: RECHARGEMENT COMPLET

**AVANT DE TESTER**, vous DEVEZ recharger l'application:

### Windows:
```
Ctrl + Shift + R
```

### Mac:
```
Cmd + Shift + R
```

### Alternative:
1. Ouvrir les outils de développement (F12)
2. Cliquer droit sur le bouton de rechargement
3. Sélectionner "Vider le cache et recharger"

**POURQUOI?** Le navigateur utilise peut-être une version en cache avec l'ancien code.

---

## ✅ TEST #1: Acte de Vente (Notaire)

### Étapes:
1. Sélectionner "Acte de Vente Mobilière" ou "Acte de Vente de Fonds de Commerce"
2. Cliquer sur "Ouvrir le formulaire"
3. Remplir TOUS les champs:
   - **Vendeur**: Djahid Abasse, né le 12/01/2000 à Alger, CIN 546321325, Adresse: Tigditt Mostaganem, Profession: commerçant
   - **Acheteur**: Kaddour Bey, né le 13/09/1990 à Mostaganem, CIN 865131654, Adresse: Matmar, Profession: conducteur
   - **Bien**: Fonds de commerce - matériel de lavage d'occasion datant de 2005
   - **Prix**: 5000000 (5 millions)
   - **Mode paiement**: Comptant
   - **Délai livraison**: 30 jours
   - **Garantie**: Libre de toute hypothèque
4. Cliquer sur "Soumettre"
5. Cliquer sur "Générer le document"

### Résultat Attendu:

Le document devrait commencer par:
```
L'an deux mille vingt-six, le vingt-huit février.

PAR-DEVANT NOUS, Maître [Votre nom], Notaire à [Ville], soussigné,

ONT COMPARU:

MONSIEUR Djahid Abasse
Né le douze janvier deux mille à Alger
Demeurant à Tigditt, Mostaganem
Titulaire de la carte d'identité nationale n° 546321325
délivrée le vingt-cinq décembre deux mille quinze
De nationalité algérienne
Profession: commerçant

Ci-après dénommé "LE VENDEUR"

D'UNE PART,

ET:

MONSIEUR Kaddour Bey
Né le treize septembre mil neuf cent quatre-vingt-dix à Mostaganem
...
```

### ❌ CE QUI NE DOIT PLUS APPARAÎTRE:
- ❌ "Monsieur/Madame,, de nationalité algérienne, titulaire de la carte d'identité nationale n°, demeurant à"
- ❌ "Cette vente est consentie et acceptée moyennant le prix principal de Dinars Algériens ()"
- ❌ Clauses vides au début du document
- ❌ "Wilaya de 06" (doit être "Wilaya de Béjaïa" ou le nom complet)

### ✅ CE QUI DOIT APPARAÎTRE:
- ✅ "L'an deux mille vingt-six"
- ✅ "PAR-DEVANT NOUS"
- ✅ "ONT COMPARU"
- ✅ Identités complètes avec toutes les données
- ✅ "5 000 000 DA (CINQ MILLIONS DE DINARS ALGÉRIENS)"
- ✅ "DONT ACTE"
- ✅ "Et après lecture faite, les parties ont signé avec Nous, Notaire"

---

## ✅ TEST #2: Requête de Divorce (Avocat)

### Étapes:
1. Sélectionner "Requête de Divorce"
2. Remplir le formulaire avec des données complètes
3. Générer

### Résultat Attendu:

```
EXPOSÉ DES FAITS

Monsieur [Nom Prénom], né le [date] à [lieu], CIN n° [numéro], demeurant à [adresse], profession: [profession]

Madame [Nom Prénom], née le [date] à [lieu], CIN n° [numéro], demeurant à [adresse], profession: [profession]

[Description des faits]

EN DROIT

Articles 48 et suivants du Code de la Famille...

PAR CES MOTIFS

- Prononcer le divorce entre les époux
- Fixer la pension alimentaire à [montant] DA ([montant en lettres])
- Statuer sur la garde des enfants
- Condamner aux dépens

PIÈCES JOINTES
1. Copie acte de mariage
2. Copies CIN des époux
...
```

### ❌ CE QUI NE DOIT PLUS APPARAÎTRE:
- ❌ Placeholders vides
- ❌ "Monsieur/Madame" indécis
- ❌ Montants vides

---

## ✅ TEST #3: Exploit de Signification (Huissier)

### Étapes:
1. Sélectionner "Exploit de Signification"
2. Remplir le formulaire
3. Générer

### Résultat Attendu:

```
PROCÈS-VERBAL DE SIGNIFICATION

L'an deux mille vingt-six
Le vingt-huit février
À quatorze heures

Nous, Maître [Nom], Huissier de Justice, soussigné,

Avons, à la requête de:
MONSIEUR [Identification complète]

PROCÉDÉ comme suit:

1. DÉPLACEMENT
...

2. SIGNIFICATION
...

DONT PROCÈS-VERBAL

Dressé à [lieu], le [date]

Pour servir et valoir ce que de droit.
```

---

## 🔍 POINTS DE VÉRIFICATION CRITIQUES

Pour CHAQUE document généré, vérifiez:

### 1. Pas de Placeholders Vides
- [ ] Pas de "Monsieur/Madame,,"
- [ ] Pas de "né(e) le à"
- [ ] Pas de "CIN n°," vide
- [ ] Pas de "demeurant à" vide
- [ ] Pas de "Dinars Algériens ()" vide

### 2. Données Complètes
- [ ] Noms et prénoms complets
- [ ] Dates de naissance complètes
- [ ] Lieux de naissance
- [ ] Numéros CIN complets
- [ ] Adresses complètes
- [ ] Professions

### 3. Montants
- [ ] En chiffres: "5 000 000 DA"
- [ ] En lettres: "(CINQ MILLIONS DE DINARS ALGÉRIENS)"
- [ ] Les deux présents

### 4. Structure
- [ ] Pas d'en-tête dupliqué
- [ ] Structure appropriée au type de document
- [ ] Une seule section de signatures
- [ ] Pas de répétitions

### 5. Références Juridiques
- [ ] Articles précis (pas "Article X du Code")
- [ ] Codes corrects (Code de la Famille, Code Civil, etc.)

---

## 🚨 SI LE PROBLÈME PERSISTE

### Scénario 1: Clauses vides toujours présentes

**Cause**: Le cache n'a pas été vidé OU le serveur n'a pas été redémarré

**Solution**:
1. Fermer complètement le navigateur
2. Redémarrer le serveur de développement
3. Rouvrir le navigateur
4. Tester à nouveau

### Scénario 2: Placeholders vides dans le document

**Cause**: Le formulaire n'a pas été rempli complètement

**Solution**:
1. Ouvrir la console (F12)
2. Chercher "Form data being submitted"
3. Vérifier que toutes les données sont présentes
4. Remplir TOUS les champs obligatoires
5. Retester

### Scénario 3: Structure incorrecte

**Cause**: L'IA n'a pas suivi les instructions

**Solution**:
1. Régénérer le document (cliquer à nouveau sur "Générer")
2. L'IA devrait maintenant suivre les nouvelles instructions
3. Si le problème persiste après 2-3 tentatives, me le signaler

---

## 📸 CAPTURE D'ÉCRAN DEMANDÉE

Si le problème persiste, envoyez-moi:

1. **Capture du document généré** (tout le document)
2. **Capture de la console** (F12 → Console)
3. **Données du formulaire** (ce que vous avez rempli)

Cela me permettra de diagnostiquer précisément le problème.

---

## ✅ SUCCÈS ATTENDU

Après le rechargement et le test, vous devriez voir:

- ✅ Documents propres sans placeholders vides
- ✅ Structure professionnelle adaptée au type
- ✅ Données complètes et correctes
- ✅ Montants en chiffres ET en lettres
- ✅ Références juridiques précises
- ✅ Une seule signature à la fin

**Les documents devraient être prêts à être signés et déposés!**

---

**TESTEZ MAINTENANT et faites-moi savoir le résultat!**
