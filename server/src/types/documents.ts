import { Profession } from './auth';

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  category: DocumentCategory;
  content: string;
  metadata: DocumentMetadata;
  ownerId: string;
  organizationId: string;
  permissions: DocumentPermission[];
  versions: DocumentVersion[];
  signatures: ElectronicSignature[];
  createdAt: Date;
  updatedAt: Date;
  status: DocumentStatus;
}

export interface DocumentMetadata {
  clientId?: string;
  caseNumber?: string;
  legalReferences: LegalReference[];
  tags: string[];
  confidentialityLevel: ConfidentialityLevel;
  retentionPeriod: number;
  customFields: Record<string, any>;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  changes: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface DocumentPermission {
  userId: string;
  permission: DocumentPermissionType;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface ElectronicSignature {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  signerRole: Profession;
  signatureData: string;
  certificateData: string;
  timestamp: Date;
  isValid: boolean;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: DocumentCategory;
  type: DocumentType;
  roleRestrictions: Profession[];
  template: string;
  variables: TemplateVariable[];
  legalReferences: LegalReference[];
  organizationId?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TemplateVariable {
  name: string;
  type: VariableType;
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: VariableValidation;
  options?: string[]; // For select/enum types
}

export interface VariableValidation {
  pattern?: string; // Regex pattern
  minLength?: number;
  maxLength?: number;
  min?: number; // For numeric types
  max?: number; // For numeric types
}

export interface LegalReference {
  type: LegalReferenceType;
  code: string;
  article?: string;
  paragraph?: string;
  title: string;
  url?: string;
}

export interface DocumentData {
  templateId: string;
  variables: Record<string, any>;
  metadata: Partial<DocumentMetadata>;
}

export interface TemplateVariables {
  [key: string]: any;
}

export interface SignedDocument extends Document {
  signatureHash: string;
  signedAt: Date;
  signedBy: string;
}

// Enums
export enum DocumentType {
  // Avocat documents
  REQUETE = 'requete',
  CONCLUSION = 'conclusion',
  MEMOIRE = 'memoire',
  CONSULTATION = 'consultation',
  ASSIGNATION = 'assignation',
  
  // Notaire documents
  ACTE_AUTHENTIQUE = 'acte_authentique',
  ACTE_VENTE = 'acte_vente',
  ACTE_DONATION = 'acte_donation',
  TESTAMENT = 'testament',
  PROCURATION = 'procuration',
  
  // Huissier documents
  EXPLOIT = 'exploit',
  PV_SIGNIFICATION = 'pv_signification',
  CONSTAT = 'constat',
  SAISIE = 'saisie',
  
  // Magistrat documents
  JUGEMENT = 'jugement',
  ORDONNANCE = 'ordonnance',
  ARRET = 'arret',
  DECISION = 'decision',
  
  // Juriste Entreprise documents
  CONTRAT = 'contrat',
  CONVENTION = 'convention',
  ACCORD = 'accord',
  AVIS_JURIDIQUE = 'avis_juridique',
  
  // Common documents
  COURRIER = 'courrier',
  RAPPORT = 'rapport',
  NOTE = 'note',
  AUTRE = 'autre'
}

export enum DocumentCategory {
  CIVIL = 'civil',
  PENAL = 'penal',
  COMMERCIAL = 'commercial',
  ADMINISTRATIF = 'administratif',
  SOCIAL = 'social',
  FISCAL = 'fiscal',
  IMMOBILIER = 'immobilier',
  FAMILLE = 'famille',
  SUCCESSION = 'succession',
  AUTRE = 'autre'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  SIGNED = 'signed',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum DocumentPermissionType {
  READ = 'read',
  WRITE = 'write',
  SIGN = 'sign',
  ADMIN = 'admin'
}

export enum ConfidentialityLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  SECRET = 'secret'
}

export enum VariableType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  EMAIL = 'email',
  PHONE = 'phone',
  ADDRESS = 'address',
  CURRENCY = 'currency'
}

export enum LegalReferenceType {
  CODE_CIVIL = 'code_civil',
  CODE_PENAL = 'code_penal',
  CODE_COMMERCE = 'code_commerce',
  CODE_PROCEDURE_CIVILE = 'code_procedure_civile',
  CODE_PROCEDURE_PENALE = 'code_procedure_penale',
  CODE_ADMINISTRATIF = 'code_administratif',
  JORA = 'jora',
  JURISPRUDENCE = 'jurisprudence',
  DOCTRINE = 'doctrine',
  AUTRE = 'autre'
}

// Template creation and management interfaces
export interface CreateTemplateRequest {
  name: string;
  description: string;
  category: DocumentCategory;
  type: DocumentType;
  roleRestrictions: Profession[];
  template: string;
  variables: TemplateVariable[];
  legalReferences: LegalReference[];
  isPublic?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  template?: string;
  variables?: TemplateVariable[];
  legalReferences?: LegalReference[];
  isActive?: boolean;
}

export interface GenerateDocumentRequest {
  templateId: string;
  variables: Record<string, any>;
  metadata?: Partial<DocumentMetadata>;
  title?: string;
}

export interface SearchTemplatesRequest {
  query?: string;
  category?: DocumentCategory;
  type?: DocumentType;
  role?: Profession;
  isPublic?: boolean;
  organizationId?: string;
  limit?: number;
  offset?: number;
}

export interface TemplateSearchResult {
  templates: DocumentTemplate[];
  total: number;
  limit: number;
  offset: number;
}

// Document generation result
export interface DocumentGenerationResult {
  success: boolean;
  document?: Document;
  errors?: ValidationError[];
  warnings?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Template validation
export interface TemplateValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}