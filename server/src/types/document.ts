import { Profession } from './auth';
import { LegalDomain, LegalReference } from './search';

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  category: DocumentCategory;
  content: string;
  metadata: DocumentMetadata;
  ownerId: string;
  organizationId?: string;
  permissions: DocumentPermission[];
  versions: DocumentVersion[];
  signatures: ElectronicSignature[];
  createdAt: Date;
  updatedAt: Date;
  status: DocumentStatus;
  templateId?: string;
  parentDocumentId?: string;
  isTemplate: boolean;
  language: 'fr' | 'ar';
  confidentialityLevel: ConfidentialityLevel;
}

export enum DocumentType {
  // Avocat documents
  REQUETE = 'requete',
  CONCLUSION = 'conclusion',
  MEMOIRE = 'memoire',
  CONSULTATION = 'consultation',
  CONTRAT = 'contrat',
  
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
  COMMANDEMENT = 'commandement',
  
  // Magistrat documents
  JUGEMENT = 'jugement',
  ARRET = 'arret',
  ORDONNANCE = 'ordonnance',
  DECISION = 'decision',
  
  // Juriste Entreprise documents
  CONTRAT_ENTREPRISE = 'contrat_entreprise',
  AVIS_JURIDIQUE = 'avis_juridique',
  POLITIQUE_INTERNE = 'politique_interne',
  
  // Common documents
  COURRIER = 'courrier',
  RAPPORT = 'rapport',
  NOTE = 'note',
  AUTRE = 'autre'
}

export enum DocumentCategory {
  PROCEDURE = 'procedure',
  CONTRAT = 'contrat',
  ACTE_NOTARIE = 'acte_notarie',
  SIGNIFICATION = 'signification',
  DECISION_JUSTICE = 'decision_justice',
  CONSULTATION = 'consultation',
  CORRESPONDANCE = 'correspondance',
  RAPPORT = 'rapport',
  AUTRE = 'autre'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  SIGNED = 'signed',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled'
}

export enum ConfidentialityLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  SECRET = 'secret'
}

export interface DocumentMetadata {
  clientId?: string;
  caseNumber?: string;
  dossierNumber?: string;
  legalReferences: LegalReference[];
  tags: string[];
  keywords: string[];
  customFields: Record<string, any>;
  retentionPeriod?: number; // in years
  expirationDate?: Date;
  relatedDocuments: string[];
  attachments: DocumentAttachment[];
  wordCount?: number;
  pageCount?: number;
  checksum?: string;
}

export interface DocumentAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
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
  checksum: string;
}

export interface DocumentPermission {
  id: string;
  documentId: string;
  userId?: string;
  roleId?: string;
  organizationId?: string;
  permissions: DocumentAction[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export enum DocumentAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
  SIGN = 'sign',
  APPROVE = 'approve',
  ARCHIVE = 'archive',
  EXPORT = 'export',
  PRINT = 'print'
}

export interface ElectronicSignature {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  signerRole: string;
  signatureType: SignatureType;
  signatureData: string;
  certificate?: string;
  timestamp: Date;
  ipAddress?: string;
  location?: string;
  reason?: string;
  isValid: boolean;
  validationData?: SignatureValidation;
}

export enum SignatureType {
  SIMPLE = 'simple',
  ADVANCED = 'advanced',
  QUALIFIED = 'qualified'
}

export interface SignatureValidation {
  isValid: boolean;
  validatedAt: Date;
  validatedBy: string;
  certificateStatus: 'valid' | 'expired' | 'revoked' | 'unknown';
  trustLevel: 'high' | 'medium' | 'low';
  errors?: string[];
  warnings?: string[];
}

// Document Templates
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  type: DocumentType;
  category: DocumentCategory;
  roleRestrictions: Profession[];
  template: string;
  variables: TemplateVariable[];
  legalReferences: LegalReference[];
  organizationId?: string;
  isPublic: boolean;
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usage: TemplateUsage;
  tags: string[];
  language: 'fr' | 'ar';
  jurisdiction?: string;
  legalDomain?: LegalDomain;
}

export interface TemplateVariable {
  name: string;
  type: VariableType;
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: VariableOption[];
  validation?: VariableValidation;
  placeholder?: string;
  helpText?: string;
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
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  LEGAL_REFERENCE = 'legal_reference',
  PERSON = 'person',
  ORGANIZATION = 'organization'
}

