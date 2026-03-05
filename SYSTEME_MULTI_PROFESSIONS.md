# 🎯 Système Multi-Professions - JuristDZ

## Vue d'ensemble

JuristDZ est maintenant configuré pour offrir une expérience **sur-mesure** à chaque profession juridique algérienne, avec son propre vocabulaire, ses types de dossiers, et ses workflows spécifiques.

---

## 📋 Professions Supportées

### ⚖️ AVOCAT
**Terminologie**: Dossiers, Clients, Pièces, Agenda
**Types de dossiers**:
- Droit Civil
- Droit Pénal
- Droit Commercial
- Droit de la Famille
- Droit du Travail
- Droit Administratif
- Droit Immobilier

**Statuts**: Nouveau → En cours → Audience → Jugement → Appel → Clôturé → Archivé

**Événements**: Audiences, RDV Client, Dépôt de pièce, Échéances, Expertise, Conciliation

---

### 📜 NOTAIRE
**Terminologie**: Actes, Parties, Annexes, Rendez-vous
**Types d'actes**:
- Vente immobilière
- Donation
- Succession
- Hypothèque
- Constitution de société
- Procuration
- Contrat de mariage
- Bail notarié

**Statuts**: Brouillon → En préparation → Vérification → Signature prévue → Signé → Enregistré → Archivé

**Événements**: Signature d'acte, RDV avec les parties, Vérification des pièces, Enregistrement, Conservation foncière

**Champs spécifiques**: N° Répertoire, N° Minute, Lieu de signature, Frais d'enregistrement

---

### ⚡ HUISSIER DE JUSTICE
**Terminologie**: Exploits, Requérants, Pièces, Missions
**Types d'exploits**:
- Signification
- Exécution forcée
- Constat
- Saisie
- Expulsion
- Commandement de payer
- Protêt

**Statuts**: Reçu → En cours → Exécuté / Infructueux → Reporté → Archivé

**Événements**: Signification, Exécution, Constat, RDV parties

**Champs spécifiques**: Destinataire, Adresse de signification, Frais de déplacement, N° Titre exécutoire

---

### ⚖️ MAGISTRAT
**Terminologie**: Affaires, Parties, Pièces du dossier, Audiences
**Types d'affaires**:
- Civil
- Pénal
- Commercial
- Social
- Administratif

**Statuts**: Enrôlé → En instruction → En audience → En délibéré → Jugé → En appel

**Événements**: Audience, Mise en délibéré, Prononcé du jugement

**Champs spécifiques**: N° RG, Chambre, Formation

---

### 💼 JURISTE D'ENTREPRISE
**Terminologie**: Dossiers, Départements, Documents, Échéances
**Types de dossiers**:
- Contrat
- Contentieux
- Conformité
- Droit social
- Propriété intellectuelle
- Réglementaire

**Statuts**: Nouveau → En analyse → En validation → Validé → Archivé

**Événements**: Réunion, Échéance contractuelle, Audit, Formation

**Champs spécifiques**: Département concerné, Référence interne, Niveau de risque

---

## 🎨 Personnalisation par Profession

### Couleurs principales
- **Avocat**: Or légal (`legal-gold`)
- **Notaire**: Ambre (`amber-600`)
- **Huissier**: Vert (`green-600`)
- **Magistrat**: Violet (`purple-600`)
- **Juriste**: Indigo (`indigo-600`)

### Icônes
- **Avocat**: ⚖️
- **Notaire**: 📜
- **Huissier**: ⚡
- **Magistrat**: ⚖️
- **Juriste**: 💼

---

## 🔧 Configuration Technique

### Fichiers créés
1. **`config/professionConfig.ts`**: Configuration complète de chaque profession
2. **`config/roleRouting.ts`**: Mise à jour des accès par rôle

### Fonctions utilitaires
```typescript
getProfessionConfig(role: UserRole): ProfessionConfig
getTerminology(role: UserRole): Terminology
getDossierTypes(role: UserRole): DossierType[]
getDossierStatuses(role: UserRole): Status[]
getEventTypes(role: UserRole): EventType[]
```

---

## 📊 Accès aux modules

| Module | Avocat | Notaire | Huissier | Magistrat | Juriste |
|--------|--------|---------|----------|-----------|---------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Recherche | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rédaction | ✅ | ✅ | ✅ | ❌ | ✅ |
| Analyse | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dossiers** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Clients** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Agenda** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Facturation** | ✅ | ✅ | ✅ | ❌ | ❌ |
| Analytiques | ✅ | ❌ | ❌ | ❌ | ❌ |
| Outils | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🚀 Prochaines étapes

### Phase 1: Adaptation de l'interface ✅
- [x] Configuration des professions
- [x] Activation des modules pour tous les rôles
- [ ] Adaptation dynamique de l'interface selon le rôle

### Phase 2: Composants spécifiques
- [ ] Adapter `EnhancedCaseManagement` pour utiliser la terminologie
- [ ] Adapter `CaseDetailView` pour les champs spécifiques
- [ ] Adapter `CaseTimeline` pour les types d'événements

### Phase 3: Workflows métier
- [ ] Workflow notaire: Signature → Enregistrement → Conservation foncière
- [ ] Workflow huissier: Réception → Signification → Exécution
- [ ] Workflow magistrat: Enrôlement → Instruction → Jugement

### Phase 4: Calculs spécifiques
- [ ] Calcul des frais d'enregistrement (Notaire)
- [ ] Calcul des frais de signification (Huissier)
- [ ] Barèmes professionnels algériens

---

## 💡 Avantages compétitifs

1. **Professionnalisme**: Chaque métier retrouve son environnement familier
2. **Conformité**: Terminologie conforme aux usages algériens
3. **Efficacité**: Workflows adaptés à chaque profession
4. **Unicité**: Aucun concurrent n'offre ce niveau de personnalisation

---

## 📝 Notes importantes

- Tous les textes sont bilingues FR/AR
- Les couleurs et icônes sont cohérentes avec chaque profession
- Les champs obligatoires varient selon la profession
- Les statuts reflètent les étapes réelles de chaque métier
- Les événements correspondent aux activités quotidiennes

---

**JuristDZ - L'assistant juridique qui parle votre langue professionnelle** 🇩🇿
