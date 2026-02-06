/**
 * Document Management System - Notification Service
 * 
 * Provides notification system integration with access grant notifications,
 * sharing and collaboration alerts, and notification preferences and delivery.
 * 
 * Requirements: 5.4
 */

import { supabaseService } from './supabaseService';
import type { 
  Permission,
  Document
} from '../../../types/document-management';

// Notification interfaces
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  status: NotificationStatus;
  createdAt: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface NotificationData {
  documentId?: string;
  documentName?: string;
  caseId?: string;
  caseName?: string;
  shareId?: string;
  workflowId?: string;
  commentId?: string;
  userId?: string;
  userName?: string;
  permissions?: Permission[];
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  preferences: {
    [key in NotificationType]: {
      enabled: boolean;
      channels: NotificationChannel[];
      frequency: NotificationFrequency;
      quietHours?: {
        start: string; // HH:MM format
        end: string;   // HH:MM format
        timezone: string;
      };
    };
  };
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  language: string;
  channel: NotificationChannel;
  subject: string;
  bodyTemplate: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  recipient: string; // email, phone, user ID, etc.
  status: DeliveryStatus;
  attemptedAt: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface NotificationBatch {
  id: string;
  name: string;
  description?: string;
  notifications: string[]; // notification IDs
  status: BatchStatus;
  createdAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalCount: number;
  successCount: number;
  failureCount: number;
}

export enum NotificationType {
  DOCUMENT_SHARED = 'document_shared',
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_REVOKED = 'permission_revoked',
  DOCUMENT_COMMENTED = 'document_commented',
  COMMENT_REPLIED = 'comment_replied',
  DOCUMENT_UPDATED = 'document_updated',
  WORKFLOW_ASSIGNED = 'workflow_assigned',
  WORKFLOW_COMPLETED = 'workflow_completed',
  SIGNATURE_REQUESTED = 'signature_requested',
  SIGNATURE_COMPLETED = 'signature_completed',
  SHARE_LINK_ACCESSED = 'share_link_accessed',
  CONCURRENT_EDIT_CONFLICT = 'concurrent_edit_conflict',
  DOCUMENT_LOCKED = 'document_locked',
  DOCUMENT_UNLOCKED = 'document_unlocked',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SECURITY_ALERT = 'security_alert'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  CANCELLED = 'cancelled'
}

export enum BatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never'
}

// Service operation results
export interface NotificationResult {
  success: boolean;
  error?: string;
  warnings?: string[];
}

export interface NotificationCreateResult extends NotificationResult {
  notification?: Notification;
}

export interface NotificationListResult extends NotificationResult {
  notifications?: Notification[];
  totalCount?: number;
  unreadCount?: number;
}

export interface NotificationPreferencesResult extends NotificationResult {
  preferences?: NotificationPreferences;
}

export interface DeliveryResult extends NotificationResult {
  deliveries?: NotificationDelivery[];
}

// Notification creation options
export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  scheduledAt?: Date;
  expiresAt?: Date;
  maxRetries?: number;
}

export interface NotificationQueryOptions {
  userId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  unreadOnly?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  limit?: number;
  offset?: number;
}

export class NotificationService {
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_EXPIRY_HOURS = 72;
  private readonly BATCH_SIZE = 100;

