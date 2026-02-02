// Types pour les formulaires juridiques structurés

export interface PersonnePhysique {
  // Identité complète
  nom: string;
  prenom: string;
  nomJeuneFille?: string; // Pour les femmes mariées
  
  // Informations matrimoniales (pour les femmes mariées)
  nomEpoux?: string;
  prenomEpoux?: string;
  
  // Filiation
  nomPere: string;
  prenomPere: string;
  nomMere: string;
  prenomMere: string;
  
  // Documents d'identité
  typeDocument: 'CIN' | 'PASSEPORT' | 'PERMIS_CONDUIRE' | 'CARTE_SEJOUR';
  numeroDocument: string;
  dateDelivrance: string;
  lieuDelivrance: string;
  
  // Informations personnelles
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  situationFamiliale: 'CELIBATAIRE' | 'MARIE' | 'DIVORCE' | 'VEUF';
  profession: string;
  
  // Adresse
  adresse: string;
  commune: string;
  daira: string;
  wilaya: string;
  codePostal?: string;
  
  // Qualité dans l'acte
  qualite?: 'VENDEUR' | 'ACHETEUR' | 'DEMANDEUR' | 'DEFENDEUR' | 'TEMOIN';
}

export interface PersonneMorale {
  // Identification
  raisonSociale: string;
  formeJuridique: 'SARL' | 'SPA' | 'EURL' | 'SNC' | 'SCS' | 'ASSOCIATION' | 'AUTRE';
  numeroRC: string; // Registre de Commerce
  numeroNIF: string; // Numéro d'Identification Fiscale
  
  // Représentant légal
  representant: PersonnePhysique;
  qualiteRepresentant: 'GERANT' | 'PDG' | 'DIRECTEUR' | 'PRESIDENT' | 'AUTRE';
  
  // Siège social
  siegeSocial: string;
  commune: string;
  wilaya: string;
  
  // Informations complémentaires
  capitalSocial?: string;
  objetSocial?: string;
}

export interface InformationsCabinet {
  // Cabinet
  nomCabinet: string;
  adresseCabinet: string;
  telephoneCabinet: string;
  emailCabinet?: string;
  
  // Avocat/Notaire
  nomPraticien: string;
  prenomPraticien: string;
  qualitePraticien: 'AVOCAT' | 'NOTAIRE' | 'HUISSIER' | 'AUTRE';
  
  // Inscription professionnelle
  numeroTableau?: string; // Pour avocat
  barreau?: string; // Pour avocat
  numeroEtude?: string; // Pour notaire
  chambreNotariale?: string; // Pour notaire
  
  // Informations légales
  numeroAgrement?: string;
  dateInscription?: string;
}

export interface InformationsTribunal {
  nomTribunal: string;
  typeTribunal: 'CIVIL' | 'PENAL' | 'COMMERCIAL' | 'ADMINISTRATIF' | 'FAMILLE' | 'REFERE';
  adresseTribunal: string;
  wilayaTribunal: string;
}

export interface BienImmobilier {
  // Description
  natureBien: 'APPARTEMENT' | 'MAISON' | 'TERRAIN' | 'LOCAL_COMMERCIAL' | 'BUREAU' | 'AUTRE';
  superficie: string;
  adresseBien: string;
  commune: string;
  wilaya: string;
  
  // Références cadastrales
  numeroTitreFoncier?: string;
  sectionCadastrale?: string;
  numeroParcelle?: string;
  
  // Valeur
  valeurEstimee?: string;
  prixVente?: string;
  
  // Charges et servitudes
  charges?: string;
  servitudes?: string;
}

export interface InformationsFinancieres {
  montant: string;
  devise: 'DZD' | 'EUR' | 'USD';
  modalitePaiement: 'COMPTANT' | 'ECHELONNE' | 'CREDIT';
  dateEcheance?: string;
  tauxInteret?: string;
}

// Formulaires spécifiques par type de document
export interface FormulaireRequeteDivorce {
  tribunal: InformationsTribunal;
  demandeur: PersonnePhysique;
  defendeur: PersonnePhysique;
  cabinet: InformationsCabinet;
  
  // Spécifique au divorce
  dateMariage: string;
  lieuMariage: string;
  numeroActeMariage: string;
  
  // Enfants
  nombreEnfants: number;
  enfants?: Array<{
    nom: string;
    prenom: string;
    dateNaissance: string;
    ageActuel: number;
  }>;
  
  // Motifs
  typeDivorce: 'KHOL' | 'TATLIQ' | 'MUBARAT' | 'FASKH';
  motifs: string;
  
  // Demandes accessoires
  pensionAlimentaire?: InformationsFinancieres;
  gardeEnfants?: 'MERE' | 'PERE' | 'PARTAGE';
  logementFamilial?: string;
}

export interface FormulaireActeVente {
  notaire: InformationsCabinet;
  vendeurs: PersonnePhysique[]; // Plusieurs vendeurs possibles
  acheteurs: PersonnePhysique[]; // Plusieurs acheteurs possibles
  bien: BienImmobilier;
  prix: InformationsFinancieres;
  
  // Conditions de vente
  conditionsParticulieres?: string;
  garanties?: string;
  dateSignature: string;
  datePriseEffet: string;
  
  // Régime matrimonial (si couples)
  regimeMatrimonialVendeurs?: 'COMMUNAUTE' | 'SEPARATION' | 'PARTICIPATION';
  regimeMatrimonialAcheteurs?: 'COMMUNAUTE' | 'SEPARATION' | 'PARTICIPATION';
}

export interface PartiesMultiples {
  vendeurs: PersonnePhysique[];
  acheteurs: PersonnePhysique[];
  temoins?: PersonnePhysique[];
}

// Interface pour gérer les couples
export interface Couple {
  epoux: PersonnePhysique;
  epouse: PersonnePhysique;
  regimeMatrimonial: 'COMMUNAUTE' | 'SEPARATION' | 'PARTICIPATION';
  dateMariage: string;
  lieuMariage: string;
}

export interface FormulaireProcuration {
  notaire: InformationsCabinet;
  mandant: PersonnePhysique;
  mandataire: PersonnePhysique;
  
  // Pouvoirs
  typePouvoirs: 'GENERAL' | 'SPECIAL';
  descriptionPouvoirs: string;
  dureeValidite?: string;
  
  // Conditions
  conditionsRevocation?: string;
  dateSignature: string;
}

// Type générique pour tous les formulaires
export type FormulaireJuridique = 
  | FormulaireRequeteDivorce 
  | FormulaireActeVente 
  | FormulaireProcuration;

// Configuration des champs par template
export interface ConfigurationChamps {
  templateId: string;
  champsObligatoires: string[];
  champsOptionnels: string[];
  validations: Record<string, (value: any) => boolean>;
  messagesErreur: Record<string, string>;
}