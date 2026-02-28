
export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  RESEARCH = 'RESEARCH',
  DRAFTING = 'DRAFTING',
  ANALYSIS = 'ANALYSIS',
  ADMIN = 'ADMIN',
  DOCS = 'DOCS',
  CASES = 'CASES'
}

export enum Sender {
  USER = 'user',
  BOT = 'bot'
}

export type Language = 'fr' | 'ar';

export type SubscriptionPlan = 'free' | 'pro' | 'cabinet';

// Updated to match the backend Profession enum
export enum UserRole {
  AVOCAT = 'avocat',
  NOTAIRE = 'notaire', 
  HUISSIER = 'huissier',
  MAGISTRAT = 'magistrat',
  ETUDIANT = 'etudiant',
  JURISTE_ENTREPRISE = 'juriste_entreprise',
  ADMIN = 'admin'
}

// Role-based routing configuration
export interface RoleRouteConfig {
  role: UserRole;
  allowedModes: AppMode[];
  defaultMode: AppMode;
  restrictedFeatures?: string[];
}

// Professional information for document generation
export interface ProfessionalInfo {
  // Pour Avocat
  barreauInscription?: string;      // "Barreau d'Alger"
  numeroInscription?: string;       // "A/12345/2020"
  cabinetName?: string;             // "Cabinet Maître Belkacemi"
  cabinetAddress?: string;          // "15 Rue Didouche Mourad, Alger"
  cabinetPhone?: string;            // "+213 21 XX XX XX"
  cabinetEmail?: string;            // "contact@cabinet-belkacemi.dz"
  
  // Pour Notaire
  chambreNotariale?: string;        // "Chambre des Notaires d'Alger"
  numeroMatricule?: string;         // "N/456/2018"
  etudeNotariale?: string;          // "Étude Notariale Benali"
  etudeAddress?: string;            // "8 Boulevard Zighout Youcef, Alger"
  etudePhone?: string;              // "+213 21 YY YY YY"
  etudeEmail?: string;              // "contact@notaire-benali.dz"
  
  // Pour Huissier
  chambreHuissiers?: string;        // "Chambre des Huissiers d'Oran"
  numeroAgrement?: string;          // "H/789/2019"
  bureauHuissier?: string;          // "Bureau d'Huissier Khelifi"
  bureauAddress?: string;           // "42 Rue Larbi Ben M'hidi, Oran"
  bureauPhone?: string;             // "+213 41 ZZ ZZ ZZ"
  bureauEmail?: string;             // "contact@huissier-khelifi.dz"
  
  // Commun
  wilayaExercice?: string;          // Wilaya principale d'exercice
  anneesExperience?: number;        // Années d'expérience
  specialites?: string[];           // Spécialités juridiques
}

// Enhanced user profile for role-based access
export interface EnhancedUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profession: UserRole;
  registrationNumber?: string;
  barreauId?: string;
  organizationName?: string;
  phoneNumber?: string;
  languages: string[];
  specializations: string[];
  roles: UserRole[];
  activeRole: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  
  // Informations professionnelles pour génération de documents
  professionalInfo?: ProfessionalInfo;
}

export interface Case {
  id: string;
  title: string;
  clientName: string;
  description: string;
  createdAt: Date;
  status: 'active' | 'archived';
  // Extended fields for comprehensive case management
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  caseType?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedValue?: number;
  deadline?: Date;
  notes?: string;
  assignedLawyer?: string;
  lastUpdated?: Date;
  documents?: string[];
  tags?: string[];
}

export interface UserFeedback {
  id: string;
  userId: string;
  messageId: string;
  isPositive: boolean;
  comment?: string;
  mode: AppMode;
  timestamp: Date;
}

export interface UserStats {
  id: string;
  email: string;
  credits: number;
  plan: SubscriptionPlan;
  isPro: boolean;
  role: 'admin' | 'user' | 'tester'; // Legacy role type for backward compatibility
  joinedAt: Date;
}

export interface Citation {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isThinking?: boolean;
  citations?: Citation[];
  feedback?: {
    isPositive: boolean;
    comment?: string;
  };
}

export interface DocumentTemplate {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  prompt: string;
  prompt_ar: string;
  structure: string[];
  structure_ar: string[];
  inputGuide: string;
  inputGuide_ar: string;
  roles: string[]; // Rôles autorisés à utiliser ce template
}

export interface LicenseKey {
  key: string;
  plan: SubscriptionPlan;
  isUsed: boolean;
  createdAt: Date;
  usedBy?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  date: Date;
}
