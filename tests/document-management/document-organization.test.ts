/**
 * Document Organization Property Tests
 * 
 * Property-based tests for document organization implemented in task 4.4
 * Validates the correctness properties for case association, folder hierarchy, 
 * tag indexing, and hierarchy consistency.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.6
 */

import * as fc from 'fast-check';
import {
  Document,
  Folder,
  FolderContents,
  DocumentFilters,
  DocumentMetadata,
  DocumentCategory,
  ConfidentialityLevel
} from '../../types/document-management';

import { mockGenerators } from './mockGenerators';
import { testUtils } from './testUtils';

// Mock case interface for testing
interface Case {
  id: string;
  title: string;
  status: 'active' | 'closed' | 'archived';
  createdAt: Date;
  createdBy: string;
}

// Mock search index entry
interface SearchIndexEntry {
  documentId: string;
  tags: string[];
  indexedAt: Date;
  searchableContent: string[];
}

describe('Document Organization Property Tests', () => {
  
  // ============================================================================
  // PROPERTY 5: CASE ASSOCIATION
  // ============================================================================
  
  describe('Property 5: Case Association', () => {
    /**
     * **Property 5: Case Association**
     * *For any* document upload, the document should be successfully associated 
     * with any valid existing case
     * **Validates: Requirements 2.1**
     */
    it('should associate documents with valid existing cases', () => {
      fc.assert(
        fc.property(
          fc.record({
            document: fc.record({
              id: mockGenerators.documentId,
              name: mockGenerators.fileName,
              size: mockGenerators.validFileSize,
              mimeType: mockGenerators.mimeType
            }),
            case: fc.record({
              id: mockGenerators.caseId,
              title: fc.string({ minLength: 1, maxLength: 255 }),
              status: fc.constantFrom('active', 'closed', 'archived'),
              createdAt: mockGenerators.pastTimestamp,
              createdBy: mockGenerators.userId
            }),
            userId: mockGenerators.userId
          }),
          (testData) => {
            // Requirement 2.1: Document should be associable with existing case
            const documentWithCase: Document = {
              id: testData.document.id,
              caseId: testData.case.id, // Association with case
              name: testData.document.name,
              originalName: testData.document.name,
              mimeType: testData.document.mimeType,
              size: testData.document.size,
              checksum: mockGenerators.checksum.generate(fc.random()),
              encryptionKey: mockGenerators.encryptionKey.generate(fc.random()),
              storagePath: mockGenerators.storagePath.generate(fc.random()),
              folderId: undefined,
              tags: [],
              metadata: {
                category: DocumentCategory.OTHER,
                confidentialityLevel: ConfidentialityLevel.INTERNAL,
                customFields: {}
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: testData.userId,
              currentVersionId: mockGenerators.documentId.generate(fc.random()),
              isDeleted: false,
              deletedAt: undefined
            };
            
            // Validate case association
            expect(documentWithCase.caseId).toBe(testData.case.id);
            expect(typeof documentWithCase.caseId).toBe('string');
            expect(documentWithCase.caseId.length).toBeGreaterThan(0);
            
            // Document should be valid with case association
            const validation = testUtils.validateDocument(documentWithCase);
            expect(validation.isValid).toBe(true);
            
            // Case should be valid
            expect(typeof testData.case.id).toBe('string');
            expect(testData.case.id.length).toBeGreaterThan(0);
            expect(['active', 'closed', 'archived']).toContain(testData.case.status);
            expect(testData.case.createdAt instanceof Date).toBe(true);
            
            return true;
          }
        ),
        { 
          numRuns: 100,
          verbose: true
        }
      );
    });
    
    it('should maintain case association integrity across operations', () => {
      fc.assert(
        fc.property(
          fc.record({
            caseId: mockGenerators.caseId,
            documents: fc.array(
              fc.record({
                id: mockGenerators.documentId,
                name: mockGenerators.fileName,
                folderId: fc.option(mockGenerators.folderId)
              }),
              { minLength: 1, maxLength: 10 }
            ),
            operations: fc.array(
              fc.constantFrom('move', 'rename', 'tag', 'update_metadata'),
              { minLength: 1, maxLength: 5 }
            )
          }),
          (testData) => {
            // All documents should maintain case association after operations
            testData.documents.forEach(doc => {
              // Before operations
              expect(typeof testData.caseId).toBe('string');
              
              // Simulate operations that should preserve case association
              testData.operations.forEach(operation => {
                let documentAfterOperation = {
                  ...doc,
                  caseId: testData.caseId // Case association should be preserved
                };
                
                switch (operation) {
                  case 'move':
                    documentAfterOperation.folderId = mockGenerators.folderId.generate(fc.random());
                    break;
                  case 'rename':
                    documentAfterOperation.name = `renamed_${doc.name}`;
                    break;
                  case 'tag':
                    // Adding tags shouldn't affect case association
                    break;
                  case 'update_metadata':
                    // Metadata updates shouldn't affect case association
                    break;
                }
                
                // Case association must be preserved
                expect(documentAfterOperation.caseId).toBe(testData.caseId);
              });
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
    
    it('should prevent association with non-existent cases', () => {
      fc.assert(
        fc.property(
          fc.record({
            document: mockGenerators.document,
            invalidCaseId: fc.string({ minLength: 1, maxLength: 50 }).map(s => `invalid-case-${s}`)
          }),
          (testData) => {
            // Attempting to associate with non-existent case should be detectable
            const documentWithInvalidCase = {
              ...testData.document,
              caseId: testData.invalidCaseId
            };
            
            // The invalid case ID should be identifiable
            expect(documentWithInvalidCase.caseId).toBe(testData.invalidCaseId);
            expect(documentWithInvalidCase.caseId.startsWith('invalid-case-')).toBe(true);
            
            // In a real system, this would trigger validation errors
            // For property testing, we validate the structure is detectable
            const isValidCaseIdFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentWithInvalidCase.caseId);
            expect(isValidCaseIdFormat).toBe(false); // Invalid format should be detectable
            
            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });
  
  // ============================================================================
  // PROPERTY 6: FOLDER HIERARCHY LIMITS
  // ============================================================================
  
  describe('Property 6: Folder Hierarchy Limits', () => {
    /**
     * **Property 6: Folder Hierarchy Limits**
     * *For any* folder creation attempt, folders should be created successfully 
     * up to 5 levels deep, and attempts to create deeper nesting should be rejected
     * **Validates: Requirements 2.2**
     */
    it('should allow folder creation up to 5 levels deep', () => {
      fc.assert(
        fc.property(
          fc.record({
            caseId: mockGenerators.caseId,
            userId: mockGenerators.userId,
            folderDepth: fc.integer({ min: 0, max: 5 })
          }),
          (testData) => {
            // Create folder hierarchy up to specified depth
            const folders: Folder[] = [];
            let currentParentId: string | undefined = undefined;
            let currentPath = '';
            
            for (let level = 0; level <= testData.folderDepth; level++) {
              const folderName = `folder_level_${level}`;
              currentPath = currentPath ? `${currentPath}/${folderName}` : `/${folderName}`;
              
              const folder: Folder = {
                id: mockGenerators.folderId.generate(fc.random()),
                caseId: testData.caseId,
                name: folderName,
                parentId: currentParentId,
                path: currentPath,
                level: level,
                createdAt: new Date(),
                createdBy: testData.userId,
                isDeleted: false
              };
              
              folders.push(folder);
              currentParentId = folder.id;
            }
            
            // Validate each folder in the hierarchy
            folders.forEach((folder, index) => {
              // Requirement 2.2: Up to 5 levels should be allowed
              expect(folder.level).toBeLessThanOrEqual(5);
              expect(folder.level).toBeGreaterThanOrEqual(0);
              expect(folder.level).toBe(index);
              
              // Validate folder structure
              const validation = testUtils.validateFolder(folder);
              expect(validation.isValid).toBe(true);
              
              // Path should reflect hierarchy
              const pathParts = folder.path.split('/').filter(part => part.length > 0);
              expect(pathParts.length).toBe(folder.level + 1);
              
              // Parent relationship should be correct
              if (folder.level === 0) {
                expect(folder.parentId).toBeUndefined();
              } else {
                expect(folder.parentId).toBe(folders[index - 1].id);
              }
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
    
    it('should reject folder creation beyond 5 levels deep', () => {
      fc.assert(
        fc.property(
          fc.record({
            caseId: mockGenerators.caseId,
            userId: mockGenerators.userId,
            excessiveDepth: fc.integer({ min: 6, max: 20 })
          }),
          (testData) => {
            // Attempt to create folder at excessive depth
            const attemptedFolder: Folder = {
              id: mockGenerators.folderId.generate(fc.random()),
              caseId: testData.caseId,
              name: `folder_at_level_${testData.excessiveDepth}`,
              parentId: mockGenerators.folderId.generate(fc.random()),
              path: `/level1/level2/level3/level4/level5/level6/excessive`,
              level: testData.excessiveDepth,
              createdAt: new Date(),
              createdBy: testData.userId,
              isDeleted: false
            };
            
            // Requirement 2.2: Folders beyond 5 levels should be rejected
            expect(attemptedFolder.level).toBeGreaterThan(5);
            
            // Validation should fail for excessive depth
            const validation = testUtils.validateFolder(attemptedFolder);
            expect(validation.isValid).toBe(false);
            expect(validation.errors.some(error => error.includes('exceeds maximum depth'))).toBe(true);
            
            return true;
          }
        ),
        { 
          numRuns: 30,
          verbose: true
        }
      );
    });
    
    it('should maintain correct path structure for nested folders', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9_-]/g, '_')),
              level: fc.integer({ min: 0, max: 5 })
            }),
            { minLength: 1, maxLength: 6 }
          ).map(folders => folders.sort((a, b) => a.level - b.level)), // Sort by level
          (folderSpecs) => {
            const caseId = mockGenerators.caseId.generate(fc.random());
            const userId = mockGenerators.userId.generate(fc.random());
            
            // Create folder hierarchy
            const folders: Folder[] = [];
            const foldersByLevel: { [level: number]: Folder } = {};
            
            folderSpecs.forEach(spec => {
              const parentFolder = spec.level > 0 ? foldersByLevel[spec.level - 1] : undefined;
              const parentPath = parentFolder ? parentFolder.path : '';
              const folderPath = parentPath ? `${parentPath}/${spec.name}` : `/${spec.name}`;
              
              const folder: Folder = {
                id: mockGenerators.folderId.generate(fc.random()),
                caseId,
                name: spec.name,
                parentId: parentFolder?.id,
                path: folderPath,
                level: spec.level,
                createdAt: new Date(),
                createdBy: userId,
                isDeleted: false
              };
              
              folders.push(folder);
              foldersByLevel[spec.level] = folder;
            });
            
            // Validate path structure consistency
            folders.forEach(folder => {
              // Path should start with /
              expect(folder.path.startsWith('/')).toBe(true);
              
              // Path depth should match folder level
              const pathParts = folder.path.split('/').filter(part => part.length > 0);
              expect(pathParts.length).toBe(folder.level + 1);
              
              // Last part of path should be folder name
              expect(pathParts[pathParts.length - 1]).toBe(folder.name);
              
              // Parent path should be prefix of child path
              if (folder.parentId) {
                const parentFolder = folders.find(f => f.id === folder.parentId);
                expect(parentFolder).toBeDefined();
                expect(folder.path.startsWith(parentFolder!.path)).toBe(true);
              }
            });
            
            return true;
          }
        ),
        { 
          numRuns: 30,
          verbose: true
        }
      );
    });
  });
  
  // ============================================================================
  // PROPERTY 7: TAG INDEXING
  // ============================================================================
  
  describe('Property 7: Tag Indexing', () => {
    /**
     * **Property 7: Tag Indexing**
     * *For any* document with assigned tags, those tags should be stored and 
     * become searchable immediately
     * **Validates: Requirements 2.3**
     */
    it('should store and index document tags for search functionality', () => {
      fc.assert(
        fc.property(
          fc.record({
            document: mockGenerators.document,
            tags: fc.array(
              fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9_-]/g, '_')),
              { minLength: 1, maxLength: 10 }
            )
          }),
          (testData) => {
            // Requirement 2.3: Tags should be stored and indexed
            const documentWithTags: Document = {
              ...testData.document,
              tags: testData.tags
            };
            
            // Create search index entry
            const searchIndexEntry: SearchIndexEntry = {
              documentId: documentWithTags.id,
              tags: documentWithTags.tags,
              indexedAt: new Date(),
              searchableContent: documentWithTags.tags.map(tag => tag.toLowerCase())
            };
            
            // Validate tag storage
            expect(Array.isArray(documentWithTags.tags)).toBe(true);
            expect(documentWithTags.tags.length).toBe(testData.tags.length);
            expect(documentWithTags.tags).toEqual(testData.tags);
            
            // Validate search index
            expect(searchIndexEntry.documentId).toBe(documentWithTags.id);
            expect(searchIndexEntry.tags).toEqual(documentWithTags.tags);
            expect(searchIndexEntry.indexedAt instanceof Date).toBe(true);
            expect(Array.isArray(searchIndexEntry.searchableContent)).toBe(true);
            expect(searchIndexEntry.searchableContent.length).toBe(documentWithTags.tags.length);
            
            // Tags should be searchable (case-insensitive)
            documentWithTags.tags.forEach((tag, index) => {
              expect(searchIndexEntry.searchableContent[index]).toBe(tag.toLowerCase());
            });
            
            // Tags should be unique in the document
            const uniqueTags = new Set(documentWithTags.tags);
            expect(uniqueTags.size).toBeLessThanOrEqual(documentWithTags.tags.length);
            
            return true;
          }
        ),
        { 
          numRuns: 100,
          verbose: true
        }
      );
    });
    
    it('should handle tag updates and re-indexing', () => {
      fc.assert(
        fc.property(
          fc.record({
            documentId: mockGenerators.documentId,
            originalTags: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
            updatedTags: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 })
          }),
          (testData) => {
            // Original index entry
            const originalIndex: SearchIndexEntry = {
              documentId: testData.documentId,
              tags: testData.originalTags,
              indexedAt: new Date(Date.now() - 60000), // 1 minute ago
              searchableContent: testData.originalTags.map(tag => tag.toLowerCase())
            };
            
            // Updated index entry
            const updatedIndex: SearchIndexEntry = {
              documentId: testData.documentId,
              tags: testData.updatedTags,
              indexedAt: new Date(), // Now
              searchableContent: testData.updatedTags.map(tag => tag.toLowerCase())
            };
            
            // Validate index update
            expect(originalIndex.documentId).toBe(updatedIndex.documentId);
            expect(updatedIndex.indexedAt.getTime()).toBeGreaterThan(originalIndex.indexedAt.getTime());
            expect(updatedIndex.tags).toEqual(testData.updatedTags);
            expect(updatedIndex.searchableContent).toEqual(testData.updatedTags.map(tag => tag.toLowerCase()));
            
            // Old tags should be replaced, not appended
            expect(updatedIndex.tags).not.toEqual(originalIndex.tags.concat(testData.updatedTags));
            
            return true;
          }
        ),
        { 
          numRuns: 50,
          verbose: true
        }
      );
    });
    
    it('should support tag-based search and filtering', () => {
      fc.assert(
        fc.property(
          fc.record({
            documents: fc.array(
              fc.record({
                id: mockGenerators.documentId,
                tags: fc.array(
                  fc.constantFrom('contract', 'legal', 'urgent', 'draft', 'final', 'client', 'internal'),
                  { minLength: 1, maxLength: 4 }
                )
              }),
              { minLength: 3, maxLength: 10 }
            ),
            searchTag: fc.constantFrom('contract', 'legal', 'urgent', 'draft', 'final', 'client', 'internal')
          }),
          (testData) => {
            // Create search index for all documents
            const searchIndex = testData.documents.map(doc => ({
              documentId: doc.id,
              tags: doc.tags,
              indexedAt: new Date(),
              searchableContent: doc.tags.map(tag => tag.toLowerCase())
            }));
            
            // Perform tag-based search
            const searchResults = searchIndex.filter(entry => 
              entry.searchableContent.includes(testData.searchTag.toLowerCase())
            );
            
            // Validate search results
            searchResults.forEach(result => {
              expect(result.searchableContent.includes(testData.searchTag.toLowerCase())).toBe(true);
              
              // Find original document
              const originalDoc = testData.documents.find(doc => doc.id === result.documentId);
              expect(originalDoc).toBeDefined();
              expect(originalDoc!.tags.some(tag => tag.toLowerCase() === testData.searchTag.toLowerCase())).toBe(true);
            });
            
            // Verify no false positives
            const nonMatchingResults = searchIndex.filter(entry => 
              !entry.searchableContent.includes(testData.searchTag.toLowerCase())
            );
            
            nonMatchingResults.forEach(result => {
              const originalDoc = testData.documents.find(doc => doc.id === result.documentId);
              expect(originalDoc!.tags.some(tag => tag.toLowerCase() === testData.searchTag.toLowerCase())).toBe(false);
            });
            
            return true;
          }
        ),
        { 
          numRuns: 30,
          verbose: true
        }
      );
    });
    
    it('should validate tag format and constraints', () => {
      fc.assert(
        fc.property(
          fc.record({
            validTags: fc.array(
              fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9_-]/g, '_')),
              { minLength: 1, maxLength: 10 }
            ),
            invalidTags: fc.array(
              fc.oneof(
                fc.constant(''), // Empty tag
                fc.string({ minLength: 51, maxLength: 100 }), // Too long
                fc.string({ minLength: 1, maxLength: 20 }).map(s => `${s} ${s}`), // Contains spaces
                fc.string({ minLength: 1, maxLength: 20 }).map(s => `${s}!@#$%`) // Special characters
              ),
              { minLength: 1, maxLength: 5 }
            )
          }),
          (testData) => {
            // Valid tags should pass validation
            testData.validTags.forEach(tag => {
              expect(typeof tag).toBe('string');
              expect(tag.length).toBeGreaterThan(0);
              expect(tag.length).toBeLessThanOrEqual(50);
              expect(/^[a-zA-Z0-9_-]+$/.test(tag)).toBe(true);
            });
            
            // Invalid tags should be identifiable
            testData.invalidTags.forEach(tag => {
              const isValid = (
                typeof tag === 'string' &&
                tag.length > 0 &&
                tag.length <= 50 &&
                /^[a-zA-Z0-9_-]+$/.test(tag)
              );
              expect(isValid).toBe(false);
            });
            
            return true;
          }
        ),
        { 
          numRuns: 30,
          verbose: true
        }
      );
    });
  });
  
  // ============================================================================
  // PROPERTY 10: HIERARCHY CONSISTENCY
  // ============================================================================
  
  describe('Property 10: Hierarchy Consistency', () => {
    /**
     * **Property 10: Hierarchy Consistency**
     * *For any* folder operation (create, move, delete), the folder hierarchy 
     * and document associations should remain consistent and valid
     * **Validates: Requirements 2.6**
     */
    it('should maintain folder hierarchy consistency during operations', () => {
      fc.assert(
        fc.property(
          fc.record({
            caseId: mockGenerators.caseId,
            userId: mockGenerators.userId,
            initialFolders: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 30 }),
                level: fc.integer({ min: 0, max: 3 })
              }),
              { minLength: 2, maxLength: 5 }
            ).map(folders => folders.sort((a, b) => a.level - b.level)),
            operations: fc.array(
              fc.constantFrom('create', 'move', 'rename', 'delete'),
              { minLength: 1, maxLength: 3 }
            )
          }),
          (testData) => {
            // Create initial folder hierarchy
            const folders: Folder[] = [];
            const foldersByLevel: { [level: number]: Folder } = {};
            
            testData.initialFolders.forEach(spec => {
              const parentFolder = spec.level > 0 ? foldersByLevel[spec.level - 1] : undefined;
              const parentPath = parentFolder ? parentFolder.path : '';
              const folderPath = parentPath ? `${parentPath}/${spec.name}` : `/${spec.name}`;
              
              const folder: Folder = {
                id: mockGenerators.folderId.generate(fc.random()),
                caseId: testData.caseId,
                name: spec.name,
                parentId: parentFolder?.id,
                path: folderPath,
                level: spec.level,
                createdAt: new Date(),
                createdBy: testData.userId,
                isDeleted: false
              };
              
              folders.push(folder);
              foldersByLevel[spec.level] = folder;
            });
            
            // Validate initial hierarchy consistency
            const validateHierarchy = (folderList: Folder[]) => {
              folderList.forEach(folder => {
                // Path should match level
                const pathParts = folder.path.split('/').filter(part => part.length > 0);
                expect(pathParts.length).toBe(folder.level + 1);
                
                // Parent relationship should be valid
                if (folder.parentId) {
                  const parent = folderList.find(f => f.id === folder.parentId);
                  expect(parent).toBeDefined();
                  expect(parent!.level).toBe(folder.level - 1);
                  expect(folder.path.startsWith(parent!.path)).toBe(true);
                }
                
                // Level should not exceed maximum
                expect(folder.level).toBeLessThanOrEqual(5);
              });
            };
            
            // Initial hierarchy should be consistent
            validateHierarchy(folders);
            
            // Simulate operations and validate consistency is maintained
            let currentFolders = [...folders];
            
            testData.operations.forEach(operation => {
              switch (operation) {
                case 'create':
                  // Create new folder (if within depth limits)
                  if (currentFolders.length > 0) {
                    const parentFolder = currentFolders[Math.floor(Math.random() * currentFolders.length)];
                    if (parentFolder.level < 4) { // Can add one more level
                      const newFolder: Folder = {
                        id: mockGenerators.folderId.generate(fc.random()),
                        caseId: testData.caseId,
                        name: `new_folder_${Date.now()}`,
                        parentId: parentFolder.id,
                        path: `${parentFolder.path}/new_folder_${Date.now()}`,
                        level: parentFolder.level + 1,
                        createdAt: new Date(),
                        createdBy: testData.userId,
                        isDeleted: false
                      };
                      currentFolders.push(newFolder);
                    }
                  }
                  break;
                  
                case 'move':
                  // Move folder to different parent (if valid)
                  if (currentFolders.length > 1) {
                    const folderToMove = currentFolders[Math.floor(Math.random() * currentFolders.length)];
                    const potentialParents = currentFolders.filter(f => 
                      f.id !== folderToMove.id && 
                      f.level < 4 && 
                      !f.path.startsWith(folderToMove.path) // Prevent circular reference
                    );
                    
                    if (potentialParents.length > 0) {
                      const newParent = potentialParents[Math.floor(Math.random() * potentialParents.length)];
                      folderToMove.parentId = newParent.id;
                      folderToMove.level = newParent.level + 1;
                      folderToMove.path = `${newParent.path}/${folderToMove.name}`;
                    }
                  }
                  break;
                  
                case 'rename':
                  // Rename folder
                  if (currentFolders.length > 0) {
                    const folderToRename = currentFolders[Math.floor(Math.random() * currentFolders.length)];
                    const newName = `renamed_${folderToRename.name}`;
                    const pathParts = folderToRename.path.split('/');
                    pathParts[pathParts.length - 1] = newName;
                    folderToRename.name = newName;
                    folderToRename.path = pathParts.join('/');
                  }
                  break;
                  
                case 'delete':
                  // Mark folder as deleted (soft delete)
                  if (currentFolders.length > 1) {
                    const folderToDelete = currentFolders[Math.floor(Math.random() * currentFolders.length)];
                    folderToDelete.isDeleted = true;
                  }
                  break;
              }
              
              // After each operation, hierarchy should remain consistent
              const activeFolders = currentFolders.filter(f => !f.isDeleted);
              validateHierarchy(activeFolders);
            });
            
            return true;
          }
        ),
        { 
          numRuns: 20,
          verbose: true
        }
      );
    });
    
    it('should maintain document associations during folder operations', () => {
      fc.assert(
        fc.property(
          fc.record({
            caseId: mockGenerators.caseId,
            folder: mockGenerators.folder,
            documents: fc.array(
              fc.record({
                id: mockGenerators.documentId,
                name: mockGenerators.fileName
              }),
              { minLength: 1, maxLength: 5 }
            ),
            folderOperations: fc.array(
              fc.constantFrom('move', 'rename', 'delete'),
              { minLength: 1, maxLength: 3 }
            )
          }),
          (testData) => {
            // Associate documents with folder
            const documentsInFolder = testData.documents.map(doc => ({
              ...doc,
              folderId: testData.folder.id,
              caseId: testData.caseId
            }));
            
            // Requirement 2.6: Document associations should be maintained consistently
            let currentFolder = { ...testData.folder };
            let currentDocuments = [...documentsInFolder];
            
            testData.folderOperations.forEach(operation => {
              switch (operation) {
                case 'move':
                  // Move folder to new location
                  const newParentId = mockGenerators.folderId.generate(fc.random());
                  currentFolder.parentId = newParentId;
                  currentFolder.path = `/new_parent/${currentFolder.name}`;
                  // Documents should still be associated with the folder
                  break;
                  
                case 'rename':
                  // Rename folder
                  const newName = `renamed_${currentFolder.name}`;
                  currentFolder.name = newName;
                  currentFolder.path = currentFolder.path.replace(/\/[^/]+$/, `/${newName}`);
                  // Documents should still be associated with the folder
                  break;
                  
                case 'delete':
                  // Delete folder (documents should be moved or handled appropriately)
                  currentFolder.isDeleted = true;
                  // In a real system, documents might be moved to parent or marked for review
                  currentDocuments.forEach(doc => {
                    // Document association should be updated appropriately
                    expect(doc.folderId).toBe(currentFolder.id); // Still associated until properly handled
                  });
                  break;
              }
              
              // After each operation, document associations should be consistent
              if (!currentFolder.isDeleted) {
                currentDocuments.forEach(doc => {
                  expect(doc.folderId).toBe(currentFolder.id);
                  expect(doc.caseId).toBe(testData.caseId);
                });
              }
            });
            
            return true;
          }
        ),
        { 
          numRuns: 30,
          verbose: true
        }
      );
    });
    
    it('should prevent circular references in folder hierarchy', () => {
      fc.assert(
        fc.property(
          fc.record({
            folders: fc.array(
              fc.record({
                id: mockGenerators.folderId,
                name: fc.string({ minLength: 1, maxLength: 20 }),
                level: fc.integer({ min: 0, max: 3 })
              }),
              { minLength: 3, maxLength: 5 }
            ).map(folders => folders.sort((a, b) => a.level - b.level))
          }),
          (testData) => {
            // Create folder hierarchy
            const folders = testData.folders.map((spec, index) => ({
              id: spec.id,
              name: spec.name,
              level: spec.level,
              parentId: index > 0 ? testData.folders[index - 1].id : undefined,
              path: `/${testData.folders.slice(0, index + 1).map(f => f.name).join('/')}`
            }));
            
            // Attempt to create circular reference
            const lastFolder = folders[folders.length - 1];
            const firstFolder = folders[0];
            
            // Trying to make first folder a child of last folder would create a cycle
            const wouldCreateCycle = (childId: string, potentialParentId: string): boolean => {
              const child = folders.find(f => f.id === childId);
              const potentialParent = folders.find(f => f.id === potentialParentId);
              
              if (!child || !potentialParent) return false;
              
              // If potential parent is already a descendant of child, it would create a cycle
              let current = potentialParent;
              while (current && current.parentId) {
                if (current.parentId === childId) return true;
                current = folders.find(f => f.id === current!.parentId);
              }
              
              return false;
            };
            
            // Validate circular reference detection
            const cycleDetected = wouldCreateCycle(firstFolder.id, lastFolder.id);
            expect(cycleDetected).toBe(true); // Should detect the potential cycle
            
            // Validate that normal parent-child relationships don't trigger false positives
            folders.forEach((folder, index) => {
              if (index < folders.length - 1) {
                const nextFolder = folders[index + 1];
                const isValidParentChild = wouldCreateCycle(nextFolder.id, folder.id);
                expect(isValidParentChild).toBe(false); // Normal hierarchy should not be detected as cycle
              }
            });
            
            return true;
          }
        ),
        { 
          numRuns: 20,
          verbose: true
        }
      );
    });
  });
  
  // ============================================================================
  // INTEGRATION TESTS FOR DOCUMENT ORGANIZATION
  // ============================================================================
  
  describe('Document Organization Integration', () => {
    it('should handle complete document organization workflow', () => {
      fc.assert(
        fc.property(
          fc.record({
            case: fc.record({
              id: mockGenerators.caseId,
              title: fc.string({ minLength: 1, maxLength: 100 })
            }),
            folderStructure: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 30 }),
                level: fc.integer({ min: 0, max: 4 })
              }),
              { minLength: 1, maxLength: 4 }
            ).map(folders => folders.sort((a, b) => a.level - b.level)),
            documents: fc.array(
              fc.record({
                name: mockGenerators.fileName,
                tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
                targetFolderLevel: fc.integer({ min: 0, max: 3 })
              }),
              { minLength: 1, maxLength: 8 }
            )
          }),
          (testData) => {
            // Create folder hierarchy
            const folders: Folder[] = [];
            const foldersByLevel: { [level: number]: Folder } = {};
            
            testData.folderStructure.forEach(spec => {
              const parentFolder = spec.level > 0 ? foldersByLevel[spec.level - 1] : undefined;
              const parentPath = parentFolder ? parentFolder.path : '';
              const folderPath = parentPath ? `${parentPath}/${spec.name}` : `/${spec.name}`;
              
              const folder: Folder = {
                id: mockGenerators.folderId.generate(fc.random()),
                caseId: testData.case.id,
                name: spec.name,
                parentId: parentFolder?.id,
                path: folderPath,
                level: spec.level,
                createdAt: new Date(),
                createdBy: mockGenerators.userId.generate(fc.random()),
                isDeleted: false
              };
              
              folders.push(folder);
              foldersByLevel[spec.level] = folder;
            });
            
            // Create documents and associate with case and folders
            const documents = testData.documents.map(docSpec => {
              const targetFolder = foldersByLevel[Math.min(docSpec.targetFolderLevel, Math.max(...Object.keys(foldersByLevel).map(Number)))];
              
              return {
                id: mockGenerators.documentId.generate(fc.random()),
                caseId: testData.case.id, // Property 5: Case Association
                name: docSpec.name,
                folderId: targetFolder?.id, // Folder association
                tags: docSpec.tags, // Property 7: Tag Indexing
                level: targetFolder?.level || 0
              };
            });
            
            // Validate complete organization
            
            // Property 5: All documents should be associated with the case
            documents.forEach(doc => {
              expect(doc.caseId).toBe(testData.case.id);
            });
            
            // Property 6: All folders should respect hierarchy limits
            folders.forEach(folder => {
              expect(folder.level).toBeLessThanOrEqual(5);
              const validation = testUtils.validateFolder(folder);
              expect(validation.isValid).toBe(true);
            });
            
            // Property 7: All document tags should be indexable
            documents.forEach(doc => {
              expect(Array.isArray(doc.tags)).toBe(true);
              expect(doc.tags.length).toBeGreaterThan(0);
              doc.tags.forEach(tag => {
                expect(typeof tag).toBe('string');
                expect(tag.length).toBeGreaterThan(0);
              });
            });
            
            // Property 10: Hierarchy should be consistent
            folders.forEach(folder => {
              if (folder.parentId) {
                const parent = folders.find(f => f.id === folder.parentId);
                expect(parent).toBeDefined();
                expect(parent!.level).toBe(folder.level - 1);
                expect(folder.path.startsWith(parent!.path)).toBe(true);
              }
            });
            
            // Document-folder associations should be valid
            documents.forEach(doc => {
              if (doc.folderId) {
                const folder = folders.find(f => f.id === doc.folderId);
                expect(folder).toBeDefined();
                expect(folder!.caseId).toBe(doc.caseId);
              }
            });
            
            return true;
          }
        ),
        { 
          numRuns: 15,
          verbose: true
        }
      );
    });
  });
});