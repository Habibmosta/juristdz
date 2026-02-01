export interface Role {
  id: string;
  name: string;
  profession: Profession;
  description: string;
  permissions: Permission[];
  organizationId?: string;
  isCustom: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  actions: string[];
  conditions?: AccessCondition[];
  scope: PermissionScope;
  description: string;
}

export interface AccessCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with';
  value: any;
}

export enum PermissionScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
  PERSONAL = 'personal',
  ROLE_SPECIFIC = 'role_specific'
}

export interface AccessContext {
  userId: string;
  activeRole: Profession;
  organizationId?: string;
  resourceId?: string;
  resourceType?: string;
  additionalContext?: Record<string, any>;
}

export interface RoleDefinition {
  name: string;
  profession: Profession;
  description: string;
  permissions: PermissionDefinition[];
  organizationId?: string;
}

export interface PermissionDefinition {
  resource: string;
  actions: string[];
  conditions?: AccessCondition[];
  scope: PermissionScope;
}

export interface OrganizationContext {
  organizationId: string;
  organizationType: string;
  region?: string;
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  organizationId?: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface RolePermissionCheck {
  hasPermission: boolean;
  reason?: string;
  conditions?: AccessCondition[];
  scope: PermissionScope;
}

// Import Profession from auth types
import { Profession } from './auth';

// Resource types for the legal platform
export enum ResourceType {
  // Document resources
  DOCUMENT = 'document',
  TEMPLATE = 'template',
  SIGNATURE = 'signature',
  
  // Client management
  CLIENT = 'client',
  DOSSIER = 'dossier',
  CASE = 'case',
  
  // Legal research
  JURISPRUDENCE = 'jurisprudence',
  LEGAL_TEXT = 'legal_text',
  SEARCH = 'search',
  
  // Learning system
  LEARNING_MODULE = 'learning_module',
  LEARNING_CONTENT = 'learning_content',
  EXERCISE = 'exercise',
  ASSESSMENT = 'assessment',
  LEARNING_PROGRESS = 'learning_progress',
  LEARNING_RECOMMENDATION = 'learning_recommendation',
  LEARNING_STATISTICS = 'learning_statistics',
  LEARNING_HELP = 'learning_help',
  LEARNING_RESTRICTION = 'learning_restriction',
  
  // Financial
  INVOICE = 'invoice',
  BILLING = 'billing',
  PAYMENT = 'payment',
  
  // Notary specific
  MINUTIER = 'minutier',
  ACTE_AUTHENTIQUE = 'acte_authentique',
  
  // Administration
  USER = 'user',
  ORGANIZATION = 'organization',
  ROLE = 'role',
  PERMISSION = 'permission',
  AUDIT = 'audit',
  
  // Moderation
  MODERATION = 'moderation',
  MODERATION_ITEM = 'moderation_item',
  MODERATION_REPORT = 'moderation_report',
  MODERATION_WORKFLOW = 'moderation_workflow',
  
  // System
  SYSTEM = 'system',
  CONFIGURATION = 'configuration',
  REPORT = 'report'
}

// Action types
export enum ActionType {
  // CRUD operations
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  
  // Document specific
  SIGN = 'sign',
  VALIDATE = 'validate',
  ARCHIVE = 'archive',
  EXPORT = 'export',
  PRINT = 'print',
  
  // Search and analysis
  SEARCH = 'search',
  ANALYZE = 'analyze',
  
  // Learning specific
  SUBMIT = 'submit',
  ATTEMPT = 'attempt',
  COMPLETE = 'complete',
  PROGRESS = 'progress',
  RECOMMEND = 'recommend',
  RESTRICT = 'restrict',
  HELP = 'help',
  
  // Financial
  CALCULATE = 'calculate',
  INVOICE = 'invoice',
  PAYMENT = 'payment',
  
  // Administrative
  ASSIGN = 'assign',
  APPROVE = 'approve',
  REJECT = 'reject',
  MODERATE = 'moderate',
  REPORT = 'report',
  
