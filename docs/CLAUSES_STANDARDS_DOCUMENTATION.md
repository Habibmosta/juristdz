# Bibliothèque de Clauses Standards - Documentation Complète

## 🎯 Objectif

Fournir une bibliothèque complète de clauses juridiques standards utilisées dans la pratique algérienne, permettant aux professionnels de construire rapidement des documents conformes et complets.

## 📚 Contenu de la Bibliothèque

### Catégories de Clauses

1. **Identification des Parties** (تحديد هوية الأطراف)
   - Identification personne physique
   - Identification personne morale
   - Représentation légale

2. **Objet du Contrat** (موضوع العقد)
   - Vente immobilière
   - Vente mobilière
   - Bail d'habitation
   - Bail commercial

3. **Prix et Modalités de Paiement** (الثمن وطرق الدفع)
   - Paiement comptant
   - Paiement échelonné
   - Loyer mensuel
   - Révision de prix

4. **Garanties et Sûretés** (الضمانات والكفالات)
   - Garantie d'éviction
   - Garantie des vices cachés
   - Dépôt de garantie
   - Hypothèque

5. **Obligations des Parties** (التزامات الأطراف)
   - Obligation de délivrance
   - Obligation de paiement
   - Obligations d'entretien
   - Usage conforme

6. **Droit de la Famille** (قانون الأسرة)
   - Régime matrimonial
   - Pension alimentaire
   - Garde des enfants

7. **Clauses Commerciales** (البنود التجارية)
   - Clause résolutoire
   - Clause pénale
   - Non-concurrence

## 🔧 Utilisation Technique

### 1. Composant ClauseSelector

```typescript
import ClauseSelector from './components/ClauseSelector';

<ClauseSelector
  language={language}
  documentType="acte_vente_immobiliere"
  selectedClauses={selectedClauseIds}
  onClausesChange={setSelectedClauseIds}
  variables={{
    NOM: 'BENALI',
    PRENOM: 'Ahmed',
    PRIX_VENTE: '5000000',
    // ... autres variables
  }}
/>
```

### 2. Service clauseService

#### Générer un document complet

```typescript
import { clauseService } from './services/clauseService';

const template = {
  documentType: 'acte_vente_immobiliere',
  selectedClauseIds: [
    'id_personne_physique',
    'objet_vente_immobiliere',
    'prix_vente_comptant',
    'garantie_eviction'
  ],
  variables: {
    NOM: 'BENALI',
    PRENOM: 'Ahmed',
    DATE_NAISSANCE: '15/03/1980',
    // ... toutes les variables
  }
};

const document = clauseService.generateDocumentWithClauses(template, 'fr');
```

#### Valider les clauses obligatoires

```typescript
const validation = clauseService.validateMandatoryClauses(
  'acte_vente_immobiliere',
  selectedClauseIds
);

if (!validation.valid) {
  console.log('Clauses manquantes:', validation.missingClauses);
}
```

#### Obtenir les variables manquantes

```typescript
const missing = clauseService.getMissingVariables(
  selectedClauseIds,
  providedVariables
);

if (missing.length > 0) {
  console.log('Variables à remplir:', missing);
}
```

#### Suggérer des clauses complémentaires

```typescript
const suggestions = clauseService.suggestComplementaryClauses(
  'acte_vente_immobiliere',
  selectedClauseIds
);

console.log('Clauses suggérées:', suggestions);
```

## 📝 Structure d'une Clause

```typescript
interface Clause {
  id: string;                    // Identifiant unique
  category: string;              // Catégorie principale
  subcategory?: string;          // Sous-catégorie
  name_fr: string;               // Nom en français
  name_ar: string;               // Nom en arabe
  text_fr: string;               // Texte en français
  text_ar: string;               // Texte en arabe
  applicable_to: string[];       // Types de documents
  mandatory?: boolean;           // Clause obligatoire
  legal_reference?: string;      // Référence légale
  notes?: string;                // Notes explicatives
  variables?: string[];          // Variables à remplacer
}
```

## 🎨 Exemples d'Utilisation

### Exemple 1: Acte de Vente Immobilière

