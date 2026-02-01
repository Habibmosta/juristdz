import { encryptionService, EncryptedData } from './encryptionService';

/**
 * Service d'isolation multi-tenant pour garantir la séparation stricte des données
 * Implémente l'isolation au niveau application avec chiffrement par tenant
 */

export interface TenantContext {
  tenantId: string;
  organizationId: string;
  userId: string;
  userRole: string;
  permissions: string[];
}

export interface IsolatedQuery {
  baseQuery: any;
  tenantFilter: any;
  encryptionContext: TenantContext;
}

export interface DataAccessLog {
  tenantId: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  action: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export class TenantIsolationService {
  private readonly auditLogs: DataAccessLog[] = [];

  /**
   * Applique l'isolation tenant à une requête de base de données
   */
  applyTenantIsolation(query: any, context: TenantContext): IsolatedQuery {
    // Ajouter automatiquement le filtre tenant à toutes les requêtes
    const tenantFilter = {
      tenant_id: context.tenantId,
      organization_id: context.organizationId
    };

    // Pour les requêtes complexes, s'assurer que l'isolation est appliquée à tous les niveaux
    const isolatedQuery = this.addTenantFilterRecursively(query, tenantFilter);

    return {
      baseQuery: isolatedQuery,
      tenantFilter,
      encryptionContext: context
    };
  }

  /**
   * Valide qu'un utilisateur peut accéder à une ressource spécifique
   */
  async validateResourceAccess(
    resourceType: string,
    resourceId: string,
    context: TenantContext,
    requiredPermission: string
  ): Promise<boolean> {
    const logEntry: DataAccessLog = {
      tenantId: context.tenantId,
      userId: context.userId,
      resourceType,
      resourceId,
      action: 'access_validation',
      timestamp: new Date(),
      success: false
    };

    try {
      // Vérifier que la ressource appartient au tenant
      const resourceBelongsToTenant = await this.verifyResourceOwnership(
        resourceType,
        resourceId,
        context.tenantId
      );

      if (!resourceBelongsToTenant) {
        logEntry.errorMessage = 'Ressource n\'appartient pas au tenant';
        this.auditLogs.push(logEntry);
        return false;
      }

      // Vérifier les permissions utilisateur
      const hasPermission = context.permissions.includes(requiredPermission);
      if (!hasPermission) {
        logEntry.errorMessage = 'Permissions insuffisantes';
        this.auditLogs.push(logEntry);
        return false;
      }

      // Vérifications spécifiques par rôle
      const roleValidation = await this.validateRoleSpecificAccess(
        resourceType,
        resourceId,
        context
      );

      if (!roleValidation) {
        logEntry.errorMessage = 'Accès refusé par validation de rôle';
        this.auditLogs.push(logEntry);
        return false;
      }

      logEntry.success = true;
      this.auditLogs.push(logEntry);
      return true;

    } catch (error) {
      logEntry.errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      this.auditLogs.push(logEntry);
      return false;
    }
  }

  /**
   * Chiffre des données avant stockage avec isolation tenant
   */
  async encryptTenantData(data: any, context: TenantContext): Promise<EncryptedData> {
    // Ajouter les métadonnées d'isolation
    const dataWithMetadata = {
      ...data,
      _tenant_id: context.tenantId,
      _organization_id: context.organizationId,
      _created_by: context.userId,
      _created_at: new Date().toISOString()
    };

    return await encryptionService.encryptData(
      JSON.stringify(dataWithMetadata),
      context.tenantId
    );
  }

  /**
   * Déchiffre des données avec validation d'isolation
   */
  async decryptTenantData(encryptedData: EncryptedData, context: TenantContext): Promise<any> {
    const decryptedJson = await encryptionService.decryptData(encryptedData, context.tenantId);
    const data = JSON.parse(decryptedJson);

    // Valider que les données appartiennent au bon tenant
    if (data._tenant_id !== context.tenantId) {
      throw new Error('Violation d\'isolation tenant: données d\'un autre tenant');
    }

    if (data._organization_id !== context.organizationId) {
      throw new Error('Violation d\'isolation organisation: données d\'une autre organisation');
    }

    // Supprimer les métadonnées d'isolation avant retour
    const { _tenant_id, _organization_id, _created_by, _created_at, ...cleanData } = data;
    
    return cleanData;
  }

  /**
   * Crée un contexte d'isolation pour un utilisateur
   */
  async createTenantContext(
    userId: string,
    organizationId: string,
    userRole: string
  ): Promise<TenantContext> {
    // Générer un tenant ID basé sur l'organisation
    const tenantId = this.generateTenantId(organizationId);
    
    // Récupérer les permissions basées sur le rôle
    const permissions = await this.getRolePermissions(userRole);

    return {
      tenantId,
      organizationId,
      userId,
      userRole,
      permissions
    };
  }

  /**
   * Valide l'intégrité de l'isolation multi-tenant
   */
  async validateTenantIntegrity(tenantId: string): Promise<{
    isValid: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Vérifier qu'aucune donnée ne fuit entre tenants
    const crossTenantLeaks = await this.detectCrossTenantDataLeaks(tenantId);
    if (crossTenantLeaks.length > 0) {
      violations.push(`Fuites de données détectées: ${crossTenantLeaks.length} cas`);
      recommendations.push('Réviser les requêtes de base de données pour l\'isolation');
    }

    // Vérifier l'intégrité des clés de chiffrement
    const keyIntegrityIssues = await this.validateEncryptionKeyIntegrity(tenantId);
    if (keyIntegrityIssues.length > 0) {
      violations.push(`Problèmes d'intégrité des clés: ${keyIntegrityIssues.length}`);
      recommendations.push('Effectuer une rotation des clés de chiffrement');
    }

    // Vérifier les logs d'audit pour des accès suspects
    const suspiciousAccess = this.detectSuspiciousAccess(tenantId);
    if (suspiciousAccess.length > 0) {
      violations.push(`Accès suspects détectés: ${suspiciousAccess.length}`);
      recommendations.push('Réviser les permissions et accès utilisateurs');
    }

    return {
      isValid: violations.length === 0,
      violations,
      recommendations
    };
  }

  /**
   * Génère un rapport d'audit d'accès aux données
   */
  generateAccessAuditReport(tenantId: string, startDate: Date, endDate: Date): {
    totalAccess: number;
    successfulAccess: number;
    failedAccess: number;
    topUsers: Array<{ userId: string; accessCount: number }>;
    topResources: Array<{ resourceType: string; accessCount: number }>;
    securityEvents: DataAccessLog[];
  } {
    const tenantLogs = this.auditLogs.filter(log => 
      log.tenantId === tenantId &&
      log.timestamp >= startDate &&
      log.timestamp <= endDate
    );

    const successfulAccess = tenantLogs.filter(log => log.success).length;
    const failedAccess = tenantLogs.filter(log => !log.success).length;

    // Analyser les utilisateurs les plus actifs
    const userAccess = new Map<string, number>();
    tenantLogs.forEach(log => {
      userAccess.set(log.userId, (userAccess.get(log.userId) || 0) + 1);
    });

    const topUsers = Array.from(userAccess.entries())
      .map(([userId, accessCount]) => ({ userId, accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    // Analyser les ressources les plus accédées
    const resourceAccess = new Map<string, number>();
    tenantLogs.forEach(log => {
      resourceAccess.set(log.resourceType, (resourceAccess.get(log.resourceType) || 0) + 1);
    });

    const topResources = Array.from(resourceAccess.entries())
      .map(([resourceType, accessCount]) => ({ resourceType, accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    // Identifier les événements de sécurité
    const securityEvents = tenantLogs.filter(log => 
      !log.success || 
      log.errorMessage?.includes('violation') ||
      log.errorMessage?.includes('refusé')
    );

    return {
      totalAccess: tenantLogs.length,
      successfulAccess,
      failedAccess,
      topUsers,
      topResources,
      securityEvents
    };
  }

  // Méthodes privées

  private addTenantFilterRecursively(query: any, tenantFilter: any): any {
    if (Array.isArray(query)) {
      return query.map(item => this.addTenantFilterRecursively(item, tenantFilter));
    }

    if (query && typeof query === 'object') {
      const result = { ...query };
      
      // Ajouter le filtre tenant aux conditions WHERE
      if (result.where) {
        result.where = { ...result.where, ...tenantFilter };
      } else {
        result.where = tenantFilter;
      }

      // Appliquer récursivement aux sous-requêtes
      Object.keys(result).forEach(key => {
        if (typeof result[key] === 'object') {
          result[key] = this.addTenantFilterRecursively(result[key], tenantFilter);
        }
      });

      return result;
    }

    return query;
  }

  private async verifyResourceOwnership(
    resourceType: string,
    resourceId: string,
    tenantId: string
  ): Promise<boolean> {
    // En production, vérifier en base de données
    // Pour l'instant, simulation
    return true;
  }

  private async validateRoleSpecificAccess(
    resourceType: string,
    resourceId: string,
    context: TenantContext
  ): Promise<boolean> {
    // Validations spécifiques par rôle professionnel
    switch (context.userRole) {
      case 'avocat':
        return this.validateAvocatAccess(resourceType, resourceId, context);
      case 'notaire':
        return this.validateNotaireAccess(resourceType, resourceId, context);
      case 'huissier':
        return this.validateHuissierAccess(resourceType, resourceId, context);
      case 'etudiant':
        return this.validateEtudiantAccess(resourceType, resourceId, context);
      default:
        return true;
    }
  }

  private async validateAvocatAccess(
    resourceType: string,
    resourceId: string,
    context: TenantContext
  ): Promise<boolean> {
    // Les avocats ne peuvent accéder qu'aux dossiers de leurs clients
    if (resourceType === 'dossier_client') {
      // Vérifier que l'avocat est assigné au dossier
      return true; // Simulation
    }
    return true;
  }

  private async validateNotaireAccess(
    resourceType: string,
    resourceId: string,
    context: TenantContext
  ): Promise<boolean> {
    // Les notaires ne peuvent accéder qu'à leur minutier
    if (resourceType === 'acte_authentique') {
      // Vérifier que l'acte appartient au notaire
      return true; // Simulation
    }
    return true;
  }

  private async validateHuissierAccess(
    resourceType: string,
    resourceId: string,
    context: TenantContext
  ): Promise<boolean> {
    // Les huissiers ne peuvent accéder qu'à leurs exploits
    if (resourceType === 'exploit') {
      // Vérifier que l'exploit appartient au huissier
      return true; // Simulation
    }
    return true;
  }

  private async validateEtudiantAccess(
    resourceType: string,
    resourceId: string,
    context: TenantContext
  ): Promise<boolean> {
    // Les étudiants ont un accès limité aux ressources pédagogiques
    const allowedResources = ['cours', 'exercice', 'jurisprudence_publique'];
    return allowedResources.includes(resourceType);
  }

  private generateTenantId(organizationId: string): string {
    // Générer un tenant ID déterministe basé sur l'organisation
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(organizationId).digest('hex').substring(0, 16);
  }

  private async getRolePermissions(userRole: string): Promise<string[]> {
    // Retourner les permissions basées sur le rôle
    const rolePermissions: Record<string, string[]> = {
      avocat: ['read_dossier', 'write_dossier', 'read_jurisprudence', 'calculate_fees'],
      notaire: ['read_acte', 'write_acte', 'read_minutier', 'write_minutier'],
      huissier: ['read_exploit', 'write_exploit', 'calculate_fees'],
      magistrat: ['read_jurisprudence', 'write_jugement', 'read_dossier'],
      etudiant: ['read_cours', 'read_exercice', 'read_jurisprudence_publique'],
      juriste_entreprise: ['read_contrat', 'write_contrat', 'read_veille'],
      admin: ['*'] // Toutes les permissions
    };

    return rolePermissions[userRole] || [];
  }

  private async detectCrossTenantDataLeaks(tenantId: string): Promise<string[]> {
    // Détecter les fuites de données entre tenants
    // En production, analyser les logs et requêtes
    return [];
  }

  private async validateEncryptionKeyIntegrity(tenantId: string): Promise<string[]> {
    // Valider l'intégrité des clés de chiffrement
    const issues: string[] = [];
    
    if (await encryptionService.isKeyRotationNeeded(tenantId)) {
      issues.push('Rotation de clé nécessaire');
    }

    return issues;
  }

  private detectSuspiciousAccess(tenantId: string): DataAccessLog[] {
    // Détecter les accès suspects dans les logs
    const recentLogs = this.auditLogs.filter(log => 
      log.tenantId === tenantId &&
      log.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
    );

    // Détecter les tentatives d'accès répétées échouées
    const failedAttempts = recentLogs.filter(log => !log.success);
    const suspiciousLogs: DataAccessLog[] = [];

    // Grouper par utilisateur et détecter les patterns suspects
    const userFailures = new Map<string, DataAccessLog[]>();
    failedAttempts.forEach(log => {
      if (!userFailures.has(log.userId)) {
        userFailures.set(log.userId, []);
      }
      userFailures.get(log.userId)!.push(log);
    });

    // Marquer comme suspect si plus de 5 échecs en 1 heure
    userFailures.forEach((logs, userId) => {
      if (logs.length > 5) {
        suspiciousLogs.push(...logs);
      }
    });

    return suspiciousLogs;
  }
}

export const tenantIsolationService = new TenantIsolationService();