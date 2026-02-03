import { db } from '@/database/connection';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  Notification,
  NotificationTemplate,
  NotificationPreferences,
  DeadlineNotification,
  NotificationLog,
  NotificationDigest,
  ProceduralDeadline,
  CreateNotificationRequest,
  CreateNotificationTemplateRequest,
  UpdateNotificationPreferencesRequest,
  NotificationSearchCriteria,
  NotificationSearchResult,
  NotificationStatistics,
  BulkNotificationRequest,
  BulkNotificationResult,
  DeadlineReminderConfig,
  TemplateContext,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  NotificationEventType,
  DigestType,
  DigestStatus,
  CalculationMethod,
  EmailNotificationData,
  SMSNotificationData,
  PushNotificationData,
  NotificationServiceResponse
} from '@/types/notification';

export class NotificationService {

  /**
   * Create a new notification
   * Validates: Requirements 5.3 - Notification system
   */
  async createNotification(notificationData: CreateNotificationRequest, organizationId?: string): Promise<Notification> {
    try {
      const notificationId = uuidv4();
      
      const notification: Notification = {
        id: notificationId,
        recipientId: notificationData.recipientId,
        recipientEmail: notificationData.recipientEmail,
        recipientPhone: notificationData.recipientPhone,
        type: notificationData.type,
        channel: notificationData.channel,
        subject: notificationData.subject,
        message: notificationData.message,
        relatedEntityType: notificationData.relatedEntityType,
        relatedEntityId: notificationData.relatedEntityId,
        caseId: notificationData.caseId,
        scheduledAt: notificationData.scheduledAt || new Date(),
        status: NotificationStatus.PENDING,
        priority: notificationData.priority || NotificationPriority.NORMAL,
        retryCount: 0,
        maxRetries: 3,
        metadata: notificationData.metadata || {},
        templateId: notificationData.templateId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveNotificationToDatabase(notification);

      // Log creation event
      await this.logNotificationEvent(notificationId, NotificationEventType.CREATED, {
        type: notification.type,
        channel: notification.channel,
        recipientId: notification.recipientId
      });

      logger.info('Notification created successfully', { 
        notificationId, 
        type: notification.type, 
        recipientId: notification.recipientId 
      });

      return notification;

    } catch (error) {
      logger.error('Notification creation error:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Create notification from template
   * Validates: Requirements 5.3 - Template-based notifications
   */
  async createNotificationFromTemplate(
    templateId: string,
    recipientId: string,
    context: TemplateContext,
    scheduledAt?: Date,
    priority?: NotificationPriority
  ): Promise<Notification> {
    try {
      // Get template
      const template = await this.getNotificationTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Process template
      const processedContent = await this.processTemplate(template, context);

      // Create notification
      const notificationData: CreateNotificationRequest = {
        recipientId,
        type: template.type,
        channel: template.channel,
        subject: processedContent.subject,
        message: processedContent.body,
        relatedEntityType: context.case ? 'case' : context.deadline ? 'deadline' : undefined,
        relatedEntityId: context.case?.id || context.deadline?.id,
        caseId: context.case?.id,
        scheduledAt,
        priority,
        templateId,
        metadata: { templateContext: context }
      };

      return await this.createNotification(notificationData);

    } catch (error) {
      logger.error('Template notification creation error:', error);
      throw new Error('Failed to create notification from template');
    }
  }

  /**
   * Send pending notifications
   * Validates: Requirements 5.3 - Notification delivery
   */
  async processPendingNotifications(batchSize: number = 100): Promise<number> {
    try {
      // Vérifier si la table notifications existe
      const tableExists = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'notifications'
        ) as exists
      `);
      
      if (!tableExists.rows[0].exists) {
        // Table n'existe pas, retourner 0 sans erreur
        return 0;
      }

      // Get pending notifications
      const result = await db.query(
        `SELECT * FROM notifications 
         WHERE status = $1 AND scheduled_at <= CURRENT_TIMESTAMP
         ORDER BY priority DESC, scheduled_at ASC
         LIMIT $2`,
        [NotificationStatus.PENDING, batchSize]
      );

      const notifications = (result as any).rows.map((row: any) => this.mapRowToNotification(row));
      let processedCount = 0;

      for (const notification of notifications) {
        try {
          // Check user preferences
          const canSend = await this.checkNotificationPreferences(notification);
          if (!canSend) {
            await this.updateNotificationStatus(notification.id, NotificationStatus.CANCELLED, 'User preferences');
            continue;
          }

          // Send notification
          const response = await this.sendNotification(notification);
          
          if (response.success) {
            await this.updateNotificationStatus(
              notification.id, 
              NotificationStatus.SENT, 
              undefined, 
              response.externalId
            );
            
            await this.logNotificationEvent(notification.id, NotificationEventType.SENT, {
              channel: notification.channel,
              externalId: response.externalId
            });
            
            processedCount++;
          } else {
            await this.handleNotificationFailure(notification, response.error || 'Unknown error');
          }

        } catch (error) {
          logger.error('Notification processing error:', { notificationId: notification.id, error });
          await this.handleNotificationFailure(notification, error.message);
        }
      }

      if (processedCount > 0) {
        logger.info('Processed pending notifications', { processedCount, totalFound: notifications.length });
      }
      return processedCount;

    } catch (error) {
      logger.error('Process pending notifications error:', error);
      throw new Error('Failed to process pending notifications');
    }
  }

  /**
   * Create bulk notifications
   * Validates: Requirements 5.3 - Bulk notification support
   */
  async createBulkNotifications(bulkRequest: BulkNotificationRequest): Promise<BulkNotificationResult> {
    try {
      const successful: string[] = [];
      const failed: { recipientId: string; error: string }[] = [];

      for (const recipientId of bulkRequest.recipientIds) {
        try {
          // Process template variables if provided
          let message = bulkRequest.message;
          let subject = bulkRequest.subject;

          if (bulkRequest.templateId && bulkRequest.templateVariables) {
            const template = await this.getNotificationTemplate(bulkRequest.templateId);
            if (template) {
              const context: TemplateContext = {
                user: { id: recipientId, name: '', email: '' },
                custom: bulkRequest.templateVariables
              };
              const processed = await this.processTemplate(template, context);
              message = processed.body;
              subject = processed.subject;
            }
          }

          const notificationData: CreateNotificationRequest = {
            recipientId,
            type: bulkRequest.type,
            channel: bulkRequest.channel,
            subject,
            message,
            scheduledAt: bulkRequest.scheduledAt,
            priority: bulkRequest.priority,
            templateId: bulkRequest.templateId,
            metadata: { bulkNotification: true }
          };

          await this.createNotification(notificationData);
          successful.push(recipientId);

        } catch (error) {
          failed.push({ recipientId, error: error.message });
        }
      }

      return {
        successful,
        failed,
        totalProcessed: successful.length + failed.length
      };

    } catch (error) {
      logger.error('Bulk notification creation error:', error);
      throw new Error('Failed to create bulk notifications');
    }
  }

  /**
   * Generate deadline notifications
   * Validates: Requirements 5.3 - Automatic deadline notifications
   */
  async generateDeadlineNotifications(): Promise<number> {
    try {
      // Vérifier si la fonction existe avant de l'appeler
      const functionExists = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_proc 
          WHERE proname = 'generate_deadline_notifications'
        ) as exists
      `);
      
      if (!functionExists.rows[0].exists) {
        logger.warn('Function generate_deadline_notifications does not exist, skipping');
        return 0;
      }

      const result = await db.query('SELECT generate_deadline_notifications()');
      const notificationsCreated = (result as any).rows[0].generate_deadline_notifications;

      logger.info('Generated deadline notifications', { count: notificationsCreated });
      return notificationsCreated;

    } catch (error) {
      logger.error('Generate deadline notifications error:', error);
      // Ne pas faire échouer le processus, juste logger l'erreur
      logger.warn('Deadline notifications generation failed, continuing');
      return 0;
    }
  }

  /**
   * Configure deadline reminders for a case
   * Validates: Requirements 5.3 - Configurable deadline reminders
   */
  async configureDeadlineReminders(config: DeadlineReminderConfig): Promise<void> {
    try {
      // Get deadline details
      const deadlineResult = await db.query(
        'SELECT * FROM case_deadlines WHERE id = $1',
        [config.deadlineId]
      );

      if (!deadlineResult || (deadlineResult as any).rows.length === 0) {
        throw new Error('Deadline not found');
      }

      const deadline = (deadlineResult as any).rows[0];

      // Create notifications for each reminder day
      for (const daysBefore of config.notificationDays) {
        const notificationDate = new Date(deadline.deadline_date);
        notificationDate.setDate(notificationDate.getDate() - daysBefore);

        // Only create if notification date is in the future
        if (notificationDate > new Date()) {
          for (const channel of config.channels) {
            const notificationData: CreateNotificationRequest = {
              recipientId: deadline.assigned_to || deadline.created_by,
              type: NotificationType.DEADLINE_REMINDER,
              channel,
              subject: `Rappel d'échéance: ${deadline.title}`,
              message: config.customMessage || 
                `L'échéance "${deadline.title}" arrive dans ${daysBefore} jour(s). Date limite: ${deadline.deadline_date}`,
              relatedEntityType: 'deadline',
              relatedEntityId: config.deadlineId,
              caseId: deadline.case_id,
              scheduledAt: notificationDate,
              priority: config.priority || (daysBefore <= 1 ? NotificationPriority.URGENT : NotificationPriority.NORMAL)
            };

            await this.createNotification(notificationData);
          }
        }
      }

      logger.info('Deadline reminders configured', { 
        deadlineId: config.deadlineId, 
        reminderCount: config.notificationDays.length * config.channels.length 
      });

    } catch (error) {
      logger.error('Configure deadline reminders error:', error);
      throw new Error('Failed to configure deadline reminders');
    }
  }

  /**
   * Get user notification preferences
   * Validates: Requirements 5.3 - User notification preferences
   */
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences[]> {
    try {
      const result = await db.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [userId]
      );

      return (result as any).rows.map((row: any) => this.mapRowToNotificationPreferences(row));

    } catch (error) {
      logger.error('Get notification preferences error:', error);
      throw new Error('Failed to retrieve notification preferences');
    }
  }

  /**
   * Update user notification preferences
   * Validates: Requirements 5.3 - Configurable preferences
   */
  async updateNotificationPreferences(
    userId: string, 
    updates: UpdateNotificationPreferencesRequest
  ): Promise<NotificationPreferences> {
    try {
      const preferencesId = uuidv4();
      
      const preferences: NotificationPreferences = {
        id: preferencesId,
        userId,
        notificationType: updates.notificationType,
        emailEnabled: updates.emailEnabled ?? true,
        smsEnabled: updates.smsEnabled ?? false,
        inAppEnabled: updates.inAppEnabled ?? true,
        pushEnabled: updates.pushEnabled ?? true,
        businessHoursOnly: updates.businessHoursOnly ?? false,
        quietHoursStart: updates.quietHoursStart,
        quietHoursEnd: updates.quietHoursEnd,
        timezone: updates.timezone || 'Africa/Algiers',
        immediate: updates.immediate ?? true,
        dailyDigest: updates.dailyDigest ?? false,
        weeklyDigest: updates.weeklyDigest ?? false,
        digestTime: updates.digestTime || '09:00:00',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.query(
        `INSERT INTO notification_preferences (
          id, user_id, notification_type, email_enabled, sms_enabled, in_app_enabled,
          push_enabled, business_hours_only, quiet_hours_start, quiet_hours_end,
          timezone, immediate, daily_digest, weekly_digest, digest_time,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (user_id, notification_type) DO UPDATE SET
          email_enabled = $4, sms_enabled = $5, in_app_enabled = $6, push_enabled = $7,
          business_hours_only = $8, quiet_hours_start = $9, quiet_hours_end = $10,
          timezone = $11, immediate = $12, daily_digest = $13, weekly_digest = $14,
          digest_time = $15, updated_at = $17`,
        [
          preferencesId, userId, preferences.notificationType, preferences.emailEnabled,
          preferences.smsEnabled, preferences.inAppEnabled, preferences.pushEnabled,
          preferences.businessHoursOnly, preferences.quietHoursStart, preferences.quietHoursEnd,
          preferences.timezone, preferences.immediate, preferences.dailyDigest,
          preferences.weeklyDigest, preferences.digestTime, preferences.createdAt, preferences.updatedAt
        ]
      );

      logger.info('Notification preferences updated', { userId, notificationType: preferences.notificationType });
      return preferences;

    } catch (error) {
      logger.error('Update notification preferences error:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Search notifications
   * Validates: Requirements 5.3 - Notification management
   */
  async searchNotifications(criteria: NotificationSearchCriteria): Promise<NotificationSearchResult> {
    try {
      const startTime = Date.now();

      // Build search query
      let query = 'SELECT * FROM notifications WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 0;

      if (criteria.recipientId) {
        query += ` AND recipient_id = $${++paramIndex}`;
        params.push(criteria.recipientId);
      }

      if (criteria.type) {
        query += ` AND type = $${++paramIndex}`;
        params.push(criteria.type);
      }

      if (criteria.channel) {
        query += ` AND channel = $${++paramIndex}`;
        params.push(criteria.channel);
      }

      if (criteria.status) {
        query += ` AND status = $${++paramIndex}`;
        params.push(criteria.status);
      }

      if (criteria.priority) {
        query += ` AND priority = $${++paramIndex}`;
        params.push(criteria.priority);
      }

      if (criteria.caseId) {
        query += ` AND case_id = $${++paramIndex}`;
        params.push(criteria.caseId);
      }

      if (criteria.dateRange) {
        if (criteria.dateRange.from) {
          query += ` AND created_at >= $${++paramIndex}`;
          params.push(criteria.dateRange.from);
        }
        if (criteria.dateRange.to) {
          query += ` AND created_at <= $${++paramIndex}`;
          params.push(criteria.dateRange.to);
        }
      }

      // Add sorting
      const sortBy = criteria.sortBy || 'created_at';
      const sortOrder = criteria.sortOrder || 'desc';
      query += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Add pagination
      const limit = criteria.limit || 50;
      const offset = criteria.offset || 0;
      query += ` LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
      params.push(limit, offset);

      // Execute search
      const result = await db.query(query, params);
      const notifications = (result as any).rows.map((row: any) => this.mapRowToNotification(row));

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)').replace(/ORDER BY.*$/, '').replace(/LIMIT.*$/, '');
      const countResult = await db.query(countQuery, params.slice(0, -2));
      const totalCount = parseInt((countResult as any).rows[0].count);

      const searchTime = Date.now() - startTime;

      return {
        notifications,
        totalCount,
        searchTime
      };

    } catch (error) {
      logger.error('Search notifications error:', error);
      throw new Error('Failed to search notifications');
    }
  }

  /**
   * Get notification statistics
   * Validates: Requirements 5.3 - Notification analytics
   */
  async getNotificationStatistics(userId?: string, startDate?: Date, endDate?: Date): Promise<NotificationStatistics> {
    try {
      let baseQuery = 'FROM notifications WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 0;

      if (userId) {
        baseQuery += ` AND recipient_id = $${++paramIndex}`;
        params.push(userId);
      }

      if (startDate) {
        baseQuery += ` AND created_at >= $${++paramIndex}`;
        params.push(startDate);
      }

      if (endDate) {
        baseQuery += ` AND created_at <= $${++paramIndex}`;
        params.push(endDate);
      }

      // Get total notifications
      const totalResult = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
      const totalNotifications = parseInt((totalResult as any).rows[0].total);

      // Get notifications by status
      const statusResult = await db.query(
        `SELECT status, COUNT(*) as count ${baseQuery} GROUP BY status`,
        params
      );
      const notificationsByStatus: Record<NotificationStatus, number> = {
        [NotificationStatus.PENDING]: 0,
        [NotificationStatus.SENT]: 0,
        [NotificationStatus.DELIVERED]: 0,
        [NotificationStatus.READ]: 0,
        [NotificationStatus.FAILED]: 0,
        [NotificationStatus.CANCELLED]: 0
      };
      (statusResult as any).rows.forEach((row: any) => {
        notificationsByStatus[row.status as NotificationStatus] = parseInt(row.count);
      });

      // Get notifications by type
      const typeResult = await db.query(
        `SELECT type, COUNT(*) as count ${baseQuery} GROUP BY type`,
        params
      );
      const notificationsByType: Record<NotificationType, number> = {} as any;
      (typeResult as any).rows.forEach((row: any) => {
        notificationsByType[row.type as NotificationType] = parseInt(row.count);
      });

      // Get notifications by channel
      const channelResult = await db.query(
        `SELECT channel, COUNT(*) as count ${baseQuery} GROUP BY channel`,
        params
      );
      const notificationsByChannel: Record<NotificationChannel, number> = {} as any;
      (channelResult as any).rows.forEach((row: any) => {
        notificationsByChannel[row.channel as NotificationChannel] = parseInt(row.count);
      });

      // Calculate delivery rate
      const sentCount = notificationsByStatus[NotificationStatus.SENT] + 
                       notificationsByStatus[NotificationStatus.DELIVERED] + 
                       notificationsByStatus[NotificationStatus.READ];
      const deliveryRate = totalNotifications > 0 ? (sentCount / totalNotifications) * 100 : 0;

      // Calculate failure rate
      const failureRate = totalNotifications > 0 ? 
        (notificationsByStatus[NotificationStatus.FAILED] / totalNotifications) * 100 : 0;

      // Get recent activity
      const activityResult = await db.query(
        `SELECT n.id, n.type, n.status, n.recipient_id, n.created_at, n.case_id,
                c.title as case_title, up.first_name || ' ' || up.last_name as recipient_name
         ${baseQuery}
         LEFT JOIN cases c ON n.case_id = c.id
         LEFT JOIN users u ON n.recipient_id = u.id
         LEFT JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true
         ORDER BY n.created_at DESC LIMIT 10`,
        params
      );

      const recentActivity = (activityResult as any).rows.map((row: any) => ({
        id: row.id,
        type: row.type,
        status: row.status,
        recipientId: row.recipient_id,
        recipientName: row.recipient_name || 'Unknown',
        timestamp: new Date(row.created_at),
        caseTitle: row.case_title
      }));

      return {
        totalNotifications,
        notificationsByStatus,
        notificationsByType,
        notificationsByChannel,
        deliveryRate,
        averageDeliveryTime: 0, // Would need to calculate from delivery timestamps
        failureRate,
        recentActivity
      };

    } catch (error) {
      logger.error('Get notification statistics error:', error);
      throw new Error('Failed to retrieve notification statistics');
    }
  }

  // Private helper methods

  private async sendNotification(notification: Notification): Promise<NotificationServiceResponse> {
    try {
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          return await this.sendEmailNotification(notification);
        case NotificationChannel.SMS:
          return await this.sendSMSNotification(notification);
        case NotificationChannel.IN_APP:
          return await this.sendInAppNotification(notification);
        case NotificationChannel.PUSH:
          return await this.sendPushNotification(notification);
        default:
          throw new Error(`Unsupported notification channel: ${notification.channel}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<NotificationServiceResponse> {
    // This would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll simulate the email sending
    logger.info('Sending email notification', { 
      notificationId: notification.id, 
      recipient: notification.recipientEmail 
    });

    // Simulate email service response
    return {
      success: true,
      externalId: `email_${Date.now()}`,
      status: 'sent'
    };
  }

  private async sendSMSNotification(notification: Notification): Promise<NotificationServiceResponse> {
    // This would integrate with an SMS service like Twilio, AWS SNS, etc.
    logger.info('Sending SMS notification', { 
      notificationId: notification.id, 
      recipient: notification.recipientPhone 
    });

    return {
      success: true,
      externalId: `sms_${Date.now()}`,
      status: 'sent'
    };
  }

  private async sendInAppNotification(notification: Notification): Promise<NotificationServiceResponse> {
    // In-app notifications are stored in database and delivered via WebSocket/SSE
    logger.info('Sending in-app notification', { 
      notificationId: notification.id, 
      recipient: notification.recipientId 
    });

    return {
      success: true,
      externalId: `inapp_${notification.id}`,
      status: 'delivered'
    };
  }

  private async sendPushNotification(notification: Notification): Promise<NotificationServiceResponse> {
    // This would integrate with push notification services like FCM, APNS, etc.
    logger.info('Sending push notification', { 
      notificationId: notification.id, 
      recipient: notification.recipientId 
    });

    return {
      success: true,
      externalId: `push_${Date.now()}`,
      status: 'sent'
    };
  }

  private async checkNotificationPreferences(notification: Notification): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT * FROM notification_preferences 
         WHERE user_id = $1 AND notification_type = $2`,
        [notification.recipientId, notification.type]
      );

      if (!result || (result as any).rows.length === 0) {
        // No preferences set, allow notification
        return true;
      }

      const preferences = this.mapRowToNotificationPreferences((result as any).rows[0]);

      // Check channel preferences
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          return preferences.emailEnabled;
        case NotificationChannel.SMS:
          return preferences.smsEnabled;
        case NotificationChannel.IN_APP:
          return preferences.inAppEnabled;
        case NotificationChannel.PUSH:
          return preferences.pushEnabled;
        default:
          return true;
      }

    } catch (error) {
      logger.error('Check notification preferences error:', error);
      // On error, allow notification to be safe
      return true;
    }
  }

  private async processTemplate(template: NotificationTemplate, context: TemplateContext): Promise<{ subject?: string; body: string }> {
    try {
      // Simple template processing - in production, use a proper template engine like Handlebars
      let subject = template.subjectTemplate;
      let body = template.bodyTemplate;

      // Replace user variables
      if (context.user) {
        const replacements = {
          '{{user_name}}': context.user.name || `${context.user.firstName || ''} ${context.user.lastName || ''}`.trim(),
          '{{user_email}}': context.user.email || '',
          '{{user_id}}': context.user.id
        };

        Object.entries(replacements).forEach(([placeholder, value]) => {
          if (subject) subject = subject.replace(new RegExp(placeholder, 'g'), value);
          body = body.replace(new RegExp(placeholder, 'g'), value);
        });
      }

      // Replace case variables
      if (context.case) {
        const replacements = {
          '{{case_title}}': context.case.title,
          '{{case_number}}': context.case.caseNumber,
          '{{case_status}}': context.case.status,
          '{{client_name}}': context.case.client || ''
        };

        Object.entries(replacements).forEach(([placeholder, value]) => {
          if (subject) subject = subject.replace(new RegExp(placeholder, 'g'), value);
          body = body.replace(new RegExp(placeholder, 'g'), value);
        });
      }

      // Replace deadline variables
      if (context.deadline) {
        const replacements = {
          '{{deadline_title}}': context.deadline.title,
          '{{deadline_description}}': context.deadline.description || '',
          '{{deadline_date}}': context.deadline.deadlineDate.toLocaleDateString('fr-DZ'),
          '{{priority}}': context.deadline.priority,
          '{{days_before}}': context.deadline.daysBefore?.toString() || ''
        };

        Object.entries(replacements).forEach(([placeholder, value]) => {
          if (subject) subject = subject.replace(new RegExp(placeholder, 'g'), value);
          body = body.replace(new RegExp(placeholder, 'g'), value);
        });
      }

      // Replace custom variables
      if (context.custom) {
        Object.entries(context.custom).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          if (subject) subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
          body = body.replace(new RegExp(placeholder, 'g'), String(value));
        });
      }

      return { subject, body };

    } catch (error) {
      logger.error('Template processing error:', error);
      return { subject: template.subjectTemplate, body: template.bodyTemplate };
    }
  }

  private async getNotificationTemplate(templateId: string): Promise<NotificationTemplate | null> {
    try {
      const result = await db.query(
        'SELECT * FROM notification_templates WHERE id = $1 AND is_active = true',
        [templateId]
      );

      if (!result || (result as any).rows.length === 0) {
        return null;
      }

      return this.mapRowToNotificationTemplate((result as any).rows[0]);

    } catch (error) {
      logger.error('Get notification template error:', error);
      return null;
    }
  }

  private async updateNotificationStatus(
    notificationId: string, 
    status: NotificationStatus, 
    failureReason?: string,
    externalId?: string
  ): Promise<void> {
    try {
      const updateFields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
      const params = [notificationId, status];
      let paramIndex = 2;

      if (status === NotificationStatus.SENT) {
        updateFields.push(`sent_at = CURRENT_TIMESTAMP`);
      }

      if (status === NotificationStatus.DELIVERED) {
        updateFields.push(`delivered_at = CURRENT_TIMESTAMP`);
      }

      if (status === NotificationStatus.FAILED && failureReason) {
        updateFields.push(`failure_reason = $${++paramIndex}`);
        params.push(failureReason);
      }

      const query = `UPDATE notifications SET ${updateFields.join(', ')} WHERE id = $1`;
      await db.query(query, params);

    } catch (error) {
      logger.error('Update notification status error:', error);
    }
  }

  private async handleNotificationFailure(notification: Notification, error: string): Promise<void> {
    try {
      const newRetryCount = notification.retryCount + 1;

      if (newRetryCount >= notification.maxRetries) {
        // Max retries reached, mark as failed
        await this.updateNotificationStatus(notification.id, NotificationStatus.FAILED, error);
        await this.logNotificationEvent(notification.id, NotificationEventType.FAILED, { error, retryCount: newRetryCount });
      } else {
        // Schedule retry
        const nextRetry = new Date();
        nextRetry.setMinutes(nextRetry.getMinutes() + (newRetryCount * 5)); // Exponential backoff

        await db.query(
          'UPDATE notifications SET retry_count = $2, last_retry_at = CURRENT_TIMESTAMP WHERE id = $1',
          [notification.id, newRetryCount]
        );

        await this.logNotificationEvent(notification.id, NotificationEventType.RETRY, { 
          error, 
          retryCount: newRetryCount, 
          nextRetry 
        });
      }

    } catch (error) {
      logger.error('Handle notification failure error:', error);
    }
  }

  /**
   * Update notification status (public method for API routes)
   */
  async updateNotificationStatus(
    notificationId: string, 
    status: NotificationStatus, 
    failureReason?: string,
    externalId?: string
  ): Promise<void> {
    try {
      const updateFields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
      const params = [notificationId, status];
      let paramIndex = 2;

      if (status === NotificationStatus.SENT) {
        updateFields.push(`sent_at = CURRENT_TIMESTAMP`);
      }

      if (status === NotificationStatus.DELIVERED) {
        updateFields.push(`delivered_at = CURRENT_TIMESTAMP`);
      }

      if (status === NotificationStatus.READ) {
        updateFields.push(`read_at = CURRENT_TIMESTAMP`);
      }

      if (status === NotificationStatus.FAILED && failureReason) {
        updateFields.push(`failure_reason = $${++paramIndex}`);
        params.push(failureReason);
      }

      const query = `UPDATE notifications SET ${updateFields.join(', ')} WHERE id = $1`;
      await db.query(query, params);

      // Log the status change
      await this.logNotificationEvent(notificationId, status as any, {
        previousStatus: 'unknown', // Would need to track this
        externalId,
        failureReason
      });

    } catch (error) {
      logger.error('Update notification status error:', error);
      throw new Error('Failed to update notification status');
    }
  }

  private async logNotificationEvent(
    notificationId: string, 
    eventType: NotificationEventType, 
    details: Record<string, any>
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO notification_logs (id, notification_id, event_type, details, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [uuidv4(), notificationId, eventType, JSON.stringify(details)]
      );
    } catch (error) {
      logger.error('Log notification event error:', error);
    }
  }

  private async saveNotificationToDatabase(notification: Notification): Promise<void> {
    await db.query(
      `INSERT INTO notifications (
        id, recipient_id, recipient_email, recipient_phone, type, channel, subject, message,
        related_entity_type, related_entity_id, case_id, scheduled_at, status, priority,
        retry_count, max_retries, metadata, template_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        notification.id, notification.recipientId, notification.recipientEmail, notification.recipientPhone,
        notification.type, notification.channel, notification.subject, notification.message,
        notification.relatedEntityType, notification.relatedEntityId, notification.caseId,
        notification.scheduledAt, notification.status, notification.priority, notification.retryCount,
        notification.maxRetries, JSON.stringify(notification.metadata), notification.templateId,
        notification.createdAt, notification.updatedAt
      ]
    );
  }

  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      recipientId: row.recipient_id,
      recipientEmail: row.recipient_email,
      recipientPhone: row.recipient_phone,
      type: row.type,
      channel: row.channel,
      subject: row.subject,
      message: row.message,
      relatedEntityType: row.related_entity_type,
      relatedEntityId: row.related_entity_id,
      caseId: row.case_id,
      scheduledAt: new Date(row.scheduled_at),
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
      readAt: row.read_at ? new Date(row.read_at) : undefined,
      status: row.status,
      priority: row.priority,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      lastRetryAt: row.last_retry_at ? new Date(row.last_retry_at) : undefined,
      failureReason: row.failure_reason,
      metadata: JSON.parse(row.metadata || '{}'),
      templateId: row.template_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToNotificationTemplate(row: any): NotificationTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      channel: row.channel,
      subjectTemplate: row.subject_template,
      bodyTemplate: row.body_template,
      variables: JSON.parse(row.variables || '[]'),
      triggerConditions: JSON.parse(row.trigger_conditions || '{}'),
      isSystem: row.is_system,
      isActive: row.is_active,
      organizationId: row.organization_id,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToNotificationPreferences(row: any): NotificationPreferences {
    return {
      id: row.id,
      userId: row.user_id,
      notificationType: row.notification_type,
      emailEnabled: row.email_enabled,
      smsEnabled: row.sms_enabled,
      inAppEnabled: row.in_app_enabled,
      pushEnabled: row.push_enabled,
      businessHoursOnly: row.business_hours_only,
      quietHoursStart: row.quiet_hours_start,
      quietHoursEnd: row.quiet_hours_end,
      timezone: row.timezone,
      immediate: row.immediate,
      dailyDigest: row.daily_digest,
      weeklyDigest: row.weekly_digest,
      digestTime: row.digest_time,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export const notificationService = new NotificationService();