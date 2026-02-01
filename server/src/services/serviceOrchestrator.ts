import { logger } from '@/utils/logger';
import { getDb } from '@/database/connection';
import { authService } from '@/services/authService';
import { rbacService } from '@/services/rbacService';
import { userService } from '@/services/userService';
import { documentService } from '@/services/documentService';
import { caseManagementService } from '@/services/caseManagementService';
import { notificationService } from '@/services/notificationService';
import { billingService } from '@/services/billingService';
import { legalSearchService } from '@/services/legalSearchService';
import { learningService } from '@/services/learningService';
import { minutierService } from '@/services/minutierService';
import { adminService } from '@/services/adminService';
import { moderationService } from '@/services/moderationService';
import { auditService } from '@/services/auditService';
import { monitoringService } from '@/services/monitoringService';
import { backupService } from '@/services/backupService';
import { encryptionService } from '@/services/encryptionService';
import { tenantIsolationService } from '@/services/tenantIsolationService';
import { algerianLegalSystemService } from '@/services/algerianLegalSystemService';
import { algerianSpecificitiesService } from '@/services/algerianSpecificitiesService';
import { i18nService } from '@/services/i18nService';

/**
 * Orchestrateur de services pour la plateforme JuristDZ
 * Gère l'intégration, la communication inter-services et la cohérence des données
 */

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  dependencies: string[];
  metrics?: any;
}

export interface ServiceDependency {
  service: string;
  dependsOn: string[];
  critical: boolean;
}

export interface DataConsistencyCheck {
  name: string;
  description: string;
  check: () => Promise<boolean>;
  fix?: () => Promise<void>;
}

export class ServiceOrchestrator {
  private services: Map<string, any> = new Map();
  private healthChecks: Map<string, ServiceHealth> = new Map();
  private dependencies: ServiceDependency[] = [];
  private consistencyChecks: DataConsistencyCheck[] = [];
  private isInitialized = false;

  constructor() {
    this.registerServices();
    this.defineDependencies();
    this.setupConsistencyChecks();
  }

  /**
   * Initialise tous les services et leurs dépendances
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initialisation de l\'orchestrateur de services...');

      // Vérifier la base de données
      await this.checkDatabaseConnection();

      // Initialiser les services dans l'ordre des dépendances
      await this.initializeServicesInOrder();

      // Démarrer les vérifications de santé
      this.startHealthChecks();

      // Démarrer les vérifications de cohérence
      this.startConsistencyChecks();

      this.isInitialized = true;
      logger.info('Orchestrateur de services initialisé avec succès');

    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de l\'orchestrateur:', error);
      throw error;
    }
  }

  /**
   * Enregistre tous les services disponibles
   */
  private registerServices(): void {
    this.services.set('database', getDb());
    this.services.set('auth', authService);
    this.services.set('rbac', rbacService);
    this.services.set('user', userService);
    this.services.set('document', documentService);
    this.services.set('case', caseManagementService);
    this.services.set('notification', notificationService);
    this.services.set('billing', billingService);
    this.services.set('search', legalSearchService);
    this.services.set('learning', learningService);
    this.services.set('minutier', minutierService);
    this.services.set('admin', adminService);
    this.services.set('moderation', moderationService);
    this.services.set('audit', auditService);
    this.services.set('monitoring', monitoringService);
    this.services.set('backup', backupService);
    this.services.set('encryption', encryptionService);
    this.services.set('tenant', tenantIsolationService);
    this.services.set('algerian-legal', algerianLegalSystemService);
    this.services.set('algerian-specificities', algerianSpecificitiesService);
    this.services.set('i18n', i18nService);
  }

