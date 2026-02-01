import express from 'express';
import { notificationService } from '@/services/notificationService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';
import {
  CreateNotificationRequest,
  UpdateNotificationPreferencesRequest,
  NotificationSearchCriteria,
  BulkNotificationRequest,
  DeadlineReminderConfig,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority
} from '@/types/notification';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * Create a new notification
 * POST /api/notifications
 */
router.post('/', rbacMiddleware(['notification:create']), async (req, res) => {
  try {
    const notificationData: CreateNotificationRequest = req.body;
    const organizationId = (req as any).user?.organizationId;

    const notification = await notificationService.createNotification(notificationData, organizationId);

    res.status(201).json({
      success: true,
      data: notification
    });

  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
});

/**
 * Create notification from template
 * POST /api/notifications/from-template
 */
router.post('/from-template', rbacMiddleware(['notification:create']), async (req, res) => {
  try {
    const { templateId, recipientId, context, scheduledAt, priority } = req.body;

    const notification = await notificationService.createNotificationFromTemplate(
      templateId,
      recipientId,
      context,
      scheduledAt ? new Date(scheduledAt) : undefined,
      priority
    );

    res.status(201).json({
      success: true,
      data: notification
    });

  } catch (error) {
    logger.error('Create notification from template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification from template'
    });
  }
});

/**
 * Create bulk notifications
 * POST /api/notifications/bulk
 */
router.post('/bulk', rbacMiddleware(['notification:create', 'notification:bulk']), async (req, res) => {
  try {
    const bulkRequest: BulkNotificationRequest = req.body;

    const result = await notificationService.createBulkNotifications(bulkRequest);

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Create bulk notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk notifications'
    });
  }
});

/**
 * Search notifications
 * GET /api/notifications/search
 */
router.get('/search', rbacMiddleware(['notification:read']), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const criteria: NotificationSearchCriteria = {
      recipientId: req.query.recipientId as string,
      type: req.query.type as NotificationType,
      channel: req.query.channel as NotificationChannel,
      status: req.query.status as NotificationStatus,
      priority: req.query.priority as NotificationPriority,
      caseId: req.query.caseId as string,
      dateRange: req.query.from || req.query.to ? {
        from: req.query.from ? new Date(req.query.from as string) : undefined,
        to: req.query.to ? new Date(req.query.to as string) : undefined
      } : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    // Non-admin users can only see their own notifications
    if (userRole !== 'Administrateur_Plateforme') {
      criteria.recipientId = userId;
    }

    const result = await notificationService.searchNotifications(criteria);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Search notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search notifications'
    });
  }
});

/**
 * Get user's notifications
 * GET /api/notifications/my
 */
router.get('/my', async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const criteria: NotificationSearchCriteria = {
      recipientId: userId,
      status: req.query.status as NotificationStatus,
      type: req.query.type as NotificationType,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sortBy: 'created_at',
      sortOrder: 'desc'
    };

    const result = await notificationService.searchNotifications(criteria);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notifications'
    });
  }
});

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = (req as any).user.id;

    // Update notification status to read
    await notificationService.updateNotificationStatus(
      notificationId, 
      NotificationStatus.READ, 
      undefined, 
      undefined
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

/**
 * Get notification preferences
 * GET /api/notifications/preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const preferences = await notificationService.getUserNotificationPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    logger.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notification preferences'
    });
  }
});

/**
 * Update notification preferences
 * PUT /api/notifications/preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const updates: UpdateNotificationPreferencesRequest = req.body;

    const preferences = await notificationService.updateNotificationPreferences(userId, updates);

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    logger.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

/**
 * Configure deadline reminders
 * POST /api/notifications/deadline-reminders
 */
router.post('/deadline-reminders', rbacMiddleware(['case:manage']), async (req, res) => {
  try {
    const config: DeadlineReminderConfig = req.body;

    await notificationService.configureDeadlineReminders(config);

    res.json({
      success: true,
      message: 'Deadline reminders configured successfully'
    });

  } catch (error) {
    logger.error('Configure deadline reminders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure deadline reminders'
    });
  }
});

/**
 * Generate deadline notifications (admin only)
 * POST /api/notifications/generate-deadline-notifications
 */
router.post('/generate-deadline-notifications', rbacMiddleware(['admin:manage']), async (req, res) => {
  try {
    const count = await notificationService.generateDeadlineNotifications();

    res.json({
      success: true,
      data: { notificationsCreated: count }
    });

  } catch (error) {
    logger.error('Generate deadline notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate deadline notifications'
    });
  }
});

/**
 * Process pending notifications (admin only)
 * POST /api/notifications/process-pending
 */
router.post('/process-pending', rbacMiddleware(['admin:manage']), async (req, res) => {
  try {
    const batchSize = req.body.batchSize || 100;
    const count = await notificationService.processPendingNotifications(batchSize);

    res.json({
      success: true,
      data: { notificationsProcessed: count }
    });

  } catch (error) {
    logger.error('Process pending notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process pending notifications'
    });
  }
});

/**
 * Get notification statistics
 * GET /api/notifications/statistics
 */
router.get('/statistics', rbacMiddleware(['notification:read']), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    
    // Admin can see all statistics, others only their own
    const targetUserId = userRole === 'Administrateur_Plateforme' ? 
      (req.query.userId as string) : userId;

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const statistics = await notificationService.getNotificationStatistics(
      targetUserId, 
      startDate, 
      endDate
    );

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Get notification statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notification statistics'
    });
  }
});

/**
 * Get notification types and channels (for UI dropdowns)
 * GET /api/notifications/metadata
 */
router.get('/metadata', async (req, res) => {
  try {
    const metadata = {
      types: Object.values(NotificationType),
      channels: Object.values(NotificationChannel),
      statuses: Object.values(NotificationStatus),
      priorities: Object.values(NotificationPriority)
    };

    res.json({
      success: true,
      data: metadata
    });

  } catch (error) {
    logger.error('Get notification metadata error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve notification metadata'
    });
  }
});

export default router;