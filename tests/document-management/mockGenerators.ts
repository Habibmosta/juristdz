/**
 * Document Management System - Mock Data Generators
 * 
 * Advanced mock data generators for property-based testing using fast-check.
 * These generators create realistic test data that respects business rules
 * and constraints defined in the requirements.
 * 
 * Requirements: All (testing foundation)
 */

import * as fc from 'fast-check';
import { Language, UserRole } from '../../types';

// =====================================================
// BASIC GENERATORS
// =====================================================

/**
 * Generate valid document IDs (UUIDs)
 */
export const documentIdGenerator = fc.uuid();

/**
 * Generate valid user IDs (UUIDs)
 */
export const userIdGenerator = fc.uuid();

/**
 * Generate valid case IDs (UUIDs)
 */
export const caseIdGenerator = fc.uuid();

/**
 * Generate valid folder IDs (UUIDs)
 */
export const folderIdGenerator = fc.uuid();

/**
 * Generate valid file names with proper extensions
 */
export const fileNameGenerator = fc.oneof(
  fc.string({ minLength: 1, maxLength: 100 }).map(s => `${s.replace(/[^a-zA-Z0-9\-_]/g, '_')}.pdf`),
  fc.string({ minLength: 1, maxLength: 100 }).map(s => `${s.replace(/[^a-zA-Z0-9\-_]/g, '_')}.docx`),
  fc.string({ minLength: 1, maxLength: 100 }).map(s => `${s.replace(/[^a-zA-Z0-9\-_]/g, '_')}.doc`),
  fc.string({ minLength: 1, maxLength: 100 }).map(s => `${s.replace(/[^a-zA-Z0-9\-_]/g, '_')}.txt`),
  fc.string({ minLength: 1, maxLength: 100 }).map(s => `${s.replace(/[^a-zA-Z0-9\-_]/g, '_')}.jpg`),
  fc.string({ minLength: 1, maxLength: 100 }).map(s => `${s.replace(/[^a-zA-Z0-9\-_]/g, '_')}.png`)
);

/**
 * Generate valid MIME types according to requirements 1.1
 */
export const mimeTypeGenerator = fc.constantFrom(
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
  'text/plain'
);

/**
 * Generate invalid MIME types for negative testing
 */
export const invalidMimeTypeGenerator = fc.constantFrom(
  'application/exe',
  'text/html',
  'application/javascript',
  'image/gif',
  'video/mp4',
  'audio/mp3',
  'application/zip'
);

/**
 * Generate valid file sizes (1 byte to 50MB as per requirement 1.2)
 */
export const validFileSizeGenerator = fc.integer({ min: 1, max: 50 * 1024 * 1024 });

/**
 * Generate invalid file sizes for negative testing
 */
export const invalidFileSizeGenerator = fc.oneof(
  fc.integer({ min: -1000, max: 0 }), // Negative or zero sizes
  fc.integer({ min: 50 * 1024 * 1024 + 1, max: 100 * 1024 * 1024 }) // Over 50MB limit
);

/**
 * Generate valid folder depths (0-5 levels as per requirement 2.2)
 */
export const validFolderDepthGenerator = fc.integer({ min: 0, max: 5 });

/**
 * Generate invalid folder depths for negative testing
 */
export const invalidFolderDepthGenerator = fc.oneof(
  fc.integer({ min: -10, max: -1 }), // Negative depths
  fc.integer({ min: 6, max: 20 }) // Exceeding 5 level limit
);

/**
 * Generate document categories as per requirements
 */
export const documentCategoryGenerator = fc.constantFrom(
  'contract',
  'pleading',
  'evidence',
  'correspondence',
  'template',
  'other'
);

/**
 * Generate confidentiality levels as per requirements
 */
export const confidentialityLevelGenerator = fc.constantFrom(
  'public',
  'internal',
  'confidential',
  'restricted'
);

/**
 * Generate user roles as per requirements
 */
export const userRoleGenerator = fc.constantFrom(
  UserRole.AVOCAT,
  UserRole.NOTAIRE,
  UserRole.HUISSIER,
  UserRole.MAGISTRAT,
  UserRole.ADMIN
);

