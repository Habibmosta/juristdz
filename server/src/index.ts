import { config } from '@/config/environment';
import { logger } from '@/utils/logger';
import { createApp } from './app';
import { sessionCleanupService } from '@/services/sessionCleanupService';
import { notificationScheduler } from '@/services/notificationScheduler';
import { rbacService } from '@/services/rbacService';
import { closeDatabase } from '@/database/connection';
import { serviceOrchestrator } from '@/services/serviceOrchestrator';

async function startServer() {
  try {
    const app = await createApp();

    // Start session cleanup service
    sessionCleanupService.start();

    // Start notification scheduler
    notificationScheduler.start(5); // Process every 5 minutes

    // Start RBAC cleanup service
    setInterval(async () => {
      try {
        await rbacService.cleanupExpiredData();
      } catch (error) {
        logger.error('RBAC cleanup error:', error);
      }
    }, 60 * 60 * 1000); // Run every hour

    // Start server
    const port = config.server.port;
    app.listen(port, () => {
      logger.info(`JuristDZ Server running on port ${port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  sessionCleanupService.stop();
  notificationScheduler.stop();
  await serviceOrchestrator.shutdown();
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  sessionCleanupService.stop();
  notificationScheduler.stop();
  await serviceOrchestrator.shutdown();
  await closeDatabase();
  process.exit(0);
});

startServer();
