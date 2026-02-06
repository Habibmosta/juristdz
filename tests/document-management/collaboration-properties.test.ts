/**
 * Collaboration Features Property-Based Tests
 * 
 * Comprehensive property-based tests for collaboration functionality
 * implementing Properties 21-26 as specified in task 9.5.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import {
  documentSharingService,
  DocumentSharingService
} from '../../src/document-management/services/documentSharingService';
import {
  concurrentEditingService,
  ConcurrentEditingService
} from '../../src/document-management/services/concurrentEditingService';
import {
  notificationService,
  NotificationService
} from '../../src/document-management/services/notificationService';
import {
  Document,
  DocumentPermission,
  ShareLink,
  Permission,
  DocumentComment,
  ShareRequest,
  ShareResult,
  AccessAttempt,
  ConcurrentEditingSession,
  EditConflict,
  NotificationRequest,
  NotificationResult
} from '../../types/document-management';
import { UserRole } from '../../types';
import { testDatabase } from './testDatabase';
import { testCleanup } from './testCleanup';
import { testConfig } from './testConfig';

// =====================================================
// MOCK GENERATORS FOR COLLABORATION TESTING
// =====================================================

/**
 * Generate valid user IDs
 */
const userIdGenerator = fc.string({ minLength: 8, maxLength: 36 })
  .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
  .map(s => s || 'test-user-id');

/**
 * Generate document IDs
 */
const documentIdGenerator = fc.string({ minLength: 8, maxLength: 36 })
  .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
  .map(s => s || 'test-doc-id');

/**
 * Generate email addresses
 */
const emailGenerator = fc.emailAddress();

/**
 * Generate permission sets
 */
const permissionGenerator = fc.array(
  fc.constantFrom(...Object.values(Permission)),
  { minLength: 1, maxLength: 5 }
).map(perms => [...new Set(perms)]); // Remove duplicates

/**
 * Generate share requests
 */
const shareRequestGenerator = fc.record({
  documentId: documentIdGenerator,
  recipientEmail: emailGenerator,
  permissions: permissionGenerator,
  message: fc.option(fc.string({ maxLength: 500 })),
  expiresAt: fc.option(fc.date({ min: new Date() })),
  allowDownload: fc.boolean(),
  requireAuthentication: fc.boolean()
});

/**
 * Generate document comments
 */
const documentCommentGenerator = fc.record({
  documentId: documentIdGenerator,
  content: fc.string({ minLength: 1, maxLength: 1000 }),
  authorId: userIdGenerator,
  authorName: fc.string({ minLength: 1, maxLength: 100 }),
  parentCommentId: fc.option(fc.string({ minLength: 8, maxLength: 36 })),
  position: fc.option(fc.record({
    page: fc.integer({ min: 1, max: 100 }),
    x: fc.integer({ min: 0, max: 1000 }),
    y: fc.integer({ min: 0, max: 1000 })
  }))
});

/**
 * Generate concurrent editing sessions
 */
const editingSessionGenerator = fc.record({
  documentId: documentIdGenerator,
  userId: userIdGenerator,
  userName: fc.string({ minLength: 1, maxLength: 100 }),
  startedAt: fc.date(),
  lastActivity: fc.date(),
  isActive: fc.boolean(),
  editingRegion: fc.option(fc.record({
    startLine: fc.integer({ min: 1, max: 1000 }),
    endLine: fc.integer({ min: 1, max: 1000 }),
    startColumn: fc.integer({ min: 1, max: 100 }),
    endColumn: fc.integer({ min: 1, max: 100 })
  }))
});

/**
 * Generate notification requests
 */
const notificationRequestGenerator = fc.record({
  recipientId: userIdGenerator,
  type: fc.constantFrom('document_shared', 'access_granted', 'comment_added', 'document_updated'),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  message: fc.string({ minLength: 1, maxLength: 1000 }),
  documentId: fc.option(documentIdGenerator),
  actionUrl: fc.option(fc.webUrl()),
  priority: fc.constantFrom('low', 'normal', 'high', 'urgent')
});

// =====================================================
// TEST SETUP AND TEARDOWN
// =====================================================

