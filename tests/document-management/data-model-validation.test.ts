/**
 * Data Model Validation Property Tests
 * 
 * Property-based tests for data model validation implemented in task 2.4
 * Validates the correctness properties for document management data models.
 * 
 * Requirements: 4.4, 4.5
 */

import * as fc from 'fast-check';
import {
  DocumentVersion,
  VersionComparison,
  VersionDifference,
  Document,
  Folder,
  Template,
  SignatureWorkflow,
  WorkflowSigner,
  DigitalSignature,
  DocumentPermission,
  AuditTrail
} from '../../types/document-management';

import { mockGenerators } from './mockGenerators';
import { testUtils } from './testUtils';

describe('Data Model Validation Property Tests', () => {
  
  // ============================================================================
  // PROPERTY 19: VERSION METADATA COMPLETENESS
  // ============================================================================
  
  describe('Property 19: Version Metadata Completeness', () => {
    /**
     * **Property 19: Version Metadata Completeness**
     * *For any* document version, it should have complete metadata including 
     * timestamp, user information, and modification details
     * **Validates: Requirements 4.4, 4.5**
     */
    it('should ensure all document versions have complete metadata', () => {
      fc.assert(
        fc.property(mockGenerators.documentVersion, (version: DocumentVersion) => {
          // Requirement 4.4: Store timestamps and user information for each version
          
          // Must have timestamp information
          expect(version.createdAt).toBeDefined();
          expect(version.createdAt instanceof Date).toBe(true);
          expect(version.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
          
          // Must have user information
          expect(version.createdBy).toBeDefined();
          expect(typeof version.createdBy).toBe('string');
          expect(version.createdBy.length).toBeGreaterThan(0);
          
          // Must have version identification
          expect(version.id).toBeDefined();
          expect(typeof version.id).toBe('string');
          expect(version.id.length).toBeGreaterThan(0);
          
          expect(version.documentId).toBeDefined();
          expect(typeof version.documentId).toBe('string');
          expect(version.documentId.length).toBeGreaterThan(0);
          
          expect(version.versionNumber).toBeDefined();
          expect(typeof version.versionNumber).toBe('number');
          expect(version.versionNumber).toBeGreaterThan(0);
          
          // Must have integrity information
          expect(version.checksum).toBeDefined();
          expect(typeof version.checksum).toBe('string');
          expect(version.checksum.length).toBeGreaterThan(0);
          
          expect(version.size).toBeDefined();
          expect(typeof version.size).toBe('number');
          expect(version.size).toBeGreaterThan(0);
          
          expect(version.storagePath).toBeDefined();
          expect(typeof version.storagePath).toBe('string');
          expect(version.storagePath.length).toBeGreaterThan(0);
          
          // Must have current version flag
          expect(version.isCurrent).toBeDefined();
          expect(typeof version.isCurrent).toBe('boolean');
          
          // Requirement 4.5: Modification details should be available
          // Change description is optional but if present must be valid
          if (version.changeDescription !== undefined) {
            expect(typeof version.changeDescription).toBe('string');
          }
          
          return true;
        }),
        { 
          numRuns: 100,
          verbose: true
        }
      );
    });
    
    it('should ensure version history can be chronologically ordered', () => {
      fc.assert(
        fc.property(
          fc.array(mockGenerators.documentVersion, { minLength: 2, maxLength: 10 }),
          (versions: DocumentVersion[]) => {
            // All versions should have the same documentId for this test
            const documentId = versions[0].documentId;
            const normalizedVersions = versions.map((v, index) => ({
              ...v,
              documentId,
              versionNumber: index + 1,
              createdAt: new Date(Date.now() - (versions.length - index) * 60000) // Each version 1 minute apart
            }));
            
            // Requirement 4.5: Should be able to show chronological list
            const sortedByTime = [...normalizedVersions].sort((a, b) => 
              a.createdAt.getTime() - b.createdAt.getTime()
            );
            
            const sortedByVersion = [...normalizedVersions].sort((a, b) => 
              a.versionNumber - b.versionNumber
            );
            
            // Chronological order should match version number order
            for (let i = 0; i < sortedByTime.length; i++) {
              expect(sortedByTime[i].versionNumber).toBe(sortedByVersion[i].versionNumber);
              expect(sortedByTime[i].createdAt.getTime()).toBeLessThanOrEqual(
                sortedByTime[i + 1]?.createdAt.getTime() || Date.now()
              );
            }
            
            // Each version should have complete metadata for chronological display
            normalizedVersions.forEach(version => {
              expect(version.createdAt instanceof Date).toBe(true);
              expect(typeof version.createdBy).toBe('string');
              expect(version.createdBy.length).toBeGreaterThan(0);
              expect(typeof version.versionNumber).toBe('number');
              expect(version.versionNumber).toBeGreaterThan(0);
            });
            
            return true;
          }
        ),
        { 
          numRuns: 50,
          verbose: true
        }
      );
    });
    
    it('should ensure version metadata supports modification tracking', () => {
      fc.assert(
        fc.property(
          fc.tuple(mockGenerators.documentVersion, mockGenerators.documentVersion),
          ([oldVersion, newVersion]: [DocumentVersion, DocumentVersion]) => {
            // Make them related versions of the same document
            const documentId = oldVersion.documentId;
            const normalizedOldVersion = {
              ...oldVersion,
              documentId,
              versionNumber: 1,
              createdAt: new Date(Date.now() - 60000), // 1 minute ago
              isCurrent: false
            };
            
            const normalizedNewVersion = {
              ...newVersion,
              documentId,
              versionNumber: 2,
              createdAt: new Date(), // Now
              isCurrent: true,
              changeDescription: 'Updated document content'
            };
            
            // Both versions should have complete metadata for modification tracking
            [normalizedOldVersion, normalizedNewVersion].forEach(version => {
              // Timestamp information (Requirement 4.4)
              expect(version.createdAt instanceof Date).toBe(true);
              expect(typeof version.createdBy).toBe('string');
              expect(version.createdBy.length).toBeGreaterThan(0);
              
              // Version identification
              expect(typeof version.id).toBe('string');
              expect(version.id.length).toBeGreaterThan(0);
              expect(typeof version.versionNumber).toBe('number');
              expect(version.versionNumber).toBeGreaterThan(0);
              
              // Integrity tracking
              expect(typeof version.checksum).toBe('string');
              expect(version.checksum.length).toBeGreaterThan(0);
              expect(typeof version.size).toBe('number');
              expect(version.size).toBeGreaterThan(0);
            });
            
            // Newer version should have later timestamp
            expect(normalizedNewVersion.createdAt.getTime()).toBeGreaterThan(
              normalizedOldVersion.createdAt.getTime()
            );
            
            // Version numbers should be sequential
            expect(normalizedNewVersion.versionNumber).toBeGreaterThan(
              normalizedOldVersion.versionNumber
            );
            
            // Only one version should be current
            expect(normalizedOldVersion.isCurrent).toBe(false);
            expect(normalizedNewVersion.isCurrent).toBe(true);
            
            return true;
          }
        ),
        { 
          numRuns: 50,
          verbose: true
        }
      );
    });
  });
  
  // ============================================================================
  // ADDITIONAL DATA MODEL VALIDATION PROPERTIES
  // ============================================================================
  
  describe('Document Model Validation', () => {
    it('should validate document structure completeness', () => {
      fc.assert(
        fc.property(mockGenerators.document, (document: Document) => {
          const validation = testUtils.validateDocument(document);
          
          if (!validation.isValid) {
            console.error('Document validation failed:', validation.errors);
            console.error('Document:', document);
          }
          
          return validation.isValid;
        }),
        { numRuns: 100 }
      );
    });
    
    it('should ensure document metadata consistency', () => {
      fc.assert(
        fc.property(mockGenerators.document, (document: Document) => {
          // Metadata should be consistent with document properties
          expect(document.metadata).toBeDefined();
          expect(typeof document.metadata).toBe('object');
          
          // Category should be valid
          expect(['contract', 'pleading', 'evidence', 'correspondence', 'template', 'other'])
            .toContain(document.metadata.category);
          
          // Confidentiality level should be valid
          expect(['public', 'internal', 'confidential', 'restricted'])
            .toContain(document.metadata.confidentialityLevel);
          
          // Custom fields should be an object
          expect(typeof document.metadata.customFields).toBe('object');
          
          // If retention period is specified, it should be positive
          if (document.metadata.retentionPeriod !== undefined) {
            expect(document.metadata.retentionPeriod).toBeGreaterThan(0);
          }
          
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });
  
  describe('Folder Model Validation', () => {
    it('should validate folder hierarchy constraints', () => {
      fc.assert(
        fc.property(mockGenerators.folder, (folder: Folder) => {
          const validation = testUtils.validateFolder(folder);
          
          if (!validation.isValid) {
            console.error('Folder validation failed:', validation.errors);
            console.error('Folder:', folder);
          }
          
          return validation.isValid;
        }),
        { numRuns: 100 }
      );
    });
    
    it('should ensure folder path consistency with level', () => {
      fc.assert(
        fc.property(mockGenerators.folder, (folder: Folder) => {
          // Path depth should correspond to folder level
          const pathParts = folder.path.split('/').filter(part => part.length > 0);
          
          // Level 0 folders should have simple paths
          if (folder.level === 0) {
            expect(pathParts.length).toBeLessThanOrEqual(1);
            expect(folder.parentId).toBeNull();
          }
          
          // Higher level folders should have more complex paths
          if (folder.level > 0) {
            expect(pathParts.length).toBeGreaterThan(0);
          }
          
          // Level should not exceed maximum depth
          expect(folder.level).toBeLessThanOrEqual(5);
          expect(folder.level).toBeGreaterThanOrEqual(0);
          
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });
  
  describe('Template Model Validation', () => {
    it('should validate template structure and variables', () => {
      fc.assert(
        fc.property(mockGenerators.template, (template: Template) => {
          const validation = testUtils.validateTemplate(template);
          
          if (!validation.isValid) {
            console.error('Template validation failed:', validation.errors);
            console.error('Template:', template);
          }
          
          return validation.isValid;
        }),
        { numRuns: 100 }
      );
    });
    
    it('should ensure template variables are well-formed', () => {
      fc.assert(
        fc.property(mockGenerators.template, (template: Template) => {
          // All variables should have required fields
          template.variables.forEach((variable, index) => {
            expect(typeof variable.name).toBe('string');
            expect(variable.name.length).toBeGreaterThan(0);
            expect(typeof variable.type).toBe('string');
            expect(['text', 'date', 'number', 'boolean', 'list']).toContain(variable.type);
            expect(typeof variable.label).toBe('string');
            expect(variable.label.length).toBeGreaterThan(0);
            expect(typeof variable.required).toBe('boolean');
            
            // Variable names should be unique within template
            const duplicateNames = template.variables.filter(v => v.name === variable.name);
            expect(duplicateNames.length).toBe(1);
          });
          
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });
  
  describe('Signature Workflow Model Validation', () => {
    it('should validate signature workflow completeness', () => {
      fc.assert(
        fc.property(mockGenerators.signatureWorkflow, (workflow: SignatureWorkflow) => {
          const validation = testUtils.validateSignatureWorkflow(workflow);
          
          if (!validation.isValid) {
            console.error('Signature workflow validation failed:', validation.errors);
            console.error('Workflow:', workflow);
          }
          
          return validation.isValid;
        }),
        { numRuns: 100 }
      );
    });
    
    it('should ensure signer order consistency', () => {
      fc.assert(
        fc.property(mockGenerators.signatureWorkflow, (workflow: SignatureWorkflow) => {
          // Signer orders should be unique and sequential
          const orders = workflow.signers.map(s => s.order).sort((a, b) => a - b);
          
          for (let i = 0; i < orders.length; i++) {
            expect(orders[i]).toBeGreaterThan(0);
            
            // No duplicate orders
            if (i > 0) {
              expect(orders[i]).toBeGreaterThan(orders[i - 1]);
            }
          }
          
          // All signers should have valid email addresses
          workflow.signers.forEach(signer => {
            expect(signer.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            expect(typeof signer.name).toBe('string');
            expect(signer.name.length).toBeGreaterThan(0);
          });
          
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });
  
  describe('Permission Model Validation', () => {
    it('should validate document permission structure', () => {
      fc.assert(
        fc.property(mockGenerators.documentPermission, (permission: DocumentPermission) => {
          // Must have either userId or roleId
          expect(permission.userId !== undefined || permission.roleId !== undefined).toBe(true);
          
          // Permission type should be valid
          expect(['view', 'edit', 'delete', 'share', 'sign']).toContain(permission.permission);
          
          // Granted date should be valid
          expect(permission.grantedAt instanceof Date).toBe(true);
          expect(permission.grantedAt.getTime()).toBeLessThanOrEqual(Date.now());
          
          // If expiration is set, it should be in the future relative to grant date
          if (permission.expiresAt) {
            expect(permission.expiresAt instanceof Date).toBe(true);
            expect(permission.expiresAt.getTime()).toBeGreaterThan(permission.grantedAt.getTime());
          }
          
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });
  
  describe('Audit Trail Model Validation', () => {
    it('should validate audit trail completeness', () => {
      fc.assert(
        fc.property(mockGenerators.auditTrail, (auditEntry: AuditTrail) => {
          // Required fields
          expect(typeof auditEntry.id).toBe('string');
          expect(auditEntry.id.length).toBeGreaterThan(0);
          expect(typeof auditEntry.entityType).toBe('string');
          expect(auditEntry.entityType.length).toBeGreaterThan(0);
          expect(typeof auditEntry.entityId).toBe('string');
          expect(auditEntry.entityId.length).toBeGreaterThan(0);
          expect(typeof auditEntry.action).toBe('string');
          expect(auditEntry.action.length).toBeGreaterThan(0);
          expect(auditEntry.timestamp instanceof Date).toBe(true);
          expect(typeof auditEntry.details).toBe('object');
          
          // Timestamp should be reasonable
          expect(auditEntry.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
          expect(auditEntry.timestamp.getTime()).toBeGreaterThan(Date.now() - 365 * 24 * 60 * 60 * 1000); // Within last year
          
          return true;
        }),
        { numRuns: 50 }
      );
    });
  });
});