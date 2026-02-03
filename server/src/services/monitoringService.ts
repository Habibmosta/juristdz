import { EventEmitter } from 'events';
import { auditService, MonitoringMetrics, SecurityThreat } from './auditService';
import { logger } from '@/utils/logger';

/**
 * Service de monitoring en temps réel pour la surveillance du système
 * Implémente l'alerting automatique et le monitoring des performances
 */

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: MonitoringMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMinutes: number;
  enabled: boolean;
  tenantId?: string; // Si null, s'applique à tous les tenants
}

export interface Alert {
  id: string;
  ruleId: string;
  tenantId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'suppressed';
  metadata: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    database: 'healthy' | 'warning' | 'critical';
    authentication: 'healthy' | 'warning' | 'critical';
    encryption: 'healthy' | 'warning' | 'critical';
    audit: 'healthy' | 'warning' | 'critical';
  };
  metrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeUsers: number;
    systemLoad: number;
  };
  lastChecked: Date;
}

export interface PerformanceMetrics {
  timestamp: Date;
  tenantId?: string;
  
  // Métriques de performance
  responseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  
  // Métriques de charge
  requestsPerSecond: number;
  concurrentUsers: number;
  
  // Métriques système
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  
  // Métriques de base de données
  dbConnections: number;
  dbQueryTime: number;
  
  // Métriques de sécurité
  encryptionOperations: number;
  auditEvents: number;
}

export class MonitoringService extends EventEmitter {
  private readonly alertRules: Map<string, AlertRule> = new Map();
  private readonly activeAlerts: Map<string, Alert> = new Map();
  private readonly alertCooldowns: Map<string, Date> = new Map();
  private readonly metricsHistory: PerformanceMetrics[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeDefaultAlertRules();
    this.startMonitoring();
  }

  /**
   * Enregistre une métrique (méthode manquante)
   */
  recordMetric(name: string, value: number): void {
    try {
      // Enregistrer la métrique dans l'historique local
      logger.debug(`Recording metric: ${name} = ${value}`);
      // Ici on pourrait ajouter la logique pour persister en base
    } catch (error) {
      logger.warn(`Failed to record metric ${name}:`, error);
    }
  }

  /**
   * Démarre le monitoring en temps réel
   */
  startMonitoring(): void {
    // Désactiver temporairement les intervalles pour éviter les erreurs de base de données
    // TODO: Réactiver après la création des tables manquantes
    
    logger.info('Service de monitoring démarré (intervalles désactivés)');
  }

  /**
   * Arrête le monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    logger.info('Service de monitoring arrêté');
  }

  /**
   * Ajoute une règle d'alerte personnalisée
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info(`Règle d'alerte ajoutée: ${rule.name}`);
  }

  /**
   * Supprime une règle d'alerte
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    logger.info(`Règle d'alerte supprimée: ${ruleId}`);
  }

  /**
   * Obtient toutes les alertes actives
   */
  getActiveAlerts(tenantId?: string): Alert[] {
    const alerts = Array.from(this.activeAlerts.values());
    return tenantId ? alerts.filter(a => a.tenantId === tenantId) : alerts;
  }