/**
 * Generate permissions as per requirements
 */
export const permissionGenerator = fc.constantFrom(
  'view',
  'edit',
  'delete',
  'share',
  'sign'
);

/**
 * Generate languages as per requirements 3.5
 */
export const languageGenerator = fc.constantFrom(Language.FRENCH, Language.ARABIC);

/**
 * Generate template categories
 */
export const templateCategoryGenerator = fc.constantFrom(
  'contract',
  'motion',
  'brief',
  'notice',
  'agreement',
  'other'
);

/**
 * Generate workflow statuses
 */
export const workflowStatusGenerator = fc.constantFrom(
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'expired'
);

/**
 * Generate signer statuses
 */
export const signerStatusGenerator = fc.constantFrom(
  'pending',
  'signed',
  'declined'
);

// =====================================================
// COMPLEX GENERATORS
// =====================================================

/**
 * Generate valid document tags
 */
export const documentTagsGenerator = fc.array(
  fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9\-_]/g, '_')),
  { minLength: 0, maxLength: 10 }
);

/**
 * Generate encryption keys (base64 encoded)
 */
export const encryptionKeyGenerator = fc.string({ minLength: 32, maxLength: 64 })
  .map(s => Buffer.from(s).toString('base64'));

/**
 * Generate checksums (SHA-256 hex)
 */
export const checksumGenerator = fc.string({ minLength: 64, maxLength: 64 })
  .map(s => s.replace(/[^a-f0-9]/g, 'a').substring(0, 64));

/**
 * Generate storage paths
 */
export const storagePathGenerator = fc.tuple(userIdGenerator, fileNameGenerator)
  .map(([userId, fileName]) => `/${userId}/${fileName}`);

/**
 * Generate email addresses
 */
export const emailGenerator = fc.tuple(
  fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'a')),
  fc.constantFrom('example.com', 'test.com', 'domain.org')
).map(([local, domain]) => `${local}@${domain}`);

/**
 * Generate IP addresses
 */
export const ipAddressGenerator = fc.tuple(
  fc.integer({ min: 1, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 1, max: 255 })
).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

/**
 * Generate future timestamps (for expiration dates)
 */
export const futureTimestampGenerator = fc.integer({ min: 1, max: 365 * 24 * 60 * 60 * 1000 })
  .map(offset => new Date(Date.now() + offset));

/**
 * Generate past timestamps (for creation dates)
 */
export const pastTimestampGenerator = fc.integer({ min: 1, max: 30 * 24 * 60 * 60 * 1000 })
  .map(offset => new Date(Date.now() - offset));

// =====================================================
// DOCUMENT GENERATORS
// =====================================================

/**
 * Generate complete document metadata
 */
export const documentMetadataGenerator = fc.record({
  description: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
  category: documentCategoryGenerator,
  confidentialityLevel: confidentialityLevelGenerator,
  retentionPeriod: fc.option(fc.integer({ min: 30, max: 3650 })), // 30 days to 10 years
  customFields: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.oneof(
      fc.string({ maxLength: 200 }),
      fc.integer(),
      fc.boolean(),
      fc.date()
    )
  )
});

/**
 * Generate complete document objects
 */
export const documentGenerator = fc.record({
  id: documentIdGenerator,
  caseId: caseIdGenerator,
  name: fileNameGenerator,
  originalName: fileNameGenerator,
  mimeType: mimeTypeGenerator,
  size: validFileSizeGenerator,
  checksum: checksumGenerator,
  encryptionKey: encryptionKeyGenerator,
  storagePath: storagePathGenerator,
  folderId: fc.option(folderIdGenerator),
  tags: documentTagsGenerator,
  metadata: documentMetadataGenerator,
  createdAt: pastTimestampGenerator,
  updatedAt: pastTimestampGenerator,
  createdBy: userIdGenerator,
  currentVersionId: fc.uuid(),
  isDeleted: fc.boolean(),
  deletedAt: fc.option(pastTimestampGenerator)
});

/**
 * Generate folder objects with proper hierarchy
 */
