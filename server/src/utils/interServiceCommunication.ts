import { logger } from '@/utils/logger';
import { auditService } from '@/services/auditService';

/**
 * Utilitaires pour la communication inter-services sécurisée
 * Gère les appels entre services avec audit, retry et validation
 */

export interface ServiceCall {
  sourceService: string;
  targetService: string;
  method: string;
  params: any;
  userId?: string;
  tenantId?: string;
  requestId?: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    responseTime: number;
    timestamp: Date;
    requestId: string;
  };
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class InterServiceCommunication {
  private static instance: InterServiceCommunication;
  private callHistory: Map<string, ServiceCall[]> = new Map();
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  private constructor() {}

  static getInstance(): InterServiceCommunication {
    if (!InterServiceCommunication.instance) {
      InterServiceCommunication.instance = new InterServiceCommunication();
    }
    return InterServiceCommunication.instance;
  }

  /**
   * Effectue un appel sécurisé entre services
   */
  async callService<T = any>(
    call: ServiceCall,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ServiceResponse<T>> {
    const requestId = call.requestId || this.generateRequestId();
    const startTime = Date.now();
    
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    
    // Enregistrer l'appel
    this.recordCall({ ...call, requestId });
    
    // Audit de l'appel inter-service
    await this.auditServiceCall(call, requestId);
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // Validation des paramètres
        this.validateServiceCall(call);
        
        // Effectuer l'appel
        const result = await this.executeServiceCall<T>(call);
        
        const responseTime = Date.now() - startTime;
        
        // Audit du succès
        await this.auditServiceCallSuccess(call, requestId, responseTime);
        
        return {
          success: true,
          data: result,
          metadata: {
            responseTime,
            timestamp: new Date(),
            requestId
          }
        };
        
      } catch (error) {
        lastError = error as Error;
        
        logger.warn(`Échec de l'appel inter-service (tentative ${attempt}/${config.maxAttempts}):`, {
          sourceService: call.sourceService,
          targetService: call.targetService,
          method: call.method,
          error: error instanceof Error ? error.message : error,
          requestId
        });
        
        // Si ce n'est pas la dernière tentative, attendre avant de réessayer
        if (attempt < config.maxAttempts) {
          const delay = Math.min(
            config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
            config.maxDelay
          );
          await this.sleep(delay);
        }
      }
    }
    
    // Audit de l'échec
    const responseTime = Date.now() - startTime;
    await this.auditServiceCallFailure(call, requestId, lastError!, responseTime);
    
    return {
      success: false,
      error: lastError?.message || 'Erreur inconnue lors de l\'appel inter-service',
      metadata: {
        responseTime,
        timestamp: new Date(),
        requestId
      }
    };
  }

  /**
   * Valide un appel de service
   */
  private validateServiceCall(call: ServiceCall): void {
    if (!call.sourceService || !call.targetService) {
      throw new Error('Services source et cible requis');
    }
    
    if (!call.method) {
      throw new Error('Méthode requise');
    }
    
    // Validation de l'isolation tenant
    if (call.tenantId && call.params) {
      this.validateTenantIsolation(call);
    }
  }

  /**
   * Valide l'isolation des données par tenant
   */
  private validateTenantIsolation(call: ServiceCall): void {
    // Vérifier que les paramètres ne contiennent pas de données d'autres tenants
    if (typeof call.params === 'object' && call.params !== null) {
      const paramString = JSON.stringify(call.params);
      
      // Rechercher des patterns suspects (IDs d'autres tenants, etc.)
      if (call.tenantId && paramString.includes('tenant_id') && !paramString.includes(call.tenantId)) {
        logger.warn('Tentative d\'accès cross-tenant détectée:', {
          sourceService: call.sourceService,
          targetService: call.targetService,
          tenantId: call.tenantId,
          params: call.params
        });
        
        throw new Error('Violation de l\'isolation tenant détectée');
      }
    }
  }

  /**
   * Exécute l'appel de service
   */
  private async executeServiceCall<T>(call: ServiceCall): Promise<T> {
    // Simuler l'appel de service - en production, ceci serait remplacé
    // par la logique d'appel réelle (HTTP, message queue, etc.)
    
    switch (call.targetService) {
      case 'auth':
        return await this.callAuthService(call);
      case 'document':
        return await this.callDocumentService(call);
      case 'case':
        return await this.callCaseService(call);
      case 'notification':
        return await this.callNotificationService(call);
      case 'billing':
        return await this.callBillingService(call);
      case 'search':
        return await this.callSearchService(call);
      default:
        throw new Error(`Service ${call.targetService} non supporté`);
    }
  }

  /**
   * Appels spécialisés par service
   */
  private async callAuthService<T>(call: ServiceCall): Promise<T> {
    const { authService } = await import('@/services/authService');
    
    switch (call.method) {
      case 'validateToken':
        return await authService.validateToken(call.params.token) as T;
      case 'getUserById':
        return await authService.getUserById(call.params.userId) as T;
      default:
        throw new Error(`Méthode ${call.method} non supportée pour le service auth`);
    }
  }

  private async callDocumentService<T>(call: ServiceCall): Promise<T> {
    const { documentService } = await import('@/services/documentService');
    
    switch (call.method) {
      case 'getDocument':
        return await documentService.getDocument(call.params.documentId, call.userId!, call.tenantId!) as T;
      case 'createDocument':
        return await documentService.createDocument(call.params.documentData, call.userId!, call.tenantId!) as T;
      case 'updateDocument':
        return await documentService.updateDocument(call.params.documentId, call.params.updates, call.userId!, call.tenantId!) as T;
      default:
        throw new Error(`Méthode ${call.method} non supportée pour le service document`);
    }
  }

  private async callCaseService<T>(call: ServiceCall): Promise<T> {
    const { caseManagementService } = await import('@/services/caseManagementService');
    
    switch (call.method) {
      case 'getCase':
        return await caseManagementService.getCase(call.params.caseId, call.userId!, call.tenantId!) as T;
      case 'createCase':
        return await caseManagementService.createCase(call.params.caseData, call.userId!, call.tenantId!) as T;
      case 'updateCase':
        return await caseManagementService.updateCase(call.params.caseId, call.params.updates, call.userId!, call.tenantId!) as T;
      default:
        throw new Error(`Méthode ${call.method} non supportée pour le service case`);
    }
  }

  private async callNotificationService<T>(call: ServiceCall): Promise<T> {
    const { notificationService } = await import('@/services/notificationService');
    
    switch (call.method) {
      case 'sendNotification':
        return await notificationService.sendNotification(call.params.notification) as T;
      case 'getNotifications':
        return await notificationService.getNotifications(call.params.userId, call.params.options) as T;
      default:
        throw new Error(`Méthode ${call.method} non supportée pour le service notification`);
    }
  }

  private async callBillingService<T>(call: ServiceCall): Promise<T> {
    const { billingService } = await import('@/services/billingService');
    
    switch (call.method) {
      case 'calculateFees':
        return await billingService.calculateFees(call.params.calculation) as T;
      case 'generateInvoice':
        return await billingService.generateInvoice(call.params.invoiceData) as T;
      default:
        throw new Error(`Méthode ${call.method} non supportée pour le service billing`);
    }
  }

  private async callSearchService<T>(call: ServiceCall): Promise<T> {
    const { legalSearchService } = await import('@/services/legalSearchService');
    
    switch (call.method) {
      case 'search':
        return await legalSearchService.search(call.params.query, call.params.options) as T;
      case 'indexDocument':
        return await legalSearchService.indexDocument(call.params.document) as T;
      default:
        throw new Error(`Méthode ${call.method} non supportée pour le service search`);
    }
  }

  /**
   * Enregistre un appel dans l'historique
   */
  private recordCall(call: ServiceCall): void {
    const key = `${call.sourceService}->${call.targetService}`;
    
    if (!this.callHistory.has(key)) {
      this.callHistory.set(key, []);
    }
    
    const history = this.callHistory.get(key)!;
    history.push(call);
    
    // Garder seulement les 100 derniers appels
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Audit d'un appel inter-service
   */
  private async auditServiceCall(call: ServiceCall, requestId: string): Promise<void> {
    try {
      await auditService.logApiAccess({
        userId: call.userId || 'system',
        tenantId: call.tenantId || 'system',
        action: `inter_service_call`,
        resource: `${call.sourceService}->${call.targetService}`,
        details: {
          method: call.method,
          requestId,
          sourceService: call.sourceService,
          targetService: call.targetService
        }
      });
    } catch (error) {
      logger.error('Erreur lors de l\'audit de l\'appel inter-service:', error);
    }
  }

  /**
   * Audit du succès d'un appel
   */
  private async auditServiceCallSuccess(call: ServiceCall, requestId: string, responseTime: number): Promise<void> {
    try {
      await auditService.logApiAccess({
        userId: call.userId || 'system',
        tenantId: call.tenantId || 'system',
        action: `inter_service_call_success`,
        resource: `${call.sourceService}->${call.targetService}`,
        details: {
          method: call.method,
          requestId,
          responseTime,
          sourceService: call.sourceService,
          targetService: call.targetService
        }
      });
    } catch (error) {
      logger.error('Erreur lors de l\'audit du succès de l\'appel inter-service:', error);
    }
  }

  /**
   * Audit de l'échec d'un appel
   */
  private async auditServiceCallFailure(call: ServiceCall, requestId: string, error: Error, responseTime: number): Promise<void> {
    try {
      await auditService.logSecurityEvent({
        type: 'inter_service_call_failure',
        userId: call.userId || 'system',
        tenantId: call.tenantId || 'system',
        details: {
          method: call.method,
          requestId,
          responseTime,
          sourceService: call.sourceService,
          targetService: call.targetService,
          error: error.message
        },
        severity: 'medium'
      });
    } catch (auditError) {
      logger.error('Erreur lors de l\'audit de l\'échec de l\'appel inter-service:', auditError);
    }
  }

  /**
   * Génère un ID de requête unique
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utilitaire de pause
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtient l'historique des appels pour une paire de services
   */
  getCallHistory(sourceService: string, targetService: string): ServiceCall[] {
    const key = `${sourceService}->${targetService}`;
    return this.callHistory.get(key) || [];
  }

  /**
   * Obtient les statistiques des appels inter-services
   */
  getCallStatistics(): {
    totalCalls: number;
    callsByService: Record<string, number>;
    averageResponseTime: number;
    errorRate: number;
  } {
    let totalCalls = 0;
    const callsByService: Record<string, number> = {};
    
    for (const [key, calls] of this.callHistory.entries()) {
      totalCalls += calls.length;
      callsByService[key] = calls.length;
    }
    
    return {
      totalCalls,
      callsByService,
      averageResponseTime: 0, // À calculer avec les métriques réelles
      errorRate: 0 // À calculer avec les métriques réelles
    };
  }

  /**
   * Nettoie l'historique des appels
   */
  clearCallHistory(): void {
    this.callHistory.clear();
    logger.info('Historique des appels inter-services nettoyé');
  }
}

