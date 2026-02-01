import { Router, Request, Response } from 'express';
import { auditService } from '@/services/auditService';
import { monitoringService } from '@/services/monitoringService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';

/**
 * Routes pour l'audit et le monitoring du système
 * Accès restreint aux administrateurs et utilisateurs autorisés
 */

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * GET /api/audit/events
 * Récupère les événements d'audit pour un tenant
 */
router.get('/events', 
  rbacMiddleware(['admin', 'audit_viewer']),
  async (req: Request, res: Response) => {
    try {
      const { tenantId, startDate, endDate, limit = 100, offset = 0 } = req.query;
      const user = (req as any).user;

      // Utiliser le tenant de l'utilisateur si non spécifié
      const targetTenantId = tenantId as string || user.tenantId;

      // Vérifier les permissions pour accéder aux données d'audit
      if (user.role !== 'admin' && user.tenantId !== targetTenantId) {
        return res.status(403).json({ 
          error: 'Accès refusé aux données d\'audit d\'un autre tenant' 
        });
      }

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const report = await auditService.generateAuditReport(
        targetTenantId,
        start,
        end
      );

      res.json({
        success: true,
        data: report,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des événements d\'audit:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des événements d\'audit' 
      });
    }
  }
);

/**
 * GET /api/audit/report
 * Génère un rapport d'audit complet
 */
router.get('/report',
  rbacMiddleware(['admin', 'audit_viewer']),
  async (req: Request, res: Response) => {
    try {
      const { tenantId, startDate, endDate, format = 'json' } = req.query;
      const user = (req as any).user;

      const targetTenantId = tenantId as string || user.tenantId;

      // Vérifier les permissions
      if (user.role !== 'admin' && user.tenantId !== targetTenantId) {
        return res.status(403).json({ 
          error: 'Accès refusé aux rapports d\'audit d\'un autre tenant' 
        });
      }

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const report = await auditService.generateAuditReport(
        targetTenantId,
        start,
        end
      );

      if (format === 'csv') {
        // Convertir en CSV pour export
        const csv = convertReportToCSV(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-report-${targetTenantId}-${Date.now()}.csv"`);
        res.send(csv);
      } else {
        res.json({
          success: true,
          data: report
        });
      }

    } catch (error) {
      console.error('Erreur lors de la génération du rapport d\'audit:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la génération du rapport d\'audit' 
      });
    }
  }
);

/**
 * GET /api/audit/security-threats
 * Récupère les menaces de sécurité détectées
 */
router.get('/security-threats',
  rbacMiddleware(['admin', 'security_analyst']),
  async (req: Request, res: Response) => {
    try {
      const { tenantId, severity, status, limit = 50 } = req.query;
      const user = (req as any).user;

      const targetTenantId = tenantId as string || user.tenantId;

      // Vérifier les permissions
      if (user.role !== 'admin' && user.tenantId !== targetTenantId) {
        return res.status(403).json({ 
          error: 'Accès refusé aux données de sécurité d\'un autre tenant' 
        });
      }

      // Déclencher une détection d'intrusions en temps réel
      const threats = await auditService.detectIntrusions(targetTenantId);

      // Filtrer selon les paramètres
      let filteredThreats = threats;
      if (severity) {
        filteredThreats = filteredThreats.filter(t => t.severity === severity);
      }
      if (status) {
        filteredThreats = filteredThreats.filter(t => t.status === status);
      }

      // Limiter les résultats
      const limitedThreats = filteredThreats.slice(0, parseInt(limit as string));

      res.json({
        success: true,
        data: limitedThreats,
        total: filteredThreats.length
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des menaces:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des menaces de sécurité' 
      });
    }
  }
);

/**
 * GET /api/audit/metrics
 * Récupère les métriques de monitoring actuelles
 */
router.get('/metrics',
  rbacMiddleware(['admin', 'monitor_viewer']),
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.query;
      const user = (req as any).user;

      const targetTenantId = tenantId as string || user.tenantId;

      // Vérifier les permissions
      if (user.role !== 'admin' && user.tenantId !== targetTenantId) {
        return res.status(403).json({ 
          error: 'Accès refusé aux métriques d\'un autre tenant' 
        });
      }

      const metrics = await auditService.getCurrentMetrics(targetTenantId);
      const performanceMetrics = await monitoringService.getPerformanceMetrics(targetTenantId);

      res.json({
        success: true,
        data: {
          monitoring: metrics,
          performance: performanceMetrics,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des métriques:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des métriques' 
      });
    }
  }
);

