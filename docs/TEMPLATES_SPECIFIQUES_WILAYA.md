# Templates Spécifiques par Wilaya - Documentation

## 🎯 Objectif

Adapter automatiquement les templates juridiques aux spécificités de chaque wilaya algérienne, incluant les coordonnées des tribunaux, les formats de numéros officiels, et les particularités locales.

## 📊 Données Disponibles par Wilaya

### Wilayas Couvertes (Phase 1)

1. **16 - Alger** (الجزائر)
2. **31 - Oran** (وهران)
3. **25 - Constantine** (قسنطينة)
4. **23 - Annaba** (عنابة)
5. **09 - Blida** (البليدة)
6. **15 - Tizi Ouzou** (تيزي وزو)
7. **06 - Béjaïa** (بجاية)
8. **19 - Sétif** (سطيف)

### Informations Incluses

Pour chaque wilaya, nous avons :

#### 1. Tribunaux
- Nom (FR/AR)
- Adresse complète
- Téléphone
- Type (civil, commercial, administratif, famille, pénal)

**Exemple - Alger:**
```
Tribunal de Sidi M'Hamed
محكمة سيدي امحمد
Place des Martyrs, Alger Centre
Tél: 021 73 42 00
Type: Civil
```

#### 2. Conservation Foncière
- Nom (FR/AR)
- Adresse
- Téléphone
- Circonscription (communes couvertes)

**Exemple - Oran:**
```
Conservation Foncière d'Oran
المحافظة العقارية لوهران
Boulevard de la Révolution, Oran
Tél: 041 33 60 00
Circonscription: Oran, Bir El Djir, Es Senia
```

#### 3. Barreau
- Nom (FR/AR)
- Adresse
- Téléphone
- Président (optionnel)

#### 4. Chambre des Notaires
- Nom (FR/AR)
- Adresse
- Téléphone

#### 5. Chambre des Huissiers
- Nom (FR/AR)
- Adresse
- Téléphone

#### 6. Formats Officiels

**Registre de Commerce (RC):**
- Format spécifique par wilaya
- Exemple Alger: `16/XXXXXXXX`
- Exemple Oran: `31/XXXXXXXX`

**Numéro d'Identification Fiscale (NIF):**
- Format: `0999[CODE_WILAYA]XXXXXXXXX`
- Exemple Alger: `099916XXXXXXXXX`
- Exemple Constantine: `099925XXXXXXXXX`

#### 7. Spécificités Locales

Chaque wilaya a ses particularités :

**Alger:**
- Mention obligatoire du secteur urbain
- Référence au plan d'urbanisme
- Délais de traitement plus courts

**Constantine:**
- Mention des ponts pour localisation
- Références topographiques spécifiques
- Procédures pour la vieille ville

**Blida:**
- Mention des terres agricoles (APFA)
- Références au périmètre de la Mitidja
- Procédures pour exploitations agricoles

## 🔧 Utilisation Technique

### 1. Composant WilayaSelector

```typescript
import WilayaSelector from './components/WilayaSelector';

<WilayaSelector
  language={language}
  selectedWilaya={wilayaCode}
  onWilayaChange={(code) => setWilayaCode(code)}
  showDetails={true}
/>
```

**Props:**
- `language`: 'fr' | 'ar'
- `selectedWilaya`: Code de la wilaya (ex: '16')
- `onWilayaChange`: Callback lors du changement
- `showDetails`: Afficher les détails (tribunaux, etc.)

### 2. Service wilayaTemplateService

#### Obtenir les variables d'une wilaya

```typescript
import { wilayaTemplateService } from './services/wilayaTemplateService';

const variables = wilayaTemplateService.getWilayaVariables('16', 'Tribunal de Sidi M\'Hamed');

// Retourne:
{
  wilaya_code: '16',
  wilaya_name_fr: 'Alger',
  wilaya_name_ar: 'الجزائر',
  tribunal_name_fr: 'Tribunal de Sidi M\'Hamed',
  tribunal_name_ar: 'محكمة سيدي امحمد',
  tribunal_address: 'Place des Martyrs, Alger Centre',
  tribunal_phone: '021 73 42 00',
  format_rc: '16/XXXXXXXX',
  format_nif: '099916XXXXXXXXX',
  // ... autres champs
}
```

#### Remplir un template avec les données