// Instance singleton
export const interServiceCommunication = InterServiceCommunication.getInstance();

// Utilitaires de convenance pour les appels courants
export const serviceCall = {
  /**
   * Appel d'authentification
   */
  auth: {
    validateToken: async (token: string, sourceService: string) => {
      return await interServiceCommunication.callService({
        sourceService,
        targetService: 'auth',
        method: 'validateToken',
        params: { token }
      });
    },
    
    getUserById: async (userId: string, sourceService: string) => {
      return await interServiceCommunication.callService({
        sourceService,
        targetService: 'auth',
        method: 'getUserById',
        params: { userId }
      });
    }
  },

  /**
   * Appels de documents
   */
  document: {
    get: async (documentId: string, userId: string, tenantId: string, sourceService: string) => {
      return await interServiceCommunication.callService({
        sourceService,
        targetService: 'document',
        method: 'getDocument',
        params: { documentId },
        userId,
        tenantId
      });
    },
    
    create: async (documentData: any, userId: string, tenantId: string, sourceService: string) => {
      return await interServiceCommunication.callService({
        sourceService,
        targetService: 'document',
        method: 'createDocument',
        params: { documentData },
        userId,
        tenantId
      });
    }
  },

  /**
   * Appels de notifications
   */
  notification: {
    send: async (notification: any, sourceService: string) => {
      return await interServiceCommunication.callService({
        sourceService,
        targetService: 'notification',
        method: 'sendNotification',
        params: { notification }
      });
    }
  },

  /**
   * Appels de recherche
   */
  search: {
    query: async (query: any, options: any, sourceService: string) => {
      return await interServiceCommunication.callService({
        sourceService,
        targetService: 'search',
        method: 'search',
        params: { query, options }
      });
    }
  }
};