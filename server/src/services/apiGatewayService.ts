import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '@/utils/logger';
import { auditService } from '@/services/auditService';
import { monitoringService } from '@/services/monitoringService';

/**
 * Service de passerelle API unifiée
 * Gère le routage intelligent, la limitation de débit, et la centralisation des erreurs
 */

export interface ApiRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  service: string;
  handler: string;
  roles: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
    message?: string;
  };
  cache?: {
    ttl: number; // Time to live in seconds
    key?: string; // Custom cache key pattern
  };
  validation?: {
    body?: any;
    query?: any;
    params?: any;
  };
}

export interface ApiGatewayConfig {
  defaultRateLimit: {
    windowMs: number;
    max: number;
  };
  globalTimeout: number;
  enableCaching: boolean;
  enableMetrics: boolean;
  enableAudit: boolean;
}

export class ApiGatewayService {
  private routes: Map<string, ApiRoute> = new Map();
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private config: ApiGatewayConfig;
  private metrics: Map<string, {
    requests: number;
    errors: number;
    totalTime: number;
    avgResponseTime: number;
  }> = new Map();

  constructor(config: ApiGatewayConfig) {
    this.config = config;
    this.startCacheCleanup();
    this.startMetricsReporting();
  }

  /**
   * Enregistre une route dans la passerelle
   */
  registerRoute(route: ApiRoute): void {
    const routeKey = `${route.method}:${route.path}`;
    this.routes.set(routeKey, route);
    
    // Initialiser les métriques pour cette route
    this.metrics.set(routeKey, {
      requests: 0,
      errors: 0,
      totalTime: 0,
      avgResponseTime: 0
    });

    logger.info(`Route enregistrée: ${routeKey} -> ${route.service}.${route.handler}`);
  }

  /**
   * Middleware de routage intelligent
   */
  routingMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const routeKey = `${req.method}:${req.route?.path || req.path}`;
      const route = this.routes.get(routeKey);

      if (!route) {
        return next(); // Laisser passer si la route n'est pas gérée par la passerelle
      }

