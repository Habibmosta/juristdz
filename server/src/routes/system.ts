import { Router } from 'express';
import { serviceOrchestrator } from '@/services/serviceOrchestrator';
import { interServiceCommunication } from '@/utils/interServiceCommunication';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * GET /api/system/health
 * Vérification de santé globale du système
 */
router.get('/health', async (req, res) => {
  try {
    const systemStatus = serviceOrchestrator.getSystemStatus();
    
    res.status(systemStatus.status === 'healthy' ? 200 : 503).json({
      success: true,
      data: systemStatus
    });

  } catch (error) {
    logger.error('Erreur lors de la vérification de santé du système:', error);
    res.status(503).json({
      success: false,
      message: 'Erreur lors de la vérification de santé du système',
      status: 'unhealthy'
    });
  }
});

/**
 * GET /api/system/services
 * État détaillé de tous les services (admin seulement)
 */
router.get('/services', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const servicesHealth = serviceOrchestrator.getServicesHealth();
    
    res.json({
      success: true,
      data: {
        services: servicesHealth,
        summary: {
          total: servicesHealth.length,
          healthy: servicesHealth.filter(s => s.status === 'healthy').length,
          degraded: servicesHealth.filter(s => s.status === 'degraded').length,
          unhealthy: servicesHealth.filter(s => s.status === 'unhealthy').length
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'état des services:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'état des services'
    });
  }
});

/**
 * GET /api/system/services/:serviceName
 * État détaillé d'un service spécifique (admin seulement)
 */
router.get('/services/:serviceName', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { serviceName } = req.params;
    const serviceHealth = serviceOrchestrator.getServiceHealth(serviceName);
    
    if (!serviceHealth) {
      return res.status(404).json({
        success: false,
        message: 'Service non trouvé'
      });
    }

    res.json({
      success: true,
      data: serviceHealth
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'état du service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'état du service'
    });
  }
});

/**
 * GET /api/system/inter-service-calls
 * Statistiques des appels inter-services (admin seulement)
 */
router.get('/inter-service-calls', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const statistics = interServiceCommunication.getCallStatistics();
    
    res.json({
      success: true,
      data: {
        statistics,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques inter-services:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques inter-services'
    });
  }
});

/**
 * GET /api/system/inter-service-calls/:sourceService/:targetService
 * Historique des appels entre deux services spécifiques (admin seulement)
 */
router.get('/inter-service-calls/:sourceService/:targetService', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { sourceService, targetService } = req.params;
    const { limit = 50 } = req.query;
    
    const history = interServiceCommunication.getCallHistory(sourceService, targetService);
    const limitedHistory = history.slice(-parseInt(limit as string));
    
    res.json({
      success: true,
      data: {
        sourceService,
        targetService,
        calls: limitedHistory,
        total: history.length,
        showing: limitedHistory.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'historique des appels:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique des appels'
    });
  }
});

/**
 * POST /api/system/inter-service-calls/clear
 * Nettoie l'historique des appels inter-services (admin seulement)
 */
router.post('/inter-service-calls/clear', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    interServiceCommunication.clearCallHistory();
    
    res.json({
      success: true,
      message: 'Historique des appels inter-services nettoyé',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erreur lors du nettoyage de l\'historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage de l\'historique'
    });
  }
});

/**
 * GET /api/system/metrics
 * Métriques globales du système (admin seulement)
 */
router.get('/metrics', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const systemStatus = serviceOrchestrator.getSystemStatus();
    const interServiceStats = interServiceCommunication.getCallStatistics();
    
    // Métriques système
    const systemMetrics = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };

    res.json({
      success: true,
      data: {
        system: systemMetrics,
        services: {
          status: systemStatus.status,
          criticalServicesHealthy: systemStatus.criticalServicesHealthy,
          totalServices: systemStatus.services.length,
          healthyServices: systemStatus.services.filter(s => s.status === 'healthy').length,
          degradedServices: systemStatus.services.filter(s => s.status === 'degraded').length,
          unhealthyServices: systemStatus.services.filter(s => s.status === 'unhealthy').length
        },
        interServiceCalls: interServiceStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des métriques système:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques système'
    });
  }
});

/**
 * POST /api/system/test-inter-service
 * Test de communication inter-services (admin seulement)
 */
router.post('/test-inter-service', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { sourceService, targetService, method, params } = req.body;
    
    if (!sourceService || !targetService || !method) {
      return res.status(400).json({
        success: false,
        message: 'sourceService, targetService et method sont requis'
      });
    }

    const result = await interServiceCommunication.callService({
      sourceService,
      targetService,
      method,
      params: params || {},
      userId: (req as any).user.id,
      tenantId: (req as any).tenantId
    });

    res.json({
      success: true,
      data: {
        testResult: result,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors du test inter-service:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test inter-service',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/system/status
 * Statut simplifié du système pour les utilisateurs normaux
 */
router.get('/status', async (req, res) => {
  try {
    const systemStatus = serviceOrchestrator.getSystemStatus();
    
    // Version simplifiée pour les utilisateurs non-admin
    res.json({
      success: true,
      data: {
        status: systemStatus.status,
        message: systemStatus.status === 'healthy' 
          ? 'Tous les systèmes fonctionnent normalement'
          : systemStatus.status === 'degraded'
          ? 'Certains services fonctionnent en mode dégradé'
          : 'Des problèmes techniques sont en cours de résolution',
        timestamp: systemStatus.lastCheck
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du statut système:', error);
    res.status(503).json({
      success: false,
      message: 'Impossible de vérifier le statut du système',
      status: 'unknown'
    });
  }
});

export default router;