```typescript
const template = {
  documentType: 'acte_vente_immobiliere',
  selectedClauseIds: [
    'id_personne_physique',      // Vendeur
    'id_personne_physique',      // Acheteur
    'objet_vente_immobiliere',   // Description du bien
    'prix_vente_comptant',       // Prix
    'garantie_eviction',         // Garantie
    'garantie_vices_caches',     // Garantie
    'obligation_delivrance'      // Obligations
  ],
  variables: {
    // Vendeur
    NOM: 'BENALI',
    PRENOM: 'Ahmed',
    DATE_NAISSANCE: '15/03/1980',
    LIEU_NAISSANCE: 'Alger',
    CIN: '123456789',
    ADRESSE: '10 Rue Didouche Mourad, Alger',
    PROFESSION: 'Commerçant',
    
    // Bien
    NATURE_BIEN: 'Appartement F3',
    SUPERFICIE: '85',
    ADRESSE_BIEN: '25 Rue Larbi Ben M\'hidi, Alger',
    NUMERO_TITRE_FONCIER: '12345/16',
    SECTION_CADASTRALE: 'A-123',
    
    // Prix
    PRIX_VENTE: '5000000',
    PRIX_LETTRES: 'Cinq millions',
    
    // Délais
    DELAI_DELIVRANCE: '30'
  }
};

const document = clauseService.generateDocumentWithClauses(template, 'fr');
```

### Exemple 2: Bail d'Habitation

```typescript
const template = {
  documentType: 'bail_habitation',
  selectedClauseIds: [
    'id_personne_physique',           // Bailleur
    'id_personne_physique',           // Locataire
    'objet_bail_habitation',          // Logement
    'loyer_mensuel',                  // Loyer
    'depot_garantie',                 // Garantie
    'obligation_entretien_bailleur',  // Obligations bailleur
    'obligation_usage_locataire'      // Obligations locataire
  ],
  variables: {
    ADRESSE_LOGEMENT: '15 Rue des Frères Bouadou, Oran',
    NOMBRE_PIECES: '3',
    SUPERFICIE: '75',
    MONTANT_LOYER: '25000',
    LOYER_LETTRES: 'Vingt-cinq mille',
    JOUR_PAIEMENT: '5',
    MONTANT_DEPOT: '50000',
    NOMBRE_MOIS: '2'
  }
};
```

### Exemple 3: Requête de Divorce

```typescript
const template = {
  documentType: 'requete_divorce',
  selectedClauseIds: [
    'id_personne_physique',    // Demandeur
    'id_personne_physique',    // Défendeur
    'pension_alimentaire',     // Pension
    'garde_enfants'            // Garde
  ],
  variables: {
    MONTANT_PENSION: '15000',
    BENEFICIAIRE: 'les enfants mineurs',
    JOUR_PAIEMENT: '1er',
    NOMS_ENFANTS: 'Yasmine et Karim',
    PARENT_GARDIEN: 'la mère',
    MODALITES_VISITE: 'un week-end sur deux et la moitié des vacances scolaires'
  }
};
```

## 🔍 Variables Communes

### Variables d'Identification

```
[NOM] - Nom de famille
[PRENOM] - Prénom
[DATE_NAISSANCE] - Date de naissance
[LIEU_NAISSANCE] - Lieu de naissance
[CIN] - Numéro de carte d'identité
[DATE_CIN] - Date de délivrance CIN
[LIEU_CIN] - Lieu de délivrance CIN
[ADRESSE] - Adresse complète
[PROFESSION] - Profession
```

### Variables Personne Morale

```
[DENOMINATION] - Dénomination sociale
[FORME_JURIDIQUE] - Forme juridique (SARL, SPA, etc.)
[CAPITAL] - Capital social
[SIEGE_SOCIAL] - Siège social
[RC] - Numéro RC
[NIF] - Numéro NIF
[REPRESENTANT] - Nom du représentant
[QUALITE] - Qualité du représentant
```

### Variables Immobilières

```
[NATURE_BIEN] - Nature du bien
[SUPERFICIE] - Superficie en m²
[ADRESSE_BIEN] - Adresse du bien
[NUMERO_TITRE_FONCIER] - Numéro titre foncier
[SECTION_CADASTRALE] - Section cadastrale
```

### Variables Financières

```
[PRIX_VENTE] - Prix de vente (chiffres)
[PRIX_LETTRES] - Prix en lettres
[MONTANT_LOYER] - Montant du loyer
[LOYER_LETTRES] - Loyer en lettres
[MONTANT_ACOMPTE] - Montant acompte
[MONTANT_SOLDE] - Solde à payer
[NOMBRE_ECHEANCES] - Nombre d'échéances
[MONTANT_ECHEANCE] - Montant par échéance
```

## ⚖️ Références Légales

Toutes les clauses incluent des références aux textes légaux algériens :

