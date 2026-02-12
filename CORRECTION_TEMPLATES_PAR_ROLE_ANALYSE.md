# ANALYSE: Problème de Templates par Rôle

## PROBLÈME IDENTIFIÉ

Quand un utilisateur sélectionne le rôle "Avocat" et va dans "Rédaction", il voit des templates qui ne sont PAS spécifiques aux avocats.

## CAUSE RACINE

Dans `components/EnhancedDraftingInterface.tsx`, ligne 35-46:

```typescript
const getTemplatesForRole = (role: UserRole) => {
  switch (role) {
    case UserRole.AVOCAT: return TEMPLATES;  // ← PROBLÈME ICI
    case UserRole.NOTAIRE: return NOTAIRE_TEMPLATES;
    case UserRole.HUISSIER: return HUISSIER_TEMPLATES;
    case UserRole.MAGISTRAT: return MAGISTRAT_TEMPLATES;
    case UserRole.JURISTE_ENTREPRISE: return JURISTE_TEMPLATES;
    case UserRole.ETUDIANT: return ETUDIANT_TEMPLATES;
    default: return TEMPLATES;
  }
};
```

**Le problème**: `TEMPLATES` est une constante générique qui contient des documents pour TOUS les rôles, pas spécifiquement pour les avocats.

## STRUCTURE ACTUELLE dans constants.ts

```typescript
// Ligne ~100
export const TEMPLATES: DocumentTemplate[] = [
  // Documents génériques (divorce, civil, pénal, commercial, etc.)
  // Ces documents sont marqués avec roles: ['avocat'] mais sont mélangés
];

// Ligne ~600
export const NOTAIRE_TEMPLATES: DocumentTemplate[] = [
  // Actes de vente, testaments, donations, sociétés, etc.
  // Spécifiques aux notaires
];

// Ligne ~784
export const HUISSIER_TEMPLATES: DocumentTemplate[] = [
  // Sommations, constats, significations, etc.
  // Spécifiques aux huissiers
];

// Autres: MAGISTRAT_TEMPLATES, JURISTE_TEMPLATES, ETUDIANT_TEMPLATES
```

## DOCUMENTS QUI DEVRAIENT ÊTRE POUR AVOCAT

D'après le Code de la Profession d'Avocat algérien, les avocats rédigent:

### 1. DROIT DE LA FAMILLE
- ✅ Requête de Divorce
- ✅ Requête Pension Alimentaire
- ✅ Requête Garde d'Enfants
- ✅ Requête en Succession

### 2. DROIT CIVIL
- ✅ Conclusions Civiles (mémoires de défense)
- ✅ Assignation Civile
- ✅ Requête Dommages-Intérêts
- ✅ Requête d'Expulsion

### 3. DROIT PÉNAL
- ✅ Requête Pénale
- ✅ Constitution de Partie Civile
- ✅ Mémoire de Défense Pénale
- ❌ Plainte avec Constitution de Partie Civile

### 4. DROIT COMMERCIAL
- ✅ Requête Commerciale
- ✅ Requête en Faillite
- ❌ Assignation devant Tribunal de Commerce

### 5. DROIT ADMINISTRATIF
- ✅ Recours Administratif
- ❌ Recours pour Excès de Pouvoir

### 6. PROCÉDURES D'URGENCE
- ✅ Requête en Référé
- ❌ Ordonnance sur Requête

### 7. DROIT DU TRAVAIL
- ❌ Requête Prud'homale
- ❌ Contestation Licenciement

### 8. DROIT IMMOBILIER
- ❌ Action en Revendication
- ❌ Action Possessoire

## DOCUMENTS QUI NE SONT PAS POUR AVOCAT

### NOTAIRE UNIQUEMENT
- Acte de Vente Immobilière (acte authentique)
- Testament Authentique
- Donation Entre Époux
- Constitution SARL (acte authentique)
- Procuration Générale (acte authentique)
- Hypothèque Conventionnelle

### HUISSIER UNIQUEMENT
- Sommation de Payer
- Constat d'Huissier
- Procès-Verbal de Signification
- Commandement de Payer
- Saisie-Exécution

### MAGISTRAT UNIQUEMENT
- Jugement Civil
- Ordonnance de Référé
- Arrêt de Cour

## SOLUTION PROPOSÉE

### Option 1: Renommer et Réorganiser (RECOMMANDÉ)

1. **Renommer `TEMPLATES` en `AVOCAT_TEMPLATES`** dans `constants.ts`
2. **Filtrer les documents** pour ne garder que ceux pertinents pour les avocats
3. **Ajouter les documents manquants** spécifiques aux avocats

