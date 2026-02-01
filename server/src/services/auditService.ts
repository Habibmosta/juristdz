import { getDb } from '@/database/connection';
import { logger } from '@/utils/logger';

/**
 * Service d'audit et de monitoring pour la journalisation complète des accès
 * Implémente la détection d'intrusions automatique et le monitoring en temps réel
 */

export interface AuditEvent {
  id?: string;
  tenantId: string;
  userId: string;
  sessionId?: string;
  
  // Informations sur l'action
  actionType: string;
  resourceType: string;
  resourceId?: string;
  
  // Contexte de sécurité
  securityContext: {
    userRole: string;
    permissions: string[];
    dataClassification: string;
    requiresEncryption: boolean;
  };
  
  // Résultat de l'action
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  
  // Informations de traçabilité
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  duration?: number;
  
  // Métadonnées additionnelles
  metadata?: Record<string, any>;
  
  // Horodatage
  timestamp: Date;
}

export interface SecurityThreat {
  id?: string;
  tenantId: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Détails de la menace
  description: string;
  affectedResources: string[];
  
  // Contexte de la menace
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Statut de traitement
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolutionNotes?: string;
  
  // Horodatage
  detectedAt: Date;
  resolvedAt?: Date;
  
  // Métadonnées
  metadata?: Record<string, any>;
}

export interface MonitoringMetrics {
  timestamp: Date;
  tenantId: string;
  
  // Métriques d'activité
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  
  // Métriques de sécurité
  securityEvents: number;
  threatsDetected: number;
  intrusionAttempts: number;
  
  // Métriques d'utilisation
  activeUsers: number;
  dataVolume: number;
  encryptionOperations: number;
  
  // Métriques de performance
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
}

export interface AuditReport {
  tenantId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Statistiques générales
  totalEvents: number;
  successRate: number;
  averageResponseTime: number;
  
  // Analyse des utilisateurs
  topUsers: Array<{
    userId: string;
    eventCount: number;
    successRate: number;
  }>;
  
  // Analyse des ressources
  topResources: Array<{
    resourceType: string;
    accessCount: number;
    errorRate: number;
  }>;
  
  // Événements de sécurité
  securityEvents: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
  
  // Tendances temporelles
  hourlyActivity: Array<{
    hour: number;
    eventCount: number;
    errorCount: number;
  }>;
  
  // Recommandations
  recommendations: string[];
}

export class AuditService {
  private readonly db = getDb();
  private readonly metricsBuffer: MonitoringMetrics[] = [];
  private readonly threatDetectionRules: Map<string, (events: AuditEvent[]) => SecurityThreat[]> = new Map();

  constructor() {
    this.initializeThreatDetectionRules();
    this.startMetricsCollection();
  }

  /**
   * Enregistre un événement d'audit
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      const query = `
        INSERT INTO security_audit_logs (
          tenant_id, user_id, session_id, action_type, resource_type, resource_id,
          security_context, success, error_code, error_message,
          ip_address, user_agent, request_id, metadata, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `;

      const values = [
        event.tenantId,
        event.userId,
        event.sessionId,
        event.actionType,
        event.resourceType,
        event.resourceId,
        JSON.stringify(event.securityContext),
        event.success,
        event.errorCode,
        event.errorMessage,
        event.ipAddress,
        event.userAgent,
        event.requestId,
        JSON.stringify(event.metadata || {}),
        event.timestamp
      ];

      const result = await this.db.query(query, values);
      event.id = result.rows[0].id;

      // Analyser l'événement pour détecter des menaces
      await this.analyzeEventForThreats(event);

    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de l\'audit:', error);
      // Ne pas faire échouer l'opération principale si l'audit échoue
    }
  }

  /**
   * Enregistre une menace de sécurité détectée
   */
  async logSecurityThreat(threat: SecurityThreat): Promise<void> {
    try {
      const query = `
        INSERT INTO security_violations (
          tenant_id, violation_type, severity, description, affected_resources,
          user_id, ip_address, user_agent, status, detected_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `;

      const values = [
        threat.tenantId,
        threat.threatType,
        threat.severity,
        threat.description,
        JSON.stringify(threat.affectedResources),
        threat.userId,
        threat.ipAddress,
        threat.userAgent,
        threat.status,
        threat.detectedAt,
        JSON.stringify(threat.metadata || {})
      ];

      const result = await this.db.query(query, values);
      threat.id = result.rows[0].id;

      // Alerter si la menace est critique
      if (threat.severity === 'critical' || threat.severity === 'high') {
        await this.sendSecurityAlert(threat);
      }

    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement de la menace:', error);
    }
  }

