import { logger } from '@/utils/logger';
import { notificationService } from '@/services/notificationService';

export class NotificationScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the notification scheduler
   * Processes pending notifications and generates deadline notifications
   */
  start(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      logger.warn('Notification scheduler is already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    logger.info(`Starting notification scheduler with ${intervalMinutes} minute intervals`);

    // Run immediately on start
    this.processNotifications();

    // Schedule recurring processing
    this.intervalId = setInterval(() => {
      this.processNotifications();
    }, intervalMs);
  }

  /**
   * Stop the notification scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Notification scheduler is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    logger.info('Notification scheduler stopped');
  }

  /**
   * Check if scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Process notifications manually (can be called via API)
   */
  async processNotificationsManually(): Promise<{ processed: number; generated: number }> {
    return await this.processNotifications();
  }

  /**
   * Internal method to process notifications
   */
  private async processNotifications(): Promise<{ processed: number; generated: number }> {
    try {
      logger.debug('Processing notifications...');

      // Generate deadline notifications first
      const generatedCount = await notificationService.generateDeadlineNotifications();
      if (generatedCount > 0) {
        logger.info(`Generated ${generatedCount} deadline notifications`);
      }

      // Process pending notifications
      const processedCount = await notificationService.processPendingNotifications(100);
      if (processedCount > 0) {
        logger.info(`Processed ${processedCount} pending notifications`);
      }

      return {
        processed: processedCount,
        generated: generatedCount
      };

    } catch (error) {
      logger.error('Error processing notifications:', error);
      return { processed: 0, generated: 0 };
    }
  }
}

export const notificationScheduler = new NotificationScheduler();