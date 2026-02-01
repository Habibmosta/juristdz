// Minutier électronique types for notaries

export interface ActeAuthentique {
  id: string;
  numeroMinutier: string; // Numérotation chronologique automatique
  numeroRepertoire: string;
  dateActe: Date;
  typeActe: TypeActe;
  objet: string;
  parties: PartieActe[];
  notaireId: string;
  etude: EtudeNotariale;
  contenu: ContenuActe;
  signatures: SignatureActe[];
  annexes: AnnexeActe[];
  statut: StatutActe;
  hashIntegrite: string; // Hash pour garantir l'inaltérabilité
  chiffrementCle: string; // Clé de chiffrement
  metadonnees: MetadonneesActe;
  archivage: ArchivageInfo;
  createdAt: Date;
  updatedAt: Date;
}

export enum TypeActe {
  VENTE_IMMOBILIERE = 'vente_immobiliere',
  DONATION = 'donation',
  SUCCESSION = 'succession',
  HYPOTHEQUE = 'hypotheque',
  CONTRAT_MARIAGE = 'contrat_mariage',
  TESTAMENT = 'testament',
  PROCURATION = 'procuration',
  CONSTITUTION_SOCIETE = 'constitution_societe',
  CESSION_PARTS = 'cession_parts',
  BAIL_EMPHYTEOTIQUE = 'bail_emphyteotique',
  PARTAGE = 'partage',
  RECONNAISSANCE_DETTE = 'reconnaissance_dette',
  MAINLEVEE = 'mainlevee',
  AUTRE = 'autre'
}

export interface PartieActe {
  id: string;
  type: TypePartie;
  civilite: Civilite;
  nom: string;
  prenom: string;
  dateNaissance?: Date;
  lieuNaissance?: string;
  nationalite: string;
  profession?: string;
  adresse: AdressePartie;
  pieceIdentite: PieceIdentite;
  qualite: QualitePartie;
  representant?: RepresentantLegal;
}

export enum TypePartie {
  PERSONNE_PHYSIQUE = 'personne_physique',
  PERSONNE_MORALE = 'personne_morale',
  ADMINISTRATION = 'administration'
}

export enum Civilite {
  MONSIEUR = 'monsieur',
  MADAME = 'madame',
  MADEMOISELLE = 'mademoiselle'
}

export interface AdressePartie {
  rue: string;
  ville: string;
  codePostal: string;
  wilaya: string;
  pays: string;
}

export interface PieceIdentite {
  type: TypePieceIdentite;
  numero: string;
  dateDelivrance: Date;
  lieuDelivrance: string;
  dateExpiration?: Date;
}

export enum TypePieceIdentite {
  CARTE_IDENTITE = 'carte_identite',
  PASSEPORT = 'passeport',
  PERMIS_CONDUIRE = 'permis_conduire',
  REGISTRE_COMMERCE = 'registre_commerce',
  STATUTS_SOCIETE = 'statuts_societe'
}

export enum QualitePartie {
  VENDEUR = 'vendeur',
  ACQUEREUR = 'acquereur',
  DONATEUR = 'donateur',
  DONATAIRE = 'donataire',
  TESTATEUR = 'testateur',
  LEGATAIRE = 'legataire',
  HERITIER = 'heritier',
  CREANCIER = 'creancier',
  DEBITEUR = 'debiteur',
  MANDANT = 'mandant',
  MANDATAIRE = 'mandataire',
  ASSOCIE = 'associe',
  GERANT = 'gerant',
  AUTRE = 'autre'
}

export interface RepresentantLegal {
  nom: string;
  prenom: string;
  qualite: string;
  pieceIdentite: PieceIdentite;
}

export interface EtudeNotariale {
  id: string;
  nom: string;
  adresse: AdressePartie;
  telephone: string;
  email: string;
  numeroAgrement: string;
  chambreNotaires: string;
}

export interface ContenuActe {
  preambule: string;
  comparution: string;
  expose: string;
  dispositif: string;
  clauses: ClauseActe[];
  mentions: MentionActe[];
  conclusion: string;
}

export interface ClauseActe {
  id: string;
  type: TypeClause;
  titre: string;
  contenu: string;
  ordre: number;
  obligatoire: boolean;
}

export enum TypeClause {
  PRIX = 'prix',
  PAIEMENT = 'paiement',
  GARANTIE = 'garantie',
  SERVITUDE = 'servitude',
  CONDITION_SUSPENSIVE = 'condition_suspensive',
  PENALITE = 'penalite',
  ATTRIBUTION_JURIDICTION = 'attribution_juridiction',
  FRAIS = 'frais',
  AUTRE = 'autre'
}