```typescript
const template = `
TRIBUNAL: [TRIBUNAL_NAME_FR]
WILAYA: [WILAYA_NAME_FR]
RC: [FORMAT_RC]
`;

const populated = wilayaTemplateService.populateTemplate(template, '16', 'Tribunal de Sidi M\'Hamed');

// Résultat:
// TRIBUNAL: Tribunal de Sidi M'Hamed
// WILAYA: Alger
// RC: 16/XXXXXXXX
```

#### Générer un en-tête de document

```typescript
const header = wilayaTemplateService.generateDocumentHeader(
  '16',
  'Tribunal de Sidi M\'Hamed',
  'fr'
);

// Retourne un en-tête formaté avec logo, adresse, etc.
```

#### Valider un numéro RC

```typescript
const validation = wilayaTemplateService.validateRC('16/12345678', '16');

if (!validation.valid) {
  console.error(validation.message);
  // "Le format du RC doit être: 16/XXXXXXXX"
}
```

#### Générer un template complet

```typescript
// Acte de vente immobilière
const acteVente = wilayaTemplateService.generateActeVenteImmobiliere(
  '16',
  'Tribunal de Sidi M\'Hamed',
  'fr'
);

// Requête de divorce
const requeteDivorce = wilayaTemplateService.generateRequeteDivorce(
  '31',
  'Tribunal d\'Oran',
  'ar'
);
```

## 📝 Variables Disponibles dans les Templates

### Variables de Base

```
[WILAYA_CODE] - Code de la wilaya (ex: 16)
[WILAYA_NAME_FR] - Nom en français (ex: Alger)
[WILAYA_NAME_AR] - Nom en arabe (ex: الجزائر)
```

### Variables Tribunal

```
[TRIBUNAL_NAME_FR] - Nom du tribunal (français)
[TRIBUNAL_NAME_AR] - Nom du tribunal (arabe)
[TRIBUNAL_ADDRESS] - Adresse complète
[TRIBUNAL_PHONE] - Numéro de téléphone
```

### Variables Conservation Foncière

```
[CONSERVATION_NAME_FR] - Nom (français)
[CONSERVATION_NAME_AR] - Nom (arabe)
[CONSERVATION_ADDRESS] - Adresse
[CONSERVATION_PHONE] - Téléphone
```

### Variables Barreau

```
[BARREAU_NAME_FR] - Nom du barreau (français)
[BARREAU_NAME_AR] - Nom du barreau (arabe)
[BARREAU_ADDRESS] - Adresse
[BARREAU_PHONE] - Téléphone
```

### Variables Formats

```
[FORMAT_RC] - Format du RC (ex: 16/XXXXXXXX)
[FORMAT_NIF] - Format du NIF (ex: 099916XXXXXXXXX)
```

## 🎨 Exemples d'Utilisation

### Exemple 1: Acte de Vente à Alger

```typescript
const template = wilayaTemplateService.generateActeVenteImmobiliere('16', 'Tribunal de Sidi M\'Hamed', 'fr');

// Le template inclut automatiquement:
// - En-tête avec coordonnées du tribunal d'Alger
// - Format RC: 16/XXXXXXXX
// - Conservation Foncière d'Alger Centre
// - Spécificités: mention du secteur urbain
```

### Exemple 2: Requête de Divorce à Oran

```typescript
const template = wilayaTemplateService.generateRequeteDivorce('31', 'Tribunal d\'Oran', 'ar');

// Le template inclut automatiquement:
// - En-tête en arabe avec coordonnées du tribunal d'Oran
// - Barreau d'Oran
// - Spécificités: mention du quartier obligatoire
```

### Exemple 3: Validation de Numéros

```typescript
// Valider un RC d'Alger
const rcValid = wilayaTemplateService.validateRC('16/12345678', '16');
// ✅ Valid

const rcInvalid = wilayaTemplateService.validateRC('31/12345678', '16');
// ❌ Invalid - Le format du RC doit être: 16/XXXXXXXX

// Valider un NIF de Constantine
const nifValid = wilayaTemplateService.validateNIF('099925123456789', '25');
// ✅ Valid
```

## 🚀 Intégration dans l'Application

### Dans DraftingInterface.tsx

