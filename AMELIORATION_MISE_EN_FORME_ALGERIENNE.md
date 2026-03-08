# ✅ Amélioration: Mise en Forme Algérienne des Actes Notariés

## 🎯 Objectif

Adapter la génération de documents pour respecter les standards algériens de la pratique notariale.

---

## 📚 Documentation Créée

### 1. Structure Standard
**Fichier**: `STRUCTURE_ACTE_NOTARIE_ALGERIEN.md`

Contient:
- Structure complète d'un acte authentique algérien
- Formules obligatoires ("PAR-DEVANT NOUS", "ONT COMPARU", "DONT ACTE")
- Éléments essentiels (identification parties, description bien, prix)
- Spécificités algériennes (langue, références juridiques, enregistrement)
- Mise en forme (police, marges, numérotation)
- Clauses standards
- Points de vigilance

### 2. Exemple Concret
**Fichier**: `EXEMPLE_ACTE_VENTE_MOBILIERE_ALGERIEN.md`

Contient:
- Exemple complet d'acte de vente de véhicule
- Toutes les formules notariales
- Structure conforme aux usages algériens
- Notes explicatives
- Comparaison avant/après

---

## 🔍 Problèmes Identifiés dans le Document Généré

### Document Actuel (Incorrect)

```
Maître Utilisateur Test Notaire inscrit à la Chambre d'Alger
N° de matricule: N/4654/785
...
À qui de droit
Objet: Acte de Vente Mobilière
12, le 28 février 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Monsieur/Madame,, de nationalité algérienne...
```

### Problèmes:
1. ❌ Pas de formule "PAR-DEVANT NOUS"
2. ❌ Pas de "ONT COMPARU"
3. ❌ Date incorrecte: "12, le 28 février" au lieu de "L'an deux mille vingt-six, Le vingt-huit février"
4. ❌ "Monsieur/Madame,," (double virgule, indécis)
5. ❌ Identification incomplète des parties
6. ❌ Pas de "DONT ACTE"
7. ❌ Structure désordonnée
8. ❌ Placeholders vides

---

## ✅ Structure Correcte (Algérienne)

### En-Tête

```
RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
MINISTÈRE DE LA JUSTICE

ÉTUDE DE MAÎTRE [Nom Prénom]
NOTAIRE À [Ville]
[Adresse complète]

RÉPERTOIRE N° [Numéro]/[Année]

ACTE DE VENTE MOBILIÈRE
```

### Formule d'Ouverture

```
L'an deux mille vingt-six (2026)
Le vingt-huit février

PAR-DEVANT NOUS, Maître [Nom Prénom], Notaire à [Ville],
résidant à [adresse], soussigné,
```

### Comparution

```
ONT COMPARU:

MONSIEUR [Nom Prénom complet]
Né le [date en toutes lettres] à [lieu complet]
Demeurant à [adresse complète]
Titulaire de la carte d'identité nationale n° [numéro]
délivrée le [date] à [lieu]
De nationalité algérienne
Profession: [profession]

Ci-après dénommé "LE VENDEUR"

D'UNE PART,

ET:

[Même structure pour l'acheteur]

D'AUTRE PART,

LESQUELS ONT DÉCLARÉ ET RECONNU CE QUI SUIT:
```

### Corps (Articles)

```
ARTICLE PREMIER - OBJET DE LA VENTE
[Description détaillée]

ARTICLE DEUX - PRIX
La présente vente est consentie et acceptée moyennant le prix principal de:
[Montant en chiffres] Dinars Algériens ([Montant en toutes lettres])

ARTICLE TROIS - GARANTIES
[Clauses de garantie]

...
```

### Clôture

```
DONT ACTE

Fait et passé à [Ville]
Le [date en toutes lettres]

Et après lecture faite, les parties ont signé avec Nous, Notaire.

LE VENDEUR          L'ACHETEUR          LE NOTAIRE
[Signature]         [Signature]         [Signature + Cachet]
```

---

## 🛠️ Prochaines Étapes d'Implémentation

### 1. Améliorer le Template dans `constants.ts`

Modifier le `prompt` pour `acte_vente_mobiliere`:

```typescript
{
  id: 'acte_vente_mobiliere',
  name: 'Acte de Vente Mobilière',
  prompt: `Rédigez un ACTE DE VENTE MOBILIÈRE conforme aux standards algériens.

STRUCTURE OBLIGATOIRE:

1. EN-TÊTE:
RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
MINISTÈRE DE LA JUSTICE
[Étude du notaire]

2. FORMULE D'OUVERTURE:
L'an [année en toutes lettres]
Le [date en toutes lettres]

PAR-DEVANT NOUS, Maître [Nom Prénom], Notaire à [Ville], soussigné,

3. COMPARUTION:
ONT COMPARU:

MONSIEUR/MADAME [Identification complète du vendeur]
Ci-après dénommé "LE VENDEUR"
D'UNE PART,

ET:

