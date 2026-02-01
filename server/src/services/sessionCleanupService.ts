import { authService } from './authService';
import { logger } from '@/utils/logger';

export class SessionCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly intervalMinutes = 60; // Run cleanup every hour

  /**
   * Start the session cleanup service
   */
  start(): void {
    if (this.cleanupInterval) {
      logger.warn('Session cleanup service is already running');
      return;
    }

    logger.info('Starting session cleanup service');
    
    // Run cleanup immediately
    this.runCleanup();
    
    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, this.intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the session cleanup service
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Session cleanup service stopped');
    }
  }

  /**
   * Run session cleanup
   */
  private async runCleanup(): Promise<void> {
    try {
      await authService.cleanExpiredSessions();
    } catch (error) {
      logger.error('Session cleanup failed:', error);
    }
  }
}

export const sessionCleanupService = new SessionCleanupService();