  /**
   * Résout une alerte
   */
  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      this.activeAlerts.delete(alertId);
      this.emit('alertResolved', alert);
      logger.info(`Alerte résolue: ${alert.title}`);
    }
  }

  /**
   * Obtient l'état de santé du système
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const health: SystemHealth = {
        overall: 'healthy',
        components: {
          database: await this.checkDatabaseHealth(),
          authentication: await this.checkAuthenticationHealth(),
          encryption: await this.checkEncryptionHealth(),
          audit: await this.checkAuditHealth()
        },
        metrics: {
          uptime: process.uptime(),
          responseTime: await this.getAverageResponseTime(),
          errorRate: await this.getErrorRate(),
          activeUsers: await this.getActiveUsersCount(),
          systemLoad: await this.getSystemLoad()
        },
        lastChecked: new Date()
      };

      // Déterminer l'état global
      const componentStates = Object.values(health.components);
      if (componentStates.includes('critical')) {
        health.overall = 'critical';
      } else if (componentStates.includes('warning')) {
        health.overall = 'warning';
      }

      return health;

    } catch (error) {
      logger.error('Erreur lors de la vérification de santé:', error);
      return {
        overall: 'critical',
        components: {
          database: 'critical',
          authentication: 'critical',
          encryption: 'critical',
          audit: 'critical'
        },
        metrics: {
          uptime: 0,
          responseTime: 0,
          errorRate: 100,
          activeUsers: 0,
          systemLoad: 0
        },
        lastChecked: new Date()
      };
    }
  }

  /**
   * Obtient les métriques de performance actuelles
   */
  async getPerformanceMetrics(tenantId?: string): Promise<PerformanceMetrics> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Calculer les métriques de temps de réponse
      const responseTimes = await this.getResponseTimes(tenantId, oneHourAgo, now);
      
      return {
        timestamp: now,
        tenantId,
        responseTime: {
          avg: this.calculateAverage(responseTimes),
          p50: this.calculatePercentile(responseTimes, 50),
          p95: this.calculatePercentile(responseTimes, 95),
          p99: this.calculatePercentile(responseTimes, 99)
        },
        requestsPerSecond: await this.getRequestsPerSecond(tenantId),
        concurrentUsers: await this.getConcurrentUsers(tenantId),
        cpuUsage: await this.getCpuUsage(),
        memoryUsage: await this.getMemoryUsage(),
        diskUsage: await this.getDiskUsage(),
        dbConnections: await this.getDatabaseConnections(),
        dbQueryTime: await this.getDatabaseQueryTime(),
        encryptionOperations: await this.getEncryptionOperations(tenantId),
        auditEvents: await this.getAuditEventsCount(tenantId)
      };

    } catch (error) {
      logger.error('Erreur lors de la collecte des métriques:', error);
      throw error;
    }
  }

  /**
   * Génère un rapport de monitoring
   */
  async generateMonitoringReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: any;
    alerts: Alert[];
    performance: PerformanceMetrics[];
    recommendations: string[];
  }> {
    try {
      // Résumé des métriques
      const summary = await this.generateMetricsSummary(tenantId, startDate, endDate);
      
      // Alertes de la période
      const alerts = await this.getAlertsForPeriod(tenantId, startDate, endDate);
      
      // Métriques de performance
      const performance = this.metricsHistory.filter(m => 
        m.tenantId === tenantId &&
        m.timestamp >= startDate &&
        m.timestamp <= endDate
      );
      
      // Recommandations
      const recommendations = await this.generateRecommendations(summary, alerts);

      return {
        summary,
        alerts,
        performance,
        recommendations
      };

    } catch (error) {
      logger.error('Erreur lors de la génération du rapport:', error);
      throw error;
    }
  }

  // Méthodes privées

  private initializeDefaultAlertRules(): void {
    // Règle: Taux d'erreur élevé
    this.addAlertRule({
      id: 'high_error_rate',
      name: 'Taux d\'erreur élevé',
      description: 'Déclenché quand le taux d\'erreur dépasse 5%',
      condition: (metrics) => {
        const errorRate = metrics.totalRequests > 0 ? 
          (metrics.failedRequests / metrics.totalRequests) * 100 : 0;
        return errorRate > 5;
      },
      severity: 'high',
      cooldownMinutes: 15,
      enabled: true
    });

    // Règle: Temps de réponse élevé
    this.addAlertRule({
      id: 'high_response_time',
      name: 'Temps de réponse élevé',
      description: 'Déclenché quand le temps de réponse moyen dépasse 2 secondes',
      condition: (metrics) => metrics.averageResponseTime > 2000,
      severity: 'medium',
      cooldownMinutes: 10,
      enabled: true
    });

    // Règle: Tentatives d'intrusion
    this.addAlertRule({
      id: 'intrusion_attempts',
      name: 'Tentatives d\'intrusion détectées',
      description: 'Déclenché lors de la détection de tentatives d\'intrusion',
      condition: (metrics) => metrics.intrusionAttempts > 0,
      severity: 'critical',
      cooldownMinutes: 5,
      enabled: true
    });

    // Règle: Nombre élevé d'utilisateurs actifs
    this.addAlertRule({
      id: 'high_user_load',
      name: 'Charge utilisateur élevée',
      description: 'Déclenché quand le nombre d\'utilisateurs actifs dépasse le seuil',
      condition: (metrics) => metrics.activeUsers > 1000,
      severity: 'medium',
      cooldownMinutes: 30,
      enabled: true
    });
  }

  private async collectAndAnalyzeMetrics(): Promise<void> {
    try {
      // Obtenir la liste des tenants actifs
      const tenants = await this.getActiveTenants();
      
      for (const tenantId of tenants) {
        // Collecter les métriques de monitoring
        const monitoringMetrics = await auditService.getCurrentMetrics(tenantId);
        
        // Collecter les métriques de performance
        const performanceMetrics = await this.getPerformanceMetrics(tenantId);
        this.metricsHistory.push(performanceMetrics);
        
        // Analyser les métriques contre les règles d'alerte
        await this.analyzeMetricsForAlerts(monitoringMetrics, tenantId);
      }

      // Nettoyer l'historique des métriques (garder 24h)
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const initialLength = this.metricsHistory.length;
      this.metricsHistory.splice(0, this.metricsHistory.findIndex(m => m.timestamp > cutoff));
      
      if (this.metricsHistory.length < initialLength) {
        logger.debug(`Nettoyage de l'historique: ${initialLength - this.metricsHistory.length} métriques supprimées`);
      }

    } catch (error) {
      logger.error('Erreur lors de la collecte des métriques:', error);
    }
  }

  private async analyzeMetricsForAlerts(metrics: MonitoringMetrics, tenantId: string): Promise<void> {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;
      if (rule.tenantId && rule.tenantId !== tenantId) continue;

      // Vérifier le cooldown
      const cooldownKey = `${ruleId}:${tenantId}`;
      const lastAlert = this.alertCooldowns.get(cooldownKey);
      if (lastAlert && Date.now() - lastAlert.getTime() < rule.cooldownMinutes * 60 * 1000) {
        continue;
      }

      // Évaluer la condition
      try {
        if (rule.condition(metrics)) {
          await this.triggerAlert(rule, tenantId, metrics);
          this.alertCooldowns.set(cooldownKey, new Date());
        }
      } catch (error) {
        logger.error(`Erreur lors de l'évaluation de la règle ${rule.name}:`, error);
      }
    }
  }

  private async triggerAlert(rule: AlertRule, tenantId: string, metrics: MonitoringMetrics): Promise<void> {
    const alert: Alert = {
      id: `${rule.id}_${tenantId}_${Date.now()}`,
      ruleId: rule.id,
      tenantId,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      triggeredAt: new Date(),
      status: 'active',
      metadata: {
        metrics: metrics,
        rule: rule
      }
    };

    this.activeAlerts.set(alert.id, alert);
    this.emit('alertTriggered', alert);
    
    logger.warn(`ALERTE [${rule.severity.toUpperCase()}]: ${rule.name} pour tenant ${tenantId}`, {
      alertId: alert.id,
      metrics: metrics
    });

    // Envoyer des notifications selon la sévérité
    await this.sendAlertNotification(alert);
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    // En production, intégrer avec des services de notification
    // (email, SMS, Slack, PagerDuty, etc.)
    
    if (alert.severity === 'critical') {
      // Notification immédiate pour les alertes critiques
      logger.error(`ALERTE CRITIQUE: ${alert.title}`, alert);
    } else if (alert.severity === 'high') {
      // Notification prioritaire
      logger.warn(`ALERTE HAUTE: ${alert.title}`, alert);
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const health = await this.getSystemHealth();
      
      if (health.overall === 'critical') {
        await this.triggerAlert({
          id: 'system_health_critical',
          name: 'État système critique',
          description: 'Un ou plusieurs composants système sont en état critique',
          condition: () => true,
          severity: 'critical',
          cooldownMinutes: 5,
          enabled: true
        }, 'system', {} as MonitoringMetrics);
      }

      this.emit('healthCheck', health);

    } catch (error) {
      logger.error('Erreur lors de la vérification de santé:', error);
    }
  }

  private async performIntrusionDetection(): Promise<void> {
    try {
      const tenants = await this.getActiveTenants();
      
      for (const tenantId of tenants) {
        const threats = await auditService.detectIntrusions(tenantId);
        
        for (const threat of threats) {
          this.emit('securityThreat', threat);
          
          if (threat.severity === 'critical' || threat.severity === 'high') {
            await this.triggerAlert({
              id: `security_threat_${threat.threatType}`,
              name: `Menace de sécurité: ${threat.threatType}`,
              description: threat.description,
              condition: () => true,
              severity: threat.severity,
              cooldownMinutes: 10,
              enabled: true
            }, tenantId, {} as MonitoringMetrics);
          }
        }
      }

    } catch (error) {
      logger.error('Erreur lors de la détection d\'intrusions:', error);
    }
  }

  // Méthodes utilitaires pour les vérifications de santé

  private async checkDatabaseHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    try {
      // Test de connexion simple
      const { getDb } = await import('@/database/connection');
      const db = getDb();
      await db.query('SELECT 1');
      return 'healthy';
    } catch (error) {
      logger.error('Vérification base de données échouée:', error);
      return 'critical';
    }
  }

  private async checkAuthenticationHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    // Vérifier les services d'authentification
    // En production, tester les endpoints d'auth
    return 'healthy';
  }

  private async checkEncryptionHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    // Vérifier les services de chiffrement
    // En production, tester les opérations de chiffrement
    return 'healthy';
  }

  private async checkAuditHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    // Vérifier le service d'audit
    try {
      const recentEvents = await auditService.getCurrentMetrics('system');
      return 'healthy';
    } catch (error) {
      return 'warning';
    }
  }

  // Méthodes utilitaires pour les métriques

  private async getActiveTenants(): Promise<string[]> {
    try {
      const { getDb } = await import('@/database/connection');
      const db = getDb();
      
      // Vérifier si la table existe avant de l'interroger
      const tableExists = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'security_audit_logs'
        ) as exists
      `);
      
      if (!tableExists.rows[0].exists) {
        // Table n'existe pas, retourner une liste vide
        logger.warn('Table security_audit_logs does not exist, returning empty tenant list');
        return [];
      }

      const result = await db.query(
        'SELECT DISTINCT tenant_id FROM security_audit_logs WHERE timestamp >= $1',
        [new Date(Date.now() - 60 * 60 * 1000)] // Dernière heure
      );
      return result.rows.map(row => row.tenant_id);
    } catch (error) {
      logger.warn('Table security_audit_logs does not exist, returning empty tenant list');
      return [];
    }
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  // Méthodes stub pour les métriques système (à implémenter selon l'environnement)
  private async getResponseTimes(tenantId?: string, start?: Date, end?: Date): Promise<number[]> {
    // Récupérer les temps de réponse depuis les logs d'audit
    return [100, 150, 200, 120, 180]; // Exemple
  }

  private async getRequestsPerSecond(tenantId?: string): Promise<number> {
    return 10; // Exemple
  }

  private async getConcurrentUsers(tenantId?: string): Promise<number> {
    return 50; // Exemple
  }

  private async getCpuUsage(): Promise<number> {
    return 25.5; // Exemple
  }

  private async getMemoryUsage(): Promise<number> {
    const used = process.memoryUsage();
    return (used.heapUsed / used.heapTotal) * 100;
  }

  private async getDiskUsage(): Promise<number> {
    return 45.2; // Exemple
  }

  private async getDatabaseConnections(): Promise<number> {
    return 10; // Exemple
  }

  private async getDatabaseQueryTime(): Promise<number> {
    return 50; // Exemple
  }

  private async getEncryptionOperations(tenantId?: string): Promise<number> {
    return 100; // Exemple
  }

  private async getAuditEventsCount(tenantId?: string): Promise<number> {
    return 500; // Exemple
  }

  private async getAverageResponseTime(): Promise<number> {
    return 150; // Exemple
  }

  private async getErrorRate(): Promise<number> {
    return 2.5; // Exemple
  }

  private async getActiveUsersCount(): Promise<number> {
    return 75; // Exemple
  }

  private async getSystemLoad(): Promise<number> {
    return 0.8; // Exemple
  }

  private async generateMetricsSummary(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    return {
      totalRequests: 1000,
      averageResponseTime: 150,
      errorRate: 2.5,
      peakConcurrentUsers: 100
    };
  }

  private async getAlertsForPeriod(tenantId: string, startDate: Date, endDate: Date): Promise<Alert[]> {
    return Array.from(this.activeAlerts.values()).filter(alert =>
      alert.tenantId === tenantId &&
      alert.triggeredAt >= startDate &&
      alert.triggeredAt <= endDate
    );
  }

  private async generateRecommendations(summary: any, alerts: Alert[]): Promise<string[]> {
    const recommendations: string[] = [];

    if (summary.errorRate > 5) {
      recommendations.push('Taux d\'erreur élevé détecté. Vérifier les logs d\'erreur et optimiser.');
    }

    if (alerts.filter(a => a.severity === 'critical').length > 0) {
      recommendations.push('Alertes critiques détectées. Intervention immédiate recommandée.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Système fonctionnant dans les paramètres normaux.');
    }

    return recommendations;
  }
}

export const monitoringService = new MonitoringService();