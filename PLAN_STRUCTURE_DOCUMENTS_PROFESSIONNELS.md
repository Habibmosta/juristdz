# 🏛️ Plan: Structure Complète des Documents Juridiques Professionnels

## 🚨 PROBLÈME IDENTIFIÉ

Les documents générés manquent d'éléments essentiels pour être utilisables par des professionnels:

### ❌ Ce qui manque actuellement:

1. **Identification du rédacteur** (Avocat/Notaire/Huissier)
   - Nom, prénom
   - Qualité professionnelle
   - Numéro d'inscription (Barreau/Chambre)
   - Adresse du cabinet
   - Téléphone, email

2. **Destinataire du document**
   - À Monsieur le Président du Tribunal de...
   - À Monsieur le Juge des Référés
   - À qui de droit

3. **Objet clair et précis**
   - Objet: Requête en garde d'enfants
   - Référence: (numéro de dossier si applicable)

4. **Date et lieu**
   - Fait à [ville], le [date]

5. **Signature professionnelle**
   - Signature et cachet
   - Nom complet
   - Qualité (Avocat inscrit au Barreau de...)

---

## ✅ SOLUTION PROPOSÉE

### 1. Enrichir le Profil Utilisateur

Ajouter des champs obligatoires pour les professionnels:

```typescript
interface ProfessionalProfile {
  // Existant
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  
  // À AJOUTER
  professionalInfo: {
    // Pour Avocat
    barreauInscription?: string;  // "Barreau d'Alger"
    numeroInscription?: string;   // "A/12345/2020"
    cabinetName?: string;         // "Cabinet Maître Belkacemi"
    cabinetAddress?: string;      // "15 Rue Didouche Mourad, Alger"
    cabinetPhone?: string;        // "+213 21 XX XX XX"
    
    // Pour Notaire
    chambreNotariale?: string;    // "Chambre des Notaires d'Alger"
    numeroMatricule?: string;     // "N/456/2018"
    etudeAddress?: string;        // "8 Boulevard Zighout Youcef"
    
    // Pour Huissier
    chambreHuissiers?: string;    // "Chambre des Huissiers d'Oran"
    numeroAgrement?: string;      // "H/789/2019"
    bureauAddress?: string;       // "42 Rue Larbi Ben M'hidi"
  }
}
```

### 2. Créer un Service de Génération d'En-tête

```typescript
// services/documentHeaderService.ts

class DocumentHeaderService {
  
  /**
   * Générer l'en-tête complet d'un document juridique
   */
  generateDocumentHeader(params: {
    documentType: 'requete' | 'assignation' | 'acte' | 'exploit';
    professional: ProfessionalProfile;
    wilaya?: string;
    tribunal?: string;
    destinataire?: string;
    objet: string;
    reference?: string;
    date: Date;
    language: 'fr' | 'ar';
  }): string {
    
    let header = '';
    
    // 1. EN-TÊTE OFFICIEL (si tribunal)
    if (params.tribunal && params.wilaya) {
      header += this.generateOfficialHeader(params.wilaya, params.tribunal, params.language);
      header += '\n\n';
    }
    
    // 2. IDENTIFICATION DU RÉDACTEUR
    header += this.generateProfessionalIdentity(params.professional, params.language);
    header += '\n\n';
    
    // 3. DESTINATAIRE
    if (params.destinataire) {
      header += this.generateDestinataire(params.destinataire, params.tribunal, params.language);
      header += '\n\n';
    }
    
    // 4. OBJET ET RÉFÉRENCE
    header += this.generateObjetReference(params.objet, params.reference, params.language);
    header += '\n\n';
    
    // 5. DATE ET LIEU
    header += this.generateDateLieu(params.professional.cabinetAddress || params.wilaya, params.date, params.language);
    header += '\n\n';
    
    return header;
  }
  
  private generateProfessionalIdentity(professional: ProfessionalProfile, language: 'fr' | 'ar'): string {
    const info = professional.professionalInfo;
    
    if (professional.role === 'avocat') {
      return language === 'fr' ? 
        `Maître ${professional.firstName} ${professional.lastName}
Avocat inscrit au ${info.barreauInscription}
N° d'inscription: ${info.numeroInscription}
${info.cabinetName}
${info.cabinetAddress}
Tél: ${info.cabinetPhone}` :
        `الأستاذ ${professional.firstName} ${professional.lastName}