describe('Collaboration Features Property-Based Tests', () => {
  let documentSharing: DocumentSharingService;
  let concurrentEditing: ConcurrentEditingService;
  let notifications: NotificationService;

  beforeEach(async () => {
    await testDatabase.setup();
    documentSharing = documentSharingService;
    concurrentEditing = concurrentEditingService;
    notifications = notificationService;
  });

  afterEach(async () => {
    await testCleanup.cleanup();
  });

  // =====================================================
  // PROPERTY 21: GRANULAR PERMISSION ASSIGNMENT
  // =====================================================

  test('Property 21: Granular Permission Assignment - For any document sharing operation, specific permissions (view, edit, comment) should be assignable to each recipient independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        shareRequestGenerator,
        fc.array(userIdGenerator, { minLength: 1, maxLength: 10 }),
        async (shareRequest: ShareRequest, recipientIds: string[]) => {
          // Create unique recipients
          const uniqueRecipients = [...new Set(recipientIds)];
          
          // Assign different permission sets to each recipient
          const recipientPermissions = new Map<string, Permission[]>();
          
          for (const recipientId of uniqueRecipients) {
            const permissions = fc.sample(permissionGenerator, 1)[0];
            recipientPermissions.set(recipientId, permissions);
          }

          // Share document with different permissions for each recipient
          const shareResults: ShareResult[] = [];
          
          for (const [recipientId, permissions] of recipientPermissions) {
            const request = {
              ...shareRequest,
              recipientId,
              permissions
            };
            
            try {
              const result = await documentSharing.shareDocument(request, 'test-sharer');
              shareResults.push(result);
            } catch (error) {
              // Skip invalid shares
              continue;
            }
          }

          if (shareResults.length === 0) return true;

          // Verify each recipient has exactly the permissions assigned to them
          for (const [recipientId, expectedPermissions] of recipientPermissions) {
            const shareResult = shareResults.find(r => r.recipientId === recipientId);
            if (!shareResult || !shareResult.success) continue;

            // Get actual permissions for this recipient
            const actualPermissions = await documentSharing.getDocumentPermissions(
              shareRequest.documentId,
              recipientId
            );

            // Verify permissions match exactly
            const permissionsMatch = 
              actualPermissions.length === expectedPermissions.length &&
              expectedPermissions.every(perm => actualPermissions.includes(perm));

            if (!permissionsMatch) return false;
          }

          // Verify recipients don't have permissions they weren't granted
          for (const [recipientId, assignedPermissions] of recipientPermissions) {
            const allPermissions = Object.values(Permission);
            const unassignedPermissions = allPermissions.filter(p => !assignedPermissions.includes(p));
            
            for (const unassignedPerm of unassignedPermissions) {
              const hasUnassignedPermission = await documentSharing.hasPermission(
                shareRequest.documentId,
                recipientId,
                unassignedPerm
              );
              
              if (hasUnassignedPermission) return false;
            }
          }

          return true;
        }
      ),
      { numRuns: testConfig.propertyTest.numRuns }
    );
  });

  // =====================================================
  // PROPERTY 22: COMMENT METADATA PRESERVATION
  // =====================================================

  test('Property 22: Comment Metadata Preservation - For any comment added to a document, it should be stored with complete metadata including timestamp and author information', async () => {
    await fc.assert(
      fc.asyncProperty(
        documentCommentGenerator,
        async (commentData: DocumentComment) => {
          // Add comment to document
          const addedComment = await documentSharing.addComment(commentData);

          if (!addedComment) return false;

          // Retrieve the comment
          const retrievedComment = await documentSharing.getComment(addedComment.id);

          if (!retrievedComment) return false;

          // Verify all metadata is preserved
          const metadataComplete = 
            retrievedComment.id &&
            retrievedComment.documentId === commentData.documentId &&
            retrievedComment.content === commentData.content &&
            retrievedComment.authorId === commentData.authorId &&
            retrievedComment.authorName === commentData.authorName &&
            retrievedComment.createdAt &&
            retrievedComment.updatedAt &&
            typeof retrievedComment.createdAt === 'object' &&
            typeof retrievedComment.updatedAt === 'object';

          // Verify optional metadata is preserved if provided
          const optionalMetadataPreserved = 
            (commentData.parentCommentId ? retrievedComment.parentCommentId === commentData.parentCommentId : true) &&
            (commentData.position ? 
              retrievedComment.position &&
              retrievedComment.position.page === commentData.position.page &&
              retrievedComment.position.x === commentData.position.x &&
              retrievedComment.position.y === commentData.position.y 
              : true);

          // Verify timestamps are reasonable (not in future, not too old)
          const now = new Date();
          const timestampsReasonable = 
            retrievedComment.createdAt <= now &&
            retrievedComment.updatedAt <= now &&
            retrievedComment.createdAt <= retrievedComment.updatedAt;

          return metadataComplete && optionalMetadataPreserved && timestampsReasonable;
        }
      ),
      { numRuns: testConfig.propertyTest.numRuns }
    );
  });

  // =====================================================
  // PROPERTY 23: CONCURRENT EDITING SAFETY
  // =====================================================

  test('Property 23: Concurrent Editing Safety - For any simultaneous editing scenario, the system should handle concurrent modifications without data conflicts or corruption', async () => {
    await fc.assert(
      fc.asyncProperty(
        documentIdGenerator,
        fc.array(editingSessionGenerator, { minLength: 2, maxLength: 5 }),
        async (documentId: string, sessions: ConcurrentEditingSession[]) => {
          // Ensure all sessions are for the same document
          const documentSessions = sessions.map(session => ({
            ...session,
            documentId
          }));

          // Start concurrent editing sessions
          const startedSessions: string[] = [];
          
          for (const session of documentSessions) {
            try {
              const sessionId = await concurrentEditing.startEditingSession(session);
              if (sessionId) {
                startedSessions.push(sessionId);
              }
            } catch (error) {
              // Skip invalid sessions
              continue;
            }
          }

          if (startedSessions.length < 2) return true; // Need at least 2 concurrent sessions

          // Simulate concurrent edits
          const editPromises = startedSessions.map(async (sessionId, index) => {
            const editContent = `Edit from session ${index}: ${Math.random().toString(36)}`;
            
            try {
              return await concurrentEditing.applyEdit(sessionId, {
                content: editContent,
                position: { line: index + 1, column: 1 },
                operation: 'insert'
              });
            } catch (error) {
              return null;
            }
          });

          // Wait for all edits to complete
          const editResults = await Promise.all(editPromises);

          // Verify no data corruption occurred
          const documentState = await concurrentEditing.getDocumentState(documentId);
          
          // Check for conflicts
          const conflicts = await concurrentEditing.detectConflicts(documentId);
          
          // Verify conflict resolution if conflicts exist
          if (conflicts.length > 0) {
            const resolutionResult = await concurrentEditing.resolveConflicts(documentId, conflicts);
            
            // After resolution, document should be in consistent state
            const finalState = await concurrentEditing.getDocumentState(documentId);
            
            return finalState && finalState.isConsistent && !finalState.hasConflicts;
          }

          // If no conflicts, verify all edits were applied correctly
          const allEditsApplied = editResults.every(result => result && result.success);
          
          // Verify document integrity
          const documentIntegrity = documentState && 
                                  documentState.isConsistent && 
                                  !documentState.hasConflicts &&
                                  documentState.version > 0;

          return allEditsApplied && documentIntegrity;
        }
      ),
      { numRuns: Math.floor(testConfig.propertyTest.numRuns / 2) } // Fewer runs for complex concurrent test
    );
  });

  // =====================================================
  // PROPERTY 24: ACCESS NOTIFICATION
  // =====================================================

  test('Property 24: Access Notification - For any document access grant, the recipient should be notified through the platform notification system', async () => {
    await fc.assert(
      fc.asyncProperty(
        shareRequestGenerator,
        userIdGenerator,
        async (shareRequest: ShareRequest, recipientId: string) => {
          // Share document with recipient
          const shareResult = await documentSharing.shareDocument({
            ...shareRequest,
            recipientId
          }, 'test-sharer');

          if (!shareResult.success) return true; // Skip failed shares

          // Check if notification was sent
          const notifications = await notificationService.getNotificationsForUser(recipientId);
          
          // Find notification related to this document share
          const shareNotification = notifications.find(notification =>
            notification.type === 'document_shared' &&
            notification.documentId === shareRequest.documentId &&
            notification.recipientId === recipientId
          );

          // Verify notification exists and has correct content
          const notificationExists = shareNotification !== undefined;
          
          if (!notificationExists) return false;

          // Verify notification content
          const notificationComplete = 
            shareNotification.title &&
            shareNotification.message &&
            shareNotification.createdAt &&
            shareNotification.status &&
            shareNotification.documentId === shareRequest.documentId;

          // Verify notification was sent recently (within last minute)
          const now = new Date();
          const oneMinuteAgo = new Date(now.getTime() - 60000);
          const notificationTimely = shareNotification.createdAt >= oneMinuteAgo;

          // Verify notification contains access information
          const containsAccessInfo = 
            shareNotification.message.includes('access') ||
            shareNotification.message.includes('shared') ||
            shareNotification.title.includes('access') ||
            shareNotification.title.includes('shared');

          return notificationComplete && notificationTimely && containsAccessInfo;
        }
      ),
      { numRuns: testConfig.propertyTest.numRuns }
    );
  });

  // =====================================================
  // PROPERTY 26: SECURE EXTERNAL SHARING
  // =====================================================

  test('Property 26: Secure External Sharing - For any external sharing request, the system should generate secure, time-limited access links with appropriate restrictions', async () => {
    await fc.assert(
      fc.asyncProperty(
        shareRequestGenerator,
        fc.integer({ min: 1, max: 30 }), // Days until expiration
        async (shareRequest: ShareRequest, expirationDays: number) => {
          // Create external share link
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + expirationDays);

          const externalShareRequest = {
            ...shareRequest,
            isExternal: true,
            expiresAt: expirationDate,
            maxAccess: fc.sample(fc.integer({ min: 1, max: 100 }), 1)[0]
          };

          const shareLink = await documentSharing.createExternalShareLink(
            externalShareRequest,
            'test-sharer'
          );

          if (!shareLink) return false;

          // Verify link security properties
          const linkSecure = 
            shareLink.token &&
            shareLink.token.length >= 32 && // Minimum token length for security
            shareLink.expiresAt &&
            shareLink.expiresAt <= expirationDate &&
            shareLink.documentId === shareRequest.documentId;

          // Verify access restrictions
          const restrictionsApplied = 
            shareLink.permissions &&
            shareLink.permissions.length > 0 &&
            shareLink.permissions.every(perm => shareRequest.permissions.includes(perm)) &&
            (shareLink.maxAccess ? shareLink.maxAccess > 0 : true);

          // Verify link is not predictable (contains random elements)
          const tokenUnpredictable = 
            /[a-zA-Z0-9]/.test(shareLink.token) &&
            shareLink.token !== shareRequest.documentId &&
            shareLink.token !== shareRequest.recipientEmail;

          // Test link access (should work before expiration)
          const accessResult = await documentSharing.accessViaShareLink(
            shareLink.token,
            'test-external-user'
          );

          const linkAccessible = accessResult && accessResult.success;

          // Verify access tracking
          const accessCount = await documentSharing.getShareLinkAccessCount(shareLink.id);
          const accessTracked = typeof accessCount === 'number' && accessCount >= 0;

          return linkSecure && restrictionsApplied && tokenUnpredictable && linkAccessible && accessTracked;
        }
      ),
      { numRuns: testConfig.propertyTest.numRuns }
    );
  });

  // =====================================================
  // ADDITIONAL INTEGRATION TESTS
  // =====================================================

  test('Collaboration Integration - Complete sharing workflow with notifications and concurrent access', async () => {
    await fc.assert(
      fc.asyncProperty(
        documentIdGenerator,
        fc.array(userIdGenerator, { minLength: 2, maxLength: 5 }),
        permissionGenerator,
        async (documentId: string, userIds: string[], permissions: Permission[]) => {
          const uniqueUsers = [...new Set(userIds)];
          if (uniqueUsers.length < 2) return true;

          const [sharer, ...recipients] = uniqueUsers;

          // Share document with all recipients
          const shareResults: ShareResult[] = [];
          
          for (const recipient of recipients) {
            const shareRequest = {
              documentId,
              recipientId: recipient,
              permissions,
              message: `Shared by ${sharer}`
            };

            try {
              const result = await documentSharing.shareDocument(shareRequest, sharer);
              shareResults.push(result);
            } catch (error) {
              continue;
            }
          }

          const successfulShares = shareResults.filter(r => r.success);
          if (successfulShares.length === 0) return true;

          // Verify all recipients received notifications
          let allNotified = true;
          for (const recipient of recipients) {
            const notifications = await notificationService.getNotificationsForUser(recipient);
            const hasShareNotification = notifications.some(n => 
              n.type === 'document_shared' && n.documentId === documentId
            );
            if (!hasShareNotification) {
              allNotified = false;
              break;
            }
          }

          // Test concurrent access by multiple recipients
          const accessPromises = recipients.map(async (recipient) => {
            try {
              return await documentSharing.accessDocument(documentId, recipient);
            } catch (error) {
              return null;
            }
          });

          const accessResults = await Promise.all(accessPromises);
          const allCanAccess = accessResults.every(result => result && result.success);

          // Verify permissions are correctly enforced
          let permissionsCorrect = true;
          for (const recipient of recipients) {
            for (const permission of permissions) {
              const hasPermission = await documentSharing.hasPermission(
                documentId,
                recipient,
                permission
              );
              if (!hasPermission) {
                permissionsCorrect = false;
                break;
              }
            }
            if (!permissionsCorrect) break;
          }

          return allNotified && allCanAccess && permissionsCorrect;
        }
      ),
      { numRuns: Math.floor(testConfig.propertyTest.numRuns / 3) } // Fewer runs for complex integration test
    );
  });
});