export const folderGenerator = fc.record({
  id: folderIdGenerator,
  caseId: caseIdGenerator,
  name: fc.string({ minLength: 1, maxLength: 255 }),
  parentId: fc.option(folderIdGenerator),
  path: fc.string({ minLength: 1, maxLength: 1000 }),
  level: validFolderDepthGenerator,
  createdAt: pastTimestampGenerator,
  createdBy: userIdGenerator,
  isDeleted: fc.boolean()
});

/**
 * Generate document version objects
 */
export const documentVersionGenerator = fc.record({
  id: fc.uuid(),
  documentId: documentIdGenerator,
  versionNumber: fc.integer({ min: 1, max: 100 }),
  size: validFileSizeGenerator,
  checksum: checksumGenerator,
  storagePath: storagePathGenerator,
  createdAt: pastTimestampGenerator,
  createdBy: userIdGenerator,
  changeDescription: fc.option(fc.string({ maxLength: 500 })),
  isCurrent: fc.boolean()
});

// =====================================================
// TEMPLATE GENERATORS
// =====================================================

/**
 * Generate template variables
 */
export const templateVariableGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9_]/g, '_')),
  type: fc.constantFrom('text', 'date', 'number', 'boolean', 'list'),
  label: fc.string({ minLength: 1, maxLength: 100 }),
  required: fc.boolean(),
  defaultValue: fc.option(fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.date()
  )),
  validation: fc.option(fc.array(
    fc.record({
      type: fc.constantFrom('required', 'minLength', 'maxLength', 'pattern', 'range'),
      value: fc.option(fc.oneof(fc.string(), fc.integer(), fc.record({
        min: fc.option(fc.integer()),
        max: fc.option(fc.integer())
      }))),
      message: fc.string({ minLength: 1, maxLength: 200 })
    }),
    { minLength: 0, maxLength: 3 }
  )),
  options: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 })),
  placeholder: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }))
});

/**
 * Generate complete template objects
 */
export const templateGenerator = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 255 }),
  description: fc.option(fc.string({ maxLength: 1000 })),
  category: templateCategoryGenerator,
  language: languageGenerator,
  applicableRoles: fc.array(userRoleGenerator, { minLength: 1, maxLength: 5 }),
  content: fc.string({ minLength: 10, maxLength: 10000 }),
  variables: fc.array(templateVariableGenerator, { minLength: 0, maxLength: 20 }),
  createdAt: pastTimestampGenerator,
  createdBy: userIdGenerator,
  isActive: fc.boolean()
});

// =====================================================
// SIGNATURE WORKFLOW GENERATORS
// =====================================================

/**
 * Generate workflow signer objects
 */
export const workflowSignerGenerator = fc.record({
  id: fc.uuid(),
  userId: fc.option(userIdGenerator),
  email: emailGenerator,
  name: fc.string({ minLength: 1, maxLength: 255 }),
  role: fc.string({ minLength: 1, maxLength: 100 }),
  order: fc.integer({ min: 1, max: 10 }),
  status: signerStatusGenerator,
  signedAt: fc.option(pastTimestampGenerator),
  signature: fc.option(fc.record({
    signatureData: fc.string({ minLength: 100, maxLength: 1000 }),
    certificate: fc.string({ minLength: 100, maxLength: 1000 }),
    timestamp: pastTimestampGenerator,
    ipAddress: ipAddressGenerator,
    location: fc.option(fc.string({ maxLength: 200 }))
  }))
});

/**
 * Generate signature workflow objects
 */
export const signatureWorkflowGenerator = fc.record({
  id: fc.uuid(),
  documentId: documentIdGenerator,
  status: workflowStatusGenerator,
  signers: fc.array(workflowSignerGenerator, { minLength: 1, maxLength: 5 }),
  createdAt: pastTimestampGenerator,
  createdBy: userIdGenerator,
  completedAt: fc.option(pastTimestampGenerator),
  expiresAt: futureTimestampGenerator
});

// =====================================================
// PERMISSION GENERATORS
// =====================================================

/**
 * Generate document permission objects
 */