      try {
        // Mise à jour des métriques
        const routeMetrics = this.metrics.get(routeKey)!;
        routeMetrics.requests++;

        // Vérification du cache
        if (route.cache && req.method === 'GET') {
          const cacheKey = this.generateCacheKey(req, route);
          const cached = this.cache.get(cacheKey);
          
          if (cached && cached.expires > Date.now()) {
            logger.debug(`Cache hit pour ${routeKey}`);
            res.json(cached.data);
            return;
          }
        }

        // Audit de la requête
        if (this.config.enableAudit) {
          await auditService.logApiAccess({
            userId: (req as any).user?.id || 'anonymous',
            tenantId: (req as any).tenantId || 'default',
            action: `${req.method} ${req.path}`,
            resource: route.service,
            details: {
              userAgent: req.get('User-Agent'),
              ip: req.ip,
              route: routeKey
            }
          });
        }

        // Continuer vers le handler de route
        next();

      } catch (error) {
        const routeMetrics = this.metrics.get(routeKey)!;
        routeMetrics.errors++;
        
        logger.error(`Erreur dans le routage pour ${routeKey}:`, error);
        this.handleGatewayError(error, req, res, next);
      } finally {
        // Calculer le temps de réponse
        const responseTime = Date.now() - startTime;
        const routeMetrics = this.metrics.get(routeKey);
        if (routeMetrics) {
          routeMetrics.totalTime += responseTime;
          routeMetrics.avgResponseTime = routeMetrics.totalTime / routeMetrics.requests;
        }
      }
    };
  }

  /**
   * Middleware de limitation de débit
   */
  createRateLimiter(route?: ApiRoute) {
    const rateLimitConfig = route?.rateLimit || this.config.defaultRateLimit;
    
    return rateLimit({
      windowMs: rateLimitConfig.windowMs,
      max: rateLimitConfig.max,
      message: route?.rateLimit?.message || {
        error: 'Trop de requêtes',
        message: 'Limite de débit dépassée. Veuillez réessayer plus tard.',
        retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        logger.warn(`Rate limit dépassé pour ${req.ip} sur ${req.path}`);
        
        // Audit de la limitation
        if (this.config.enableAudit) {
          auditService.logSecurityEvent({
            type: 'rate_limit_exceeded',
            userId: (req as any).user?.id || 'anonymous',
            tenantId: (req as any).tenantId || 'default',
            details: {
              ip: req.ip,
              path: req.path,
              userAgent: req.get('User-Agent')
            },
            severity: 'medium'
          });
        }

        res.status(429).json({
          error: 'Trop de requêtes',
          message: 'Limite de débit dépassée. Veuillez réessayer plus tard.',
          retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000)
        });
      }
    });
  }

  /**
   * Middleware de mise en cache des réponses
   */
  cacheMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enableCaching || req.method !== 'GET') {
        return next();
      }

      const routeKey = `${req.method}:${req.route?.path || req.path}`;
      const route = this.routes.get(routeKey);

      if (!route?.cache) {
        return next();
      }

      const originalJson = res.json;
      res.json = function(data: any) {
        // Mettre en cache la réponse
        const cacheKey = this.generateCacheKey(req, route);
        const expires = Date.now() + (route.cache!.ttl * 1000);
        
        this.cache.set(cacheKey, { data, expires });
        logger.debug(`Réponse mise en cache pour ${routeKey}`);

        return originalJson.call(this, data);
      }.bind(this);

      next();
    };
  }

  /**
   * Middleware de timeout global
   */
  timeoutMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          logger.warn(`Timeout pour ${req.method} ${req.path}`);
          res.status(408).json({
            error: 'Timeout',
            message: 'La requête a pris trop de temps à traiter'
          });
        }
      }, this.config.globalTimeout);

      res.on('finish', () => {
        clearTimeout(timeout);
      });

      next();
    };
  }

  /**
   * Gestionnaire d'erreurs centralisé
   */
  handleGatewayError(error: any, req: Request, res: Response, next: NextFunction) {
    const errorId = this.generateErrorId();
    
    logger.error(`Erreur API Gateway [${errorId}]:`, {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id,
      tenantId: (req as any).tenantId
    });

    // Audit de l'erreur
    if (this.config.enableAudit) {
      auditService.logSecurityEvent({
        type: 'api_error',
        userId: (req as any).user?.id || 'anonymous',
        tenantId: (req as any).tenantId || 'default',
        details: {
          errorId,
          error: error.message,
          path: req.path,
          method: req.method
        },
        severity: 'high'
      });
    }

    // Réponse d'erreur standardisée
    if (!res.headersSent) {
      const statusCode = error.statusCode || error.status || 500;
      
      res.status(statusCode).json({
        error: 'Erreur interne',
        message: statusCode === 500 
          ? 'Une erreur interne s\'est produite' 
          : error.message,
        errorId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtient les métriques de la passerelle
   */
  getMetrics(): any {
    const totalRequests = Array.from(this.metrics.values())
      .reduce((sum, metric) => sum + metric.requests, 0);
    
    const totalErrors = Array.from(this.metrics.values())
      .reduce((sum, metric) => sum + metric.errors, 0);

    const routeMetrics = Array.from(this.metrics.entries()).map(([route, metrics]) => ({
      route,
      ...metrics,
      errorRate: metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0
    }));

    return {
      summary: {
        totalRequests,
        totalErrors,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
        cacheSize: this.cache.size,
        registeredRoutes: this.routes.size
      },
      routes: routeMetrics,
      cache: {
        size: this.cache.size,
        hitRate: this.calculateCacheHitRate()
      }
    };
  }

  /**
   * Nettoie le cache expiré
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, value] of this.cache.entries()) {
        if (value.expires <= now) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug(`Cache nettoyé: ${cleaned} entrées supprimées`);
      }
    }, 60000); // Nettoyer toutes les minutes
  }

  /**
   * Démarre le reporting des métriques
   */
  private startMetricsReporting(): void {
    if (!this.config.enableMetrics) return;

    setInterval(() => {
      const metrics = this.getMetrics();
      monitoringService.recordMetric('api_gateway_requests_total', metrics.summary.totalRequests);
      monitoringService.recordMetric('api_gateway_errors_total', metrics.summary.totalErrors);
      monitoringService.recordMetric('api_gateway_error_rate', metrics.summary.errorRate);
      monitoringService.recordMetric('api_gateway_cache_size', metrics.cache.size);
    }, 30000); // Reporter toutes les 30 secondes
  }

  /**
   * Génère une clé de cache
   */
  private generateCacheKey(req: Request, route: ApiRoute): string {
    if (route.cache?.key) {
      return route.cache.key
        .replace(':path', req.path)
        .replace(':query', JSON.stringify(req.query))
        .replace(':user', (req as any).user?.id || 'anonymous');
    }

    return `${req.path}:${JSON.stringify(req.query)}:${(req as any).user?.id || 'anonymous'}`;
  }

  /**
   * Génère un ID d'erreur unique
   */
  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calcule le taux de succès du cache
   */
  private calculateCacheHitRate(): number {
    // Implémentation simplifiée - en production, utiliser des compteurs dédiés
    return 0; // Placeholder
  }
}

// Configuration par défaut
const defaultConfig: ApiGatewayConfig = {
  defaultRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requêtes par fenêtre
  },
  globalTimeout: 30000, // 30 secondes
  enableCaching: true,
  enableMetrics: true,
  enableAudit: true
};

export const apiGatewayService = new ApiGatewayService(defaultConfig);

// Enregistrement des routes principales
apiGatewayService.registerRoute({
  path: '/api/auth/*',
  method: 'POST',
  service: 'auth',
  handler: 'authenticate',
  roles: ['public'],
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 5, // Limite stricte pour l'authentification
    message: 'Trop de tentatives de connexion'
  }
});

apiGatewayService.registerRoute({
  path: '/api/search/*',
  method: 'GET',
  service: 'search',
  handler: 'search',
  roles: ['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'etudiant_droit'],
  cache: {
    ttl: 300, // 5 minutes
    key: 'search::query::user'
  }
});

apiGatewayService.registerRoute({
  path: '/api/documents/*',
  method: 'GET',
  service: 'documents',
  handler: 'getDocument',
  roles: ['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise'],
  cache: {
    ttl: 600, // 10 minutes
  }
});

apiGatewayService.registerRoute({
  path: '/api/billing/*',
  method: 'POST',
  service: 'billing',
  handler: 'calculate',
  roles: ['avocat', 'notaire', 'huissier'],
  rateLimit: {
    windowMs: 60 * 1000,
    max: 20 // 20 calculs par minute
  }
});

apiGatewayService.registerRoute({
  path: '/api/admin/*',
  method: 'GET',
  service: 'admin',
  handler: 'getStats',
  roles: ['administrateur_plateforme'],
  rateLimit: {
    windowMs: 60 * 1000,
    max: 30
  }
});