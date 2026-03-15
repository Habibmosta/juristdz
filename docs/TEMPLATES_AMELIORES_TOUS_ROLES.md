# 📝 Templates Améliorés - TOUS LES RÔLES

## Principe Général

TOUS les templates doivent suivre ces règles:

### ✅ RÈGLES UNIVERSELLES

1. **PAS de placeholders vides** - Utiliser les données du formulaire
2. **Structure professionnelle** - Adaptée au type de document
3. **Références juridiques précises** - Articles exacts du code applicable
4. **Données complètes** - Noms complets, dates, adresses, montants
5. **Ton professionnel** - Adapté au destinataire
6. **Une seule section de signatures** - À la fin du document
7. **Pièces jointes listées** - Numérotées et précises

---

## 🎯 AVOCATS - Requêtes et Conclusions

### Structure Standard pour Requêtes

```
[EN-TÊTE PROFESSIONNEL DÉJÀ GÉNÉRÉ]

EXPOSÉ DES FAITS
- Chronologie claire
- Identités complètes des parties
- Contexte factuel précis
- Éléments de preuve

EN DROIT
- Fondements juridiques
- Articles applicables
- Jurisprudence si pertinente
- Principes généraux

PAR CES MOTIFS
- Demandes claires et chiffrées
- Formulation juridique précise
- Demandes principales et accessoires

PIÈCES JOINTES
1. [Liste numérotée]
2. [Documents précis]

[SIGNATURE PROFESSIONNELLE DÉJÀ GÉNÉRÉE]
```

### Prompt Type pour Requête

```typescript
prompt: `Rédigez une REQUÊTE [TYPE] conforme au [CODE APPLICABLE].

⚠️ IMPORTANT: Un en-tête professionnel a déjà été généré. NE GÉNÉREZ PAS d'en-tête.

STRUCTURE OBLIGATOIRE:

1. EXPOSÉ DES FAITS
- Identité complète du demandeur: [Nom Prénom], né(e) le [date] à [lieu], CIN n° [numéro], demeurant à [adresse], profession: [profession]
- Identité complète du défendeur: [même structure]
- Contexte factuel: [description chronologique]
- Préjudice subi: [description précise]

2. EN DROIT
- [Code applicable]: Articles [numéros précis]
- Jurisprudence: [si applicable]
- Principes: [fondements juridiques]

3. PAR CES MOTIFS
Demandes:
- [Demande principale avec montant si applicable]
- [Demandes accessoires]
- Condamner le défendeur aux dépens

4. PIÈCES JOINTES
1. Copie CIN du demandeur
2. [Autres pièces numérotées]

⚠️ RÈGLES CRITIQUES:
- Utilisez les VRAIES données du formulaire
- PAS de placeholders []
- Montants en chiffres ET en toutes lettres
- Références juridiques EXACTES
- Ton respectueux et professionnel
- Une seule section de signatures`,
```

---

## 📜 NOTAIRES - Actes Authentiques

### Structure Standard pour Actes Notariés

```
[EN-TÊTE PROFESSIONNEL DÉJÀ GÉNÉRÉ]

L'an [année en toutes lettres]
Le [date en toutes lettres]

PAR-DEVANT NOUS, Maître [Nom], Notaire à [Ville], soussigné,

ONT COMPARU:

MONSIEUR/MADAME [Identification complète]
Ci-après dénommé "LE [RÔLE]"
D'UNE PART,

ET:

MONSIEUR/MADAME [Identification complète]
Ci-après dénommé "LE [RÔLE]"
D'AUTRE PART,

LESQUELS ONT DÉCLARÉ ET RECONNU CE QUI SUIT:

ARTICLE PREMIER - [OBJET]
ARTICLE DEUX - [PRIX/CONDITIONS]
ARTICLE TROIS - [GARANTIES]
ARTICLE QUATRE - [MODALITÉS]

DONT ACTE

Fait et passé à [Ville]
Le [date en toutes lettres]

Et après lecture faite, les parties ont signé avec Nous, Notaire.

[SIGNATURE PROFESSIONNELLE DÉJÀ GÉNÉRÉE]
```