export const documentPermissionGenerator = fc.record({
  id: fc.uuid(),
  documentId: documentIdGenerator,
  userId: fc.option(userIdGenerator),
  roleId: fc.option(userRoleGenerator),
  permission: permissionGenerator,
  grantedBy: userIdGenerator,
  grantedAt: pastTimestampGenerator,
  expiresAt: fc.option(futureTimestampGenerator)
});

/**
 * Generate share link objects
 */
export const shareLinkGenerator = fc.record({
  id: fc.uuid(),
  documentId: documentIdGenerator,
  token: fc.string({ minLength: 32, maxLength: 64 }),
  permissions: fc.array(permissionGenerator, { minLength: 1, maxLength: 5 }),
  expiresAt: futureTimestampGenerator,
  createdBy: userIdGenerator,
  accessCount: fc.integer({ min: 0, max: 100 }),
  maxAccess: fc.option(fc.integer({ min: 1, max: 1000 }))
});

// =====================================================
// WORKFLOW GENERATORS
// =====================================================

/**
 * Generate workflow step objects
 */
export const workflowStepGenerator = fc.record({
  id: fc.uuid(),
  stepNumber: fc.integer({ min: 1, max: 20 }),
  name: fc.string({ minLength: 1, maxLength: 255 }),
  description: fc.option(fc.string({ maxLength: 1000 })),
  assignedUserId: fc.option(userIdGenerator),
  status: fc.constantFrom('pending', 'approved', 'rejected', 'skipped'),
  completedAt: fc.option(pastTimestampGenerator),
  comments: fc.option(fc.string({ maxLength: 1000 }))
});

/**
 * Generate document workflow objects
 */
export const documentWorkflowGenerator = fc.record({
  id: fc.uuid(),
  documentId: documentIdGenerator,
  name: fc.string({ minLength: 1, maxLength: 255 }),
  description: fc.option(fc.string({ maxLength: 1000 })),
  status: fc.constantFrom('active', 'completed', 'cancelled'),
  currentStep: fc.integer({ min: 1, max: 20 }),
  steps: fc.array(workflowStepGenerator, { minLength: 1, maxLength: 10 }),
  createdAt: pastTimestampGenerator,
  createdBy: userIdGenerator,
  completedAt: fc.option(pastTimestampGenerator)
});

// =====================================================
// COMMENT GENERATORS
// =====================================================

/**
 * Generate document comment objects
 */
export const documentCommentGenerator = fc.record({
  id: fc.uuid(),
  documentId: documentIdGenerator,
  parentId: fc.option(fc.uuid()),
  content: fc.string({ minLength: 1, maxLength: 2000 }),
  createdAt: pastTimestampGenerator,
  createdBy: userIdGenerator,
  updatedAt: pastTimestampGenerator,
  isDeleted: fc.boolean()
});

// =====================================================
// AUDIT TRAIL GENERATORS
// =====================================================

/**
 * Generate audit trail entries
 */
export const auditTrailGenerator = fc.record({
  id: fc.uuid(),
  entityType: fc.constantFrom('document', 'folder', 'template', 'workflow', 'signature'),
  entityId: fc.uuid(),
  action: fc.constantFrom('create', 'update', 'delete', 'view', 'download', 'share', 'sign'),
  userId: fc.option(userIdGenerator),
  timestamp: pastTimestampGenerator,
  ipAddress: fc.option(ipAddressGenerator),
  userAgent: fc.option(fc.string({ maxLength: 500 })),
  details: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.oneof(fc.string(), fc.integer(), fc.boolean())
  )
});

// =====================================================
// SCENARIO GENERATORS
// =====================================================

/**
 * Generate complete test scenarios with related entities
 */
export const testScenarioGenerator = fc.record({
  user: fc.record({
    id: userIdGenerator,
    email: emailGenerator,
    role: userRoleGenerator
  }),
  case: fc.record({
    id: caseIdGenerator,
    title: fc.string({ minLength: 1, maxLength: 255 }),
    description: fc.option(fc.string({ maxLength: 1000 })),
    status: fc.constantFrom('active', 'closed', 'archived')
  }),
  folders: fc.array(folderGenerator, { minLength: 0, maxLength: 5 }),
  documents: fc.array(documentGenerator, { minLength: 1, maxLength: 10 }),
  templates: fc.array(templateGenerator, { minLength: 0, maxLength: 3 }),
  workflows: fc.array(signatureWorkflowGenerator, { minLength: 0, maxLength: 2 })
});