```typescript
import WilayaSelector from './WilayaSelector';
import { wilayaTemplateService } from '../services/wilayaTemplateService';

const [selectedWilaya, setSelectedWilaya] = useState('');
const [selectedTribunal, setSelectedTribunal] = useState('');

// Sélecteur de wilaya
<WilayaSelector
  language={language}
  selectedWilaya={selectedWilaya}
  onWilayaChange={setSelectedWilaya}
  showDetails={true}
/>

// Lors de la génération du document
const generateDocument = () => {
  let template = baseTemplate;
  
  if (selectedWilaya) {
    template = wilayaTemplateService.populateTemplate(
      template,
      selectedWilaya,
      selectedTribunal
    );
  }
  
  // Continuer avec la génération...
};
```

### Dans TemplateContribution.tsx

```typescript
// Ajouter la sélection de wilaya lors de la contribution
<WilayaSelector
  language={language}
  selectedWilaya={templateData.wilaya}
  onWilayaChange={(code) => setTemplateData(prev => ({ ...prev, wilaya: code }))}
  showDetails={false}
/>
```

## 📈 Statistiques et Métriques

### Templates par Wilaya

Le système permet de tracker :
- Nombre de templates par wilaya
- Templates les plus utilisés par wilaya
- Taux de succès par wilaya
- Feedback spécifique par wilaya

### Amélioration Continue

Les données collectées permettent :
- Identifier les besoins spécifiques par wilaya
- Améliorer les templates locaux
- Ajouter de nouvelles spécificités
- Corriger les erreurs régionales

## 🔄 Prochaines Étapes

### Phase 2: Extension à Toutes les Wilayas

Ajouter les 40 wilayas restantes avec :
- Données complètes des tribunaux
- Coordonnées des institutions
- Spécificités locales

### Phase 3: Données Dynamiques

- Mise à jour automatique depuis sources officielles
- API pour récupérer les coordonnées à jour
- Synchronisation avec les registres officiels

### Phase 4: Templates Avancés

- Templates spécifiques par type de tribunal
- Clauses automatiques selon la wilaya
- Suggestions basées sur la jurisprudence locale

## 💡 Cas d'Usage Réels

### Cas 1: Avocat Multi-Wilayas

Un avocat inscrit au barreau d'Alger mais plaidant à Oran peut :
1. Sélectionner la wilaya Oran
2. Choisir le tribunal d'Oran
3. Générer automatiquement un document avec les bonnes coordonnées
4. Valider les numéros RC/NIF au format d'Oran

### Cas 2: Notaire avec Clients de Différentes Wilayas

Un notaire à Constantine rédigeant un acte pour un bien à Annaba :
1. Sélectionne la wilaya Annaba
2. Le système charge automatiquement la Conservation Foncière d'Annaba
3. Les spécificités côtières sont incluses
4. Le format RC d'Annaba est appliqué

### Cas 3: Étudiant en Droit

Un étudiant apprenant à rédiger des actes :
1. Explore les différentes wilayas
2. Compare les formats et spécificités
3. Pratique avec des templates réels
4. Comprend les variations régionales

## 📞 Support

### Ajouter une Nouvelle Wilaya

Pour ajouter une wilaya, éditer `data/wilayaSpecificData.ts` :

```typescript
'XX': {
  code: 'XX',
  name_fr: 'Nom Wilaya',
  name_ar: 'اسم الولاية',
  code_postal_prefix: 'XX',
  format_rc: 'XX/XXXXXXXX',
  format_nif: '0999XXXXXXXXXXXX',
  tribunaux: [
    // Liste des tribunaux
  ],
  conservation_fonciere: [
    // Liste des conservations
  ],
  // ... autres données
}
```

### Mettre à Jour des Coordonnées

Les coordonnées peuvent être mises à jour directement dans le fichier de données ou via une interface d'administration (à venir).

## ✅ Résumé

Le système de templates spécifiques par wilaya offre :

- ✅ **8 wilayas** couvertes en phase 1
- ✅ **Données complètes** : tribunaux, conservations, barreaux
- ✅ **Formats officiels** : RC et NIF par wilaya
- ✅ **Spécificités locales** documentées
- ✅ **Validation automatique** des numéros
- ✅ **Génération de templates** adaptés
- ✅ **Support bilingue** FR/AR
- ✅ **Extensible** à toutes les wilayas

**Prêt pour l'intégration et les tests !** 🚀
