import { Router } from 'express';
import { monitoringService } from '@/services/monitoringService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * GET /api/monitoring/dashboard
 * Tableau de bord de monitoring en temps réel (admin seulement)
 */
router.get('/dashboard', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { tenantId } = req.query;
    
    // Obtenir l'état de santé du système
    const systemHealth = await monitoringService.getSystemHealth();
    
    // Obtenir les métriques de performance
    const performanceMetrics = await monitoringService.getPerformanceMetrics(tenantId as string);
    
    // Obtenir les alertes actives
    const activeAlerts = monitoringService.getActiveAlerts(tenantId as string);
    
    res.json({
      success: true,
      data: {
        systemHealth,
        performanceMetrics,
        activeAlerts: {
          total: activeAlerts.length,
          critical: activeAlerts.filter(a => a.severity === 'critical').length,
          high: activeAlerts.filter(a => a.severity === 'high').length,
          medium: activeAlerts.filter(a => a.severity === 'medium').length,
          low: activeAlerts.filter(a => a.severity === 'low').length,
          alerts: activeAlerts.slice(0, 10) // Dernières 10 alertes
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du tableau de bord:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du tableau de bord'
    });
  }
});

/**
 * GET /api/monitoring/health
 * État de santé détaillé du système
 */
router.get('/health', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const systemHealth = await monitoringService.getSystemHealth();
    
    res.status(systemHealth.overall === 'healthy' ? 200 : 503).json({
      success: true,
      data: systemHealth
    });

  } catch (error) {
    logger.error('Erreur lors de la vérification de santé:', error);
    res.status(503).json({
      success: false,
      message: 'Erreur lors de la vérification de santé du système',
      data: {
        overall: 'critical',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    });
  }
});

/**
 * GET /api/monitoring/metrics
 * Métriques de performance détaillées
 */
router.get('/metrics', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { tenantId, period = '1h' } = req.query;
    
    const performanceMetrics = await monitoringService.getPerformanceMetrics(tenantId as string);
    
    res.json({
      success: true,
      data: {
        current: performanceMetrics,
        period: period,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des métriques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques'
    });
  }
});

/**
 * GET /api/monitoring/alerts
 * Liste des alertes avec filtrage
 */
router.get('/alerts', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { tenantId, severity, status, limit = 50, offset = 0 } = req.query;
    
    let alerts = monitoringService.getActiveAlerts(tenantId as string);
    
    // Filtrer par sévérité
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    
    // Filtrer par statut
    if (status) {
      alerts = alerts.filter(a => a.status === status);
    }
    
    // Pagination
    const total = alerts.length;
    const paginatedAlerts = alerts
      .slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));
    
    res.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + parseInt(limit as string) < total
        }
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes'
    });
  }
});

/**
 * POST /api/monitoring/alerts/:alertId/resolve
 * Résout une alerte
 */
router.post('/alerts/:alertId/resolve', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { alertId } = req.params;
    const { comment } = req.body;
    
    monitoringService.resolveAlert(alertId);
    
    // Log de l'action
    logger.info(`Alerte ${alertId} résolue par ${(req as any).user.id}`, {
      alertId,
      resolvedBy: (req as any).user.id,
      comment
    });
    
    res.json({
      success: true,
      message: 'Alerte résolue avec succès',
      data: {
        alertId,
        resolvedAt: new Date().toISOString(),
        resolvedBy: (req as any).user.id,
        comment
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la résolution de l\'alerte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la résolution de l\'alerte'
    });
  }
});

/**
 * GET /api/monitoring/reports/:tenantId
 * Génère un rapport de monitoring pour un tenant
 */
router.get('/reports/:tenantId', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate et endDate sont requis'
      });
    }
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format de date invalide'
      });
    }
    
    const report = await monitoringService.generateMonitoringReport(tenantId, start, end);
    
    res.json({
      success: true,
      data: {
        tenantId,
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        },
        report,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la génération du rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport de monitoring'
    });
  }
});

/**
 * GET /api/monitoring/alert-rules
 * Liste des règles d'alerte configurées
 */
router.get('/alert-rules', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    // Accéder aux règles d'alerte via une méthode publique
    const alertRules = Array.from((monitoringService as any).alertRules.values());
    
    res.json({
      success: true,
      data: {
        rules: alertRules,
        total: alertRules.length,
        enabled: alertRules.filter(r => r.enabled).length,
        disabled: alertRules.filter(r => !r.enabled).length
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des règles d\'alerte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des règles d\'alerte'
    });
  }
});

/**
 * POST /api/monitoring/alert-rules
 * Ajoute une nouvelle règle d'alerte
 */
router.post('/alert-rules', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { name, description, condition, severity, cooldownMinutes, tenantId } = req.body;
    
    if (!name || !description || !condition || !severity) {
      return res.status(400).json({
        success: false,
        message: 'name, description, condition et severity sont requis'
      });
    }
    
    const ruleId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alertRule = {
      id: ruleId,
      name,
      description,
      condition: new Function('metrics', condition), // ATTENTION: Évaluation de code - sécuriser en production
      severity,
      cooldownMinutes: cooldownMinutes || 15,
      enabled: true,
      tenantId
    };
    
    monitoringService.addAlertRule(alertRule);
    
    res.json({
      success: true,
      message: 'Règle d\'alerte ajoutée avec succès',
      data: {
        ruleId,
        rule: alertRule
      }
    });

  } catch (error) {
    logger.error('Erreur lors de l\'ajout de la règle d\'alerte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la règle d\'alerte'
    });
  }
});

/**
 * DELETE /api/monitoring/alert-rules/:ruleId
 * Supprime une règle d'alerte
 */
router.delete('/alert-rules/:ruleId', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { ruleId } = req.params;
    
    monitoringService.removeAlertRule(ruleId);
    
    res.json({
      success: true,
      message: 'Règle d\'alerte supprimée avec succès',
      data: {
        ruleId,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression de la règle d\'alerte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la règle d\'alerte'
    });
  }
});

/**
 * GET /api/monitoring/real-time
 * Endpoint pour les données en temps réel (WebSocket simulation)
 */
router.get('/real-time', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { tenantId } = req.query;
    
    // Simuler des données en temps réel
    const realTimeData = {
      timestamp: new Date().toISOString(),
      systemHealth: await monitoringService.getSystemHealth(),
      currentMetrics: await monitoringService.getPerformanceMetrics(tenantId as string),
      activeAlerts: monitoringService.getActiveAlerts(tenantId as string).length,
      systemLoad: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100
      },
      networkActivity: {
        requestsPerSecond: Math.floor(Math.random() * 100),
        bytesPerSecond: Math.floor(Math.random() * 1000000)
      }
    };
    
    res.json({
      success: true,
      data: realTimeData
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des données temps réel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données temps réel'
    });
  }
});

/**
 * GET /api/monitoring/trends
 * Tendances et analyses des métriques
 */
router.get('/trends', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { tenantId, metric = 'responseTime', period = '24h' } = req.query;
    
    // Simuler des données de tendance
    const trends = {
      metric: metric,
      period: period,
      data: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        value: Math.random() * 1000 + 100
      })),
      analysis: {
        trend: 'stable', // 'increasing', 'decreasing', 'stable'
        averageChange: 2.5,
        prediction: 'Le système devrait maintenir ses performances actuelles'
      }
    };
    
    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des tendances:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tendances'
    });
  }
});

export default router;