  // System
  CONFIGURE = 'configure',
  MONITOR = 'monitor',
  AUDIT = 'audit'
}

// Default role permissions by profession
export const DEFAULT_ROLE_PERMISSIONS: Record<Profession, PermissionDefinition[]> = {
  [Profession.AVOCAT]: [
    // Document management
    { resource: ResourceType.DOCUMENT, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.TEMPLATE, actions: [ActionType.READ, ActionType.CREATE], scope: PermissionScope.ROLE_SPECIFIC },
    { resource: ResourceType.SIGNATURE, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Client management
    { resource: ResourceType.CLIENT, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.DOSSIER, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.CASE, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE], scope: PermissionScope.PERSONAL },
    
    // Legal research
    { resource: ResourceType.JURISPRUDENCE, actions: [ActionType.READ, ActionType.SEARCH], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEGAL_TEXT, actions: [ActionType.READ, ActionType.SEARCH], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.SEARCH, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Financial
    { resource: ResourceType.INVOICE, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.BILLING, actions: [ActionType.CALCULATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Moderation (can report content)
    { resource: ResourceType.MODERATION_REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Reports
    { resource: ResourceType.REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL }
  ],
  
  [Profession.NOTAIRE]: [
    // Document management
    { resource: ResourceType.DOCUMENT, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.TEMPLATE, actions: [ActionType.READ, ActionType.CREATE], scope: PermissionScope.ROLE_SPECIFIC },
    { resource: ResourceType.SIGNATURE, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Notary specific
    { resource: ResourceType.ACTE_AUTHENTIQUE, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.SIGN], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.MINUTIER, actions: [ActionType.CREATE, ActionType.READ, ActionType.SEARCH, ActionType.ARCHIVE, ActionType.UPDATE], scope: PermissionScope.PERSONAL },
    
    // Client management
    { resource: ResourceType.CLIENT, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE], scope: PermissionScope.PERSONAL },
    
    // Legal research
    { resource: ResourceType.JURISPRUDENCE, actions: [ActionType.READ, ActionType.SEARCH], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEGAL_TEXT, actions: [ActionType.READ, ActionType.SEARCH], scope: PermissionScope.GLOBAL },
    
    // Financial
    { resource: ResourceType.INVOICE, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.BILLING, actions: [ActionType.CALCULATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Moderation (can report content)
    { resource: ResourceType.MODERATION_REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Reports
    { resource: ResourceType.REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL }
  ],
  
  [Profession.HUISSIER]: [
    // Document management
    { resource: ResourceType.DOCUMENT, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.TEMPLATE, actions: [ActionType.READ, ActionType.CREATE], scope: PermissionScope.ROLE_SPECIFIC },
    { resource: ResourceType.SIGNATURE, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Client management
    { resource: ResourceType.CLIENT, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE], scope: PermissionScope.PERSONAL },
    
    // Legal research
    { resource: ResourceType.JURISPRUDENCE, actions: [ActionType.READ, ActionType.SEARCH], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEGAL_TEXT, actions: [ActionType.READ, ActionType.SEARCH], scope: PermissionScope.GLOBAL },
    
    // Financial
    { resource: ResourceType.INVOICE, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.BILLING, actions: [ActionType.CALCULATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Moderation (can report content)
    { resource: ResourceType.MODERATION_REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Reports
    { resource: ResourceType.REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL }
  ],
  
  [Profession.MAGISTRAT]: [
    // Document management
    { resource: ResourceType.DOCUMENT, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.TEMPLATE, actions: [ActionType.READ, ActionType.CREATE], scope: PermissionScope.ROLE_SPECIFIC },
    
    // Legal research (enhanced access)
    { resource: ResourceType.JURISPRUDENCE, actions: [ActionType.READ, ActionType.SEARCH, ActionType.ANALYZE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEGAL_TEXT, actions: [ActionType.READ, ActionType.SEARCH, ActionType.ANALYZE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.SEARCH, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Case management
    { resource: ResourceType.CASE, actions: [ActionType.READ, ActionType.UPDATE, ActionType.APPROVE], scope: PermissionScope.ORGANIZATION },
    
    // Moderation (can report and moderate content)
    { resource: ResourceType.MODERATION_REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.MODERATION_ITEM, actions: [ActionType.READ, ActionType.MODERATE], scope: PermissionScope.ORGANIZATION },
    
    // Reports
    { resource: ResourceType.REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.ORGANIZATION }
  ],
  
  [Profession.ETUDIANT]: [
    // Limited document access
    { resource: ResourceType.DOCUMENT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.TEMPLATE, actions: [ActionType.READ], scope: PermissionScope.ROLE_SPECIFIC },
    
    // Legal research (read-only)
    { resource: ResourceType.JURISPRUDENCE, actions: [ActionType.READ, ActionType.SEARCH], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEGAL_TEXT, actions: [ActionType.READ, ActionType.SEARCH], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.SEARCH, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Learning system (full access for students)
    { resource: ResourceType.LEARNING_MODULE, actions: [ActionType.READ], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEARNING_CONTENT, actions: [ActionType.READ], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.EXERCISE, actions: [ActionType.READ, ActionType.SUBMIT, ActionType.ATTEMPT], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.ASSESSMENT, actions: [ActionType.READ, ActionType.SUBMIT], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.LEARNING_PROGRESS, actions: [ActionType.READ, ActionType.UPDATE, ActionType.PROGRESS], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.LEARNING_RECOMMENDATION, actions: [ActionType.READ], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.LEARNING_STATISTICS, actions: [ActionType.READ], scope: PermissionScope.PERSONAL },
    { resource: ResourceType.LEARNING_HELP, actions: [ActionType.READ, ActionType.HELP], scope: PermissionScope.GLOBAL },
    
    // Moderation (can report content)
    { resource: ResourceType.MODERATION_REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL }
  ],
  
  [Profession.JURISTE_ENTREPRISE]: [
    // Document management
    { resource: ResourceType.DOCUMENT, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.ORGANIZATION },
    { resource: ResourceType.TEMPLATE, actions: [ActionType.READ, ActionType.CREATE], scope: PermissionScope.ROLE_SPECIFIC },
    
    // Legal research
    { resource: ResourceType.JURISPRUDENCE, actions: [ActionType.READ, ActionType.SEARCH], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEGAL_TEXT, actions: [ActionType.READ, ActionType.SEARCH], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.SEARCH, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Moderation (can report content)
    { resource: ResourceType.MODERATION_REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.PERSONAL },
    
    // Reports
    { resource: ResourceType.REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.ORGANIZATION }
  ],
  
  [Profession.ADMIN]: [
    // Full system access
    { resource: ResourceType.USER, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.ORGANIZATION, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.ROLE, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.PERMISSION, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.AUDIT, actions: [ActionType.READ, ActionType.MONITOR], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.SYSTEM, actions: [ActionType.CONFIGURE, ActionType.MONITOR], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.CONFIGURATION, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.REPORT, actions: [ActionType.CREATE, ActionType.READ], scope: PermissionScope.GLOBAL },
    
    // Learning system administration
    { resource: ResourceType.LEARNING_MODULE, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEARNING_CONTENT, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.EXERCISE, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.ASSESSMENT, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEARNING_PROGRESS, actions: [ActionType.READ, ActionType.MONITOR], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEARNING_RECOMMENDATION, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEARNING_STATISTICS, actions: [ActionType.READ, ActionType.MONITOR], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEARNING_HELP, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.LEARNING_RESTRICTION, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.RESTRICT], scope: PermissionScope.GLOBAL },
    
    // Moderation system
    { resource: ResourceType.MODERATION, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.MODERATE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.MODERATION_ITEM, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE, ActionType.MODERATE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.MODERATION_REPORT, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.GLOBAL },
    { resource: ResourceType.MODERATION_WORKFLOW, actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE, ActionType.DELETE], scope: PermissionScope.GLOBAL }
  ]
};