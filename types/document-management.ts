/**
 * Core TypeScript interfaces and enums for Document Management System
 * 
 * This file contains the fundamental data models for the JuristDZ Document Management System,
 * including document entities, folder structures, version control, and access permissions.
 * 
 * Requirements: 1.1, 2.1, 2.2
 */

// Re-export existing types from main types file
export { UserRole, Language } from '../types';

/**
 * Document categories for legal document classification
 * Matches the design document specification
 */
export enum DocumentCategory {
  CONTRACT = 'contract',
  PLEADING = 'pleading', 
  EVIDENCE = 'evidence',
  CORRESPONDENCE = 'correspondence',
  TEMPLATE = 'template',
  OTHER = 'other'
}

/**
 * Confidentiality levels for document access control
 * Matches the design document specification
 */
export enum ConfidentialityLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

/**
 * Permission types for document access control
 */
export enum Permission {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
  SIGN = 'sign'
}

/**
 * Document metadata interface containing classification and custom information
 */
export interface DocumentMetadata {
  description?: string;
  category: DocumentCategory;
  confidentialityLevel: ConfidentialityLevel;
  retentionPeriod?: number; // in days
  customFields: Record<string, any>;
}

/**
 * Core document interface representing a stored document with all its properties
 */
export interface Document {
  id: string;
  caseId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number; // in bytes
  checksum: string; // for integrity verification
  encryptionKey: string; // AES-256 encryption key reference
  storagePath: string; // path in encrypted storage
  folderId?: string; // optional folder association
  tags: string[]; // searchable tags
  metadata: DocumentMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // user ID
  currentVersionId: string; // reference to current version
  isDeleted: boolean;
  deletedAt?: Date;
}

/**
 * Folder interface for organizing documents in hierarchical structures
 */
export interface Folder {
  id: string;
  caseId: string;
  name: string;
  parentId?: string; // null for root folders
  path: string; // full path from root (e.g., "/folder1/subfolder2")
  level: number; // depth level (0 for root, max 5)
  createdAt: Date;
  createdBy: string; // user ID
  isDeleted: boolean;
}

/**
 * Document version interface for version control system
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number; // incremental version number
  size: number; // in bytes
  checksum: string; // for integrity verification
  storagePath: string; // path to version file in storage
  createdAt: Date;
  createdBy: string; // user ID
  changeDescription?: string; // optional description of changes
  isCurrent: boolean; // true for the current active version
}

/**
 * Folder contents interface for displaying folder structure
 */
export interface FolderContents {
  folders: Folder[];
  documents: Document[];
  totalCount: number;
}

/**
 * Document permission interface for access control
 */
export interface DocumentPermission {
  id: string;
  documentId: string;
  userId?: string; // specific user permission
  roleId?: string; // role-based permission
  permission: Permission;
  grantedBy: string; // user ID who granted permission
  grantedAt: Date;
  expiresAt?: Date; // optional expiration
}

/**
 * Share link interface for external document sharing
 */
export interface ShareLink {
  id: string;
  documentId: string;
  token: string; // secure token for access
  permissions: Permission[];
  expiresAt: Date;
  createdBy: string; // user ID
  accessCount: number; // number of times accessed
  maxAccess?: number; // optional maximum access limit
}

/**
 * Audit trail interface for comprehensive activity logging
 */
export interface AuditTrail {
  id: string;
  entityType: string; // 'document', 'folder', 'template', etc.
  entityId: string;
  action: string; // 'create', 'update', 'delete', 'view', 'download', etc.
  userId?: string; // user who performed the action
  timestamp: Date;
  ipAddress?: string; // IP address of the user
  userAgent?: string; // browser/client information
  details: Record<string, any>; // additional action-specific details
}

/**
 * Access control rule interface for advanced permission management
 */