MONSIEUR/MADAME [Identification complète de l'acheteur]
Ci-après dénommé "L'ACHETEUR"
D'AUTRE PART,

LESQUELS ONT DÉCLARÉ ET RECONNU CE QUI SUIT:

4. ARTICLES:
ARTICLE PREMIER - OBJET DE LA VENTE
ARTICLE DEUX - PRIX
ARTICLE TROIS - GARANTIES
ARTICLE QUATRE - DÉLIVRANCE
...

5. CLÔTURE:
DONT ACTE

Fait et passé à [Ville]
Le [date en toutes lettres]

Et après lecture faite, les parties ont signé avec Nous, Notaire.

RÈGLES CRITIQUES:
- Dates en toutes lettres
- Montants en chiffres ET en toutes lettres
- Identification complète des parties
- Formules notariales obligatoires
- Articles numérotés
- Aucun placeholder vide`,
  structure: [
    'En-tête officiel',
    'Formule d\'ouverture (PAR-DEVANT NOUS)',
    'Comparution des parties (ONT COMPARU)',
    'Article Premier - Objet',
    'Article Deux - Prix',
    'Article Trois - Garanties',
    'Article Quatre - Délivrance',
    'Formule de clôture (DONT ACTE)',
    'Signatures'
  ]
}
```

### 2. Améliorer `documentHeaderService.ts`

Ajouter une fonction pour générer l'en-tête notarial algérien:

```typescript
generateNotarialHeader(params: {
  professional: EnhancedUserProfile;
  documentType: string;
  date: Date;
  language: Language;
}): string {
  const isAr = params.language === 'ar';
  const info = params.professional.professionalInfo;
  
  let header = '';
  
  // En-tête officiel
  header += isAr ?
    'الجمهورية الجزائرية الديمقراطية الشعبية\nوزارة العدل\n\n' :
    'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE\nMINISTÈRE DE LA JUSTICE\n\n';
  
  // Étude notariale
  header += isAr ?
    `مكتب الأستاذ ${params.professional.firstName} ${params.professional.lastName}\n` :
    `ÉTUDE DE MAÎTRE ${params.professional.lastName.toUpperCase()} ${params.professional.firstName}\n`;
  
  header += isAr ?
    `موثق في ${info?.wilayaExercice || 'الجزائر'}\n` :
    `NOTAIRE À ${info?.wilayaExercice || 'ALGER'}\n`;
  
  header += `${info?.etudeAddress || info?.cabinetAddress || '[Adresse]'}\n`;
  header += `${info?.cabinetPhone || '[Téléphone]'}\n\n`;
  
  // Séparateur
  header += '━'.repeat(80) + '\n\n';
  
  // Numéro de répertoire
  const year = params.date.getFullYear();
  header += isAr ?
    `رقم السجل: ${year}/XXX\n\n` :
    `RÉPERTOIRE N° ${year}/XXX\n\n`;
  
  // Titre
  header += isAr ?
    `عقد بيع منقول\n\n` :
    `ACTE DE VENTE MOBILIÈRE\n\n`;
  
  // Séparateur
  header += '━'.repeat(80) + '\n\n';
  
  // Formule d'ouverture
  const dateStr = this.formatDateInWords(params.date, params.language);
  header += isAr ?
    `سنة ${dateStr}\n\n` :
    `L'an ${dateStr}\n\n`;
  
  header += isAr ?
    `أمامنا، الأستاذ ${params.professional.firstName} ${params.professional.lastName}، موثق في ${info?.wilayaExercice || 'الجزائر'}، الموقع أدناه،\n\n` :
    `PAR-DEVANT NOUS, Maître ${params.professional.lastName.toUpperCase()} ${params.professional.firstName}, Notaire à ${info?.wilayaExercice || 'Alger'}, soussigné,\n\n`;
  
  return header;
}