// =====================================================
// EDGE CASE GENERATORS
// =====================================================

/**
 * Generate edge case scenarios for robust testing
 */
export const edgeCaseGenerators = {
  // Maximum file size (exactly 50MB)
  maxFileSize: fc.constant(50 * 1024 * 1024),
  
  // Minimum file size (1 byte)
  minFileSize: fc.constant(1),
  
  // Maximum folder depth (level 5)
  maxFolderDepth: fc.constant(5),
  
  // Empty strings and null values
  emptyString: fc.constant(''),
  nullValue: fc.constant(null),
  
  // Very long strings
  longString: fc.string({ minLength: 1000, maxLength: 2000 }),
  
  // Special characters in file names
  specialCharFileName: fc.string({ minLength: 1, maxLength: 50 })
    .map(s => `${s}!@#$%^&*()[]{}|;:,.<>?`.substring(0, 50) + '.pdf'),
  
  // Unicode characters
  unicodeString: fc.fullUnicodeString({ minLength: 1, maxLength: 100 }),
  
  // Very old and very new dates
  veryOldDate: fc.constant(new Date('1900-01-01')),
  veryNewDate: fc.constant(new Date('2100-12-31')),
  
  // Large arrays
  largeTagArray: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 100, maxLength: 1000 }),
  
  // Deeply nested folder structures
  deepFolderPath: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 10, maxLength: 20 })
    .map(parts => parts.join('/'))
};

// =====================================================
// DATABASE OPERATION GENERATORS
// =====================================================

/**
 * Generate database operation objects for testing
 */
export const databaseOperationGenerator = fc.oneof(
  // Select operations
  fc.record({
    type: fc.constant('select'),
    table: fc.constantFrom('documents', 'folders', 'templates', 'signature_workflows', 'audit_trail'),
    columns: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    filters: fc.option(fc.dictionary(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.uuid())
    )),
    pagination: fc.option(fc.record({
      page: fc.integer({ min: 1, max: 10 }),
      limit: fc.integer({ min: 1, max: 100 }),
      orderBy: fc.option(fc.constantFrom('created_at', 'updated_at', 'name', 'id')),
      orderDirection: fc.option(fc.constantFrom('asc', 'desc'))
    }))
  }),
  
  // Insert operations
  fc.record({
    type: fc.constant('insert'),
    table: fc.constantFrom('documents', 'folders', 'templates', 'signature_workflows'),
    data: fc.oneof(
      // Document data
      fc.record({
        name: fileNameGenerator,
        original_name: fileNameGenerator,
        mime_type: mimeTypeGenerator,
        size_bytes: validFileSizeGenerator,
        case_id: caseIdGenerator,
        checksum: checksumGenerator,
        storage_path: storagePathGenerator,
        category: documentCategoryGenerator,
        confidentiality_level: confidentialityLevelGenerator,
        user_id: userIdGenerator,
        created_by: userIdGenerator
      }),
      // Folder data
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 255 }),
        case_id: caseIdGenerator,
        level: validFolderDepthGenerator,
        path: fc.string({ minLength: 1, maxLength: 1000 }),
        user_id: userIdGenerator,
        created_by: userIdGenerator
      }),
      // Template data
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 255 }),
        content: fc.string({ minLength: 10, maxLength: 1000 }),
        category: templateCategoryGenerator,
        language: languageGenerator,
        applicable_roles: fc.array(userRoleGenerator, { minLength: 1, maxLength: 3 }),
        user_id: userIdGenerator,
        created_by: userIdGenerator
      })
    )
  }),
  
  // Update operations
  fc.record({
    type: fc.constant('update'),
    table: fc.constantFrom('documents', 'folders', 'templates'),
    id: fc.uuid(),
    data: fc.dictionary(
      fc.constantFrom('name', 'description', 'category', 'tags', 'is_deleted'),
      fc.oneof(fc.string(), fc.boolean(), fc.array(fc.string()))
    )
  }),
  
  // Delete operations
  fc.record({
    type: fc.constant('delete'),
    table: fc.constantFrom('documents', 'folders', 'templates'),
    id: fc.uuid(),
    hardDelete: fc.boolean()
  }),
  
  // Test connection
  fc.record({
    type: fc.constant('test')
  })
);