```typescript
// Dans constants.ts
export const AVOCAT_TEMPLATES: DocumentTemplate[] = [
  // DROIT DE LA FAMILLE
  { id: 'requete_divorce', ... },
  { id: 'requete_pension_alimentaire', ... },
  { id: 'requete_garde_enfants', ... },
  { id: 'requete_succession', ... },
  
  // DROIT CIVIL
  { id: 'conclusions_civiles', ... },
  { id: 'assignation_civile', ... },
  { id: 'requete_dommages_interets', ... },
  { id: 'requete_expulsion', ... },
  
  // DROIT PÉNAL
  { id: 'requete_penale', ... },
  { id: 'constitution_partie_civile', ... },
  { id: 'memoire_defense_penale', ... },
  { id: 'plainte_constitution_partie_civile', ... },
  
  // DROIT COMMERCIAL
  { id: 'requete_commerciale', ... },
  { id: 'assignation_tribunal_commerce', ... },
  
  // DROIT ADMINISTRATIF
  { id: 'recours_administratif', ... },
  { id: 'recours_exces_pouvoir', ... },
  
  // DROIT DU TRAVAIL
  { id: 'requete_prudhomale', ... },
  { id: 'contestation_licenciement', ... },
  
  // PROCÉDURES D'URGENCE
  { id: 'requete_refere', ... },
  { id: 'requete_ordonnance', ... },
  
  // DROIT IMMOBILIER
  { id: 'action_revendication', ... },
  { id: 'action_possessoire', ... }
];
```

4. **Mettre à jour `EnhancedDraftingInterface.tsx`**:

```typescript
const getTemplatesForRole = (role: UserRole) => {
  switch (role) {
    case UserRole.AVOCAT: return AVOCAT_TEMPLATES;  // ← CORRECTION
    case UserRole.NOTAIRE: return NOTAIRE_TEMPLATES;
    case UserRole.HUISSIER: return HUISSIER_TEMPLATES;
    case UserRole.MAGISTRAT: return MAGISTRAT_TEMPLATES;
    case UserRole.JURISTE_ENTREPRISE: return JURISTE_TEMPLATES;
    case UserRole.ETUDIANT: return ETUDIANT_TEMPLATES;
    case UserRole.ADMIN:
      return [...AVOCAT_TEMPLATES, ...NOTAIRE_TEMPLATES, ...HUISSIER_TEMPLATES, 
              ...MAGISTRAT_TEMPLATES, ...JURISTE_TEMPLATES, ...ETUDIANT_TEMPLATES];
    default: return AVOCAT_TEMPLATES;
  }
};
```

### Option 2: Filtrage Dynamique (Alternative)

Garder `TEMPLATES` mais filtrer par la propriété `roles`:

```typescript
const getTemplatesForRole = (role: UserRole) => {
  const allTemplates = [
    ...TEMPLATES,
    ...NOTAIRE_TEMPLATES,
    ...HUISSIER_TEMPLATES,
    ...MAGISTRAT_TEMPLATES,
    ...JURISTE_TEMPLATES,
    ...ETUDIANT_TEMPLATES
  ];
  
  return allTemplates.filter(template => 
    template.roles?.includes(role.toLowerCase())
  );
};
```

**Problème avec Option 2**: Nécessite que TOUS les templates aient la propriété `roles` correctement définie.

## DOCUMENTS MANQUANTS À AJOUTER

Pour compléter `AVOCAT_TEMPLATES`, il faut ajouter:

1. **Plainte avec Constitution de Partie Civile**
2. **Assignation devant Tribunal de Commerce**
3. **Recours pour Excès de Pouvoir**
4. **Requête Prud'homale**
5. **Contestation de Licenciement**
6. **Requête en Ordonnance sur Requête**
7. **Action en Revendication**
8. **Action Possessoire**
9. **Requête en Annulation de Mariage**
10. **Requête en Reconnaissance de Paternité**

## PROCHAINES ÉTAPES

1. ✅ Lire complètement `constants.ts` pour voir tous les templates
2. ⏳ Créer `AVOCAT_TEMPLATES` avec les bons documents
3. ⏳ Ajouter les documents manquants
4. ⏳ Mettre à jour `EnhancedDraftingInterface.tsx`
5. ⏳ Tester avec chaque rôle pour vérifier la cohérence

## IMPACT

- **Avocats**: Verront uniquement leurs documents (requêtes, conclusions, mémoires)
- **Notaires**: Verront uniquement leurs actes authentiques
- **Huissiers**: Verront uniquement leurs exploits et constats
- **Magistrats**: Verront uniquement leurs jugements et ordonnances
- **Admin**: Verra TOUS les documents de tous les rôles
