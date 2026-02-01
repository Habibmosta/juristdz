import { Router } from 'express';
import { apiGatewayService } from '@/services/apiGatewayService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * GET /api/gateway/metrics
 * Obtient les métriques de la passerelle API (admin seulement)
 */
router.get('/metrics', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const metrics = apiGatewayService.getMetrics();
    
    res.json({
      success: true,
      data: {
        ...metrics,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des métriques de la passerelle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques'
    });
  }
});

/**
 * GET /api/gateway/health
 * Vérification de santé de la passerelle API
 */
router.get('/health', async (req, res) => {
  try {
    const metrics = apiGatewayService.getMetrics();
    const isHealthy = metrics.summary.errorRate < 10; // Moins de 10% d'erreurs
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      gateway: {
        version: '1.0.0',
        uptime: process.uptime(),
        metrics: {
          totalRequests: metrics.summary.totalRequests,
          errorRate: metrics.summary.errorRate,
          cacheSize: metrics.cache.size,
          registeredRoutes: metrics.summary.registeredRoutes
        },
        checks: {
          errorRate: {
            status: metrics.summary.errorRate < 10 ? 'pass' : 'fail',
            value: metrics.summary.errorRate,
            threshold: 10
          },
          cacheSize: {
            status: metrics.cache.size < 10000 ? 'pass' : 'warn',
            value: metrics.cache.size,
            threshold: 10000
          }
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la vérification de santé de la passerelle:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Erreur interne de la passerelle'
    });
  }
});

/**
 * GET /api/gateway/routes
 * Liste les routes enregistrées dans la passerelle (admin seulement)
 */
router.get('/routes', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const metrics = apiGatewayService.getMetrics();
    
    res.json({
      success: true,
      data: {
        routes: metrics.routes,
        total: metrics.summary.registeredRoutes,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des routes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des routes'
    });
  }
});

/**
 * POST /api/gateway/cache/clear
 * Vide le cache de la passerelle (admin seulement)
 */
router.post('/cache/clear', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    // Accéder au cache privé via une méthode publique
    const beforeSize = apiGatewayService.getMetrics().cache.size;
    
    // Forcer le nettoyage du cache en accédant à la propriété privée
    (apiGatewayService as any).cache.clear();
    
    const afterSize = apiGatewayService.getMetrics().cache.size;
    
    logger.info(`Cache de la passerelle vidé: ${beforeSize} -> ${afterSize} entrées`);
    
    res.json({
      success: true,
      message: 'Cache vidé avec succès',
      data: {
        entriesCleared: beforeSize,
        remainingEntries: afterSize,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors du vidage du cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du vidage du cache'
    });
  }
});

/**
 * GET /api/gateway/stats/summary
 * Résumé des statistiques de la passerelle
 */
router.get('/stats/summary', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const metrics = apiGatewayService.getMetrics();
    
    // Calculer des statistiques supplémentaires
    const topRoutes = metrics.routes
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
    
    const errorRoutes = metrics.routes
      .filter(route => route.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5);
    
    const slowRoutes = metrics.routes
      .filter(route => route.avgResponseTime > 1000) // Plus de 1 seconde
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        summary: metrics.summary,
        insights: {
          topRoutes,
          errorRoutes,
          slowRoutes,
          performance: {
            avgResponseTime: metrics.routes.reduce((sum, route) => sum + route.avgResponseTime, 0) / metrics.routes.length || 0,
            totalResponseTime: metrics.routes.reduce((sum, route) => sum + route.totalTime, 0)
          }
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du résumé des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

/**
 * GET /api/gateway/config
 * Obtient la configuration actuelle de la passerelle (admin seulement)
 */
router.get('/config', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    // Accéder à la configuration via une propriété publique
    const config = (apiGatewayService as any).config;
    
    res.json({
      success: true,
      data: {
        config,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de la configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la configuration'
    });
  }
});

/**
 * POST /api/gateway/test
 * Endpoint de test pour la passerelle
 */
router.post('/test', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { delay = 0, error = false, cacheTest = false } = req.body;
    
    // Simuler un délai si demandé
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Simuler une erreur si demandée
    if (error) {
      throw new Error('Erreur de test simulée');
    }
    
    const response = {
      success: true,
      message: 'Test de la passerelle réussi',
      data: {
        timestamp: new Date().toISOString(),
        delay,
        cacheTest,
        requestId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };
    
    // Ajouter des headers de cache si c'est un test de cache
    if (cacheTest) {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
    
    res.json(response);

  } catch (error) {
    logger.error('Erreur lors du test de la passerelle:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur de test'
    });
  }
});

export default router;