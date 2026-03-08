# 🚀 INTÉGRATION MANUELLE - 3 Formulaires Huissier + 5 Formulaires Notaire

## ✅ SITUATION

Le projet compile et fonctionne avec 15 formulaires Avocat.

## 📝 ÉTAPES D'INTÉGRATION

### Étape 1: Ouvrir le fichier

```
Ouvrir: components/forms/DynamicLegalForm.tsx
```

### Étape 2: Trouver le point d'insertion

Chercher (Ctrl+F): `// Formulaire générique pour les autres templates`

Vous devriez voir (ligne ~4074):
```typescript
      );

      // Formulaire générique pour les autres templates
      default:
        return (
```

### Étape 3: Copier les formulaires Huissier

1. Ouvrir: `components/forms/HUISSIER_FORMS_COMPLETS.txt`
2. Sélectionner TOUT le contenu SAUF:
   - Les 3 premières lignes (commentaires d'en-tête)
   - Les 2 dernières lignes (`// FIN DES FORMULAIRES HUISSIER`)
3. Copier (Ctrl+C)

### Étape 4: Coller dans DynamicLegalForm.tsx

Positionner le curseur JUSTE AVANT la ligne:
```typescript
      // Formulaire générique pour les autres templates
```

Coller (Ctrl+V)

Le résultat devrait être:
```typescript
      );

      // ===== VOS 3 FORMULAIRES HUISSIER ICI =====
      case 'mise_en_demeure':
        return (...);
      
      case 'sommation_payer':
        return (...);
      
      case 'pv_constat':
        return (...);
      // ===== FIN FORMULAIRES HUISSIER =====

      // Formulaire générique pour les autres templates
      default:
        return (
```

### Étape 5: Sauvegarder et compiler

```powershell
# Sauvegarder le fichier (Ctrl+S)

# Compiler
yarn build
```

Si ça compile ✅, vous avez maintenant **18 formulaires** (15 Avocat + 3 Huissier)!

## 📋 FORMULAIRES NOTAIRE (À CRÉER ENSUITE)

Je vais créer les 5 formulaires Notaire dans un fichier séparé que vous pourrez intégrer de la même manière.

**Formulaires à créer**:
1. `acte_vente_immobiliere` - Acte de Vente Immobilière
2. `testament_authentique` - Testament Authentique
3. `contrat_mariage` - Contrat de Mariage
4. `donation_simple` - Donation Simple
5. `procuration_generale` - Procuration Générale

## ⏱️ TEMPS ESTIMÉ

- Intégration Huissier: 2 minutes
- Compilation: 30 secondes
- Création Notaire: 30 minutes
- Intégration Notaire: 2 minutes

**TOTAL**: ~35 minutes pour avoir les 23 formulaires!

