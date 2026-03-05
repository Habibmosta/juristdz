# Modals Spécifiques par Rôle

## ✅ Créés

### Avocat
- **Modal**: `NewCaseModal.tsx` (existant)
- **Champs**: Client, type d'affaire, description, priorité, échéances
- **Utilisation**: Gestion de dossiers juridiques

### Notaire  
- **Modal**: `NewActeNotarialModal.tsx` ✅ NOUVEAU
- **Champs**: 
  - Type d'acte (vente, donation, mariage, testament, succession, hypothèque, bail, société)
  - Parties (multiples)
  - Objet de l'acte
  - Montant (DA)
  - Date et lieu de signature
  - Notes
- **Utilisation**: Création d'actes authentiques

### Huissier
- **Modal**: `NewConstatHuissierModal.tsx` ✅ NOUVEAU
- **Champs**:
  - Type d'acte (signification, constat, saisie, expulsion, protêt, sommation, inventaire, PV)
  - Requérant
  - Destinataire
  - Objet
  - Adresse d'exécution
  - Date et heure d'exécution
  - Montant (DA)
  - Notes
- **Utilisation**: Création d'actes d'huissier

## 🔄 À Intégrer

Les modals sont créés mais doivent être intégrés dans:
- `components/interfaces/NotaireInterface.tsx`
- `components/interfaces/HuissierInterface.tsx`

## 📋 Autres Rôles à Vérifier

- **Magistrat**: Pas de création de dossiers (consultation uniquement)
- **Juriste d'Entreprise**: Utilise probablement le modal avocat (à vérifier)
- **Étudiant**: Mode consultation/apprentissage (pas de création)

## 🎯 Prochaines Étapes

1. Intégrer `NewActeNotarialModal` dans `NotaireInterface`
2. Intégrer `NewConstatHuissierModal` dans `HuissierInterface`
3. Vérifier et adapter pour Juriste d'Entreprise si nécessaire