### Prompt Type pour Acte Notarié

```typescript
prompt: `Rédigez un ACTE [TYPE] conforme aux standards algériens.

⚠️ IMPORTANT: Un en-tête professionnel a déjà été généré. NE GÉNÉREZ PAS d'en-tête.

COMMENCEZ DIRECTEMENT PAR:

L'an [année en toutes lettres]
Le [date en toutes lettres]

PAR-DEVANT NOUS, Maître [Nom du Notaire], Notaire à [Ville], soussigné,

ONT COMPARU:

[Identification complète des parties avec TOUTES les informations]

LESQUELS ONT DÉCLARÉ ET RECONNU CE QUI SUIT:

ARTICLE PREMIER - [OBJET]
ARTICLE DEUX - [PRIX/CONDITIONS]
ARTICLE TROIS - [GARANTIES]
ARTICLE QUATRE - [MODALITÉS]

DONT ACTE

Fait et passé à [Ville]
Le [date en toutes lettres]

Et après lecture faite, les parties ont signé avec Nous, Notaire.

⚠️ RÈGLES ABSOLUES:
- Dates EN TOUTES LETTRES
- Montants EN CHIFFRES ET EN TOUTES LETTRES
- Identification COMPLÈTE des parties
- Formules notariales OBLIGATOIRES
- PAS de placeholders []
- Articles numérotés en toutes lettres`,
```

---

## ⚖️ HUISSIERS - Exploits et Procès-Verbaux

### Structure Standard pour Exploits

```
[EN-TÊTE PROFESSIONNEL DÉJÀ GÉNÉRÉ]

PROCÈS-VERBAL DE [TYPE]

L'an [année en toutes lettres]
Le [date en toutes lettres]
À [heure] heures

Nous, Maître [Nom], Huissier de Justice près le [Tribunal], soussigné,

Avons, à la requête de:
MONSIEUR/MADAME [Identification complète du requérant]

PROCÉDÉ comme suit:

1. DÉPLACEMENT
Nous nous sommes transporté(e) à [adresse complète]

2. CONSTATATIONS
[Description précise et objective]

3. SIGNIFICATION/NOTIFICATION
[Contenu de l'acte signifié]

4. REMISE
[Modalités de remise]

DONT PROCÈS-VERBAL

Dressé à [lieu], le [date en toutes lettres]

Pour servir et valoir ce que de droit.

[SIGNATURE PROFESSIONNELLE DÉJÀ GÉNÉRÉE]
```

### Prompt Type pour Exploit

```typescript
prompt: `Rédigez un PROCÈS-VERBAL DE [TYPE] conforme au Code de Procédure Civile.

⚠️ IMPORTANT: Un en-tête professionnel a déjà été généré. NE GÉNÉREZ PAS d'en-tête.

STRUCTURE OBLIGATOIRE:

PROCÈS-VERBAL DE [TYPE]

L'an [année en toutes lettres]
Le [date en toutes lettres]
À [heure] heures

Nous, Maître [Nom], Huissier de Justice, soussigné,

Avons, à la requête de:
[Identification complète du requérant]

PROCÉDÉ comme suit:

1. DÉPLACEMENT
[Lieu exact du déplacement]

2. CONSTATATIONS
[Description objective et précise]

3. [ACTIONS EFFECTUÉES]
[Description des actes accomplis]

DONT PROCÈS-VERBAL

Dressé à [lieu], le [date]

Pour servir et valoir ce que de droit.

⚠️ RÈGLES CRITIQUES:
- Style objectif et neutre
- Chronologie précise
- Descriptions détaillées
- Heures exactes
- Identités complètes
- PAS de placeholders []`,
```

---

## 📋 MAGISTRATS - Ordonnances et Jugements

