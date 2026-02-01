import { Router, Request, Response } from 'express';
import { backupService } from '@/services/backupService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';

/**
 * Routes pour la gestion des sauvegardes et restaurations
 * Accès restreint aux administrateurs
 */

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * POST /api/backup/create
 * Crée une nouvelle sauvegarde
 */
router.post('/create',
  rbacMiddleware(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { tenantId, type = 'full' } = req.body;
      const user = (req as any).user;

      // Vérifier les permissions pour le tenant
      if (tenantId && user.role !== 'admin' && user.tenantId !== tenantId) {
        return res.status(403).json({ 
          error: 'Accès refusé pour créer une sauvegarde de ce tenant' 
        });
      }

      let metadata;
      if (type === 'incremental') {
        metadata = await backupService.createIncrementalBackup(tenantId);
      } else {
        metadata = await backupService.createFullBackup(tenantId);
      }

      res.json({
        success: true,
        data: metadata,
        message: 'Sauvegarde créée avec succès'
      });

    } catch (error) {
      console.error('Erreur lors de la création de sauvegarde:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la création de la sauvegarde',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }
);

/**
 * GET /api/backup/list
 * Liste les sauvegardes disponibles
 */
router.get('/list',
  rbacMiddleware(['admin', 'backup_viewer']),
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.query;
      const user = (req as any).user;

      // Filtrer par tenant selon les permissions
      let targetTenantId: string | undefined;
      if (user.role === 'admin') {
        targetTenantId = tenantId as string;
      } else {
        targetTenantId = user.tenantId;
      }

      const backups = await backupService.listBackups(targetTenantId);

      res.json({
        success: true,
        data: backups,
        total: backups.length
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des sauvegardes:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des sauvegardes' 
      });
    }
  }
);

/**
 * GET /api/backup/:backupId
 * Récupère les détails d'une sauvegarde
 */
router.get('/:backupId',
  rbacMiddleware(['admin', 'backup_viewer']),
  async (req: Request, res: Response) => {
    try {
      const { backupId } = req.params;
      const user = (req as any).user;

      const backups = await backupService.listBackups();
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        return res.status(404).json({ 
          error: 'Sauvegarde non trouvée' 
        });
      }

      // Vérifier les permissions
      if (user.role !== 'admin' && backup.tenantId !== user.tenantId) {
        return res.status(403).json({ 
          error: 'Accès refusé à cette sauvegarde' 
        });
      }

      res.json({
        success: true,
        data: backup
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de la sauvegarde:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération de la sauvegarde' 
      });
    }
  }
);

/**
 * POST /api/backup/:backupId/restore
 * Restaure une sauvegarde
 */
router.post('/:backupId/restore',
  rbacMiddleware(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { backupId } = req.params;
      const { 
        tenantId, 
        targetTenantId, 
        tables, 
        validateIntegrity = true, 
        dryRun = false 
      } = req.body;
      const user = (req as any).user;

      // Vérifier que la sauvegarde existe et les permissions
      const backups = await backupService.listBackups();
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        return res.status(404).json({ 
          error: 'Sauvegarde non trouvée' 
        });
      }

      if (user.role !== 'admin' && backup.tenantId !== user.tenantId) {
        return res.status(403).json({ 
          error: 'Accès refusé pour restaurer cette sauvegarde' 
        });
      }

      const restoreOptions = {
        backupId,
        tenantId: tenantId || backup.tenantId,
        targetTenantId,
        tables,
        validateIntegrity,
        dryRun
      };

      const result = await backupService.restoreBackup(restoreOptions);

      res.json({
        success: result.success,
        data: result,
        message: result.success ? 'Restauration terminée avec succès' : 'Restauration terminée avec des erreurs'
      });

    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la restauration',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }
);

/**
 * POST /api/backup/:backupId/validate
 * Valide l'intégrité d'une sauvegarde
 */
