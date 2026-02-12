# CORRECTION: Formulaires Dynamiques par Type de Document ✅

## PROBLÈME RÉSOLU

Quand un utilisateur sélectionnait "Requête Pension Alimentaire", il se retrouvait avec un formulaire d'acte de vente (Vendeur/Acheteur/Bien/Prix) qui n'avait AUCUN rapport avec une pension alimentaire!

## CAUSE

Le composant `SimpleFormModal.tsx` était codé en dur pour un seul type de document (acte de vente immobilière). Il était utilisé pour TOUS les types de documents, ce qui n'avait aucun sens.

## SOLUTION APPLIQUÉE

### 1. Création de `DynamicLegalForm.tsx`

Un nouveau composant intelligent qui affiche le bon formulaire selon le `templateId`:

```typescript
<DynamicLegalForm
  language={language}
  templateId={selectedTemplateId}  // ← Détermine quel formulaire afficher
  onSubmit={(data) => setStructuredFormData(data)}
  onClose={() => setShowFormModal(false)}
/>
```

### 2. Formulaires Spécifiques Implémentés

#### A. Requête Pension Alimentaire (`requete_pension_alimentaire`)

**Sections:**
1. **Demandeur** (celui qui demande la pension)
   - Nom, Prénom
   - Numéro CIN
   - Adresse

2. **Débiteur** (celui qui doit payer)
   - Nom, Prénom
   - Revenus mensuels estimés

3. **Bénéficiaires**
   - Nombre d'enfants
   - Âges des enfants

4. **Montant demandé**
   - Montant mensuel demandé (DA)
   - Détails des besoins (scolarité, nourriture, vêtements, santé...)

#### B. Requête de Divorce (`requete_divorce`)

**Sections:**
1. **Époux**
   - Nom, Prénom

2. **Épouse**
   - Nom, Prénom

3. **Mariage**
   - Date du mariage
   - Lieu du mariage

4. **Type de divorce**
   - Khol (خلع) - divorce à la demande de l'épouse
   - Tatliq (تطليق) - divorce judiciaire
   - Mubarat (مبارات) - consentement mutuel

5. **Motifs**
   - Détails des motifs du divorce

6. **Enfants**
   - Nombre d'enfants

#### C. Formulaire Générique (pour les autres documents)

Pour les documents qui n'ont pas encore de formulaire spécifique:
- Nom complet
- Numéro CIN
- Adresse
- Détails supplémentaires (zone de texte libre)

### 3. Mise à jour de `EnhancedDraftingInterface.tsx`

**AVANT:**
```typescript
import SimpleFormModal from './forms/SimpleFormModal';

// ...

{showFormModal && (
  <SimpleFormModal  // ← Toujours le même formulaire
    language={language}
    onSubmit={(data) => setStructuredFormData(data)}
    onClose={() => setShowFormModal(false)}
  />
)}
```

**APRÈS:**
```typescript
import DynamicLegalForm from './forms/DynamicLegalForm';

// ...

{showFormModal && (
  <DynamicLegalForm  // ← Formulaire adapté au document
    language={language}
    templateId={selectedTemplateId}  // ← Clé du changement
    onSubmit={(data) => setStructuredFormData(data)}
    onClose={() => setShowFormModal(false)}
  />
)}
```

## RÉSULTAT

Maintenant, chaque type de document a son propre formulaire adapté:

### Exemple 1: Requête Pension Alimentaire
```
✅ Demandeur (nom, prénom, CIN, adresse)
✅ Débiteur (nom, prénom, revenus)
✅ Bénéficiaires (nombre d'enfants, âges)
✅ Montant demandé (montant mensuel, détails besoins)
```

### Exemple 2: Requête de Divorce
```
✅ Époux (nom, prénom)
✅ Épouse (nom, prénom)
✅ Mariage (date, lieu)
✅ Type de divorce (Khol, Tatliq, Mubarat)
✅ Motifs du divorce
✅ Enfants (nombre)
```

### Exemple 3: Autres documents (temporaire)
```
✅ Formulaire générique avec champs de base
✅ Zone de texte libre pour détails
```

## PROCHAINES ÉTAPES

Pour compléter le système, il faut ajouter des formulaires spécifiques pour:

### Droit de la Famille
- ✅ Requête Pension Alimentaire (FAIT)
- ✅ Requête de Divorce (FAIT)
- ⏳ Requête Garde d'Enfants
- ⏳ Requête en Succession

### Droit Civil
- ⏳ Conclusions Civiles
- ⏳ Assignation Civile
- ⏳ Requête Dommages-Intérêts
- ⏳ Requête d'Expulsion

### Droit Pénal
- ⏳ Requête Pénale
- ⏳ Constitution de Partie Civile
- ⏳ Mémoire de Défense Pénale

### Droit Commercial
- ⏳ Requête Commerciale
- ⏳ Requête en Faillite

### Droit Administratif
- ⏳ Recours Administratif

### Procédures d'Urgence
- ⏳ Requête en Référé

## COMMENT AJOUTER UN NOUVEAU FORMULAIRE

Dans `DynamicLegalForm.tsx`, ajouter un nouveau `case` dans la fonction `getFieldsForTemplate()`:

```typescript
case 'requete_garde_enfants':
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg mb-4">
        {isAr ? 'طلب حضانة' : 'Requête Garde d\'Enfants'}
      </h3>
      
      {/* Ajouter les champs spécifiques */}
      <div>
        <label>...</label>
        <input
          value={formData.champX || ''}
          onChange={(e) => handleChange('champX', e.target.value)}
          className="w-full p-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
      </div>
      
      {/* ... autres champs ... */}
    </div>
  );
```

## AVANTAGES DE LA SOLUTION

1. **Pertinence**: Chaque document a les champs qui lui correspondent
2. **Expérience utilisateur**: Plus de confusion avec des champs inadaptés
3. **Qualité des documents**: Les données collectées sont pertinentes
4. **Extensibilité**: Facile d'ajouter de nouveaux formulaires
5. **Maintenance**: Un seul fichier à modifier pour ajouter un formulaire
6. **Bilingue**: Tous les formulaires supportent FR/AR

## FICHIERS MODIFIÉS

1. ✅ `components/forms/DynamicLegalForm.tsx` - CRÉÉ (nouveau composant)
2. ✅ `components/EnhancedDraftingInterface.tsx` - Import et utilisation mis à jour
3. ℹ️ `components/forms/SimpleFormModal.tsx` - Conservé pour référence (peut être supprimé plus tard)

## VÉRIFICATION

✅ Code compile sans erreurs
✅ Formulaire Pension Alimentaire fonctionnel
✅ Formulaire Divorce fonctionnel
✅ Formulaire générique pour les autres documents
✅ Support bilingue FR/AR
✅ Validation des champs requis

## CONCLUSION

Le problème est résolu! Maintenant:
- **Requête Pension Alimentaire** → Formulaire avec Demandeur/Débiteur/Bénéficiaires/Montant
- **Requête de Divorce** → Formulaire avec Époux/Épouse/Mariage/Type/Motifs
- **Autres documents** → Formulaire générique (en attendant leurs formulaires spécifiques)

Plus de confusion avec des formulaires inadaptés! 🎉