export interface VariableOption {
  value: any;
  label: string;
  description?: string;
}

export interface VariableValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  required?: boolean;
  customValidator?: string;
}

export interface TemplateUsage {
  totalUsage: number;
  lastUsed?: Date;
  popularVariables: string[];
  averageCompletionTime?: number;
}

export interface TemplateVariables {
  [key: string]: any;
}

// Document Generation
export interface DocumentGenerationRequest {
  templateId: string;
  variables: TemplateVariables;
  title?: string;
  clientId?: string;
  caseNumber?: string;
  dossierNumber?: string;
  tags?: string[];
  confidentialityLevel?: ConfidentialityLevel;
  language?: 'fr' | 'ar';
}

export interface DocumentGenerationResult {
  document: Document;
  warnings?: string[];
  missingVariables?: string[];
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

// Document Search and Filtering
export interface DocumentSearchCriteria {
  query?: string;
  type?: DocumentType;
  category?: DocumentCategory;
  status?: DocumentStatus;
  ownerId?: string;
  clientId?: string;
  caseNumber?: string;
  tags?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  confidentialityLevel?: ConfidentialityLevel;
  hasSignatures?: boolean;
  language?: 'fr' | 'ar';
  sortBy?: DocumentSortOption;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export enum DocumentSortOption {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  TITLE = 'title',
  TYPE = 'type',
  STATUS = 'status',
  RELEVANCE = 'relevance'
}

export interface DocumentSearchResult {
  documents: Document[];
  totalCount: number;
  facets?: DocumentFacet[];
  searchTime: number;
}

export interface DocumentFacet {
  field: string;
  values: { value: string; count: number }[];
}

// Document Workflow
export interface DocumentWorkflow {
  id: string;
  name: string;
  description: string;
  documentTypes: DocumentType[];
  steps: WorkflowStep[];
  isActive: boolean;
  organizationId?: string;
  createdBy: string;
  createdAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  order: number;
  type: WorkflowStepType;
  assigneeType: 'user' | 'role' | 'group';
  assigneeId?: string;
  requiredActions: DocumentAction[];
  conditions?: WorkflowCondition[];
  notifications?: WorkflowNotification[];
  timeLimit?: number; // in hours
  isOptional: boolean;
}

export enum WorkflowStepType {
  REVIEW = 'review',
  APPROVAL = 'approval',
  SIGNATURE = 'signature',
  VALIDATION = 'validation',
  NOTIFICATION = 'notification',
  ARCHIVE = 'archive'
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface WorkflowNotification {
  type: 'email' | 'sms' | 'in_app';
  recipients: string[];
  template: string;
  delay?: number; // in minutes
}

// Document Analytics
export interface DocumentAnalytics {
  totalDocuments: number;
  documentsByType: Record<DocumentType, number>;
  documentsByStatus: Record<DocumentStatus, number>;
  recentActivity: DocumentActivity[];
  topTemplates: TemplateUsageStats[];
  averageProcessingTime: number;
  signatureStats: SignatureStats;
}

export interface DocumentActivity {
  id: string;
  documentId: string;
  documentTitle: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface TemplateUsageStats {
  templateId: string;
  templateName: string;
  usageCount: number;
  lastUsed: Date;
  averageCompletionTime: number;
}

export interface SignatureStats {
  totalSignatures: number;
  signaturesByType: Record<SignatureType, number>;
  averageSigningTime: number;
  validSignatures: number;
  invalidSignatures: number;
}

// Export/Import
export interface DocumentExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'txt';
  includeMetadata: boolean;
  includeSignatures: boolean;
  includeAttachments: boolean;
  watermark?: string;
  password?: string;
}

export interface DocumentImportOptions {
  preserveMetadata: boolean;
  assignToUser?: string;
  defaultConfidentiality?: ConfidentialityLevel;
  autoDetectType: boolean;
  validateContent: boolean;
}

export interface BulkDocumentOperation {
  documentIds: string[];
  operation: 'delete' | 'archive' | 'change_status' | 'add_tags' | 'remove_tags' | 'change_owner';
  parameters?: Record<string, any>;
}

export interface BulkOperationResult {
  successful: string[];
  failed: { documentId: string; error: string }[];
  totalProcessed: number;
}