router.post('/:backupId/validate',
  rbacMiddleware(['admin', 'backup_viewer']),
  async (req: Request, res: Response) => {
    try {
      const { backupId } = req.params;
      const user = (req as any).user;

      const backups = await backupService.listBackups();
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        return res.status(404).json({ 
          error: 'Sauvegarde non trouvée' 
        });
      }

      // Vérifier les permissions
      if (user.role !== 'admin' && backup.tenantId !== user.tenantId) {
        return res.status(403).json({ 
          error: 'Accès refusé à cette sauvegarde' 
        });
      }

      const isValid = await backupService.validateBackupIntegrity(backup);

      res.json({
        success: true,
        data: {
          backupId,
          isValid,
          status: backup.status,
          validatedAt: new Date()
        },
        message: isValid ? 'Sauvegarde valide' : 'Sauvegarde corrompue'
      });

    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la validation de la sauvegarde' 
      });
    }
  }
);

/**
 * DELETE /api/backup/:backupId
 * Supprime une sauvegarde
 */
router.delete('/:backupId',
  rbacMiddleware(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { backupId } = req.params;
      const user = (req as any).user;

      // Vérifier que la sauvegarde existe et les permissions
      const backups = await backupService.listBackups();
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        return res.status(404).json({ 
          error: 'Sauvegarde non trouvée' 
        });
      }

      if (user.role !== 'admin' && backup.tenantId !== user.tenantId) {
        return res.status(403).json({ 
          error: 'Accès refusé pour supprimer cette sauvegarde' 
        });
      }

      await backupService.deleteBackup(backupId);

      res.json({
        success: true,
        message: 'Sauvegarde supprimée avec succès'
      });

    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la suppression de la sauvegarde' 
      });
    }
  }
);

/**
 * POST /api/backup/configure
 * Configure les paramètres de sauvegarde pour un tenant
 */
router.post('/configure',
  rbacMiddleware(['admin']),
  async (req: Request, res: Response) => {
    try {
      const { tenantId, config } = req.body;
      const user = (req as any).user;

      if (!tenantId) {
        return res.status(400).json({ 
          error: 'Tenant ID requis' 
        });
      }

      // Vérifier les permissions
      if (user.role !== 'admin' && user.tenantId !== tenantId) {
        return res.status(403).json({ 
          error: 'Accès refusé pour configurer ce tenant' 
        });
      }

      await backupService.configureBackup(tenantId, config);

      res.json({
        success: true,
        message: 'Configuration de sauvegarde mise à jour'
      });

    } catch (error) {
      console.error('Erreur lors de la configuration:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la configuration de sauvegarde' 
      });
    }
  }
);

/**
 * POST /api/backup/cleanup
 * Lance le nettoyage des anciennes sauvegardes
 */
router.post('/cleanup',
  rbacMiddleware(['admin']),
  async (req: Request, res: Response) => {
    try {
      await backupService.cleanupOldBackups();

      res.json({
        success: true,
        message: 'Nettoyage des anciennes sauvegardes terminé'
      });

    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      res.status(500).json({ 
        error: 'Erreur lors du nettoyage des sauvegardes' 
      });
    }
  }
);

/**
 * GET /api/backup/status
 * Récupère le statut global des sauvegardes
 */
router.get('/status',
  rbacMiddleware(['admin', 'backup_viewer']),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // Récupérer les sauvegardes selon les permissions
      const tenantId = user.role === 'admin' ? undefined : user.tenantId;
      const backups = await backupService.listBackups(tenantId);

      // Calculer les statistiques
      const stats = {
        total: backups.length,
        completed: backups.filter(b => b.status === 'completed').length,
        failed: backups.filter(b => b.status === 'failed').length,
        inProgress: backups.filter(b => b.status === 'in_progress').length,
        corrupted: backups.filter(b => b.status === 'corrupted').length,
        totalSize: backups.reduce((sum, b) => sum + (b.size || 0), 0),
        lastBackup: backups.length > 0 ? backups[0].createdAt : null,
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : null
      };

      // Calculer les tendances (derniers 7 jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentBackups = backups.filter(b => b.createdAt >= sevenDaysAgo);
      const trends = {
        recentBackups: recentBackups.length,
        averageSize: recentBackups.length > 0 ? 
          recentBackups.reduce((sum, b) => sum + (b.size || 0), 0) / recentBackups.length : 0,
        successRate: recentBackups.length > 0 ? 
          (recentBackups.filter(b => b.status === 'completed').length / recentBackups.length) * 100 : 0
      };

      res.json({
        success: true,
        data: {
          statistics: stats,
          trends,
          recentBackups: backups.slice(0, 5) // 5 plus récentes
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération du statut des sauvegardes' 
      });
    }
  }
);

export { router as backupRouter };