  /**
   * Définit les dépendances entre services
   */
  private defineDependencies(): void {
    this.dependencies = [
      { service: 'database', dependsOn: [], critical: true },
      { service: 'encryption', dependsOn: ['database'], critical: true },
      { service: 'tenant', dependsOn: ['database', 'encryption'], critical: true },
      { service: 'audit', dependsOn: ['database', 'encryption'], critical: true },
      { service: 'auth', dependsOn: ['database', 'encryption', 'audit'], critical: true },
      { service: 'rbac', dependsOn: ['database', 'auth'], critical: true },
      { service: 'user', dependsOn: ['database', 'auth', 'rbac'], critical: true },
      { service: 'i18n', dependsOn: ['database'], critical: false },
      { service: 'document', dependsOn: ['database', 'auth', 'rbac', 'encryption'], critical: true },
      { service: 'case', dependsOn: ['database', 'auth', 'rbac', 'document'], critical: true },
      { service: 'notification', dependsOn: ['database', 'auth', 'user'], critical: false },
      { service: 'billing', dependsOn: ['database', 'auth', 'rbac'], critical: true },
      { service: 'search', dependsOn: ['database', 'auth', 'rbac'], critical: true },
      { service: 'learning', dependsOn: ['database', 'auth', 'rbac'], critical: false },
      { service: 'minutier', dependsOn: ['database', 'auth', 'rbac', 'encryption'], critical: true },
      { service: 'algerian-legal', dependsOn: ['database', 'search'], critical: true },
      { service: 'algerian-specificities', dependsOn: ['database'], critical: true },
      { service: 'admin', dependsOn: ['database', 'auth', 'rbac', 'user'], critical: true },
      { service: 'moderation', dependsOn: ['database', 'auth', 'rbac'], critical: false },
      { service: 'monitoring', dependsOn: ['database'], critical: false },
      { service: 'backup', dependsOn: ['database', 'encryption'], critical: true }
    ];
  }

  /**
   * Configure les vérifications de cohérence des données
   */
  private setupConsistencyChecks(): void {
    this.consistencyChecks = [
      {
        name: 'user-role-consistency',
        description: 'Vérifier la cohérence entre utilisateurs et rôles',
        check: async () => {
          const db = getDb();
          const result = await db.query(`
            SELECT COUNT(*) as count FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id 
            WHERE ur.user_id IS NULL
          `);
          return parseInt(result.rows[0].count) === 0;
        },
        fix: async () => {
          // Assigner le rôle par défaut aux utilisateurs sans rôle
          const db = getDb();
          await db.query(`
            INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
            SELECT u.id, 'etudiant_droit', 'system', NOW()
            FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id 
            WHERE ur.user_id IS NULL
          `);
        }
      },
      {
        name: 'document-case-consistency',
        description: 'Vérifier la cohérence entre documents et dossiers',
        check: async () => {
          const db = getDb();
          const result = await db.query(`
            SELECT COUNT(*) as count FROM documents d 
            WHERE d.case_id IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM cases c WHERE c.id = d.case_id)
          `);
          return parseInt(result.rows[0].count) === 0;
        }
      },
      {
        name: 'tenant-isolation-consistency',
        description: 'Vérifier l\'isolation des données par tenant',
        check: async () => {
          const db = getDb();
          const result = await db.query(`
            SELECT COUNT(*) as count FROM documents d1, documents d2 
            WHERE d1.tenant_id != d2.tenant_id 
            AND d1.case_id = d2.case_id
          `);
          return parseInt(result.rows[0].count) === 0;
        }
      },
      {
        name: 'notification-user-consistency',
        description: 'Vérifier la cohérence entre notifications et utilisateurs',
        check: async () => {
          const db = getDb();
          const result = await db.query(`
            SELECT COUNT(*) as count FROM notifications n 
            WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = n.user_id)
          `);
          return parseInt(result.rows[0].count) === 0;
        },
        fix: async () => {
          // Supprimer les notifications orphelines
          const db = getDb();
          await db.query(`
            DELETE FROM notifications n 
            WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = n.user_id)
          `);
        }
      }
    ];
  }