export interface MentionActe {
  id: string;
  type: TypeMention;
  contenu: string;
  obligatoire: boolean;
}

export enum TypeMention {
  LECTURE = 'lecture',
  RENONCIATION_LECTURE = 'renonciation_lecture',
  PERSEVERATION = 'perseveration',
  RATURES_RENVOIS = 'ratures_renvois',
  FRAIS_ENREGISTREMENT = 'frais_enregistrement',
  PUBLICITE_FONCIERE = 'publicite_fonciere',
  AUTRE = 'autre'
}

export interface SignatureActe {
  id: string;
  partieId: string;
  typeSignature: TypeSignature;
  horodatage: Date;
  certificatNumerique?: string;
  empreinteNumerique: string;
  statut: StatutSignature;
}

export enum TypeSignature {
  ELECTRONIQUE_SIMPLE = 'electronique_simple',
  ELECTRONIQUE_AVANCEE = 'electronique_avancee',
  ELECTRONIQUE_QUALIFIEE = 'electronique_qualifiee',
  MANUSCRITE_NUMERISEE = 'manuscrite_numerisee'
}

export enum StatutSignature {
  EN_ATTENTE = 'en_attente',
  SIGNEE = 'signee',
  REFUSEE = 'refusee',
  EXPIREE = 'expiree'
}

export interface AnnexeActe {
  id: string;
  nom: string;
  type: TypeAnnexe;
  taille: number;
  cheminFichier: string;
  hashFichier: string;
  dateAjout: Date;
  description?: string;
}

export enum TypeAnnexe {
  PLAN = 'plan',
  PHOTO = 'photo',
  DOCUMENT_IDENTITE = 'document_identite',
  JUSTIFICATIF = 'justificatif',
  EXPERTISE = 'expertise',
  AUTRE = 'autre'
}

export enum StatutActe {
  BROUILLON = 'brouillon',
  EN_PREPARATION = 'en_preparation',
  PRET_SIGNATURE = 'pret_signature',
  EN_COURS_SIGNATURE = 'en_cours_signature',
  SIGNE = 'signe',
  ENREGISTRE = 'enregistre',
  ARCHIVE = 'archive',
  ANNULE = 'annule'
}

export interface MetadonneesActe {
  mots_cles: string[];
  references_legales: string[];
  montant?: number;
  devise: string;
  superficie?: number;
  localisation?: string;
  numero_parcelle?: string;
  references_cadastrales?: string[];
}

export interface ArchivageInfo {
  dateArchivage?: Date;
  numeroArchive: string;
  emplacementPhysique?: string;
  emplacementNumerique: string;
  dureeConservation: number; // en années
  dateDestructionPrevue?: Date;
  statutArchivage: StatutArchivage;
  sauvegardes: SauvegardeInfo[];
}

export enum StatutArchivage {
  ACTIF = 'actif',
  ARCHIVE_INTERMEDIAIRE = 'archive_intermediaire',
  ARCHIVE_DEFINITIVE = 'archive_definitive',
  DETRUIT = 'detruit'
}

export interface SauvegardeInfo {
  id: string;
  dateSauvegarde: Date;
  typeSauvegarde: TypeSauvegarde;
  emplacementSauvegarde: string;
  hashSauvegarde: string;
  tailleSauvegarde: number;
  statut: StatutSauvegarde;
}

export enum TypeSauvegarde {
  LOCALE = 'locale',
  CLOUD = 'cloud',
  EXTERNE = 'externe',
  PAPIER = 'papier'
}

export enum StatutSauvegarde {
  ACTIVE = 'active',
  CORROMPUE = 'corrompue',
  SUPPRIMEE = 'supprimee'
}

export interface MinutierRecherche {
  numeroMinutier?: string;
  numeroRepertoire?: string;
  dateDebut?: Date;
  dateFin?: Date;
  typeActe?: TypeActe;
  parties?: string[];
  objet?: string;
  montantMin?: number;
  montantMax?: number;
  statut?: StatutActe;
  motsCles?: string[];
  notaireId?: string;
  page?: number;
  limite?: number;
  tri?: TriMinutier;
}

export interface TriMinutier {
  champ: ChampTriMinutier;
  ordre: OrdreTriMinutier;
}

export enum ChampTriMinutier {
  DATE_ACTE = 'date_acte',
  NUMERO_MINUTIER = 'numero_minutier',
  TYPE_ACTE = 'type_acte',
  PARTIES = 'parties',
  MONTANT = 'montant',
  STATUT = 'statut'
}

export enum OrdreTriMinutier {
  ASC = 'asc',
  DESC = 'desc'
}

