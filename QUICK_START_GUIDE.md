# Guide de Démarrage Rapide - JuristDZ

## 🚀 Démarrage en 5 Minutes

### 1. Installation

```bash
# Cloner le projet
git clone <repository-url>
cd juristdz

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local
```

### 2. Configuration

Éditer `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_GROQ_API_KEY=your_groq_key
```

### 3. Lancer l'Application

```bash
npm run dev
```

Ouvrir http://localhost:5173

---

## 📝 Utiliser le Système de Génération

### Exemple Simple

```typescript
import { wilayaTemplateService } from './services/wilayaTemplateService';
import { clauseService } from './services/clauseService';

// 1. Générer un en-tête
const header = wilayaTemplateService.generateDocumentHeader(
  '16',  // Wilaya code (Alger)
  'Tribunal de Sidi M\'Hamed',
  'fr'   // Language
);

// 2. Générer des clauses
const document = clauseService.generateDocumentWithClauses({
  documentType: 'acte_vente_immobiliere',
  selectedClauseIds: ['id_personne_physique', 'prix_vente_comptant'],
  variables: {
    NOM: 'BENALI',
    PRENOM: 'Ahmed',
    PRIX_VENTE: '5000000'
  }
}, 'fr');

// 3. Combiner
const finalDoc = header + '\n\n' + document;
```

### Utiliser le Composant React

```typescript
import EnhancedDraftingInterface from './components/EnhancedDraftingInterface';

function App() {
  return (
    <EnhancedDraftingInterface
      language="fr"
      userRole="AVOCAT"
      userId="user-123"
    />
  );
}
```

---

## 🔍 Fonctionnalités Clés

### Validation de Formats

```typescript
// Valider un RC
const rcValidation = wilayaTemplateService.validateRC('16/12345678', '16');
console.log(rcValidation.valid); // true

// Valider un NIF
const nifValidation = wilayaTemplateService.validateNIF('099916123456789', '16');
console.log(nifValidation.valid); // true
```

### Suggestions de Clauses

```typescript
const suggestions = clauseService.suggestComplementaryClauses(
  'acte_vente_immobiliere',
  ['objet_vente_immobiliere', 'prix_vente_comptant']
);

console.log(suggestions); // Array of suggested clauses
```

### Export Multi-Format

```typescript
const template = {
  documentType: 'acte_vente_immobiliere',
  selectedClauseIds: ['id_personne_physique'],
  variables: { NOM: 'TEST' }
};

// Export en JSON
const jsonDoc = clauseService.exportClauses(template, 'fr', 'json');

// Export en Markdown
const mdDoc = clauseService.exportClauses(template, 'fr', 'markdown');

// Export en Texte
const textDoc = clauseService.exportClauses(template, 'fr', 'text');
```

---

## 📚 Ressources

### Documentation Complète

- **INTEGRATION_COMPLETE_GUIDE.md** - Guide d'intégration détaillé
- **SYSTEM_INTEGRATION_VALIDATION_REPORT.md** - Rapport de validation
- **TEMPLATES_SPECIFIQUES_WILAYA.md** - Documentation wilayas
- **CLAUSES_STANDARDS_DOCUMENTATION.md** - Documentation clauses

### Exemples

- **examples/document-generation-examples.ts** - Exemples complets
- **tests/integration/document-generation.test.ts** - Tests d'intégration

### Composants Principaux

- **components/EnhancedDraftingInterface.tsx** - Interface principale
- **components/WilayaSelector.tsx** - Sélecteur de wilaya
- **components/ClauseSelector.tsx** - Sélecteur de clauses
- **components/TemplateContribution.tsx** - Contribution de templates

### Services

- **services/wilayaTemplateService.ts** - Service wilaya
- **services/clauseService.ts** - Service clauses
- **services/templateContributionService.ts** - Service contributions

### Données

- **data/wilayaSpecificData.ts** - Données wilayas (8 wilayas)
- **data/clausesStandards.ts** - Clauses standards (20+ clauses)

---

## 🐛 Débogage

### Problèmes Courants

**1. Erreur de compilation TypeScript**

```bash
npm run type-check
```

**2. Erreur d'import**

Vérifier que les chemins sont corrects:
```typescript
// Correct
import { wilayaTemplateService } from './services/wilayaTemplateService';

// Incorrect
import { wilayaTemplateService } from '../services/wilayaTemplateService';
```

**3. Variables manquantes**

```typescript
const missing = clauseService.getMissingVariables(
  ['id_personne_physique'],
  { NOM: 'TEST' }
);
console.log('Variables manquantes:', missing);
```

---

## 🎯 Workflow Typique

### 1. Utilisateur Sélectionne un Template

```typescript
const templates = getTemplatesForRole(userRole);
const selectedTemplate = templates[0];
```

### 2. Utilisateur Choisit une Wilaya (Optionnel)

```typescript
const wilayaCode = '16'; // Alger
const tribunalName = 'Tribunal de Sidi M\'Hamed';
```

### 3. Utilisateur Sélectionne des Clauses (Optionnel)

```typescript
const selectedClauses = [
  'id_personne_physique',
  'objet_vente_immobiliere',
  'prix_vente_comptant'
];
```

### 4. Utilisateur Remplit les Détails

```typescript
const variables = {
  NOM: 'BENALI',
  PRENOM: 'Ahmed',
  PRIX_VENTE: '5000000'
};
```

### 5. Système Génère le Document

```typescript
// En-tête
const header = wilayaTemplateService.generateDocumentHeader(
  wilayaCode, tribunalName, 'fr'
);

// Clauses
const clauses = clauseService.generateDocumentWithClauses({
  documentType: selectedTemplate.id,
  selectedClauseIds: selectedClauses,
  variables: variables
}, 'fr');

// Complétion IA
const aiResponse = await sendMessageToGemini(prompt, [], 'DRAFTING', 'fr');

// Document final
const finalDoc = header + '\n\n' + clauses + '\n\n' + aiResponse.text;
```

---

## 📞 Support

Pour toute question ou problème:

1. Consulter la documentation complète
2. Vérifier les exemples dans `examples/`
3. Consulter les tests dans `tests/integration/`
4. Créer une issue sur GitHub

---

**Version**: 1.0.0  
**Dernière mise à jour**: 11 février 2026