/**
 * Generate related data operations for testing referential integrity
 */
export const relatedDataOperationGenerator = fc.record({
  parent: fc.record({
    type: fc.constant('insert'),
    table: fc.constantFrom('cases', 'folders'),
    data: fc.oneof(
      // Case data
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 255 }),
        description: fc.option(fc.string({ maxLength: 1000 })),
        status: fc.constantFrom('active', 'closed'),
        user_id: userIdGenerator,
        created_by: userIdGenerator
      }),
      // Folder data
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 255 }),
        case_id: caseIdGenerator,
        level: validFolderDepthGenerator,
        path: fc.string({ minLength: 1, maxLength: 1000 }),
        user_id: userIdGenerator,
        created_by: userIdGenerator
      })
    )
  }),
  child: fc.record({
    type: fc.constant('insert'),
    table: fc.constantFrom('documents', 'folders'),
    data: fc.oneof(
      // Document data (references case)
      fc.record({
        name: fileNameGenerator,
        original_name: fileNameGenerator,
        mime_type: mimeTypeGenerator,
        size_bytes: validFileSizeGenerator,
        checksum: checksumGenerator,
        storage_path: storagePathGenerator,
        user_id: userIdGenerator,
        created_by: userIdGenerator
      }),
      // Folder data (references parent folder)
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 255 }),
        level: fc.integer({ min: 1, max: 5 }),
        path: fc.string({ minLength: 1, maxLength: 1000 }),
        user_id: userIdGenerator,
        created_by: userIdGenerator
      })
    )
  }),
  foreignKey: fc.constantFrom('case_id', 'parent_id', 'folder_id'),
  cascadeDelete: fc.boolean()
});

/**
 * Generate schema validation test data
 */
export const schemaValidationDataGenerator = fc.record({
  table: fc.constantFrom('documents', 'folders', 'templates'),
  data: fc.oneof(
    // Valid document data
    fc.record({
      name: fileNameGenerator,
      original_name: fileNameGenerator,
      mime_type: mimeTypeGenerator,
      size_bytes: validFileSizeGenerator,
      case_id: caseIdGenerator,
      checksum: checksumGenerator,
      storage_path: storagePathGenerator,
      user_id: userIdGenerator,
      created_by: userIdGenerator,
      isValid: fc.constant(true)
    }),
    // Invalid document data (missing required fields)
    fc.record({
      name: fc.option(fileNameGenerator),
      mime_type: fc.option(invalidMimeTypeGenerator),
      size_bytes: fc.option(invalidFileSizeGenerator),
      isValid: fc.constant(false)
    }),
    // Valid folder data
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 255 }),
      case_id: caseIdGenerator,
      level: validFolderDepthGenerator,
      path: fc.string({ minLength: 1, maxLength: 1000 }),
      user_id: userIdGenerator,
      created_by: userIdGenerator,
      isValid: fc.constant(true)
    }),
    // Invalid folder data (exceeds depth limit)
    fc.record({
      name: fc.option(fc.string({ minLength: 1, maxLength: 255 })),
      level: fc.option(invalidFolderDepthGenerator),
      path: fc.option(fc.string({ minLength: 10000, maxLength: 20000 })), // Too long
      isValid: fc.constant(false)
    })
  ),
  isValid: fc.boolean()
});

/**
 * Generate transaction operations for testing atomicity
 */
export const transactionOperationGenerator = fc.record({
  operations: fc.array(
    fc.record({
      type: fc.constantFrom('insert', 'update', 'delete'),
      table: fc.constantFrom('documents', 'folders', 'templates'),
      data: fc.option(fc.dictionary(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.oneof(fc.string(), fc.integer(), fc.boolean())
      )),
      id: fc.option(fc.uuid()),
      expectedId: fc.option(fc.uuid())
    }),
    { minLength: 2, maxLength: 5 }
  ),
  tables: fc.array(
    fc.constantFrom('documents', 'folders', 'templates', 'audit_trail'),
    { minLength: 1, maxLength: 4 }
  ),
  shouldFail: fc.boolean()
});

