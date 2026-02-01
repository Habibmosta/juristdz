import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
import { 
  initializeTenantContext, 
  validateResourceAccess, 
  encryptSensitiveData, 
  decryptResponseData, 
  auditDataAccess, 
  detectIntrusions, 
  encryptResponse 
} from '@/middleware/securityMiddleware';
import { authRouter } from '@/routes/auth';
import { userRouter } from '@/routes/users';
import documentRouter from '@/routes/documents';
import searchRouter from '@/routes/search';
import { billingRouter } from '@/routes/billing';
import { createAdminRoutes } from '@/routes/admin';
import { createModerationRoutes } from '@/routes/moderation';
import { auditRouter } from '@/routes/audit';
import { backupRouter } from '@/routes/backup';
import rbacRouter from '@/routes/rbacRoutes';
import caseRouter from '@/routes/cases';
import notificationRouter from '@/routes/notifications';
import { createLearningRoutes } from '@/routes/learning';
import { createMinutierRoutes } from '@/routes/minutier';
import algerianSpecificitiesRouter from '@/routes/algerianSpecificities';
import { algerianLegalRouter } from '@/routes/algerianLegal';
import apiGatewayRouter from '@/routes/apiGateway';
import systemRouter from '@/routes/system';
import monitoringRouter from '@/routes/monitoring';
import performanceRouter from '@/routes/performance';
import validationRouter from '@/routes/validation';
import translationRouter from '@/routes/translation';
import { 
  apiGatewayMiddleware,
  authRateLimitMiddleware,
  searchRateLimitMiddleware,
  billingRateLimitMiddleware,
  adminRateLimitMiddleware,
  apiGatewayErrorHandler,
  requestValidationMiddleware,
  apiGatewayRequestLogger,
  apiGatewayHealthCheck
} from '@/middleware/apiGatewayMiddleware';
import { connectDatabase, getDb } from '@/database/connection';
import { serviceOrchestrator } from '@/services/serviceOrchestrator';
import { sessionCleanupService } from '@/services/sessionCleanupService';
import { rbacService } from '@/services/rbacService';
import { notificationScheduler } from '@/services/notificationScheduler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(requestLogger);
app.use(apiGatewayRequestLogger());

// API Gateway middleware
app.use(requestValidationMiddleware());
app.use(apiGatewayHealthCheck());
app.use(...apiGatewayMiddleware());

// Security middleware for tenant isolation and encryption
app.use(detectIntrusions);
app.use(initializeTenantContext);
app.use(encryptSensitiveData);
app.use(decryptResponseData);
app.use(encryptResponse);
app.use(auditDataAccess('api_access'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes with specific rate limiting
app.use('/api/auth', authRateLimitMiddleware(), authRouter);
app.use('/api/users', userRouter);
app.use('/api/documents', documentRouter);
app.use('/api/cases', caseRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/search', searchRateLimitMiddleware(), searchRouter);
app.use('/api/billing', billingRateLimitMiddleware(), billingRouter);
app.use('/api/rbac', rbacRouter);
app.use('/api/audit', auditRouter);
app.use('/api/backup', backupRouter);
app.use('/api/algerian-specificities', algerianSpecificitiesRouter);
app.use('/api/algerian-legal', algerianLegalRouter);
app.use('/api/gateway', apiGatewayRouter);
app.use('/api/system', systemRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/validation', validationRouter);
app.use('/api', translationRouter);

// Learning routes (initialized after database connection)
let learningRouter: express.Router;
let minutierRouter: express.Router;
let adminRouter: express.Router;
let moderationRouter: express.Router;

// Error handling middleware (must be last)
app.use(apiGatewayErrorHandler());
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Initialize service orchestrator
    await serviceOrchestrator.initialize();
    logger.info('Service orchestrator initialized successfully');

    // Initialize learning routes with database connection
    learningRouter = createLearningRoutes(getDb());
    app.use('/api/learning', learningRouter);
    logger.info('Learning routes initialized successfully');

    // Initialize minutier routes with database connection
    minutierRouter = createMinutierRoutes(getDb());
    app.use('/api/minutier', minutierRouter);
    logger.info('Minutier routes initialized successfully');

    // Initialize admin routes with database connection
    adminRouter = createAdminRoutes(getDb());
    app.use('/api/admin', adminRateLimitMiddleware(), adminRouter);
    logger.info('Admin routes initialized successfully');

    // Initialize moderation routes with database connection
    moderationRouter = createModerationRoutes(getDb());
    app.use('/api/moderation', moderationRouter);
    logger.info('Moderation routes initialized successfully');

    // Initialize RBAC system
    try {
      await rbacService.initializeDefaultRoles();
      logger.info('RBAC system initialized successfully');
    } catch (error) {
      logger.warn('RBAC initialization failed, continuing without default roles:', error);
    }

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
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  sessionCleanupService.stop();
  notificationScheduler.stop();
  await serviceOrchestrator.shutdown();
  process.exit(0);
});

startServer();