export interface AccessControlRule {
  id: string;
  name: string;
  description: string;
  entityType: string; // 'document', 'folder', 'case'
  entityId?: string; // specific entity or null for global rule
  conditions: AccessCondition[];
  permissions: Permission[];
  priority: number; // higher number = higher priority
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Access condition interface for rule-based access control
 */
export interface AccessCondition {
  type: 'user' | 'role' | 'time' | 'location' | 'device' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains';
  value: any;
  metadata?: Record<string, any>;
}

/**
 * Permission grant request interface
 */
export interface PermissionGrantRequest {
  documentId: string;
  userId?: string;
  roleId?: string;
  permissions: Permission[];
  expiresAt?: Date;
  message?: string; // optional message to the recipient
}

/**
 * Permission revocation request interface
 */
export interface PermissionRevocationRequest {
  documentId: string;
  userId?: string;
  roleId?: string;
  permissions?: Permission[]; // if not specified, revoke all permissions
  reason?: string;
}

/**
 * Access attempt log interface for security monitoring
 */
export interface AccessAttempt {
  id: string;
  userId?: string;
  documentId: string;
  permission: Permission;
  result: 'granted' | 'denied' | 'error';
  reason?: string; // reason for denial or error
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Security event interface for compliance and monitoring
 */
export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'permission_change' | 'suspicious_activity' | 'data_breach' | 'compliance_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  entityType?: string;
  entityId?: string;
  description: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Compliance report interface for audit and regulatory requirements
 */
export interface ComplianceReport {
  id: string;
  type: 'access_log' | 'permission_audit' | 'data_retention' | 'security_assessment';
  title: string;
  description: string;
  period: {
    from: Date;
    to: Date;
  };
  generatedAt: Date;
  generatedBy: string;
  data: Record<string, any>;
  findings: ComplianceFinding[];
  status: 'draft' | 'final' | 'submitted';
}

/**
 * Compliance finding interface for audit results
 */
export interface ComplianceFinding {
  id: string;
  type: 'violation' | 'risk' | 'recommendation' | 'observation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  recommendation?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  assignedTo?: string;
  dueDate?: Date;
}

/**
 * Data retention policy interface
 */
export interface DataRetentionPolicy {
  id: string;
  name: string;
  description: string;
  entityType: string; // 'document', 'audit_log', 'access_log'
  retentionPeriod: number; // in days
  conditions: RetentionCondition[];
  actions: RetentionAction[];
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

/**
 * Data retention condition interface
 */
export interface RetentionCondition {
  type: 'age' | 'category' | 'confidentiality' | 'case_status' | 'custom';
  operator: 'equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

/**
 * Data retention action interface
 */
export interface RetentionAction {
  type: 'delete' | 'archive' | 'anonymize' | 'notify';
  parameters: Record<string, any>;
  delay?: number; // days after retention period expires
}

/**
 * Document filters interface for search and listing operations
 */
export interface DocumentFilters {
  caseId?: string;
  folderId?: string;
  category?: DocumentCategory;
  confidentialityLevel?: ConfidentialityLevel;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  mimeTypes?: string[];
  createdBy?: string;
  searchQuery?: string;
}

/**
 * Version comparison visualization data
 */
export interface VersionComparisonVisualization {
  summary: {
    similarityPercentage: number;
    totalChanges: number;
    changeBreakdown: {
      additions: number;
      deletions: number;
      modifications: number;
    };
  };
  changes: Array<{
    type: 'addition' | 'deletion' | 'modification';
    location: DifferenceLocation;
    oldContent?: string;
    newContent?: string;
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    confidence: number;
    contextBefore?: string;
    contextAfter?: string;
  }>;
  statistics: {
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
    charactersAdded: number;
    charactersDeleted: number;
    linesAdded: number;
    linesDeleted: number;
    wordsAdded: number;
    wordsDeleted: number;
  };
  metadata: {
    comparisonTime: Date;
    algorithm: string;
    documentType: string;
    processingTime: number;
  };
}

/**
 * Version comparison interface for document diff operations
 */
export interface VersionComparison {
  oldVersion: DocumentVersion;
  newVersion: DocumentVersion;
  differences: VersionDifference[];
  similarityScore: number; // 0-1 similarity score
}

/**
 * Version difference interface for tracking changes between versions
 */
export interface VersionDifference {
  type: 'addition' | 'deletion' | 'modification';
  location: DifferenceLocation;
  oldContent?: string;
  newContent?: string;
}

/**
 * Difference location interface for pinpointing changes in documents
 */
export interface DifferenceLocation {
  page?: number;
  line?: number;
  character?: number;
  section?: string;
}

/**
 * Document upload request interface
 */
export interface DocumentUploadRequest {
  file: File;
  caseId: string;
  folderId?: string;
  metadata: Partial<DocumentMetadata>;
  tags?: string[];
}

/**
 * Document update request interface
 */
export interface DocumentUpdateRequest {
  name?: string;
  folderId?: string;
  metadata?: Partial<DocumentMetadata>;
  tags?: string[];
}

/**
 * Folder creation request interface
 */
export interface FolderCreateRequest {
  caseId: string;
  name: string;
  parentId?: string;
}

/**
 * Bulk operation result interface
 */
export interface BulkOperationResult {
  successful: string[]; // IDs of successful operations
  failed: Array<{
    id: string;
    error: string;
  }>;
  totalProcessed: number;
}

// ============================================================================
// TEMPLATE SYSTEM MODELS
// ============================================================================

/**
 * Template categories for legal document types
 */
export enum TemplateCategory {
  CONTRACT = 'contract',
  MOTION = 'motion',
  BRIEF = 'brief',
  NOTICE = 'notice',
  AGREEMENT = 'agreement'
}

/**
 * Variable types for template processing
 */
export enum VariableType {
  TEXT = 'text',
  DATE = 'date',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  LIST = 'list'
}

/**
 * Validation rule interface for template variables
 */
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'range';
  value?: any;
  message: string;
}

/**
 * Template variable interface defining customizable fields in templates
 */
export interface TemplateVariable {
  name: string; // variable identifier (e.g., "clientName")
  type: VariableType;
  label: string; // human-readable label
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
  options?: string[]; // for LIST type variables
  placeholder?: string;
  description?: string;
}

/**
 * Template interface for document template management
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  language: Language;
  applicableRoles: UserRole[]; // roles that can use this template
  content: string; // template content with variable placeholders
  variables: TemplateVariable[];
  createdAt: Date;
  createdBy: string; // user ID
  updatedAt: Date;
  updatedBy: string; // user ID
  isActive: boolean;
  version: number; // template version for updates
}

/**
 * Template variables filled by user for document generation
 */
export interface TemplateVariables {
  [variableName: string]: any;
}

/**
 * Generated document from template processing
 */
export interface GeneratedDocument {
  id: string;
  templateId: string;
  content: string; // processed content with variables substituted
  variables: TemplateVariables; // variables used for generation
  generatedAt: Date;
  generatedBy: string; // user ID
  format: 'html' | 'pdf' | 'docx';
}

/**
 * Template definition for creating new templates
 */
export interface TemplateDefinition {
  name: string;
  description: string;
  category: TemplateCategory;
  language: Language;
  applicableRoles: UserRole[];
  content: string;
  variables: TemplateVariable[];
}

/**
 * Template validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Processed document from template engine
 */
export interface ProcessedDocument {
  content: string;
  metadata: {
    templateId: string;
    variables: TemplateVariables;
    processedAt: Date;
    language?: Language;
    direction?: 'ltr' | 'rtl';
    languageFormatting?: any; // FormattedContent from language formatting service
  };
}

// ============================================================================
// DIGITAL SIGNATURE WORKFLOW MODELS
// ============================================================================

/**
 * Signature workflow status enumeration
 */
export enum WorkflowStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

/**
 * Individual signer status within a workflow
 */
export enum SignerStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  DECLINED = 'declined'
}

/**
 * Digital signature interface containing cryptographic signature data
 */
export interface DigitalSignature {
  id: string;
  signerId: string; // reference to WorkflowSigner
  signatureData: string; // base64 encoded signature
  certificate: string; // digital certificate for verification
  timestamp: Date; // when signature was applied
  ipAddress: string; // IP address of signer
  location?: string; // optional geographic location
  signatureMethod: 'electronic' | 'digital_certificate' | 'biometric';
  hashAlgorithm: string; // e.g., 'SHA-256'
  isValid: boolean; // signature validation status
}

/**
 * Workflow signer interface defining participants in signature process
 */
export interface WorkflowSigner {
  id: string;
  workflowId: string;
  userId?: string; // internal user ID (optional for external signers)
  email: string;
  name: string;
  role: string; // signer's role in the document (e.g., 'client', 'attorney')
  order: number; // signing order (1-based)
  status: SignerStatus;
  signedAt?: Date;
  signature?: DigitalSignature;
  notificationsSent: number; // count of reminder notifications
  lastNotificationAt?: Date;
  declineReason?: string; // reason if declined
}

/**
 * Signature workflow interface managing the complete signing process
 */
export interface SignatureWorkflow {
  id: string;
  documentId: string;
  name: string; // workflow name/description
  status: WorkflowStatus;
  signers: WorkflowSigner[];
  createdAt: Date;
  createdBy: string; // user ID who initiated workflow
  completedAt?: Date;
  expiresAt: Date;
  reminderFrequency?: number; // days between reminders
  requiresAllSigners: boolean; // true if all signers must sign
  allowDecline: boolean; // whether signers can decline
  customMessage?: string; // message to signers
  metadata: {
    documentName: string;
    documentSize: number;
    documentChecksum: string;
  };
}

/**
 * Signature validation result interface
 */
export interface SignatureValidation {
  isValid: boolean;
  signatureId: string;
  validatedAt: Date;
  validationDetails: {
    certificateValid: boolean;
    timestampValid: boolean;
    documentIntegrity: boolean;
    signerIdentityVerified: boolean;
  };
  errors?: string[];
  warnings?: string[];
}

/**
 * Signed document interface representing a document with completed signatures
 */
export interface SignedDocument {
  id: string;
  originalDocumentId: string;
  workflowId: string;
  signedContent: string; // document with embedded signatures
  signatures: DigitalSignature[];
  completedAt: Date;
  certificateChain: string[]; // certificate validation chain
  auditTrail: SignatureAuditEntry[];
  isLegallyBinding: boolean;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending_review';
}

/**
 * Signature audit trail entry for compliance tracking
 */
export interface SignatureAuditEntry {
  id: string;
  workflowId: string;
  action: 'workflow_created' | 'signer_added' | 'notification_sent' | 'document_signed' | 'workflow_completed' | 'workflow_cancelled';
  performedBy: string; // user ID or system
  performedAt: Date;
  details: Record<string, any>; // action-specific details
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Signer information for workflow creation
 */
export interface SignerInfo {
  email: string;
  name: string;
  role: string;
  order: number;
  userId?: string; // optional for internal users
}

/**
 * Workflow status summary for monitoring
 */
export interface WorkflowStatusSummary {
  workflowId: string;
  status: WorkflowStatus;
  totalSigners: number;
  signedCount: number;
  pendingCount: number;
  declinedCount: number;
  progress: number; // percentage (0-100)
  nextAction?: string; // description of next required action
  estimatedCompletion?: Date;
}


// ============================================================================
// DOCUMENT WORKFLOW MANAGEMENT MODELS
// ============================================================================

/**
 * Document workflow step type enumeration
 */
export enum WorkflowStepType {
  REVIEW = 'review',
  APPROVAL = 'approval',
  SIGNATURE = 'signature',
  VALIDATION = 'validation',
  NOTIFICATION = 'notification',
  ARCHIVE = 'archive'
}

/**
 * Workflow step status enumeration
 */
export enum WorkflowStepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  REJECTED = 'rejected'
}

/**
 * Document workflow status enumeration
 */
export enum DocumentWorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

/**
 * Workflow step interface defining individual approval/review steps
 */
export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepNumber: number; // order in the workflow
  name: string;
  description: string;
  type: WorkflowStepType;
  assigneeType: 'user' | 'role' | 'group';
  assigneeId?: string; // user ID, role ID, or group ID
  assigneeName?: string; // display name
  status: WorkflowStepStatus;
  requiredActions: string[]; // actions that must be completed
  conditions?: WorkflowCondition[]; // conditions for step activation
  timeLimit?: number; // time limit in hours
  isOptional: boolean;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string; // user ID
  comments?: string;
  decision?: 'approved' | 'rejected' | 'revision_requested';
  revisionNotes?: string;
}

/**
 * Workflow condition interface for conditional step execution
 */
export interface WorkflowCondition {
  field: string; // field to check (e.g., 'documentType', 'confidentialityLevel')
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  metadata?: Record<string, any>;
}

/**
 * Workflow notification configuration
 */
export interface WorkflowNotification {
  type: 'email' | 'sms' | 'in_app';
  recipients: string[]; // user IDs or email addresses
  template: string; // notification template ID
  delay?: number; // delay in minutes before sending
  triggerEvent: 'step_started' | 'step_completed' | 'workflow_completed' | 'deadline_approaching';
}

/**
 * Document workflow interface managing approval and review processes
 */
export interface DocumentWorkflow {
  id: string;
  documentId: string;
  name: string;
  description: string;
  status: DocumentWorkflowStatus;
  currentStep: number; // current step number
  steps: WorkflowStep[];
  createdAt: Date;
  createdBy: string; // user ID
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  notifications?: WorkflowNotification[];
  metadata: {
    documentName: string;
    documentType: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    deadline?: Date;
  };
}

/**
 * Workflow template interface for reusable workflow definitions
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string; // e.g., 'contract_review', 'document_approval'
  applicableDocumentTypes: string[];
  steps: Omit<WorkflowStep, 'id' | 'workflowId' | 'status' | 'startedAt' | 'completedAt' | 'completedBy'>[];
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Workflow step action interface for recording step activities
 */
export interface WorkflowStepAction {
  id: string;
  stepId: string;
  workflowId: string;
  action: 'started' | 'approved' | 'rejected' | 'revision_requested' | 'completed' | 'skipped';
  performedBy: string; // user ID
  performedAt: Date;
  comments?: string;
  attachments?: string[]; // document IDs
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Workflow progress summary interface
 */
export interface WorkflowProgress {
  workflowId: string;
  status: DocumentWorkflowStatus;
  totalSteps: number;
  completedSteps: number;
  currentStepNumber: number;
  currentStepName?: string;
  progress: number; // percentage (0-100)
  estimatedCompletion?: Date;
  isOnTrack: boolean;
  delayedSteps: number;
  nextAction?: string;
}

/**
 * Workflow creation request interface
 */
export interface WorkflowCreateRequest {
  documentId: string;
  name: string;
  description?: string;
  templateId?: string; // optional template to use
  steps: Array<{
    name: string;
    description: string;
    type: WorkflowStepType;
    assigneeType: 'user' | 'role' | 'group';
    assigneeId: string;
    requiredActions?: string[];
    timeLimit?: number;
    isOptional?: boolean;
  }>;
  notifications?: WorkflowNotification[];
  metadata?: {
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    deadline?: Date;
  };
}

/**
 * Workflow step completion request interface
 */
export interface WorkflowStepCompletionRequest {
  stepId: string;
  decision: 'approved' | 'rejected' | 'revision_requested';
  comments?: string;
  revisionNotes?: string;
  attachments?: string[];
}

/**
 * Workflow audit entry interface
 */
export interface WorkflowAuditEntry {
  id: string;
  workflowId: string;
  stepId?: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