  /**
   * Génère un rapport d'audit complet
   */
  async generateAuditReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AuditReport> {
    try {
      // Statistiques générales
      const generalStats = await this.getGeneralStatistics(tenantId, startDate, endDate);
      
      // Analyse des utilisateurs
      const topUsers = await this.getTopUsers(tenantId, startDate, endDate);
      
      // Analyse des ressources
      const topResources = await this.getTopResources(tenantId, startDate, endDate);
      
      // Événements de sécurité
      const securityEvents = await this.getSecurityEvents(tenantId, startDate, endDate);
      
      // Activité horaire
      const hourlyActivity = await this.getHourlyActivity(tenantId, startDate, endDate);
      
      // Générer des recommandations
      const recommendations = await this.generateRecommendations(
        tenantId, generalStats, securityEvents
      );

      return {
        tenantId,
        period: { startDate, endDate },
        totalEvents: generalStats.totalEvents,
        successRate: generalStats.successRate,
        averageResponseTime: generalStats.averageResponseTime,
        topUsers,
        topResources,
        securityEvents,
        hourlyActivity,
        recommendations
      };

    } catch (error) {
      logger.error('Erreur lors de la génération du rapport d\'audit:', error);
      throw error;
    }
  }

  /**
   * Obtient les métriques de monitoring en temps réel
   */
  async getCurrentMetrics(tenantId: string): Promise<MonitoringMetrics> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Requêtes d'activité
      const activityQuery = `
        SELECT 
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE success = true) as successful_requests,
          COUNT(*) FILTER (WHERE success = false) as failed_requests,
          AVG(EXTRACT(EPOCH FROM (timestamp - timestamp))) as avg_response_time
        FROM security_audit_logs 
        WHERE tenant_id = $1 AND timestamp >= $2
      `;

      const activityResult = await this.db.query(activityQuery, [tenantId, oneHourAgo]);
      const activity = activityResult.rows[0];

      // Événements de sécurité
      const securityQuery = `
        SELECT 
          COUNT(*) as security_events,
          COUNT(*) FILTER (WHERE severity IN ('high', 'critical')) as threats_detected,
          COUNT(*) FILTER (WHERE violation_type = 'intrusion_attempt') as intrusion_attempts
        FROM security_violations 
        WHERE tenant_id = $1 AND detected_at >= $2
      `;

      const securityResult = await this.db.query(securityQuery, [tenantId, oneHourAgo]);
      const security = securityResult.rows[0];

      // Utilisateurs actifs
      const usersQuery = `
        SELECT COUNT(DISTINCT user_id) as active_users
        FROM security_audit_logs 
        WHERE tenant_id = $1 AND timestamp >= $2
      `;

      const usersResult = await this.db.query(usersQuery, [tenantId, oneHourAgo]);
      const users = usersResult.rows[0];