/**
 * GET /api/audit/system-health
 * Récupère l'état de santé du système
 */
router.get('/system-health',
  rbacMiddleware(['admin']),
  async (req: Request, res: Response) => {
    try {
      const health = await monitoringService.getSystemHealth();

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      console.error('Erreur lors de la vérification de santé:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la vérification de santé du système' 
      });
    }
  }
);

/**
 * GET /api/audit/alerts
 * Récupère les alertes actives
 */
router.get('/alerts',
  rbacMiddleware(['admin', 'alert_viewer']),
  async (req: Request, res: Response) => {
    try {
      const { tenantId, severity, status } = req.query;
      const user = (req as any).user;

      const targetTenantId = tenantId as string || (user.role === 'admin' ? undefined : user.tenantId);

      let alerts = monitoringService.getActiveAlerts(targetTenantId);

      // Filtrer selon les paramètres
      if (severity) {
        alerts = alerts.filter(a => a.severity === severity);
      }
      if (status) {
        alerts = alerts.filter(a => a.status === status);
      }

      res.json({
        success: true,
        data: alerts,
        total: alerts.length
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des alertes' 
      });
    }
  }
);

/**
 * POST /api/audit/alerts/:alertId/resolve
 * Résout une alerte
 */
router.post('/alerts/:alertId/resolve',
  rbacMiddleware(['admin', 'alert_manager']),
  async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const { resolution_notes } = req.body;

      monitoringService.resolveAlert(alertId);

      res.json({
        success: true,
        message: 'Alerte résolue avec succès'
      });

    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la résolution de l\'alerte' 
      });
    }
  }
);

/**
 * GET /api/audit/monitoring-report
 * Génère un rapport de monitoring complet
 */
router.get('/monitoring-report',
  rbacMiddleware(['admin', 'monitor_viewer']),
  async (req: Request, res: Response) => {
    try {
      const { tenantId, startDate, endDate } = req.query;
      const user = (req as any).user;

      const targetTenantId = tenantId as string || user.tenantId;

      // Vérifier les permissions
      if (user.role !== 'admin' && user.tenantId !== targetTenantId) {
        return res.status(403).json({ 
          error: 'Accès refusé aux rapports de monitoring d\'un autre tenant' 
        });
      }

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const report = await monitoringService.generateMonitoringReport(
        targetTenantId,
        start,
        end
      );

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      console.error('Erreur lors de la génération du rapport de monitoring:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la génération du rapport de monitoring' 
      });
    }
  }
);

/**
 * POST /api/audit/cleanup
 * Lance le nettoyage des anciens logs d'audit
 */
router.post('/cleanup',
  rbacMiddleware(['admin']),
  async (req: Request, res: Response) => {
    try {
      await auditService.cleanupOldLogs();

      res.json({
        success: true,
        message: 'Nettoyage des logs d\'audit terminé'
      });

    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      res.status(500).json({ 
        error: 'Erreur lors du nettoyage des logs d\'audit' 
      });
    }
  }
);

// Fonctions utilitaires

function convertReportToCSV(report: any): string {
  const headers = [
    'Date',
    'Tenant ID',
    'Total Events',
    'Success Rate',
    'Average Response Time',
    'Security Events'
  ];

  const rows = [
    headers.join(','),
    [
      new Date().toISOString(),
      report.tenantId,
      report.totalEvents,
      report.successRate.toFixed(2) + '%',
      report.averageResponseTime.toFixed(2) + 'ms',
      report.securityEvents.length
    ].join(',')
  ];

  // Ajouter les détails des utilisateurs
  if (report.topUsers && report.topUsers.length > 0) {
    rows.push('');
    rows.push('Top Users');
    rows.push('User ID,Event Count,Success Rate');
    report.topUsers.forEach((user: any) => {
      rows.push(`${user.userId},${user.eventCount},${user.successRate.toFixed(2)}%`);
    });
  }

  // Ajouter les détails des ressources
  if (report.topResources && report.topResources.length > 0) {
    rows.push('');
    rows.push('Top Resources');
    rows.push('Resource Type,Access Count,Error Rate');
    report.topResources.forEach((resource: any) => {
      rows.push(`${resource.resourceType},${resource.accessCount},${resource.errorRate.toFixed(2)}%`);
    });
  }

  return rows.join('\n');
}

export { router as auditRouter };