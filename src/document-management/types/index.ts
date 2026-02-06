// Document Management System - Type Definitions
// This file exports all TypeScript interfaces and types for the DMS

// Re-export all types from the main document management types file
export * from '../../../types/document-management';

// Template System Types
export type {
  Template,
  TemplateVariable,
  TemplateVariables,
  TemplateDefinition,
  GeneratedDocument,
  ProcessedDocument,
  ValidationResult
} from '../../../types/document-management';

export {
  TemplateCategory,
  VariableType
} from '../../../types/document-management';

// Digital Signature Types
export type {
  SignatureWorkflow,
  WorkflowSigner,
  DigitalSignature,
  SignatureValidation,
  SignedDocument,
  SignatureAuditEntry,
  SignerInfo,
  WorkflowStatusSummary
} from '../../../types/document-management';

export {
  WorkflowStatus,
  SignerStatus
} from '../../../types/document-management';