محامٍ مسجل في ${info.barreauInscription}
رقم التسجيل: ${info.numeroInscription}
${info.cabinetName}
${info.cabinetAddress}
الهاتف: ${info.cabinetPhone}`;
    }
    
    // Similaire pour Notaire et Huissier...
  }
  
  private generateDestinataire(destinataire: string, tribunal: string, language: 'fr' | 'ar'): string {
    if (destinataire === 'president_tribunal') {
      return language === 'fr' ?
        `À Monsieur le Président du ${tribunal}` :
        `إلى السيد رئيس ${tribunal}`;
    }
    // Autres destinataires...
  }
  
  private generateObjetReference(objet: string, reference: string | undefined, language: 'fr' | 'ar'): string {
    let result = language === 'fr' ? `Objet: ${objet}` : `الموضوع: ${objet}`;
    if (reference) {
      result += language === 'fr' ? `\nRéférence: ${reference}` : `\nالمرجع: ${reference}`;
    }
    return result;
  }
}
```

### 3. Créer un Service de Signature

```typescript
// services/documentSignatureService.ts

class DocumentSignatureService {
  
  generateSignatureBlock(params: {
    professional: ProfessionalProfile;
    date: Date;
    lieu: string;
    language: 'fr' | 'ar';
  }): string {
    
    const dateStr = params.date.toLocaleDateString(params.language === 'fr' ? 'fr-FR' : 'ar-DZ');
    
    let signature = '';
    
    // Date et lieu
    signature += params.language === 'fr' ?
      `Fait à ${params.lieu}, le ${dateStr}` :
      `حرر في ${params.lieu}، بتاريخ ${dateStr}`;
    
    signature += '\n\n';
    
    // Signature
    signature += params.language === 'fr' ?
      `Signature et cachet\n\n` :
      `التوقيع والختم\n\n`;
    
    // Identité du signataire
    const info = params.professional.professionalInfo;
    
    if (params.professional.role === 'avocat') {
      signature += params.language === 'fr' ?
        `Maître ${params.professional.firstName} ${params.professional.lastName}
Avocat au Barreau de ${info.barreauInscription}
N° ${info.numeroInscription}` :
        `الأستاذ ${params.professional.firstName} ${params.professional.lastName}
محامٍ لدى ${info.barreauInscription}
رقم ${info.numeroInscription}`;
    }
    
    return signature;
  }
}
```

### 4. Modifier EnhancedDraftingInterface

```typescript
// Dans handleGenerate()

// 1. Récupérer le profil utilisateur complet
const userProfile = await getUserProfile(userId);

// 2. Vérifier que le profil est complet
if (!userProfile.professionalInfo || !userProfile.professionalInfo.numeroInscription) {
  alert('Veuillez compléter votre profil professionnel avant de générer des documents');
  return;
}

// 3. Générer l'en-tête professionnel
const documentHeader = documentHeaderService.generateDocumentHeader({
  documentType: 'requete',
  professional: userProfile,
  wilaya: selectedWilaya,
  tribunal: selectedTribunal,
  destinataire: 'president_tribunal',
  objet: selectedTemplate.name,
  reference: formData.reference,
  date: new Date(),
  language: language
});

// 4. Ajouter au début du document
documentContent = documentHeader + '\n\n' + documentContent;

// 5. Générer le corps avec l'IA
const response = await sendMessageToGemini(prompt, [], AppMode.DRAFTING, language);

// 6. Générer la signature
const signatureBlock = documentSignatureService.generateSignatureBlock({
  professional: userProfile,
  date: new Date(),
  lieu: selectedWilaya || userProfile.professionalInfo.cabinetAddress?.split(',')[0] || 'Alger',
  language: language
});

// 7. Assembler le document final
let finalDocument = documentHeader + '\n\n' + response.text + '\n\n' + signatureBlock;
```

### 5. Créer un Formulaire de Profil Professionnel

```typescript
// components/ProfessionalProfileForm.tsx

const ProfessionalProfileForm = ({ user, onSave }) => {
  
  return (
    <form>
      <h2>Informations Professionnelles</h2>
      
      {user.role === 'avocat' && (
        <>
          <input 
            label="Barreau d'inscription"
            placeholder="Barreau d'Alger"
            required
          />
          <input 
            label="Numéro d'inscription"
            placeholder="A/12345/2020"
            required
          />
          <input 
            label="Nom du cabinet"
            placeholder="Cabinet Maître Belkacemi"
          />
          <input 
            label="Adresse du cabinet"
            placeholder="15 Rue Didouche Mourad, Alger"
            required
          />
          <input 
            label="Téléphone"
            placeholder="+213 21 XX XX XX"
            required
          />
        </>
      )}
      
      {/* Similaire pour Notaire et Huissier */}
      
      <button type="submit">Enregistrer</button>
    </form>
  );
};
```

