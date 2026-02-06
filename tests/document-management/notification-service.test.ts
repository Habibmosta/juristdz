/**
 * Tests for Notification Service
 * 
 * Tests notification system integration with access grant notifications,
 * sharing and collaboration alerts, and notification preferences and delivery.
 * 
 * Requirements: 5.4
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { notificationService, NotificationService } from '../../src/document-management/services/notificationService';
import { supabaseService } from '../../src/document-management/services/supabaseService';
import { 
  NotificationType, 
  NotificationPriority, 
  NotificationChannel, 
  NotificationStatus,
  NotificationFrequency,
  DeliveryStatus
} from '../../src/document-management/services/notificationService';
import { Permission } from '../../src/document-management/types';

// Mock the supabase service
jest.mock('../../src/document-management/services/supabaseService');
const mockSupabaseService = supabaseService as jest.Mocked<typeof supabaseService>;

describe('NotificationService', () => {
  const mockUserId = 'user-123';
  const mockDocumentId = 'doc-456';
  const mockDocumentName = 'Test Document';
  const mockNotificationId = 'notification-789';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful responses
    mockSupabaseService.insert.mockResolvedValue({
      success: true,
      data: { id: 'new-id' }
    });

    mockSupabaseService.update.mockResolvedValue({
      success: true,
      data: { id: 'updated-id' }
    });

    mockSupabaseService.findById.mockResolvedValue({
      success: true,
      data: { id: 'found-id' }
    });

    mockSupabaseService.query.mockResolvedValue({
      success: true,
      data: [],
      count: 0
    });

    mockSupabaseService.createAuditEntry.mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createNotification', () => {
    it('should successfully create and send immediate notification', async () => {
      const notificationData = {
        id: mockNotificationId,
        user_id: mockUserId,
        type: NotificationType.DOCUMENT_SHARED,
        title: 'Document Shared',
        message: 'Test document has been shared with you',
        data: { documentId: mockDocumentId },
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        status: NotificationStatus.PENDING,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        retry_count: 0,
        max_retries: 3
      };

      // Mock user preferences (no preferences found, will use defaults)
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      // Mock notification creation
      mockSupabaseService.insert.mockResolvedValueOnce({
        success: true,
        data: notificationData
      });

      // Mock delivery creation and updates for sending
      mockSupabaseService.insert.mockResolvedValue({
        success: true,
        data: { id: 'delivery-123' }
      });

      const result = await notificationService.createNotification({
        userId: mockUserId,
        type: NotificationType.DOCUMENT_SHARED,
        title: 'Document Shared',
        message: 'Test document has been shared with you',
        data: { documentId: mockDocumentId },
        priority: NotificationPriority.NORMAL
      });

      expect(result.success).toBe(true);
      expect(result.notification).toBeDefined();
      expect(result.notification?.type).toBe(NotificationType.DOCUMENT_SHARED);

      // Verify notification was created
      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          user_id: mockUserId,
          type: NotificationType.DOCUMENT_SHARED,
          title: 'Document Shared',
          message: 'Test document has been shared with you',
          priority: NotificationPriority.NORMAL
        })
      );

      // Verify audit entry was created
      expect(mockSupabaseService.createAuditEntry).toHaveBeenCalledWith(
        'notification',
        mockNotificationId,
        'create',
        expect.any(Object),
        'system'
      );
    });

    it('should create scheduled notification without immediate sending', async () => {
      const scheduledAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      const notificationData = {
        id: mockNotificationId,
        user_id: mockUserId,
        type: NotificationType.SYSTEM_MAINTENANCE,
        title: 'Scheduled Maintenance',
        message: 'System maintenance scheduled',
        data: {},
        priority: NotificationPriority.NORMAL,
        channels: [NotificationChannel.EMAIL],
        status: NotificationStatus.SCHEDULED,
        created_at: new Date().toISOString(),
        scheduled_at: scheduledAt.toISOString(),
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        retry_count: 0,
        max_retries: 3
      };

      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      mockSupabaseService.insert.mockResolvedValueOnce({
        success: true,
        data: notificationData
      });

      const result = await notificationService.createNotification({
        userId: mockUserId,
        type: NotificationType.SYSTEM_MAINTENANCE,
        title: 'Scheduled Maintenance',
        message: 'System maintenance scheduled',
        data: {},
        scheduledAt
      });

      expect(result.success).toBe(true);
      expect(result.notification?.status).toBe(NotificationStatus.SCHEDULED);

      // Verify notification was created with scheduled status
      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          status: NotificationStatus.SCHEDULED,
          scheduled_at: scheduledAt.toISOString()
        })
      );
    });

    it('should respect user preferences and skip disabled notification types', async () => {
      // Mock user preferences with document sharing disabled
      const userPreferences = {
        id: 'prefs-123',
        user_id: mockUserId,
        email_enabled: true,
        push_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        preferences: {
          [NotificationType.DOCUMENT_SHARED]: {
            enabled: false,
            channels: [NotificationChannel.EMAIL],
            frequency: NotificationFrequency.IMMEDIATE
          }
        },
        language: 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [userPreferences],
        count: 1
      });

      const result = await notificationService.createNotification({
        userId: mockUserId,
        type: NotificationType.DOCUMENT_SHARED,
        title: 'Document Shared',
        message: 'Test document has been shared with you',
        data: { documentId: mockDocumentId }
      });

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Notification type disabled by user preferences');

      // Verify no notification was created
      expect(mockSupabaseService.insert).not.toHaveBeenCalledWith('notifications', expect.any(Object));
    });

    it('should handle notification creation failure', async () => {
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      mockSupabaseService.insert.mockResolvedValueOnce({
        success: false,
        error: { message: 'Database error' }
      });

      const result = await notificationService.createNotification({
        userId: mockUserId,
        type: NotificationType.DOCUMENT_SHARED,
        title: 'Document Shared',
        message: 'Test document has been shared with you',
        data: { documentId: mockDocumentId }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create notification');
    });
  });

  describe('sendNotification', () => {
    const mockNotification = {
      id: mockNotificationId,
      user_id: mockUserId,
      type: NotificationType.DOCUMENT_SHARED,
      title: 'Document Shared',
      message: 'Test message',
      data: { documentId: mockDocumentId },
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      status: NotificationStatus.PENDING,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      retry_count: 0,
      max_retries: 3
    };

    it('should successfully send notification through all channels', async () => {
      mockSupabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: mockNotification
      });

      // Mock delivery creation for each channel
      mockSupabaseService.insert.mockResolvedValue({
        success: true,
        data: { id: 'delivery-123' }
      });

      const result = await notificationService.sendNotification(mockNotificationId);

      expect(result.success).toBe(true);

      // Verify notification status was updated to sending then sent
      expect(mockSupabaseService.update).toHaveBeenCalledWith(
        'notifications',
        mockNotificationId,
        expect.objectContaining({
          status: NotificationStatus.SENDING
        })
      );

      expect(mockSupabaseService.update).toHaveBeenCalledWith(
        'notifications',
        mockNotificationId,
        expect.objectContaining({
          status: NotificationStatus.SENT,
          sent_at: expect.any(String)
        })
      );

      // Verify delivery records were created for each channel
      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'notification_deliveries',
        expect.objectContaining({
          notification_id: mockNotificationId,
          channel: NotificationChannel.IN_APP
        })
      );

      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'notification_deliveries',
        expect.objectContaining({
          notification_id: mockNotificationId,
          channel: NotificationChannel.EMAIL
        })
      );
    });

    it('should fail when notification not found', async () => {
      mockSupabaseService.findById.mockResolvedValueOnce({
        success: false,
        data: null
      });

      const result = await notificationService.sendNotification('nonexistent-notification');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Notification not found');
    });

    it('should fail when notification has expired', async () => {
      const expiredNotification = {
        ...mockNotification,
        expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      };

      mockSupabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: expiredNotification
      });

      const result = await notificationService.sendNotification(mockNotificationId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Notification has expired');

      // Verify notification was marked as expired
      expect(mockSupabaseService.update).toHaveBeenCalledWith(
        'notifications',
        mockNotificationId,
        expect.objectContaining({
          status: NotificationStatus.EXPIRED
        })
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should retrieve user notifications with filters', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: mockUserId,
          type: NotificationType.DOCUMENT_SHARED,
          title: 'Document Shared',
          message: 'Test message 1',
          data: {},
          priority: NotificationPriority.NORMAL,
          channels: [NotificationChannel.IN_APP],
          status: NotificationStatus.SENT,
          created_at: new Date().toISOString(),
          retry_count: 0,
          max_retries: 3
        },
        {
          id: 'notif-2',
          user_id: mockUserId,
          type: NotificationType.PERMISSION_GRANTED,
          title: 'Permission Granted',
          message: 'Test message 2',
          data: {},
          priority: NotificationPriority.HIGH,
          channels: [NotificationChannel.EMAIL],
          status: NotificationStatus.READ,
          created_at: new Date().toISOString(),
          read_at: new Date().toISOString(),
          retry_count: 0,
          max_retries: 3
        }
      ];

      // Mock notifications query
      mockSupabaseService.query
        .mockResolvedValueOnce({
          success: true,
          data: mockNotifications,
          count: 2
        })
        // Mock unread count query
        .mockResolvedValueOnce({
          success: true,
          data: [],
          count: 1
        });

      const result = await notificationService.getUserNotifications(mockUserId, {
        type: NotificationType.DOCUMENT_SHARED,
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(result.notifications).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.unreadCount).toBe(1);

      // Verify query was called with correct filters
      expect(mockSupabaseService.query).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          filters: expect.objectContaining({
            user_id: mockUserId,
            type: NotificationType.DOCUMENT_SHARED
          }),
          limit: 10,
          sortBy: 'created_at',
          sortOrder: 'desc'
        })
      );
    });

    it('should retrieve only unread notifications when requested', async () => {
      mockSupabaseService.query
        .mockResolvedValueOnce({
          success: true,
          data: [],
          count: 0
        })
        .mockResolvedValueOnce({
          success: true,
          data: [],
          count: 0
        });

      const result = await notificationService.getUserNotifications(mockUserId, {
        unreadOnly: true
      });

      expect(result.success).toBe(true);

      // Verify query included unread filter
      expect(mockSupabaseService.query).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          filters: expect.objectContaining({
            user_id: mockUserId,
            read_at: null
          })
        })
      );
    });

    it('should handle date range filtering', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-12-31');

      mockSupabaseService.query
        .mockResolvedValueOnce({
          success: true,
          data: [],
          count: 0
        })
        .mockResolvedValueOnce({
          success: true,
          data: [],
          count: 0
        });

      const result = await notificationService.getUserNotifications(mockUserId, {
        dateRange: { from: fromDate, to: toDate }
      });

      expect(result.success).toBe(true);

      // Verify date range filter was applied
      expect(mockSupabaseService.query).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          filters: expect.objectContaining({
            user_id: mockUserId,
            created_at: {
              gte: fromDate.toISOString(),
              lte: toDate.toISOString()
            }
          })
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('should successfully mark notification as read', async () => {
      const notificationData = {
        id: mockNotificationId,
        user_id: mockUserId,
        status: NotificationStatus.SENT
      };

      mockSupabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: notificationData
      });

      const result = await notificationService.markAsRead(mockNotificationId, mockUserId);

      expect(result.success).toBe(true);

      // Verify notification was updated
      expect(mockSupabaseService.update).toHaveBeenCalledWith(
        'notifications',
        mockNotificationId,
        expect.objectContaining({
          status: NotificationStatus.READ,
          read_at: expect.any(String)
        })
      );
    });

    it('should fail when notification belongs to another user', async () => {
      const notificationData = {
        id: mockNotificationId,
        user_id: 'other-user',
        status: NotificationStatus.SENT
      };

      mockSupabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: notificationData
      });

      const result = await notificationService.markAsRead(mockNotificationId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied: notification belongs to another user');
    });

    it('should fail when notification not found', async () => {
      mockSupabaseService.findById.mockResolvedValueOnce({
        success: false,
        data: null
      });

      const result = await notificationService.markAsRead('nonexistent-notification', mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const result = await notificationService.markAllAsRead(mockUserId);

      expect(result.success).toBe(true);

      // Verify bulk update was performed
      expect(mockSupabaseService.query).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          filters: {
            user_id: mockUserId,
            read_at: null
          },
          update: expect.objectContaining({
            status: NotificationStatus.READ,
            read_at: expect.any(String)
          })
        })
      );
    });
  });

  describe('getUserPreferences', () => {
    it('should retrieve existing user preferences', async () => {
      const preferencesData = {
        id: 'prefs-123',
        user_id: mockUserId,
        email_enabled: true,
        push_enabled: false,
        sms_enabled: false,
        in_app_enabled: true,
        preferences: {
          [NotificationType.DOCUMENT_SHARED]: {
            enabled: true,
            channels: [NotificationChannel.EMAIL],
            frequency: NotificationFrequency.IMMEDIATE
          }
        },
        language: 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [preferencesData],
        count: 1
      });

      const result = await notificationService.getUserPreferences(mockUserId);

      expect(result.success).toBe(true);
      expect(result.preferences).toBeDefined();
      expect(result.preferences?.emailEnabled).toBe(true);
      expect(result.preferences?.pushEnabled).toBe(false);
    });

    it('should create default preferences when none exist', async () => {
      // Mock no existing preferences
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      // Mock successful creation of default preferences
      const defaultPreferencesData = {
        id: 'prefs-new',
        user_id: mockUserId,
        email_enabled: true,
        push_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        preferences: {},
        language: 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabaseService.insert.mockResolvedValueOnce({
        success: true,
        data: defaultPreferencesData
      });

      const result = await notificationService.getUserPreferences(mockUserId);

      expect(result.success).toBe(true);
      expect(result.preferences).toBeDefined();

      // Verify default preferences were created
      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'notification_preferences',
        expect.objectContaining({
          user_id: mockUserId,
          email_enabled: true,
          push_enabled: true,
          sms_enabled: false,
          in_app_enabled: true
        })
      );
    });
  });

  describe('updateUserPreferences', () => {
    it('should update existing preferences', async () => {
      // Mock existing preferences
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{ id: 'prefs-123', user_id: mockUserId }],
        count: 1
      });

      const updatedPreferencesData = {
        id: 'prefs-123',
        user_id: mockUserId,
        email_enabled: false,
        push_enabled: true,
        sms_enabled: true,
        in_app_enabled: true,
        preferences: {},
        language: 'ar',
        updated_at: new Date().toISOString()
      };

      mockSupabaseService.update.mockResolvedValueOnce({
        success: true,
        data: updatedPreferencesData
      });

      const result = await notificationService.updateUserPreferences(mockUserId, {
        emailEnabled: false,
        smsEnabled: true,
        language: 'ar'
      });

      expect(result.success).toBe(true);
      expect(result.preferences?.emailEnabled).toBe(false);
      expect(result.preferences?.smsEnabled).toBe(true);
      expect(result.preferences?.language).toBe('ar');

      // Verify update was called
      expect(mockSupabaseService.update).toHaveBeenCalledWith(
        'notification_preferences',
        'prefs-123',
        expect.objectContaining({
          email_enabled: false,
          sms_enabled: true,
          language: 'ar'
        })
      );
    });

    it('should create new preferences when none exist', async () => {
      // Mock no existing preferences
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      const newPreferencesData = {
        id: 'prefs-new',
        user_id: mockUserId,
        email_enabled: true,
        push_enabled: false,
        sms_enabled: false,
        in_app_enabled: true,
        preferences: {},
        language: 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabaseService.insert.mockResolvedValueOnce({
        success: true,
        data: newPreferencesData
      });

      const result = await notificationService.updateUserPreferences(mockUserId, {
        pushEnabled: false
      });

      expect(result.success).toBe(true);

      // Verify insert was called
      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'notification_preferences',
        expect.objectContaining({
          user_id: mockUserId,
          push_enabled: false,
          created_at: expect.any(String)
        })
      );
    });
  });

  describe('notification helpers', () => {
    it('should send document shared notification', async () => {
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      mockSupabaseService.insert.mockResolvedValueOnce({
        success: true,
        data: { id: mockNotificationId }
      });

      const result = await notificationService.notifyDocumentShared(
        mockUserId,
        mockDocumentId,
        mockDocumentName,
        [Permission.VIEW, Permission.EDIT],
        'sharer-user',
        'Please review this document'
      );

      expect(result.success).toBe(true);

      // Verify notification was created with correct data
      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          type: NotificationType.DOCUMENT_SHARED,
          title: 'Document Shared',
          data: expect.objectContaining({
            documentId: mockDocumentId,
            documentName: mockDocumentName,
            permissions: [Permission.VIEW, Permission.EDIT],
            userId: 'sharer-user'
          })
        })
      );
    });

    it('should send permission granted notification', async () => {
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      mockSupabaseService.insert.mockResolvedValueOnce({
        success: true,
        data: { id: mockNotificationId }
      });

      const result = await notificationService.notifyPermissionGranted(
        mockUserId,
        mockDocumentId,
        mockDocumentName,
        [Permission.EDIT],
        'granter-user'
      );

      expect(result.success).toBe(true);

      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          type: NotificationType.PERMISSION_GRANTED,
          title: 'Document Access Granted',
          message: expect.stringContaining('edit permissions')
        })
      );
    });

    it('should send comment notification', async () => {
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      mockSupabaseService.insert.mockResolvedValueOnce({
        success: true,
        data: { id: mockNotificationId }
      });

      const result = await notificationService.notifyDocumentCommented(
        mockUserId,
        mockDocumentId,
        mockDocumentName,
        'comment-123',
        'commenter-user',
        'This is a test comment'
      );

      expect(result.success).toBe(true);

      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          type: NotificationType.DOCUMENT_COMMENTED,
          title: 'New Comment',
          message: expect.stringContaining('commenter-user commented'),
          data: expect.objectContaining({
            commentId: 'comment-123'
          })
        })
      );
    });

    it('should send concurrent edit conflict notification', async () => {
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      mockSupabaseService.insert.mockResolvedValueOnce({
        success: true,
        data: { id: mockNotificationId }
      });

      const result = await notificationService.notifyConcurrentEditConflict(
        mockUserId,
        mockDocumentId,
        mockDocumentName,
        'Multiple users editing same section'
      );

      expect(result.success).toBe(true);

      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          type: NotificationType.CONCURRENT_EDIT_CONFLICT,
          title: 'Edit Conflict Detected',
          priority: NotificationPriority.HIGH,
          message: expect.stringContaining('conflict was detected')
        })
      );
    });
  });

  describe('processScheduledNotifications', () => {
    it('should process scheduled notifications', async () => {
      const scheduledNotifications = [
        {
          id: 'scheduled-1',
          user_id: mockUserId,
          type: NotificationType.SYSTEM_MAINTENANCE,
          status: NotificationStatus.SCHEDULED,
          scheduled_at: new Date(Date.now() - 60 * 1000).toISOString() // 1 minute ago
        },
        {
          id: 'scheduled-2',
          user_id: 'user-456',
          type: NotificationType.DOCUMENT_SHARED,
          status: NotificationStatus.SCHEDULED,
          scheduled_at: new Date(Date.now() - 30 * 1000).toISOString() // 30 seconds ago
        }
      ];

      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: scheduledNotifications,
        count: 2
      });

      // Mock successful sending for each notification
      mockSupabaseService.findById.mockResolvedValue({
        success: true,
        data: {
          id: 'scheduled-1',
          channels: [NotificationChannel.EMAIL],
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }
      });

      const result = await notificationService.processScheduledNotifications();

      expect(result.success).toBe(true);
      expect(result.warnings?.[0]).toContain('Processed 2 scheduled notifications');

      // Verify scheduled notifications query
      expect(mockSupabaseService.query).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          filters: expect.objectContaining({
            status: NotificationStatus.SCHEDULED,
            scheduled_at: expect.objectContaining({
              lte: expect.any(String)
            })
          })
        })
      );
    });

    it('should handle no scheduled notifications', async () => {
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      const result = await notificationService.processScheduledNotifications();

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('No scheduled notifications to process');
    });
  });

  describe('cleanupExpiredNotifications', () => {
    it('should cleanup expired and old notifications', async () => {
      const result = await notificationService.cleanupExpiredNotifications();

      expect(result.success).toBe(true);

      // Verify expired notifications were marked
      expect(mockSupabaseService.query).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          filters: expect.objectContaining({
            status: { in: [NotificationStatus.PENDING, NotificationStatus.SCHEDULED] },
            expires_at: expect.objectContaining({
              lt: expect.any(String)
            })
          }),
          update: expect.objectContaining({
            status: NotificationStatus.EXPIRED
          })
        })
      );

      // Verify old notifications were deleted
      expect(mockSupabaseService.query).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          filters: expect.objectContaining({
            created_at: expect.objectContaining({
              lt: expect.any(String)
            })
          }),
          delete: true
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabaseService.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await notificationService.createNotification({
        userId: mockUserId,
        type: NotificationType.DOCUMENT_SHARED,
        title: 'Test',
        message: 'Test message',
        data: {}
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create notification');
    });

    it('should handle notification sending failures', async () => {
      const mockNotification = {
        id: mockNotificationId,
        user_id: mockUserId,
        channels: [NotificationChannel.EMAIL],
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };

      mockSupabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: mockNotification
      });

      // Mock delivery creation failure
      mockSupabaseService.insert.mockRejectedValueOnce(new Error('Delivery creation failed'));

      const result = await notificationService.sendNotification(mockNotificationId);

      expect(result.success).toBe(false);
      expect(result.warnings).toBeDefined();
    });
  });
});