export interface ResultatRechercheMinutier {
  actes: ActeAuthentique[];
  total: number;
  page: number;
  totalPages: number;
  facettes: FacetteRecherche[];
}

export interface FacetteRecherche {
  champ: string;
  valeurs: ValeurFacette[];
}

export interface ValeurFacette {
  valeur: string;
  nombre: number;
}

export interface CopieConforme {
  id: string;
  acteId: string;
  typeCopie: TypeCopie;
  numeroCopie: string;
  dateGeneration: Date;
  demandeur: DemandeurCopie;
  notaireId: string;
  contenuCopie: string;
  signatureNotaire: SignatureNotaire;
  cachets: CachetNotarial[];
  statut: StatutCopie;
  validiteJuridique: boolean;
  hashCopie: string;
}

export enum TypeCopie {
  COPIE_CONFORME = 'copie_conforme',
  EXTRAIT = 'extrait',
  EXPEDITION = 'expedition',
  GROSSE = 'grosse'
}

export interface DemandeurCopie {
  nom: string;
  prenom?: string;
  qualite: string;
  adresse: AdressePartie;
  pieceIdentite: PieceIdentite;
  motifDemande: string;
}

export interface SignatureNotaire {
  notaireId: string;
  nomNotaire: string;
  dateSignature: Date;
  signatureNumerique: string;
  certificat: string;
}

export interface CachetNotarial {
  id: string;
  type: TypeCachet;
  empreinte: string;
  dateApposition: Date;
  coordonnees: CoordonneesCachet;
}

export enum TypeCachet {
  CACHET_ETUDE = 'cachet_etude',
  CACHET_PERSONNEL = 'cachet_personnel',
  SCEAU_ELECTRONIQUE = 'sceau_electronique'
}

export interface CoordonneesCachet {
  x: number;
  y: number;
  page: number;
}

export enum StatutCopie {
  GENEREE = 'generee',
  SIGNEE = 'signee',
  DELIVREE = 'delivree',
  ANNULEE = 'annulee'
}

export interface StatistiquesMinutier {
  notaireId: string;
  periode: PeriodeStatistiques;
  nombreActes: number;
  repartitionTypeActe: Record<TypeActe, number>;
  montantTotal: number;
  montantMoyen: number;
  nombreCopies: number;
  evolutionMensuelle: EvolutionMensuelle[];
  topClients: TopClient[];
}

export interface PeriodeStatistiques {
  dateDebut: Date;
  dateFin: Date;
}

export interface EvolutionMensuelle {
  mois: string;
  nombreActes: number;
  montantTotal: number;
}

export interface TopClient {
  nom: string;
  nombreActes: number;
  montantTotal: number;
}

// Request/Response types
export interface CreerActeRequest {
  typeActe: TypeActe;
  objet: string;
  parties: Omit<PartieActe, 'id'>[];
  contenu: ContenuActe;
  metadonnees: MetadonneesActe;
  annexes?: Omit<AnnexeActe, 'id' | 'dateAjout'>[];
}

export interface ModifierActeRequest {
  objet?: string;
  parties?: PartieActe[];
  contenu?: Partial<ContenuActe>;
  metadonnees?: Partial<MetadonneesActe>;
  statut?: StatutActe;
}

export interface DemanderCopieRequest {
  acteId: string;
  typeCopie: TypeCopie;
  demandeur: DemandeurCopie;
  motifDemande: string;
}

export interface ArchivageRequest {
  acteId: string;
  emplacementPhysique?: string;
  dureeConservation: number;
  typesSauvegarde: TypeSauvegarde[];
}

export interface MinutierDashboard {
  statistiques: StatistiquesMinutier;
  actesRecents: ActeAuthentique[];
  actesEnCours: ActeAuthentique[];
  copiesEnAttente: CopieConforme[];
  alertes: AlerteMinutier[];
}

export interface AlerteMinutier {
  id: string;
  type: TypeAlerte;
  message: string;
  acteId?: string;
  dateAlerte: Date;
  priorite: PrioriteAlerte;
  traitee: boolean;
}

export enum TypeAlerte {
  SIGNATURE_MANQUANTE = 'signature_manquante',
  DELAI_ENREGISTREMENT = 'delai_enregistrement',
  SAUVEGARDE_ECHEC = 'sauvegarde_echec',
  INTEGRITE_COMPROMISE = 'integrite_compromise',
  ARCHIVAGE_REQUIS = 'archivage_requis'
}

export enum PrioriteAlerte {
  BASSE = 'basse',
  MOYENNE = 'moyenne',
  HAUTE = 'haute',
  CRITIQUE = 'critique'
}