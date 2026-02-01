import { Request, Response, NextFunction } from 'express';
import { apiGatewayService } from '@/services/apiGatewayService';
import { logger } from '@/utils/logger';

/**
 * Middleware d'intégration de la passerelle API
 */

/**
 * Middleware principal de la passerelle API
 * Applique le routage intelligent, la limitation de débit, et la mise en cache
 */
export const apiGatewayMiddleware = () => {
  return [
    // Timeout global
    apiGatewayService.timeoutMiddleware(),
    
    // Limitation de débit par défaut
    apiGatewayService.createRateLimiter(),
    
    // Routage intelligent
    apiGatewayService.routingMiddleware(),
    
    // Mise en cache des réponses
    apiGatewayService.cacheMiddleware()
  ];
};

/**
 * Middleware de limitation de débit spécialisé pour l'authentification
 */
export const authRateLimitMiddleware = () => {
  return apiGatewayService.createRateLimiter({
    path: '/api/auth/*',
    method: 'POST',
    service: 'auth',
    handler: 'authenticate',
    roles: ['public'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 tentatives maximum
      message: {
        error: 'Trop de tentatives de connexion',
        message: 'Vous avez dépassé le nombre maximum de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
        retryAfter: 900 // 15 minutes en secondes
      }
    }
  });
};

/**
 * Middleware de limitation de débit pour les recherches
 */
export const searchRateLimitMiddleware = () => {
  return apiGatewayService.createRateLimiter({
    path: '/api/search/*',
    method: 'GET',
    service: 'search',
    handler: 'search',
    roles: ['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'etudiant_droit'],
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 recherches par minute
      message: {
        error: 'Limite de recherche dépassée',
        message: 'Vous avez effectué trop de recherches. Veuillez attendre avant de continuer.',
        retryAfter: 60
      }
    }
  });
};

/**
 * Middleware de limitation de débit pour la facturation
 */
export const billingRateLimitMiddleware = () => {
  return apiGatewayService.createRateLimiter({
    path: '/api/billing/*',
    method: 'POST',
    service: 'billing',
    handler: 'calculate',
    roles: ['avocat', 'notaire', 'huissier'],
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      max: 20, // 20 calculs par minute
      message: {
        error: 'Limite de calcul dépassée',
        message: 'Vous avez effectué trop de calculs de facturation. Veuillez attendre avant de continuer.',
        retryAfter: 60
      }
    }
  });
};

/**
 * Middleware de limitation de débit pour l'administration
 */
export const adminRateLimitMiddleware = () => {
  return apiGatewayService.createRateLimiter({
    path: '/api/admin/*',
    method: 'GET',
    service: 'admin',
    handler: 'getStats',
    roles: ['administrateur_plateforme'],
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 requêtes par minute
      message: {
        error: 'Limite d\'administration dépassée',
        message: 'Trop de requêtes administratives. Veuillez attendre avant de continuer.',
        retryAfter: 60
      }
    }
  });
};

/**
 * Middleware de gestion centralisée des erreurs de la passerelle
 */
export const apiGatewayErrorHandler = () => {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    // Déléguer à la passerelle API pour une gestion centralisée
    apiGatewayService.handleGatewayError(error, req, res, next);
  };
};

/**
 * Middleware de métriques de la passerelle API
 */
export const apiGatewayMetricsMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ajouter les métriques à la réponse pour les administrateurs
    if ((req as any).user?.role === 'administrateur_plateforme' && req.path === '/api/admin/gateway-metrics') {
      const metrics = apiGatewayService.getMetrics();
      return res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

/**
 * Middleware de validation des requêtes
 */
export const requestValidationMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validation de base des headers
      const contentType = req.get('Content-Type');
      
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (!contentType || !contentType.includes('application/json')) {
          return res.status(400).json({
            error: 'Type de contenu invalide',
            message: 'Le type de contenu doit être application/json pour les requêtes POST/PUT/PATCH'
          });
        }
      }

      // Validation de la taille du body
      const contentLength = req.get('Content-Length');
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
        return res.status(413).json({
          error: 'Contenu trop volumineux',
          message: 'La taille du contenu ne peut pas dépasser 10MB'
        });
      }

      // Validation des paramètres de pagination
      if (req.query.page && isNaN(Number(req.query.page))) {
        return res.status(400).json({
          error: 'Paramètre invalide',
          message: 'Le paramètre "page" doit être un nombre'
        });
      }

      if (req.query.limit && isNaN(Number(req.query.limit))) {
        return res.status(400).json({
          error: 'Paramètre invalide',
          message: 'Le paramètre "limit" doit être un nombre'
        });
      }

      // Limiter la taille des paramètres de pagination
      if (req.query.limit && Number(req.query.limit) > 100) {
        return res.status(400).json({
          error: 'Limite dépassée',
          message: 'La limite ne peut pas dépasser 100 éléments'
        });
      }

      next();
    } catch (error) {
      logger.error('Erreur de validation de requête:', error);
      res.status(400).json({
        error: 'Requête invalide',
        message: 'La requête contient des données invalides'
      });
    }
  };
};

/**
 * Middleware de logging des requêtes pour la passerelle
 */
export const apiGatewayRequestLogger = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Log de la requête entrante
    logger.info(`API Gateway: ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      tenantId: (req as any).tenantId
    });

    // Intercepter la réponse pour logger la sortie
    const originalSend = res.send;
    res.send = function(data: any) {
      const responseTime = Date.now() - startTime;
      
      logger.info(`API Gateway Response: ${req.method} ${req.path} - ${res.statusCode}`, {
        responseTime: `${responseTime}ms`,
        contentLength: res.get('Content-Length') || 0,
        userId: (req as any).user?.id,
        tenantId: (req as any).tenantId
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Middleware de santé de la passerelle API
 */
export const apiGatewayHealthCheck = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/api/gateway/health') {
      const metrics = apiGatewayService.getMetrics();
      
      return res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        gateway: {
          version: '1.0.0',
          uptime: process.uptime(),
          metrics: {
            totalRequests: metrics.summary.totalRequests,
            errorRate: metrics.summary.errorRate,
            cacheSize: metrics.cache.size,
            registeredRoutes: metrics.summary.registeredRoutes
          }
        }
      });
    }
    
    next();
  };
};