      return {
        timestamp: now,
        tenantId,
        totalRequests: parseInt(activity.total_requests) || 0,
        successfulRequests: parseInt(activity.successful_requests) || 0,
        failedRequests: parseInt(activity.failed_requests) || 0,
        averageResponseTime: parseFloat(activity.avg_response_time) || 0,
        securityEvents: parseInt(security.security_events) || 0,
        threatsDetected: parseInt(security.threats_detected) || 0,
        intrusionAttempts: parseInt(security.intrusion_attempts) || 0,
        activeUsers: parseInt(users.active_users) || 0,
        dataVolume: 0, // À implémenter selon les besoins
        encryptionOperations: 0 // À implémenter selon les besoins
      };

    } catch (error) {
      logger.error('Erreur lors de la récupération des métriques:', error);
      throw error;
    }
  }

  /**
   * Détecte les intrusions automatiquement
   */
  async detectIntrusions(tenantId: string): Promise<SecurityThreat[]> {
    try {
      const threats: SecurityThreat[] = [];
      const recentEvents = await this.getRecentEvents(tenantId, 60); // Dernières 60 minutes

      // Appliquer toutes les règles de détection
      for (const [ruleName, ruleFunction] of this.threatDetectionRules) {
        try {
          const detectedThreats = ruleFunction(recentEvents);
          threats.push(...detectedThreats);
        } catch (error) {
          logger.error(`Erreur dans la règle de détection ${ruleName}:`, error);
        }
      }

      // Enregistrer les nouvelles menaces
      for (const threat of threats) {
        await this.logSecurityThreat(threat);
      }

      return threats;

    } catch (error) {
      logger.error('Erreur lors de la détection d\'intrusions:', error);
      return [];
    }
  }

  /**
   * Nettoie les anciens logs d'audit selon la politique de rétention
   */
  async cleanupOldLogs(): Promise<void> {
    try {
      const retentionPeriod = 365; // 1 an par défaut
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionPeriod);

      // Nettoyer les logs d'audit
      const auditCleanup = await this.db.query(
        'DELETE FROM security_audit_logs WHERE timestamp < $1',
        [cutoffDate]
      );

      // Nettoyer les violations résolues anciennes
      const violationCutoff = new Date();
      violationCutoff.setDate(violationCutoff.getDate() - (retentionPeriod * 2)); // 2 ans pour les violations

      const violationCleanup = await this.db.query(
        'DELETE FROM security_violations WHERE status = $1 AND resolved_at < $2',
        ['resolved', violationCutoff]
      );

      logger.info(`Nettoyage d'audit terminé: ${auditCleanup.rowCount} logs, ${violationCleanup.rowCount} violations`);

    } catch (error) {
      logger.error('Erreur lors du nettoyage des logs:', error);
    }
  }

  // Méthodes privées

  private initializeThreatDetectionRules(): void {
    // Règle: Tentatives de connexion répétées échouées
    this.threatDetectionRules.set('failed_login_attempts', (events: AuditEvent[]) => {
      const threats: SecurityThreat[] = [];
      const loginFailures = events.filter(e => 
        e.actionType === 'login' && !e.success
      );

      // Grouper par utilisateur et IP
      const failuresByUser = new Map<string, AuditEvent[]>();
      loginFailures.forEach(event => {
        const key = `${event.userId}:${event.ipAddress}`;
        if (!failuresByUser.has(key)) {
          failuresByUser.set(key, []);
        }
        failuresByUser.get(key)!.push(event);
      });

      // Détecter les tentatives répétées
      failuresByUser.forEach((failures, userKey) => {
        if (failures.length >= 5) { // 5 échecs ou plus
          const [userId, ipAddress] = userKey.split(':');
          threats.push({
            tenantId: failures[0].tenantId,
            threatType: 'brute_force_login',
            severity: failures.length >= 10 ? 'high' : 'medium',
            description: `${failures.length} tentatives de connexion échouées pour l'utilisateur ${userId}`,
            affectedResources: ['authentication'],
            userId,
            ipAddress,
            status: 'detected',
            detectedAt: new Date(),
            metadata: { failureCount: failures.length, timespan: '1 hour' }
          });
        }
      });

      return threats;
    });

    // Règle: Accès à des ressources non autorisées
    this.threatDetectionRules.set('unauthorized_access', (events: AuditEvent[]) => {
      const threats: SecurityThreat[] = [];
      const unauthorizedAccess = events.filter(e => 
        !e.success && e.errorCode === 'INSUFFICIENT_PERMISSIONS'
      );

      // Grouper par utilisateur
      const accessByUser = new Map<string, AuditEvent[]>();
      unauthorizedAccess.forEach(event => {
        if (!accessByUser.has(event.userId)) {
          accessByUser.set(event.userId, []);
        }
        accessByUser.get(event.userId)!.push(event);
      });

      // Détecter les tentatives répétées d'accès non autorisé
      accessByUser.forEach((attempts, userId) => {
        if (attempts.length >= 3) {
          const uniqueResources = new Set(attempts.map(a => a.resourceType));
          threats.push({
            tenantId: attempts[0].tenantId,
            threatType: 'unauthorized_access_attempt',
            severity: uniqueResources.size >= 3 ? 'high' : 'medium',
            description: `Tentatives répétées d'accès non autorisé par l'utilisateur ${userId}`,
            affectedResources: Array.from(uniqueResources),
            userId,
            status: 'detected',
            detectedAt: new Date(),
            metadata: { attemptCount: attempts.length, resourceTypes: Array.from(uniqueResources) }
          });
        }
      });

      return threats;
    });

    // Règle: Activité suspecte hors heures normales
    this.threatDetectionRules.set('off_hours_activity', (events: AuditEvent[]) => {
      const threats: SecurityThreat[] = [];
      const now = new Date();
      const currentHour = now.getHours();

      // Définir les heures normales (8h-18h)
      const isOffHours = currentHour < 8 || currentHour > 18;

      if (isOffHours) {
        const sensitiveActions = events.filter(e => 
          ['delete', 'export', 'decrypt', 'admin_action'].includes(e.actionType)
        );

        if (sensitiveActions.length >= 2) {
          const userIds = new Set(sensitiveActions.map(e => e.userId));
          userIds.forEach(userId => {
            const userActions = sensitiveActions.filter(e => e.userId === userId);
            threats.push({
              tenantId: userActions[0].tenantId,
              threatType: 'off_hours_sensitive_activity',
              severity: 'medium',
              description: `Activité sensible détectée hors heures normales pour l'utilisateur ${userId}`,
              affectedResources: userActions.map(a => a.resourceType),
              userId,
              status: 'detected',
              detectedAt: new Date(),
              metadata: { hour: currentHour, actionCount: userActions.length }
            });
          });
        }
      }

      return threats;
    });
  }

  private startMetricsCollection(): void {
    // Collecter les métriques toutes les 5 minutes
    setInterval(async () => {
      try {
        // Obtenir la liste des tenants actifs
        const tenantsQuery = 'SELECT DISTINCT tenant_id FROM security_audit_logs WHERE timestamp >= $1';
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const tenantsResult = await this.db.query(tenantsQuery, [oneHourAgo]);

        for (const row of tenantsResult.rows) {
          const metrics = await this.getCurrentMetrics(row.tenant_id);
          this.metricsBuffer.push(metrics);
        }

        // Garder seulement les 100 dernières métriques par tenant
        if (this.metricsBuffer.length > 1000) {
          this.metricsBuffer.splice(0, this.metricsBuffer.length - 1000);
        }

      } catch (error) {
        logger.error('Erreur lors de la collecte des métriques:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private async analyzeEventForThreats(event: AuditEvent): Promise<void> {
    // Analyse en temps réel pour détecter des patterns suspects
    if (!event.success && event.actionType === 'login') {
      // Vérifier les tentatives de connexion répétées
      const recentFailures = await this.db.query(
        `SELECT COUNT(*) as count FROM security_audit_logs 
         WHERE user_id = $1 AND action_type = 'login' AND success = false 
         AND timestamp >= $2`,
        [event.userId, new Date(Date.now() - 15 * 60 * 1000)] // 15 minutes
      );

      if (parseInt(recentFailures.rows[0].count) >= 3) {
        await this.logSecurityThreat({
          tenantId: event.tenantId,
          threatType: 'repeated_login_failures',
          severity: 'medium',
          description: `Échecs de connexion répétés pour l'utilisateur ${event.userId}`,
          affectedResources: ['authentication'],
          userId: event.userId,
          ipAddress: event.ipAddress,
          status: 'detected',
          detectedAt: new Date()
        });
      }
    }
  }

  private async sendSecurityAlert(threat: SecurityThreat): Promise<void> {
    // Envoyer une alerte aux administrateurs
    logger.warn(`ALERTE SÉCURITÉ [${threat.severity.toUpperCase()}]: ${threat.description}`, {
      threatId: threat.id,
      tenantId: threat.tenantId,
      threatType: threat.threatType,
      userId: threat.userId,
      ipAddress: threat.ipAddress
    });

    // En production, intégrer avec un système de notification (email, SMS, Slack, etc.)
  }

  private async getRecentEvents(tenantId: string, minutes: number): Promise<AuditEvent[]> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    
    const query = `
      SELECT * FROM security_audit_logs 
      WHERE tenant_id = $1 AND timestamp >= $2 
      ORDER BY timestamp DESC
    `;

    const result = await this.db.query(query, [tenantId, cutoffTime]);
    
    return result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      sessionId: row.session_id,
      actionType: row.action_type,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      securityContext: JSON.parse(row.security_context || '{}'),
      success: row.success,
      errorCode: row.error_code,
      errorMessage: row.error_message,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      requestId: row.request_id,
      metadata: JSON.parse(row.metadata || '{}'),
      timestamp: row.timestamp
    }));
  }

  private async getGeneralStatistics(tenantId: string, startDate: Date, endDate: Date): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE success = true) as successful_events,
        AVG(CASE WHEN metadata->>'duration' IS NOT NULL 
            THEN (metadata->>'duration')::numeric ELSE NULL END) as avg_response_time
      FROM security_audit_logs 
      WHERE tenant_id = $1 AND timestamp BETWEEN $2 AND $3
    `;

    const result = await this.db.query(query, [tenantId, startDate, endDate]);
    const stats = result.rows[0];

    return {
      totalEvents: parseInt(stats.total_events) || 0,
      successRate: stats.total_events > 0 ? 
        (parseInt(stats.successful_events) / parseInt(stats.total_events)) * 100 : 0,
      averageResponseTime: parseFloat(stats.avg_response_time) || 0
    };
  }

  private async getTopUsers(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      SELECT 
        user_id,
        COUNT(*) as event_count,
        COUNT(*) FILTER (WHERE success = true) as successful_events,
        COUNT(*) as total_events
      FROM security_audit_logs 
      WHERE tenant_id = $1 AND timestamp BETWEEN $2 AND $3
      GROUP BY user_id
      ORDER BY event_count DESC
      LIMIT 10
    `;

    const result = await this.db.query(query, [tenantId, startDate, endDate]);
    
    return result.rows.map(row => ({
      userId: row.user_id,
      eventCount: parseInt(row.event_count),
      successRate: row.total_events > 0 ? 
        (parseInt(row.successful_events) / parseInt(row.total_events)) * 100 : 0
    }));
  }

  private async getTopResources(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      SELECT 
        resource_type,
        COUNT(*) as access_count,
        COUNT(*) FILTER (WHERE success = false) as error_count,
        COUNT(*) as total_count
      FROM security_audit_logs 
      WHERE tenant_id = $1 AND timestamp BETWEEN $2 AND $3
      GROUP BY resource_type
      ORDER BY access_count DESC
      LIMIT 10
    `;

    const result = await this.db.query(query, [tenantId, startDate, endDate]);
    
    return result.rows.map(row => ({
      resourceType: row.resource_type,
      accessCount: parseInt(row.access_count),
      errorRate: row.total_count > 0 ? 
        (parseInt(row.error_count) / parseInt(row.total_count)) * 100 : 0
    }));
  }

  private async getSecurityEvents(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      SELECT 
        violation_type as type,
        COUNT(*) as count,
        severity
      FROM security_violations 
      WHERE tenant_id = $1 AND detected_at BETWEEN $2 AND $3
      GROUP BY violation_type, severity
      ORDER BY count DESC
    `;

    const result = await this.db.query(query, [tenantId, startDate, endDate]);
    
    return result.rows.map(row => ({
      type: row.type,
      count: parseInt(row.count),
      severity: row.severity
    }));
  }

  private async getHourlyActivity(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const query = `
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as event_count,
        COUNT(*) FILTER (WHERE success = false) as error_count
      FROM security_audit_logs 
      WHERE tenant_id = $1 AND timestamp BETWEEN $2 AND $3
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour
    `;

    const result = await this.db.query(query, [tenantId, startDate, endDate]);
    
    return result.rows.map(row => ({
      hour: parseInt(row.hour),
      eventCount: parseInt(row.event_count),
      errorCount: parseInt(row.error_count)
    }));
  }

  private async generateRecommendations(
    tenantId: string, 
    stats: any, 
    securityEvents: any[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyser le taux de succès
    if (stats.successRate < 95) {
      recommendations.push('Taux de succès faible détecté. Vérifier les permissions et la configuration.');
    }

    // Analyser les événements de sécurité
    const highSeverityEvents = securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical');
    if (highSeverityEvents.length > 0) {
      recommendations.push('Événements de sécurité critiques détectés. Révision immédiate recommandée.');
    }

    // Analyser les temps de réponse
    if (stats.averageResponseTime > 1000) { // > 1 seconde
      recommendations.push('Temps de réponse élevés détectés. Optimisation des performances recommandée.');
    }

    // Recommandations générales
    if (recommendations.length === 0) {
      recommendations.push('Système fonctionnant normalement. Continuer la surveillance.');
    }

    return recommendations;
  }
}

export const auditService = new AuditService();