import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { notificationService } from '@/services/notificationService';
import { db } from '@/database/connection';
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  CreateNotificationRequest,
  UpdateNotificationPreferencesRequest,
  DeadlineReminderConfig,
  TemplateContext
} from '@/types/notification';

// Mock database
jest.mock('@/database/connection');
const mockDb = db as jest.Mocked<typeof db>;

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('NotificationService', () => {
  const mockUserId = 'user-123';
  const mockCaseId = 'case-456';
  const mockDeadlineId = 'deadline-789';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notificationData: CreateNotificationRequest = {
        recipientId: mockUserId,
        type: NotificationType.DEADLINE_REMINDER,
        channel: NotificationChannel.EMAIL,
        subject: 'Test Notification',
        message: 'This is a test notification',
        caseId: mockCaseId,
        priority: NotificationPriority.HIGH
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await notificationService.createNotification(notificationData);

      expect(result).toBeDefined();
      expect(result.recipientId).toBe(mockUserId);
      expect(result.type).toBe(NotificationType.DEADLINE_REMINDER);
      expect(result.channel).toBe(NotificationChannel.EMAIL);
      expect(result.status).toBe(NotificationStatus.PENDING);
      expect(result.priority).toBe(NotificationPriority.HIGH);
      expect(mockDb.query).toHaveBeenCalledTimes(2); // Insert notification + log event
    });

    it('should handle notification creation errors', async () => {
      const notificationData: CreateNotificationRequest = {
        recipientId: mockUserId,
        type: NotificationType.CASE_UPDATE,
        channel: NotificationChannel.IN_APP,
        message: 'Test message'
      };

      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(notificationService.createNotification(notificationData))
        .rejects.toThrow('Failed to create notification');
    });
  });

  describe('createNotificationFromTemplate', () => {
    it('should create notification from template with context', async () => {
      const templateId = 'template-123';
      const context: TemplateContext = {
        user: {
          id: mockUserId,
          name: 'John Doe',
          email: 'john@example.com'
        },
        case: {
          id: mockCaseId,
          title: 'Test Case',
          caseNumber: 'CASE-001',
          status: 'open'
        },
        deadline: {
          id: mockDeadlineId,
          title: 'Filing Deadline',
          deadlineDate: new Date('2024-12-31'),
          priority: 'high',
          daysBefore: 7
        }
      };

      // Mock template retrieval
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{
            id: templateId,
            name: 'Deadline Reminder',
            type: NotificationType.DEADLINE_REMINDER,
            channel: NotificationChannel.EMAIL,
            subject_template: 'Rappel: {{deadline_title}} - {{case_title}}',
            body_template: 'Bonjour {{user_name}}, l\'échéance "{{deadline_title}}" pour l\'affaire "{{case_title}}" arrive dans {{days_before}} jour(s).',
            variables: '[]',
            trigger_conditions: '{}',
            is_system: true,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }]
        } as any)
        .mockResolvedValueOnce({ rows: [] } as any) // Insert notification
        .mockResolvedValueOnce({ rows: [] } as any); // Log event

      const result = await notificationService.createNotificationFromTemplate(
        templateId,
        mockUserId,
        context
      );

      expect(result).toBeDefined();
      expect(result.subject).toContain('Filing Deadline');
      expect(result.subject).toContain('Test Case');
      expect(result.message).toContain('John Doe');
      expect(result.message).toContain('7 jour(s)');
    });

    it('should handle template not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] } as any);

      await expect(notificationService.createNotificationFromTemplate(
        'nonexistent-template',
        mockUserId,
        {}
      )).rejects.toThrow('Template not found');
    });
  });

  describe('processPendingNotifications', () => {
    it('should process pending notifications successfully', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          recipient_id: mockUserId,
          type: NotificationType.DEADLINE_REMINDER,
          channel: NotificationChannel.EMAIL,
          subject: 'Test',
          message: 'Test message',
          status: NotificationStatus.PENDING,
          priority: NotificationPriority.NORMAL,
          scheduled_at: new Date(),
          retry_count: 0,
          max_retries: 3,
          metadata: '{}',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      // Mock pending notifications query
      mockDb.query
        .mockResolvedValueOnce({ rows: mockNotifications } as any)
        // Mock user preferences check (no preferences = allow)
        .mockResolvedValueOnce({ rows: [] } as any)
        // Mock notification status update
        .mockResolvedValueOnce({ rows: [] } as any)
        // Mock log event
        .mockResolvedValueOnce({ rows: [] } as any);

      const result = await notificationService.processPendingNotifications(10);

      expect(result).toBe(1);
      expect(mockDb.query).toHaveBeenCalledTimes(4);
    });

    it('should handle notification processing errors gracefully', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          recipient_id: mockUserId,
          type: NotificationType.DEADLINE_REMINDER,
          channel: NotificationChannel.EMAIL,
          subject: 'Test',
          message: 'Test message',
          status: NotificationStatus.PENDING,
          priority: NotificationPriority.NORMAL,
          scheduled_at: new Date(),
          retry_count: 0,
          max_retries: 3,
          metadata: '{}',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: mockNotifications } as any)
        .mockResolvedValueOnce({ rows: [] } as any) // User preferences
        .mockRejectedValueOnce(new Error('Send error')); // Simulate send failure

      const result = await notificationService.processPendingNotifications(10);

      expect(result).toBe(0); // No notifications processed successfully
    });
  });

  describe('generateDeadlineNotifications', () => {
    it('should generate deadline notifications using database function', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ generate_deadline_notifications: 5 }]
      } as any);

      const result = await notificationService.generateDeadlineNotifications();

      expect(result).toBe(5);
      expect(mockDb.query).toHaveBeenCalledWith('SELECT generate_deadline_notifications()');
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(notificationService.generateDeadlineNotifications())
        .rejects.toThrow('Failed to generate deadline notifications');
    });
  });

  describe('configureDeadlineReminders', () => {
    it('should configure deadline reminders successfully', async () => {
      const config: DeadlineReminderConfig = {
        deadlineId: mockDeadlineId,
        notificationDays: [7, 3, 1],
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH
      };

      const mockDeadline = {
        id: mockDeadlineId,
        title: 'Test Deadline',
        deadline_date: new Date('2024-12-31'),
        case_id: mockCaseId,
        assigned_to: mockUserId,
        created_by: mockUserId
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockDeadline] } as any)
        .mockResolvedValue({ rows: [] } as any); // For all notification creations

      await notificationService.configureDeadlineReminders(config);

      // Should create 6 notifications (3 days × 2 channels)
      expect(mockDb.query).toHaveBeenCalledTimes(13); // 1 deadline query + 6 notifications + 6 log events
    });

    it('should handle deadline not found', async () => {
      const config: DeadlineReminderConfig = {
        deadlineId: 'nonexistent',
        notificationDays: [7],
        channels: [NotificationChannel.EMAIL]
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] } as any);

      await expect(notificationService.configureDeadlineReminders(config))
        .rejects.toThrow('Deadline not found');
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences successfully', async () => {
      const updates: UpdateNotificationPreferencesRequest = {
        notificationType: NotificationType.DEADLINE_REMINDER,
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        businessHoursOnly: true,
        timezone: 'Africa/Algiers'
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await notificationService.updateNotificationPreferences(mockUserId, updates);

      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.notificationType).toBe(NotificationType.DEADLINE_REMINDER);
      expect(result.emailEnabled).toBe(true);
      expect(result.smsEnabled).toBe(false);
      expect(result.businessHoursOnly).toBe(true);
    });
  });

  describe('searchNotifications', () => {
    it('should search notifications with criteria', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          recipient_id: mockUserId,
          type: NotificationType.DEADLINE_REMINDER,
          channel: NotificationChannel.EMAIL,
          subject: 'Test',
          message: 'Test message',
          status: NotificationStatus.SENT,
          priority: NotificationPriority.NORMAL,
          scheduled_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          retry_count: 0,
          max_retries: 3,
          metadata: '{}'
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: mockNotifications } as any)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any);

      const result = await notificationService.searchNotifications({
        recipientId: mockUserId,
        type: NotificationType.DEADLINE_REMINDER,
        limit: 10
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.notifications[0].recipientId).toBe(mockUserId);
    });
  });

  describe('getNotificationStatistics', () => {
    it('should return notification statistics', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '10' }] } as any) // Total count
        .mockResolvedValueOnce({ rows: [{ status: 'sent', count: '8' }, { status: 'failed', count: '2' }] } as any) // By status
        .mockResolvedValueOnce({ rows: [{ type: 'deadline_reminder', count: '5' }] } as any) // By type
        .mockResolvedValueOnce({ rows: [{ channel: 'email', count: '7' }] } as any) // By channel
        .mockResolvedValueOnce({ rows: [] } as any); // Recent activity

      const result = await notificationService.getNotificationStatistics(mockUserId);

      expect(result.totalNotifications).toBe(10);
      expect(result.deliveryRate).toBe(80); // 8 sent out of 10 total
      expect(result.failureRate).toBe(20); // 2 failed out of 10 total
      expect(result.notificationsByStatus.sent).toBe(8);
      expect(result.notificationsByStatus.failed).toBe(2);
    });
  });

  describe('createBulkNotifications', () => {
    it('should create bulk notifications successfully', async () => {
      const bulkRequest = {
        recipientIds: ['user1', 'user2', 'user3'],
        type: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.IN_APP,
        message: 'System maintenance scheduled',
        priority: NotificationPriority.HIGH
      };

      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await notificationService.createBulkNotifications(bulkRequest);

      expect(result.successful).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
      expect(result.totalProcessed).toBe(3);
    });

    it('should handle partial failures in bulk notifications', async () => {
      const bulkRequest = {
        recipientIds: ['user1', 'user2'],
        type: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.EMAIL,
        message: 'Test message'
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [] } as any) // First user success
        .mockResolvedValueOnce({ rows: [] } as any) // Log event
        .mockRejectedValueOnce(new Error('Database error')); // Second user failure

      const result = await notificationService.createBulkNotifications(bulkRequest);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].recipientId).toBe('user2');
      expect(result.totalProcessed).toBe(2);
    });
  });

  describe('getUserNotificationPreferences', () => {
    it('should retrieve user notification preferences', async () => {
      const mockPreferences = [
        {
          id: 'pref-1',
          user_id: mockUserId,
          notification_type: NotificationType.DEADLINE_REMINDER,
          email_enabled: true,
          sms_enabled: false,
          in_app_enabled: true,
          push_enabled: false,
          business_hours_only: false,
          timezone: 'Africa/Algiers',
          immediate: true,
          daily_digest: false,
          weekly_digest: false,
          digest_time: '09:00:00',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockPreferences } as any);

      const result = await notificationService.getUserNotificationPreferences(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(mockUserId);
      expect(result[0].notificationType).toBe(NotificationType.DEADLINE_REMINDER);
      expect(result[0].emailEnabled).toBe(true);
      expect(result[0].smsEnabled).toBe(false);
    });
  });
});