private formatDateInWords(date: Date, language: Language): string {
  // Convertir la date en toutes lettres
  // Ex: "deux mille vingt-six" pour 2026
  // ...
}
```

### 3. Améliorer le Prompt IA dans `EnhancedDraftingInterface.tsx`

Ajouter des instructions spécifiques pour la structure algérienne:

```typescript
prompt += '\n\n=== STRUCTURE NOTARIALE ALGÉRIENNE ===\n';
prompt += '⚠️ IMPORTANT: Respectez EXACTEMENT cette structure:\n\n';
prompt += '1. NE GÉNÉREZ PAS d\'en-tête (déjà généré)\n';
prompt += '2. COMMENCEZ par "ONT COMPARU:"\n';
prompt += '3. Identifiez le VENDEUR avec:\n';
prompt += '   - Nom et prénom complets\n';
prompt += '   - Date et lieu de naissance EN TOUTES LETTRES\n';
prompt += '   - Adresse complète\n';
prompt += '   - N° CIN et date de délivrance\n';
prompt += '   - Nationalité algérienne\n';
prompt += '   - Profession\n';
prompt += '   - "Ci-après dénommé LE VENDEUR"\n';
prompt += '   - "D\'UNE PART,"\n\n';
prompt += '4. Identifiez L\'ACHETEUR (même structure)\n';
prompt += '   - "Ci-après dénommé L\'ACHETEUR"\n';
prompt += '   - "D\'AUTRE PART,"\n\n';
prompt += '5. "LESQUELS ONT DÉCLARÉ ET RECONNU CE QUI SUIT:"\n\n';
prompt += '6. ARTICLES numérotés:\n';
prompt += '   - ARTICLE PREMIER - OBJET DE LA VENTE\n';
prompt += '   - ARTICLE DEUX - PRIX (en chiffres ET en toutes lettres)\n';
prompt += '   - ARTICLE TROIS - GARANTIES\n';
prompt += '   - ARTICLE QUATRE - DÉLIVRANCE\n';
prompt += '   - ...\n\n';
prompt += '7. TERMINEZ par:\n';
prompt += '   - "DONT ACTE"\n';
prompt += '   - "Fait et passé à [Ville]"\n';
prompt += '   - "Le [date en toutes lettres]"\n';
prompt += '   - "Et après lecture faite, les parties ont signé avec Nous, Notaire."\n\n';
prompt += '⚠️ RÈGLES ABSOLUES:\n';
prompt += '- Dates EN TOUTES LETTRES: "quinze mars mil neuf cent quatre-vingt-cinq"\n';
prompt += '- Montants EN CHIFFRES ET EN TOUTES LETTRES: "1 200 000 DA (UN MILLION DEUX CENT MILLE DINARS ALGÉRIENS)"\n';
prompt += '- PAS de "Monsieur/Madame" indécis - choisissez selon le prénom\n';
prompt += '- PAS de placeholders vides\n';
prompt += '- Formules notariales OBLIGATOIRES\n';
```

---

## 📊 Comparaison Avant/Après

| Élément | Avant | Après |
|---------|-------|-------|
| **En-tête** | Simple | République Algérienne + Ministère |
| **Date** | "12, le 28 février 2026" | "L'an deux mille vingt-six, Le vingt-huit février" |
| **Formule ouverture** | Absente | "PAR-DEVANT NOUS, Maître..." |
| **Comparution** | "Monsieur/Madame,," | "ONT COMPARU: MONSIEUR [Nom complet]..." |
| **Identification** | Incomplète | Complète (date/lieu naissance, CIN, profession) |
| **Prix** | "() DA" | "1 200 000 DA (UN MILLION DEUX CENT MILLE DINARS ALGÉRIENS)" |
| **Structure** | Désordonnée | Articles numérotés (ARTICLE PREMIER, DEUX, TROIS...) |
| **Clôture** | Absente | "DONT ACTE" + "Fait et passé à..." |
| **Signatures** | Informelles | "Et après lecture faite, les parties ont signé avec Nous, Notaire" |

---

## ✅ Résultat Attendu

Après implémentation, le document généré devrait ressembler à:

```
RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
MINISTÈRE DE LA JUSTICE

ÉTUDE DE MAÎTRE BELKACEMI HABIB
NOTAIRE À BÉJAÏA
...

RÉPERTOIRE N° 2026/XXX

ACTE DE VENTE MOBILIÈRE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

L'an deux mille vingt-six
Le vingt-huit février

PAR-DEVANT NOUS, Maître BELKACEMI Habib, Notaire à Béjaïa, soussigné,

ONT COMPARU:

MONSIEUR MHAMD Smail
Né le quinze mars mil neuf cent quatre-vingt-cinq à Oran
Demeurant à Cité Boufatis, Oran
Titulaire de la carte d'identité nationale n° 532322
délivrée le dix janvier deux mille vingt à Oran
De nationalité algérienne
Profession: Commerçant

Ci-après dénommé "LE VENDEUR"

D'UNE PART,

ET:

MADAME BENALI Fatima
[Identification complète]

Ci-après dénommée "L'ACHETEUSE"

D'AUTRE PART,

LESQUELS ONT DÉCLARÉ ET RECONNU CE QUI SUIT:

ARTICLE PREMIER - OBJET DE LA VENTE
[Description du bien]

ARTICLE DEUX - PRIX
La présente vente est consentie et acceptée moyennant le prix principal de:
UN MILLION DEUX CENT MILLE DINARS ALGÉRIENS (1 200 000 DA)

...

DONT ACTE

Fait et passé à Béjaïa
Le vingt-huit février deux mille vingt-six

Et après lecture faite, les parties ont signé avec Nous, Notaire.
```

---

## 🎯 Conclusion

La documentation complète est maintenant disponible pour adapter la génération de documents aux standards algériens. Les prochaines étapes sont:

1. ✅ **Documentation créée** (STRUCTURE + EXEMPLE)
2. ⏳ **Modifier le template** dans `constants.ts`
3. ⏳ **Améliorer le service** `documentHeaderService.ts`
4. ⏳ **Adapter le prompt IA** dans `EnhancedDraftingInterface.tsx`
5. ⏳ **Tester** avec des cas réels

**Les documents générés seront alors conformes aux usages de la pratique notariale algérienne!**