// =====================================================
// ACCESS CONTROL AND AUDIT GENERATORS
// =====================================================

/**
 * Generate access control rule objects
 */
export const accessControlRuleGenerator = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 255 }),
  description: fc.string({ minLength: 1, maxLength: 1000 }),
  entityType: fc.constantFrom('document', 'folder', 'case', 'template'),
  entityId: fc.option(fc.uuid()),
  conditions: fc.array(
    fc.record({
      type: fc.constantFrom('user', 'role', 'time', 'location', 'device', 'custom'),
      operator: fc.constantFrom('equals', 'not_equals', 'in', 'not_in', 'greater_than', 'less_than', 'contains'),
      value: fc.oneof(fc.string(), fc.integer(), fc.boolean(), userRoleGenerator),
      metadata: fc.option(fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())))
    }),
    { minLength: 1, maxLength: 5 }
  ),
  permissions: fc.array(permissionGenerator, { minLength: 1, maxLength: 5 }),
  priority: fc.integer({ min: 1, max: 1000 }),
  isActive: fc.boolean(),
  createdAt: pastTimestampGenerator,
  createdBy: userIdGenerator,
  updatedAt: pastTimestampGenerator,
  updatedBy: userIdGenerator
});

/**
 * Generate access attempt log objects
 */
export const accessAttemptGenerator = fc.record({
  id: fc.uuid(),
  userId: fc.option(userIdGenerator),
  documentId: documentIdGenerator,
  permission: permissionGenerator,
  result: fc.constantFrom('granted', 'denied', 'error'),
  reason: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
  timestamp: pastTimestampGenerator,
  ipAddress: fc.option(ipAddressGenerator),
  userAgent: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
  sessionId: fc.option(fc.string({ minLength: 10, maxLength: 100 }))
});

/**
 * Generate security event objects
 */
export const securityEventGenerator = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('login', 'logout', 'permission_change', 'suspicious_activity', 'data_breach', 'compliance_violation'),
  severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
  userId: fc.option(userIdGenerator),
  entityType: fc.option(fc.constantFrom('document', 'folder', 'case', 'user')),
  entityId: fc.option(fc.uuid()),
  description: fc.string({ minLength: 10, maxLength: 1000 }),
  details: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.oneof(fc.string(), fc.integer(), fc.boolean())
  ),
  timestamp: pastTimestampGenerator,
  ipAddress: fc.option(ipAddressGenerator),
  resolved: fc.boolean(),
  resolvedAt: fc.option(pastTimestampGenerator),
  resolvedBy: fc.option(userIdGenerator)
});

/**
 * Generate compliance finding objects
 */
export const complianceFindingGenerator = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('violation', 'risk', 'recommendation', 'observation'),
  severity: fc.constantFrom('low', 'medium', 'high', 'critical'),
  title: fc.string({ minLength: 10, maxLength: 255 }),
  description: fc.string({ minLength: 20, maxLength: 1000 }),
  evidence: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 0, maxLength: 10 }),
  recommendation: fc.option(fc.string({ minLength: 10, maxLength: 500 })),
  status: fc.constantFrom('open', 'in_progress', 'resolved', 'accepted_risk'),
  assignedTo: fc.option(userIdGenerator),
  dueDate: fc.option(futureTimestampGenerator)
});

/**
 * Generate compliance report objects
 */
export const complianceReportGenerator = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('access_log', 'permission_audit', 'data_retention', 'security_assessment'),
  title: fc.string({ minLength: 10, maxLength: 255 }),
  description: fc.string({ minLength: 20, maxLength: 1000 }),
  period: fc.record({
    from: pastTimestampGenerator,
    to: pastTimestampGenerator
  }),
  generatedAt: pastTimestampGenerator,
  generatedBy: userIdGenerator,
  data: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.oneof(fc.string(), fc.integer(), fc.boolean())
  ),
  findings: fc.array(complianceFindingGenerator, { minLength: 0, maxLength: 10 }),
  status: fc.constantFrom('draft', 'final', 'submitted')
});

