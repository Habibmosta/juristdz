import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
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
import improvedTranslationRouter from '@/routes/improvedTranslation';
import dataRouter from '@/routes/data';
import rpcRouter from '@/routes/rpc';
import {
  apiGatewayErrorHandler,
  adminRateLimitMiddleware,
  apiGatewayRequestLogger
} from '@/middleware/apiGatewayMiddleware';
import { connectDatabase, getDb } from '@/database/connection';
import { serviceOrchestrator } from '@/services/serviceOrchestrator';
import { rbacService } from '@/services/rbacService';
import { config, configValidationError } from '@/config/environment';

export async function createApp(): Promise<express.Express> {
  if (configValidationError) {
    throw new Error(`Configuration serveur invalide : ${configValidationError}`);
  }

  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: '*',
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  app.use(requestLogger);
  app.use(apiGatewayRequestLogger());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Diagnostic DB (temps réel) : vérifie la connexion à la base.
  // Enregistré sous /api/* (rewrite Vercel) et à la racine (serveur dédié).
  const dbDiagnostic = async (req: express.Request, res: express.Response) => {
    try {
      const { db } = await import('@/database/connection');
      const result = (await db.query(
        "SELECT current_database() AS db, count(*) AS tables FROM information_schema.tables WHERE table_schema = 'public'"
      )) as { rows: Array<{ db: string; tables: number }> };
      res.json({
        status: 'ok',
        database: result.rows[0]?.db,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'error',
        error: err?.code || 'db_unreachable'
      });
    }
  };
  app.get('/health/db', dbDiagnostic);
  app.get('/api/health/db', dbDiagnostic);

  // API routes sans rate limiting (dev)
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/documents', documentRouter);
  app.use('/api/cases', caseRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/billing', billingRouter);
  app.use('/api/rbac', rbacRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/backup', backupRouter);
  app.use('/api/algerian-specificities', algerianSpecificitiesRouter);
  app.use('/api/algerian-legal', algerianLegalRouter);
  app.use('/api/gateway', apiGatewayRouter);
  app.use('/api/data', dataRouter);
  app.use('/api/rpc', rpcRouter);
  app.use('/api/system', systemRouter);
  app.use('/api/monitoring', monitoringRouter);
  app.use('/api/performance', performanceRouter);
  app.use('/api/validation', validationRouter);
  app.use('/api', translationRouter);
  app.use('/api/improved-translation', improvedTranslationRouter);

  // Connect to database (lazy : le pool pg se connecte à la première requête).
  // On ne bloque pas le boot serveurless sur un test de connexion.
  connectDatabase().catch((err) =>
    logger.warn('Connexion DB différée (première requête):', err)
  );

  // Initialize service orchestrator (non bloquant : tables créées en arrière-plan)
  serviceOrchestrator
    .initialize()
    .then(() => logger.info('Service orchestrator initialized successfully'))
    .catch((err) =>
      logger.warn('Service orchestrator initialisation différée:', err)
    );

  // Initialize routes requiring the database connection
  app.use('/api/learning', createLearningRoutes(getDb()));
  logger.info('Learning routes initialized successfully');

  app.use('/api/minutier', createMinutierRoutes(getDb()));
  logger.info('Minutier routes initialized successfully');

  app.use('/api/admin', adminRateLimitMiddleware(), createAdminRoutes(getDb()));
  logger.info('Admin routes initialized successfully');

  app.use('/api/moderation', createModerationRoutes(getDb()));
  logger.info('Moderation routes initialized successfully');

  // Initialize RBAC system (non bloquant, tolérant aux methodes absentes).
  // En serverless, les tables RBAC viennent des migrations : on évite une salve
  // de requêtes au cold start qui sature le pool (max 3) et provoquait des
  // "Connection terminated due to connection timeout". Conservé hors Vercel.
  if (!process.env.VERCEL) {
    (async () => {
      try {
        await (rbacService as any).createTablesIfNotExist?.();
        await (rbacService as any).initializeDefaultRoles?.();
        logger.info('RBAC system initialized successfully');
      } catch (error) {
        logger.warn('RBAC initialization deferred:', error);
      }
    })().catch(() => {});
  }

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

  return app;
}