### Structure Standard pour Ordonnances

```
[EN-TÊTE TRIBUNAL]

ORDONNANCE DE [TYPE]

Le [date en toutes lettres]

Nous, [Nom], [Fonction] au [Tribunal],

Vu la requête présentée par:
[Identification du requérant]

Vu les pièces produites:
[Liste des pièces]

Vu les textes applicables:
[Articles de loi]

CONSIDÉRANT QUE:
[Motifs de la décision]

PAR CES MOTIFS:

ORDONNONS:
[Dispositif de la décision]

Fait à [lieu], le [date]

[Signature et cachet]
```

---

## 🏢 JURISTES D'ENTREPRISE - Contrats et Avis

### Structure Standard pour Contrats

```
CONTRAT DE [TYPE]

Entre les soussignés:

D'UNE PART,
[Identification complète de la société]

D'AUTRE PART,
[Identification complète du cocontractant]

IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT:

ARTICLE 1 - OBJET
ARTICLE 2 - DURÉE
ARTICLE 3 - PRIX ET MODALITÉS DE PAIEMENT
ARTICLE 4 - OBLIGATIONS DES PARTIES
ARTICLE 5 - GARANTIES
ARTICLE 6 - RÉSILIATION
ARTICLE 7 - LITIGES

Fait en [nombre] exemplaires originaux
À [lieu], le [date]

[Signatures]
```

---

## 🎓 ÉTUDIANTS - Cas Pratiques et Consultations

### Structure Standard pour Cas Pratique

```
CAS PRATIQUE - [MATIÈRE]

I. EXPOSÉ DES FAITS
[Résumé des faits pertinents]

II. PROBLÉMATIQUE
[Question(s) de droit soulevée(s)]

III. ANALYSE JURIDIQUE

A. Qualification juridique
[Identification de la nature juridique]

B. Régime juridique applicable
[Textes et principes applicables]

C. Application au cas d'espèce
[Raisonnement juridique]

IV. CONCLUSION
[Réponse à la problématique]
```

---

## 🔧 IMPLÉMENTATION

### Étape 1: Modifier constants.ts

Pour CHAQUE template, remplacer le `prompt` basique par un prompt détaillé suivant les modèles ci-dessus.

### Étape 2: Adapter selon le type

- **Requêtes/Conclusions**: Structure "Exposé - En droit - Par ces motifs"
- **Actes notariés**: Structure "PAR-DEVANT NOUS - ONT COMPARU - ARTICLES - DONT ACTE"
- **Exploits**: Structure "PROCÈS-VERBAL - Déplacement - Constatations - DONT PV"
- **Contrats**: Structure "Entre les soussignés - Articles - Signatures"

### Étape 3: Règles communes à TOUS

```typescript
⚠️ RÈGLES CRITIQUES (à ajouter à TOUS les prompts):
1. Un en-tête professionnel a déjà été généré - NE PAS le régénérer
2. Utilisez les VRAIES données du formulaire
3. PAS de placeholders vides []
4. Dates au format approprié (JJ/MM/AAAA ou en toutes lettres)
5. Montants en chiffres ET en toutes lettres
6. Identités complètes (nom, prénom, date/lieu naissance, CIN, adresse, profession)
7. Références juridiques EXACTES
8. Ton professionnel adapté
9. Une seule section de signatures à la fin
10. Pièces jointes listées et numérotées
```

---

## ✅ RÉSULTAT ATTENDU

Après implémentation, TOUS les documents générés devront:
- ✅ Commencer directement par le contenu (pas d'en-tête dupliqué)
- ✅ Utiliser les vraies données du formulaire
- ✅ Ne contenir AUCUN placeholder vide
- ✅ Avoir une structure professionnelle
- ✅ Inclure des références juridiques précises
- ✅ Être prêts à être signés et déposés

---

**Ce document sert de guide pour améliorer TOUS les templates de l'application, quel que soit le rôle.**