/**
 * Generate data retention condition objects
 */
export const retentionConditionGenerator = fc.record({
  type: fc.constantFrom('age', 'category', 'confidentiality', 'case_status', 'custom'),
  operator: fc.constantFrom('equals', 'greater_than', 'less_than', 'in', 'not_in'),
  value: fc.oneof(fc.string(), fc.integer(), fc.boolean())
});

/**
 * Generate data retention action objects
 */
export const retentionActionGenerator = fc.record({
  type: fc.constantFrom('delete', 'archive', 'anonymize', 'notify'),
  parameters: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.oneof(fc.string(), fc.integer(), fc.boolean())
  ),
  delay: fc.option(fc.integer({ min: 0, max: 365 }))
});

/**
 * Generate data retention policy objects
 */
export const dataRetentionPolicyGenerator = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 255 }),
  description: fc.string({ minLength: 1, maxLength: 1000 }),
  entityType: fc.constantFrom('document', 'audit_log', 'access_log'),
  retentionPeriod: fc.integer({ min: 1, max: 3650 }), // 1 day to 10 years
  conditions: fc.array(retentionConditionGenerator, { minLength: 1, maxLength: 5 }),
  actions: fc.array(retentionActionGenerator, { minLength: 1, maxLength: 3 }),
  isActive: fc.boolean(),
  createdAt: pastTimestampGenerator,
  createdBy: userIdGenerator
});

// Export all generators
export const mockGenerators = {
  // Basic generators
  documentId: documentIdGenerator,
  userId: userIdGenerator,
  caseId: caseIdGenerator,
  folderId: folderIdGenerator,
  fileName: fileNameGenerator,
  mimeType: mimeTypeGenerator,
  invalidMimeType: invalidMimeTypeGenerator,
  validFileSize: validFileSizeGenerator,
  invalidFileSize: invalidFileSizeGenerator,
  validFolderDepth: validFolderDepthGenerator,
  invalidFolderDepth: invalidFolderDepthGenerator,
  documentCategory: documentCategoryGenerator,
  confidentialityLevel: confidentialityLevelGenerator,
  userRole: userRoleGenerator,
  permission: permissionGenerator,
  language: languageGenerator,
  
  // Complex generators
  documentTags: documentTagsGenerator,
  encryptionKey: encryptionKeyGenerator,
  checksum: checksumGenerator,
  storagePath: storagePathGenerator,
  email: emailGenerator,
  ipAddress: ipAddressGenerator,
  futureTimestamp: futureTimestampGenerator,
  pastTimestamp: pastTimestampGenerator,
  
  // Entity generators
  document: documentGenerator,
  folder: folderGenerator,
  documentVersion: documentVersionGenerator,
  template: templateGenerator,
  templateVariable: templateVariableGenerator,
  signatureWorkflow: signatureWorkflowGenerator,
  workflowSigner: workflowSignerGenerator,
  documentPermission: documentPermissionGenerator,
  shareLink: shareLinkGenerator,
  documentWorkflow: documentWorkflowGenerator,
  workflowStep: workflowStepGenerator,
  documentComment: documentCommentGenerator,
  auditTrail: auditTrailGenerator,
  
  // Access control and audit generators
  accessControlRule: accessControlRuleGenerator,
  accessAttempt: accessAttemptGenerator,
  securityEvent: securityEventGenerator,
  complianceFinding: complianceFindingGenerator,
  complianceReport: complianceReportGenerator,
  retentionCondition: retentionConditionGenerator,
  retentionAction: retentionActionGenerator,
  dataRetentionPolicy: dataRetentionPolicyGenerator,
  
  // Database operation generators
  databaseOperation: databaseOperationGenerator,
  relatedDataOperation: relatedDataOperationGenerator,
  schemaValidationData: schemaValidationDataGenerator,
  transactionOperation: transactionOperationGenerator,
  
  // Scenario generators
  testScenario: testScenarioGenerator,
  
  // Edge case generators
  edgeCases: edgeCaseGenerators
};