- **Code Civil algérien** (Ordonnance 75-58)
- **Code de la Famille** (Loi 84-11)
- **Code de Commerce** (Ordonnance 75-59)
- **Code de Procédure Civile et Administrative** (Loi 08-09)
- **Lois spécifiques** (bail d'habitation, etc.)

## 🎯 Clauses Obligatoires

Certaines clauses sont **obligatoires** selon le type de document :

### Acte de Vente Immobilière
- ✅ Identification des parties
- ✅ Objet de la vente (description du bien)
- ✅ Prix de vente
- ✅ Garantie d'éviction
- ✅ Garantie des vices cachés

### Bail d'Habitation
- ✅ Identification des parties
- ✅ Description du logement
- ✅ Montant du loyer
- ✅ Obligations d'entretien du bailleur

### Requête de Divorce
- ✅ Identification des parties
- ✅ Motifs du divorce
- ✅ Demandes (pension, garde, etc.)

## 🚀 Fonctionnalités Avancées

### 1. Validation Automatique

Le système vérifie automatiquement :
- Présence des clauses obligatoires
- Cohérence entre les clauses
- Variables manquantes
- Conflits potentiels

### 2. Suggestions Intelligentes

Basées sur les clauses sélectionnées :
- Clause de prix → Suggère modalités de paiement
- Clause de vente → Suggère garanties
- Clause de bail → Suggère dépôt de garantie

### 3. Export Multi-Format

```typescript
// Export en texte
const text = clauseService.exportClauses(template, 'fr', 'text');

// Export en JSON
const json = clauseService.exportClauses(template, 'fr', 'json');

// Export en Markdown
const markdown = clauseService.exportClauses(template, 'fr', 'markdown');
```

### 4. Recherche de Clauses

```typescript
const results = clauseService.searchClauses(
  'garantie',
  'acte_vente_immobiliere',
  'fr'
);
```

### 5. Statistiques

```typescript
const stats = clauseService.getClauseStatistics('acte_vente_immobiliere');
// {
//   total: 15,
//   mandatory: 5,
//   optional: 10,
//   byCategory: { ... }
// }
```

## 📊 Intégration dans l'Application

### Dans DraftingInterface.tsx

```typescript
import ClauseSelector from './components/ClauseSelector';
import { clauseService } from './services/clauseService';

const [selectedClauses, setSelectedClauses] = useState<string[]>([]);
const [variables, setVariables] = useState<{ [key: string]: string }>({});

// Sélecteur de clauses
<ClauseSelector
  language={language}
  documentType={selectedTemplate.id}
  selectedClauses={selectedClauses}
  onClausesChange={setSelectedClauses}
  variables={variables}
/>

// Génération du document
const generateDocument = () => {
  const template = {
    documentType: selectedTemplate.id,
    selectedClauseIds: selectedClauses,
    variables: variables
  };
  
  const document = clauseService.generateDocumentWithClauses(template, language);
  return document;
};
```

## 💡 Bonnes Pratiques

### ✅ À Faire

1. **Toujours inclure les clauses obligatoires**
2. **Vérifier la cohérence des clauses**
3. **Remplir toutes les variables requises**
4. **Adapter les clauses au contexte**
5. **Vérifier les références légales**

### ❌ À Éviter

1. **Omettre des clauses obligatoires**
2. **Mélanger des clauses incompatibles**
3. **Laisser des variables vides**
4. **Utiliser des clauses obsolètes**
5. **Ignorer les avertissements du système**

## 🔄 Prochaines Étapes

### Phase 2: Extension de la Bibliothèque

- [ ] Ajouter 50+ clauses supplémentaires
- [ ] Couvrir tous les types de documents
- [ ] Clauses spécifiques par wilaya
- [ ] Versions bilingues complètes

### Phase 3: Intelligence Artificielle

- [ ] Suggestion automatique de clauses
- [ ] Détection de clauses manquantes
- [ ] Optimisation de la rédaction
- [ ] Analyse de cohérence avancée

### Phase 4: Personnalisation

- [ ] Clauses personnalisées par cabinet
- [ ] Templates de clauses réutilisables
- [ ] Bibliothèque partagée
- [ ] Versioning des clauses

## 📞 Support

### Ajouter une Nouvelle Clause

Pour ajouter une clause, éditer `data/clausesStandards.ts` :

```typescript
{
  id: 'ma_nouvelle_clause',
  category: 'obligations',
  name_fr: 'Ma Nouvelle Clause',
  name_ar: 'بندي الجديد',
  text_fr: 'Texte de la clause...',
  text_ar: 'نص البند...',
  applicable_to: ['acte_vente_immobiliere'],
  mandatory: false,
  legal_reference: 'Article X du Code Civil',
  variables: ['VARIABLE1', 'VARIABLE2']
}
```

## ✅ Résumé

La bibliothèque de clauses standards offre :

- ✅ **20+ clauses** prêtes à l'emploi
- ✅ **7 catégories** couvrant tous les besoins
- ✅ **Support bilingue** FR/AR complet
- ✅ **Références légales** pour chaque clause
- ✅ **Validation automatique** des documents
- ✅ **Suggestions intelligentes** de clauses
- ✅ **Export multi-format** (text, JSON, markdown)
- ✅ **Intégration facile** dans l'application

**Prêt pour l'utilisation professionnelle !** 🚀
