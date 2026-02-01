export interface UserCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  tokens?: TokenPair;
  mfaRequired?: boolean;
  error?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SessionInfo {
  valid: boolean;
  userId?: string;
  email?: string;
  activeRole?: string;
  sessionId?: string;
  expiresAt?: Date;
  error?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profession: Profession;
  registrationNumber?: string;
  barreauId?: string;
  organizationName?: string;
  phoneNumber?: string;
  address?: Address;
  languages: string[];
  specializations: string[];
  roles: Profession[];
  activeRole: Profession;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
}

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export enum Profession {
  AVOCAT = 'avocat',
  NOTAIRE = 'notaire',
  HUISSIER = 'huissier',
  MAGISTRAT = 'magistrat',
  ETUDIANT = 'etudiant',
  JURISTE_ENTREPRISE = 'juriste_entreprise',
  ADMIN = 'admin'
}

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export type MFAMethod = 'totp' | 'sms' | 'email';

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profession: Profession;
  registrationNumber?: string;
  barreauId?: string;
  organizationName?: string;
  phoneNumber?: string;
  address?: Address;
  languages?: string[];
  specializations?: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface SwitchRoleRequest {
  newRole: Profession;
}

export interface EnableMFARequest {
  method: MFAMethod;
}

export interface VerifyMFARequest {
  token: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    activeRole: Profession;
    sessionId: string;
  };
}