  /**
   * Initialise les services dans l'ordre des dépendances
   */
  private async initializeServicesInOrder(): Promise<void> {
    const initialized = new Set<string>();
    const toInitialize = [...this.dependencies];

    while (toInitialize.length > 0) {
      const canInitialize = toInitialize.filter(dep => 
        dep.dependsOn.every(dependency => initialized.has(dependency))
      );

      if (canInitialize.length === 0) {
        const remaining = toInitialize.map(d => d.service).join(', ');
        throw new Error(`Dépendances circulaires détectées pour les services: ${remaining}`);
      }

      for (const dep of canInitialize) {
        try {
          await this.initializeService(dep.service);
          initialized.add(dep.service);
          toInitialize.splice(toInitialize.indexOf(dep), 1);
          logger.info(`Service ${dep.service} initialisé avec succès`);
        } catch (error) {
          if (dep.critical) {
            throw new Error(`Échec de l'initialisation du service critique ${dep.service}: ${error}`);
          } else {
            logger.warn(`Échec de l'initialisation du service non-critique ${dep.service}:`, error);
            initialized.add(dep.service); // Marquer comme initialisé pour continuer
            toInitialize.splice(toInitialize.indexOf(dep), 1);
          }
        }
      }
    }
  }

  /**
   * Initialise un service spécifique
   */
  private async initializeService(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} non trouvé`);
    }

    // Certains services ont des méthodes d'initialisation spécifiques
    if (typeof service.initialize === 'function') {
      await service.initialize();
    } else if (typeof service.init === 'function') {
      await service.init();
    }

    // Initialiser les vérifications de santé
    this.healthChecks.set(serviceName, {
      name: serviceName,
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 0,
      errorCount: 0,
      dependencies: this.dependencies.find(d => d.service === serviceName)?.dependsOn || []
    });
  }

  /**
   * Vérifie la connexion à la base de données
   */
  private async checkDatabaseConnection(): Promise<void> {
    try {
      const db = getDb();
      await db.query('SELECT 1');
      logger.info('Connexion à la base de données vérifiée');
    } catch (error) {
      logger.error('Erreur de connexion à la base de données:', error);
      throw error;
    }
  }

  /**
   * Démarre les vérifications de santé périodiques
   */
  private startHealthChecks(): void {
    setInterval(async () => {
      for (const [serviceName, service] of this.services.entries()) {
        await this.checkServiceHealth(serviceName, service);
      }
    }, 30000); // Vérifier toutes les 30 secondes
  }

  /**
   * Vérifie la santé d'un service
   */
  private async checkServiceHealth(serviceName: string, service: any): Promise<void> {
    const startTime = Date.now();
    const healthCheck = this.healthChecks.get(serviceName);
    
    if (!healthCheck) return;

    try {
      // Vérification de santé basique
      if (typeof service.healthCheck === 'function') {
        await service.healthCheck();
      } else if (serviceName === 'database') {
        await service.query('SELECT 1');
      }

      const responseTime = Date.now() - startTime;
      
      healthCheck.status = responseTime > 5000 ? 'degraded' : 'healthy';
      healthCheck.responseTime = responseTime;
      healthCheck.lastCheck = new Date();
      healthCheck.errorCount = Math.max(0, healthCheck.errorCount - 1); // Réduire le compteur d'erreurs

    } catch (error) {
      healthCheck.status = 'unhealthy';
      healthCheck.errorCount++;
      healthCheck.lastCheck = new Date();
      
      logger.warn(`Service ${serviceName} en mauvaise santé:`, error);
      
      // Alerter si le service est critique
      const dependency = this.dependencies.find(d => d.service === serviceName);
      if (dependency?.critical) {
        await this.handleCriticalServiceFailure(serviceName, error);
      }
    }
  }

  /**
   * Gère les pannes de services critiques
   */
  private async handleCriticalServiceFailure(serviceName: string, error: any): Promise<void> {
    logger.error(`ALERTE: Service critique ${serviceName} en panne:`, error);
    
    // Enregistrer l'incident
    try {
      await auditService.logSecurityEvent({
        type: 'critical_service_failure',
        userId: 'system',
        tenantId: 'system',
        details: {
          service: serviceName,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        severity: 'critical'
      });
    } catch (auditError) {
      logger.error('Impossible d\'enregistrer l\'incident de service critique:', auditError);
    }

    // Tenter une récupération automatique
    try {
      await this.attemptServiceRecovery(serviceName);
    } catch (recoveryError) {
      logger.error(`Échec de la récupération automatique pour ${serviceName}:`, recoveryError);
    }
  }

  /**
   * Tente une récupération automatique d'un service
   */
  private async attemptServiceRecovery(serviceName: string): Promise<void> {
    logger.info(`Tentative de récupération du service ${serviceName}...`);
    
    const service = this.services.get(serviceName);
    if (!service) return;

    // Réinitialiser le service
    if (typeof service.restart === 'function') {
      await service.restart();
    } else if (typeof service.initialize === 'function') {
      await service.initialize();
    }

    logger.info(`Service ${serviceName} récupéré avec succès`);
  }

  /**
   * Démarre les vérifications de cohérence périodiques
   */
  private startConsistencyChecks(): void {
    setInterval(async () => {
      for (const check of this.consistencyChecks) {
        await this.runConsistencyCheck(check);
      }
    }, 300000); // Vérifier toutes les 5 minutes
  }

  /**
   * Exécute une vérification de cohérence
   */
  private async runConsistencyCheck(check: DataConsistencyCheck): Promise<void> {
    try {
      const isConsistent = await check.check();
      
      if (!isConsistent) {
        logger.warn(`Incohérence détectée: ${check.name} - ${check.description}`);
        
        if (check.fix) {
          logger.info(`Tentative de correction automatique pour: ${check.name}`);
          await check.fix();
          
          // Revérifier après correction
          const isFixed = await check.check();
          if (isFixed) {
            logger.info(`Incohérence corrigée avec succès: ${check.name}`);
          } else {
            logger.error(`Échec de la correction automatique: ${check.name}`);
          }
        }
      }
    } catch (error) {
      logger.error(`Erreur lors de la vérification de cohérence ${check.name}:`, error);
    }
  }

  /**
   * Obtient l'état de santé de tous les services
   */
  getServicesHealth(): ServiceHealth[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Obtient l'état de santé d'un service spécifique
   */
  getServiceHealth(serviceName: string): ServiceHealth | null {
    return this.healthChecks.get(serviceName) || null;
  }

  /**
   * Vérifie si tous les services critiques sont en bonne santé
   */
  areAllCriticalServicesHealthy(): boolean {
    const criticalServices = this.dependencies
      .filter(d => d.critical)
      .map(d => d.service);

    return criticalServices.every(serviceName => {
      const health = this.healthChecks.get(serviceName);
      return health && health.status !== 'unhealthy';
    });
  }

  /**
   * Obtient un résumé de l'état du système
   */
  getSystemStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: ServiceHealth[];
    criticalServicesHealthy: boolean;
    lastCheck: Date;
  } {
    const services = this.getServicesHealth();
    const criticalServicesHealthy = this.areAllCriticalServicesHealthy();
    
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (!criticalServicesHealthy || unhealthyCount > 0) {
      status = 'unhealthy';
    } else if (degradedCount > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      services,
      criticalServicesHealthy,
      lastCheck: new Date()
    };
  }

  /**
   * Arrête l'orchestrateur et tous les services
   */
  async shutdown(): Promise<void> {
    logger.info('Arrêt de l\'orchestrateur de services...');
    
    // Arrêter les services dans l'ordre inverse des dépendances
    const shutdownOrder = [...this.dependencies].reverse();
    
    for (const dep of shutdownOrder) {
      try {
        const service = this.services.get(dep.service);
        if (service && typeof service.shutdown === 'function') {
          await service.shutdown();
          logger.info(`Service ${dep.service} arrêté`);
        }
      } catch (error) {
        logger.error(`Erreur lors de l'arrêt du service ${dep.service}:`, error);
      }
    }
    
    this.isInitialized = false;
    logger.info('Orchestrateur de services arrêté');
  }
}

export const serviceOrchestrator = new ServiceOrchestrator();