  /**
   * Create and send a notification
   */
  async createNotification(options: CreateNotificationOptions): Promise<NotificationCreateResult> {
    try {
      // Get user preferences to determine delivery channels
      const preferencesResult = await this.getUserPreferences(options.userId);
      let channels = options.channels;

      if (preferencesResult.success && preferencesResult.preferences) {
        const typePrefs = preferencesResult.preferences.preferences[options.type];
        if (typePrefs && typePrefs.enabled) {
          channels = typePrefs.channels;
        } else if (!typePrefs?.enabled) {
          // User has disabled this notification type
          return {
            success: true,
            warnings: ['Notification type disabled by user preferences']
          };
        }
      }

      // Use default channels if none specified
      if (!channels || channels.length === 0) {
        channels = [NotificationChannel.IN_APP, NotificationChannel.EMAIL];
      }

      // Calculate expiration time
      const expiresAt = options.expiresAt || 
        new Date(Date.now() + this.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);

      // Create notification record
      const notificationData = {
        user_id: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        data: options.data,
        priority: options.priority || NotificationPriority.NORMAL,
        channels: channels,
        status: options.scheduledAt ? NotificationStatus.SCHEDULED : NotificationStatus.PENDING,
        created_at: new Date().toISOString(),
        scheduled_at: options.scheduledAt?.toISOString(),
        expires_at: expiresAt.toISOString(),
        retry_count: 0,
        max_retries: options.maxRetries || this.DEFAULT_MAX_RETRIES
      };

      const createResult = await supabaseService.insert('notifications', notificationData);
      if (!createResult.success) {
        return {
          success: false,
          error: `Failed to create notification: ${createResult.error?.message || 'Unknown error'}`
        };
      }

      const notification = this.mapDatabaseRecordToNotification(createResult.data);

      // Send immediately if not scheduled
      if (!options.scheduledAt) {
        await this.sendNotification(notification.id);
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'notification',
        notification.id,
        'create',
        {
          type: options.type,
          priority: options.priority,
          channels: channels,
          scheduledAt: options.scheduledAt?.toISOString()
        },
        'system'
      );

      return {
        success: true,
        notification
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Send a notification through configured channels
   */
  async sendNotification(notificationId: string): Promise<NotificationResult> {
    try {
      // Get notification details
      const notificationResult = await supabaseService.findById('notifications', notificationId);
      if (!notificationResult.success || !notificationResult.data) {
        return {
          success: false,
          error: 'Notification not found'
        };
      }

      const notification = this.mapDatabaseRecordToNotification(notificationResult.data);

      // Check if notification has expired
      if (notification.expiresAt && notification.expiresAt < new Date()) {
        await supabaseService.update('notifications', notificationId, {
          status: NotificationStatus.EXPIRED
        });
        return {
          success: false,
          error: 'Notification has expired'
        };
      }

      // Update status to sending
      await supabaseService.update('notifications', notificationId, {
        status: NotificationStatus.SENDING
      });

      // Send through each configured channel
      const deliveryPromises = notification.channels.map(channel =>
        this.sendThroughChannel(notification, channel)
      );

      const deliveryResults = await Promise.allSettled(deliveryPromises);
      
      // Check if any delivery succeeded
      const hasSuccessfulDelivery = deliveryResults.some(result => 
        result.status === 'fulfilled' && result.value.success
      );

      // Update notification status
      const finalStatus = hasSuccessfulDelivery ? NotificationStatus.SENT : NotificationStatus.FAILED;
      await supabaseService.update('notifications', notificationId, {
        status: finalStatus,
        sent_at: new Date().toISOString()
      });

      return {
        success: hasSuccessfulDelivery,
        warnings: deliveryResults
          .filter(result => result.status === 'rejected' || !result.value.success)
          .map(result => result.status === 'rejected' ? result.reason : result.value.error)
          .filter(Boolean)
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: NotificationQueryOptions = {}
  ): Promise<NotificationListResult> {
    try {
      const filters: any = { user_id: userId };
      
      if (options.type) filters.type = options.type;
      if (options.status) filters.status = options.status;
      if (options.priority) filters.priority = options.priority;
      if (options.unreadOnly) filters.read_at = null;
      
      if (options.dateRange) {
        filters.created_at = {
          gte: options.dateRange.from.toISOString(),
          lte: options.dateRange.to.toISOString()
        };
      }

      const queryOptions = {
        filters,
        limit: options.limit || 50,
        offset: options.offset || 0,
        sortBy: 'created_at',
        sortOrder: 'desc' as const
      };

      const result = await supabaseService.query('notifications', queryOptions);
      if (!result.success) {
        return {
          success: false,
          error: `Failed to retrieve notifications: ${result.error?.message || 'Unknown error'}`
        };
      }

      const notifications = (result.data || []).map(record => 
        this.mapDatabaseRecordToNotification(record)
      );

      // Get unread count
      const unreadResult = await supabaseService.query('notifications', {
        filters: { user_id: userId, read_at: null },
        count: true
      });

      return {
        success: true,
        notifications,
        totalCount: result.count,
        unreadCount: unreadResult.count || 0
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationResult> {
    try {
      // Verify notification belongs to user
      const notificationResult = await supabaseService.findById('notifications', notificationId);
      if (!notificationResult.success || !notificationResult.data) {
        return {
          success: false,
          error: 'Notification not found'
        };
      }

      if (notificationResult.data.user_id !== userId) {
        return {
          success: false,
          error: 'Access denied: notification belongs to another user'
        };
      }

      // Update read status
      await supabaseService.update('notifications', notificationId, {
        status: NotificationStatus.READ,
        read_at: new Date().toISOString()
      });

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<NotificationResult> {
    try {
      await supabaseService.query('notifications', {
        filters: {
          user_id: userId,
          read_at: null
        },
        update: {
          status: NotificationStatus.READ,
          read_at: new Date().toISOString()
        }
      });

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to mark all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferencesResult> {
    try {
      const result = await supabaseService.query('notification_preferences', {
        filters: { user_id: userId },
        limit: 1
      });

      if (!result.success) {
        return {
          success: false,
          error: `Failed to retrieve preferences: ${result.error?.message || 'Unknown error'}`
        };
      }

      if (!result.data?.length) {
        // Create default preferences
        const defaultPreferences = this.createDefaultPreferences(userId);
        const createResult = await this.updateUserPreferences(userId, defaultPreferences);
        return createResult;
      }

      const preferences = this.mapDatabaseRecordToPreferences(result.data[0]);

      return {
        success: true,
        preferences
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferencesResult> {
    try {
      // Check if preferences exist
      const existingResult = await supabaseService.query('notification_preferences', {
        filters: { user_id: userId },
        limit: 1
      });

      const preferencesData = {
        user_id: userId,
        email_enabled: preferences.emailEnabled ?? true,
        push_enabled: preferences.pushEnabled ?? true,
        sms_enabled: preferences.smsEnabled ?? false,
        in_app_enabled: preferences.inAppEnabled ?? true,
        preferences: preferences.preferences || this.getDefaultTypePreferences(),
        language: preferences.language || 'fr',
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingResult.success && existingResult.data?.length) {
        // Update existing preferences
        result = await supabaseService.update(
          'notification_preferences',
          existingResult.data[0].id,
          preferencesData
        );
      } else {
        // Create new preferences
        preferencesData.created_at = new Date().toISOString();
        result = await supabaseService.insert('notification_preferences', preferencesData);
      }

      if (!result.success) {
        return {
          success: false,
          error: `Failed to update preferences: ${result.error?.message || 'Unknown error'}`
        };
      }

      const updatedPreferences = this.mapDatabaseRecordToPreferences(result.data);

      return {
        success: true,
        preferences: updatedPreferences
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Send document sharing notification
   */
  async notifyDocumentShared(
    recipientUserId: string,
    documentId: string,
    documentName: string,
    permissions: Permission[],
    sharedBy: string,
    message?: string
  ): Promise<NotificationResult> {
    const notificationData: NotificationData = {
      documentId,
      documentName,
      permissions,
      userId: sharedBy,
      actionUrl: `/documents/${documentId}`,
      metadata: { message }
    };

    return this.createNotification({
      userId: recipientUserId,
      type: NotificationType.DOCUMENT_SHARED,
      title: 'Document Shared',
      message: `${documentName} has been shared with you by ${sharedBy}. ${message || ''}`,
      data: notificationData,
      priority: NotificationPriority.NORMAL
    });
  }

  /**
   * Send permission granted notification
   */
  async notifyPermissionGranted(
    recipientUserId: string,
    documentId: string,
    documentName: string,
    permissions: Permission[],
    grantedBy: string
  ): Promise<NotificationResult> {
    const notificationData: NotificationData = {
      documentId,
      documentName,
      permissions,
      userId: grantedBy,
      actionUrl: `/documents/${documentId}`
    };

    return this.createNotification({
      userId: recipientUserId,
      type: NotificationType.PERMISSION_GRANTED,
      title: 'Document Access Granted',
      message: `You have been granted ${permissions.join(', ')} permissions to ${documentName}`,
      data: notificationData,
      priority: NotificationPriority.NORMAL
    });
  }

  /**
   * Send comment notification
   */
  async notifyDocumentCommented(
    recipientUserId: string,
    documentId: string,
    documentName: string,
    commentId: string,
    commentedBy: string,
    commentText: string
  ): Promise<NotificationResult> {
    const notificationData: NotificationData = {
      documentId,
      documentName,
      commentId,
      userId: commentedBy,
      actionUrl: `/documents/${documentId}#comment-${commentId}`
    };

    return this.createNotification({
      userId: recipientUserId,
      type: NotificationType.DOCUMENT_COMMENTED,
      title: 'New Comment',
      message: `${commentedBy} commented on ${documentName}: "${commentText.substring(0, 100)}${commentText.length > 100 ? '...' : ''}"`,
      data: notificationData,
      priority: NotificationPriority.NORMAL
    });
  }

  /**
   * Send concurrent editing conflict notification
   */
  async notifyConcurrentEditConflict(
    userId: string,
    documentId: string,
    documentName: string,
    conflictDetails: string
  ): Promise<NotificationResult> {
    const notificationData: NotificationData = {
      documentId,
      documentName,
      actionUrl: `/documents/${documentId}/conflicts`,
      metadata: { conflictDetails }
    };

    return this.createNotification({
      userId,
      type: NotificationType.CONCURRENT_EDIT_CONFLICT,
      title: 'Edit Conflict Detected',
      message: `A conflict was detected while editing ${documentName}. ${conflictDetails}`,
      data: notificationData,
      priority: NotificationPriority.HIGH
    });
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<NotificationResult> {
    try {
      // Get notifications scheduled for now or earlier
      const scheduledResult = await supabaseService.query('notifications', {
        filters: {
          status: NotificationStatus.SCHEDULED,
          scheduled_at: { lte: new Date().toISOString() }
        },
        limit: this.BATCH_SIZE
      });

      if (!scheduledResult.success || !scheduledResult.data?.length) {
        return {
          success: true,
          warnings: ['No scheduled notifications to process']
        };
      }

      // Send each scheduled notification
      const sendPromises = scheduledResult.data.map(record =>
        this.sendNotification(record.id)
      );

      const results = await Promise.allSettled(sendPromises);
      
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;

      return {
        success: true,
        warnings: [`Processed ${results.length} scheduled notifications, ${successCount} successful`]
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to process scheduled notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<NotificationResult> {
    try {
      // Mark expired notifications
      await supabaseService.query('notifications', {
        filters: {
          status: { in: [NotificationStatus.PENDING, NotificationStatus.SCHEDULED] },
          expires_at: { lt: new Date().toISOString() }
        },
        update: {
          status: NotificationStatus.EXPIRED
        }
      });

      // Delete old notifications (older than 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      await supabaseService.query('notifications', {
        filters: {
          created_at: { lt: ninetyDaysAgo.toISOString() }
        },
        delete: true
      });

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Send notification through specific channel
   */
  private async sendThroughChannel(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<NotificationResult> {
    try {
      // Create delivery record
      const deliveryData = {
        notification_id: notification.id,
        channel,
        recipient: await this.getChannelRecipient(notification.userId, channel),
        status: DeliveryStatus.PENDING,
        attempted_at: new Date().toISOString(),
        retry_count: 0
      };

      const deliveryResult = await supabaseService.insert('notification_deliveries', deliveryData);
      if (!deliveryResult.success) {
        return {
          success: false,
          error: 'Failed to create delivery record'
        };
      }

      const deliveryId = deliveryResult.data.id;

      try {
        // Update delivery status to sending
        await supabaseService.update('notification_deliveries', deliveryId, {
          status: DeliveryStatus.SENDING
        });

        // Send through channel (mock implementation)
        const success = await this.sendThroughChannelProvider(notification, channel);

        // Update delivery status
        await supabaseService.update('notification_deliveries', deliveryId, {
          status: success ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
          delivered_at: success ? new Date().toISOString() : undefined,
          failed_at: success ? undefined : new Date().toISOString(),
          error_message: success ? undefined : 'Delivery failed'
        });

        return {
          success
        };

      } catch (deliveryError) {
        // Update delivery status to failed
        await supabaseService.update('notification_deliveries', deliveryId, {
          status: DeliveryStatus.FAILED,
          failed_at: new Date().toISOString(),
          error_message: deliveryError instanceof Error ? deliveryError.message : 'Unknown error'
        });

        return {
          success: false,
          error: deliveryError instanceof Error ? deliveryError.message : 'Delivery failed'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Channel delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get recipient address for channel
   */
  private async getChannelRecipient(userId: string, channel: NotificationChannel): Promise<string> {
    // This would integrate with user service to get contact information
    // For now, return mock data
    switch (channel) {
      case NotificationChannel.EMAIL:
        return `user-${userId}@example.com`;
      case NotificationChannel.SMS:
        return `+1234567890`;
      case NotificationChannel.PUSH:
        return `push-token-${userId}`;
      case NotificationChannel.IN_APP:
        return userId;
      default:
        return userId;
    }
  }

  /**
   * Send through channel provider (mock implementation)
   */
  private async sendThroughChannelProvider(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<boolean> {
    // Mock implementation - in real system, this would integrate with:
    // - Email service (SendGrid, AWS SES, etc.)
    // - Push notification service (Firebase, AWS SNS, etc.)
    // - SMS service (Twilio, AWS SNS, etc.)
    // - WebSocket for in-app notifications

    console.log(`Sending ${channel} notification:`, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      recipient: notification.userId
    });

    // Simulate success/failure
    return Math.random() > 0.1; // 90% success rate
  }

  /**
   * Create default notification preferences
   */
  private createDefaultPreferences(userId: string): NotificationPreferences {
    return {
      id: '',
      userId,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      preferences: this.getDefaultTypePreferences(),
      language: 'fr',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get default preferences for all notification types
   */
  private getDefaultTypePreferences() {
    const defaultPrefs = {
      enabled: true,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      frequency: NotificationFrequency.IMMEDIATE
    };

    const preferences: any = {};
    Object.values(NotificationType).forEach(type => {
      preferences[type] = { ...defaultPrefs };
    });

    // Customize specific types
    preferences[NotificationType.SECURITY_ALERT] = {
      enabled: true,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
      frequency: NotificationFrequency.IMMEDIATE
    };

    preferences[NotificationType.SYSTEM_MAINTENANCE] = {
      enabled: true,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      frequency: NotificationFrequency.DAILY
    };

    return preferences;
  }

  /**
   * Map database record to Notification interface
   */
  private mapDatabaseRecordToNotification(record: any): Notification {
    return {
      id: record.id,
      userId: record.user_id,
      type: record.type,
      title: record.title,
      message: record.message,
      data: record.data,
      priority: record.priority,
      channels: record.channels,
      status: record.status,
      createdAt: new Date(record.created_at),
      scheduledAt: record.scheduled_at ? new Date(record.scheduled_at) : undefined,
      sentAt: record.sent_at ? new Date(record.sent_at) : undefined,
      readAt: record.read_at ? new Date(record.read_at) : undefined,
      expiresAt: record.expires_at ? new Date(record.expires_at) : undefined,
      retryCount: record.retry_count,
      maxRetries: record.max_retries
    };
  }

  /**
   * Map database record to NotificationPreferences interface
   */
  private mapDatabaseRecordToPreferences(record: any): NotificationPreferences {
    return {
      id: record.id,
      userId: record.user_id,
      emailEnabled: record.email_enabled,
      pushEnabled: record.push_enabled,
      smsEnabled: record.sms_enabled,
      inAppEnabled: record.in_app_enabled,
      preferences: record.preferences,
      language: record.language,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