---

## 📋 EXEMPLE DE DOCUMENT FINAL COMPLET

### Requête en Garde d'Enfants

```
RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
MINISTÈRE DE LA JUSTICE

Tribunal de Béjaïa
Wilaya de Béjaïa

Adresse: Place Gueydon, Béjaïa
Tél: 034 21 42 00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Maître Habib BELKACEMI
Avocat inscrit au Barreau de Béjaïa
N° d'inscription: A/2456/2018
Cabinet Maître Belkacemi
15 Rue Didouche Mourad, Béjaïa
Tél: +213 34 21 XX XX
Email: h.belkacemi@avocat-dz.com

À Monsieur le Président du Tribunal de Béjaïa

Objet: Requête en garde d'enfants
Référence: Dossier n° 2024/123

Béjaïa, le 28 février 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUÊTE EN GARDE D'ENFANTS

Monsieur le Président,

J'ai l'honneur de me présenter devant votre haute juridiction au nom et pour le compte de:

Monsieur Djillali AHMED
Né le 21 juin 1990 à Tiaret
Titulaire de la CIN n° 65312321
Demeurant à Tamourassen, Tiaret
Profession: Taxieur

Mon mandant, ci-après dénommé "le Demandeur"

CONTRE

Madame Djija FETTAH
Née le 18 mai 2000 à Tiaret
Titulaire de la CIN n° 97613131
Demeurant à Tadmait, Tiaret
Profession: Au foyer

Ci-après dénommée "la Défenderesse"

EXPOSÉ DES FAITS

[... corps du document généré par l'IA ...]

PAR CES MOTIFS

Plaise à Monsieur le Président du Tribunal de Béjaïa:

1. Accorder la garde de l'enfant Fatima au Demandeur
2. Fixer un droit de visite et d'hébergement pour la mère
3. Condamner la Défenderesse aux dépens

Sous le bénéfice de ces observations, je vous prie d'agréer, Monsieur le Président, 
l'expression de ma haute considération.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fait à Béjaïa, le 28 février 2026

Signature et cachet

Maître Habib BELKACEMI
Avocat au Barreau de Béjaïa
N° A/2456/2018

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PIÈCES JOINTES:
1. Copie CIN du Demandeur
2. Acte de naissance de l'enfant
3. Certificat de résidence
4. Justificatifs de revenus
```

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1: Base de Données (1-2h)
- [ ] Ajouter champs `professionalInfo` au schéma utilisateur
- [ ] Migration base de données
- [ ] Mettre à jour types TypeScript

### Phase 2: Services (2-3h)
- [ ] Créer `documentHeaderService.ts`
- [ ] Créer `documentSignatureService.ts`
- [ ] Tests unitaires

### Phase 3: Interface Utilisateur (2-3h)
- [ ] Créer `ProfessionalProfileForm.tsx`
- [ ] Ajouter dans les paramètres utilisateur
- [ ] Validation des champs obligatoires

### Phase 4: Intégration (2-3h)
- [ ] Modifier `EnhancedDraftingInterface.tsx`
- [ ] Intégrer les services d'en-tête et signature
- [ ] Tester avec tous les types de documents

### Phase 5: Prompts IA (1-2h)
- [ ] Enrichir les prompts pour structure complète
- [ ] Ajouter exemples de documents complets
- [ ] Tests avec différents rôles

### Phase 6: Tests et Validation (2-3h)
- [ ] Tests avec profils Avocat, Notaire, Huissier
- [ ] Validation format documents
- [ ] Corrections et ajustements

**TOTAL ESTIMÉ: 10-16 heures de développement**

---

## ✅ RÉSULTAT ATTENDU

Après implémentation, chaque document généré aura:

1. ✅ En-tête officiel complet
2. ✅ Identification du professionnel rédacteur
3. ✅ Destinataire clairement identifié
4. ✅ Objet et référence
5. ✅ Date et lieu
6. ✅ Corps du document structuré
7. ✅ Signature professionnelle avec cachet
8. ✅ Liste des pièces jointes

**Le document sera prêt à être imprimé, signé et déposé au tribunal sans aucune modification!**

---

**Priorité**: 🔴 CRITIQUE - Sans cela, l'application n'est PAS utilisable par des professionnels
**Complexité**: 🟡 MOYENNE - Nécessite modifications base de données + services + UI
**Impact**: 🟢 MAJEUR - Rend l'application production-ready pour les professionnels
