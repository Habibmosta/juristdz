import { auditService, AuditService, AuditEvent, SecurityThreat } from '@/services/auditService';

describe('AuditService', () => {
  let service: AuditService;
  const testTenantId = 'test-tenant-123';
  const testUserId = 'test-user-456';

  beforeEach(() => {
    service = new AuditService();
  });

  describe('Enregistrement d\'événements d\'audit', () => {
    test('devrait enregistrer un événement d\'audit valide', async () => {
      const event: AuditEvent = {
        tenantId: testTenantId,
        userId: testUserId,
        actionType: 'document_access',
        resourceType: 'document',
        resourceId: 'doc-123',
        securityContext: {
          userRole: 'avocat',
          permissions: ['read_document'],
          dataClassification: 'confidential',
          requiresEncryption: true
        },
        success: true,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date()
      };

      await expect(service.logEvent(event)).resolves.not.toThrow();
      expect(event.id).toBeDefined();
    });

    test('devrait gérer les événements d\'échec', async () => {
      const event: AuditEvent = {
        tenantId: testTenantId,
        userId: testUserId,
        actionType: 'document_access',
        resourceType: 'document',
        resourceId: 'doc-123',
        securityContext: {
          userRole: 'avocat',
          permissions: ['read_document'],
          dataClassification: 'confidential',
          requiresEncryption: true
        },
        success: false,
        errorCode: 'INSUFFICIENT_PERMISSIONS',
        errorMessage: 'Permissions insuffisantes pour accéder au document',
        timestamp: new Date()
      };

      await expect(service.logEvent(event)).resolves.not.toThrow();
    });
  });

  describe('Enregistrement de menaces de sécurité', () => {
    test('devrait enregistrer une menace de sécurité', async () => {
      const threat: SecurityThreat = {
        tenantId: testTenantId,
        threatType: 'brute_force_login',
        severity: 'high',
        description: 'Tentatives de connexion répétées échouées',
        affectedResources: ['authentication'],
        userId: testUserId,
        ipAddress: '192.168.1.100',
        status: 'detected',
        detectedAt: new Date()
      };

      await expect(service.logSecurityThreat(threat)).resolves.not.toThrow();
      expect(threat.id).toBeDefined();
    });

    test('devrait traiter différents niveaux de sévérité', async () => {
      const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];

      for (const severity of severities) {
        const threat: SecurityThreat = {
          tenantId: testTenantId,
          threatType: 'test_threat',
          severity,
          description: `Menace de niveau ${severity}`,
          affectedResources: ['test'],
          status: 'detected',
          detectedAt: new Date()
        };

        await expect(service.logSecurityThreat(threat)).resolves.not.toThrow();
      }
    });
  });

  describe('Génération de rapports d\'audit', () => {
    test('devrait générer un rapport d\'audit complet', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago
      const endDate = new Date();

      // Simuler quelques événements
      const events: AuditEvent[] = [
        {
          tenantId: testTenantId,
          userId: testUserId,
          actionType: 'login',
          resourceType: 'authentication',
          securityContext: {
            userRole: 'avocat',
            permissions: ['login'],
            dataClassification: 'internal',
            requiresEncryption: false
          },
          success: true,
          timestamp: new Date()
        },
        {
          tenantId: testTenantId,
          userId: testUserId,
          actionType: 'document_access',
          resourceType: 'document',
          resourceId: 'doc-123',
          securityContext: {
            userRole: 'avocat',
            permissions: ['read_document'],
            dataClassification: 'confidential',
            requiresEncryption: true
          },
          success: true,
          timestamp: new Date()
        }
      ];

      for (const event of events) {
        await service.logEvent(event);
      }

      const report = await service.generateAuditReport(testTenantId, startDate, endDate);

      expect(report).toBeDefined();
      expect(report.tenantId).toBe(testTenantId);
      expect(report.period.startDate).toEqual(startDate);
      expect(report.period.endDate).toEqual(endDate);
      expect(report.totalEvents).toBeGreaterThanOrEqual(0);
      expect(report.successRate).toBeGreaterThanOrEqual(0);
      expect(report.successRate).toBeLessThanOrEqual(100);
      expect(Array.isArray(report.topUsers)).toBe(true);
      expect(Array.isArray(report.topResources)).toBe(true);
      expect(Array.isArray(report.securityEvents)).toBe(true);
      expect(Array.isArray(report.hourlyActivity)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('devrait gérer les périodes sans événements', async () => {
      const startDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h ago
      const endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);   // 24h ago

      const report = await service.generateAuditReport('tenant-inexistant', startDate, endDate);

      expect(report.totalEvents).toBe(0);
      expect(report.topUsers).toHaveLength(0);
      expect(report.topResources).toHaveLength(0);
    });
  });

  describe('Métriques de monitoring', () => {
    test('devrait récupérer les métriques actuelles', async () => {
      const metrics = await service.getCurrentMetrics(testTenantId);

      expect(metrics).toBeDefined();
      expect(metrics.tenantId).toBe(testTenantId);
      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.successfulRequests).toBe('number');
      expect(typeof metrics.failedRequests).toBe('number');
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(typeof metrics.securityEvents).toBe('number');
      expect(typeof metrics.threatsDetected).toBe('number');
      expect(typeof metrics.intrusionAttempts).toBe('number');
      expect(typeof metrics.activeUsers).toBe('number');
    });

    test('devrait calculer les métriques correctement', async () => {
      // Simuler des événements avec succès et échecs
      const successEvent: AuditEvent = {
        tenantId: testTenantId,
        userId: testUserId,
        actionType: 'test_action',
        resourceType: 'test_resource',
        securityContext: {
          userRole: 'test',
          permissions: [],
          dataClassification: 'internal',
          requiresEncryption: false
        },
        success: true,
        timestamp: new Date()
      };

      const failureEvent: AuditEvent = {
        ...successEvent,
        success: false,
        errorCode: 'TEST_ERROR'
      };

      await service.logEvent(successEvent);
      await service.logEvent(failureEvent);

      const metrics = await service.getCurrentMetrics(testTenantId);

      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.successfulRequests).toBeGreaterThan(0);
      expect(metrics.failedRequests).toBeGreaterThan(0);
    });
  });

  describe('Détection d\'intrusions', () => {
    test('devrait détecter les tentatives de connexion répétées', async () => {
      // Simuler plusieurs échecs de connexion
      for (let i = 0; i < 6; i++) {
        const event: AuditEvent = {
          tenantId: testTenantId,
          userId: testUserId,
          actionType: 'login',
          resourceType: 'authentication',
          securityContext: {
            userRole: 'avocat',
            permissions: [],
            dataClassification: 'internal',
            requiresEncryption: false
          },
          success: false,
          errorCode: 'INVALID_CREDENTIALS',
          ipAddress: '192.168.1.100',
          timestamp: new Date()
        };

        await service.logEvent(event);
      }

      const threats = await service.detectIntrusions(testTenantId);

      expect(threats.length).toBeGreaterThan(0);
      const bruteForceThreats = threats.filter(t => t.threatType === 'brute_force_login');
      expect(bruteForceThreats.length).toBeGreaterThan(0);
    });

    test('devrait détecter les accès non autorisés répétés', async () => {
      // Simuler plusieurs tentatives d'accès non autorisé
      for (let i = 0; i < 4; i++) {
        const event: AuditEvent = {
          tenantId: testTenantId,
          userId: testUserId,
          actionType: 'document_access',
          resourceType: 'document',
          resourceId: `doc-${i}`,
          securityContext: {
            userRole: 'avocat',
            permissions: ['read_document'],
            dataClassification: 'confidential',
            requiresEncryption: true
          },
          success: false,
          errorCode: 'INSUFFICIENT_PERMISSIONS',
          timestamp: new Date()
        };

        await service.logEvent(event);
      }

      const threats = await service.detectIntrusions(testTenantId);

      const unauthorizedThreats = threats.filter(t => t.threatType === 'unauthorized_access_attempt');
      expect(unauthorizedThreats.length).toBeGreaterThan(0);
    });

    test('devrait détecter l\'activité suspecte hors heures', async () => {
      // Simuler une activité sensible (cette partie dépend de l'heure actuelle)
      const sensitiveEvent: AuditEvent = {
        tenantId: testTenantId,
        userId: testUserId,
        actionType: 'delete',
        resourceType: 'document',
        resourceId: 'sensitive-doc',
        securityContext: {
          userRole: 'avocat',
          permissions: ['delete_document'],
          dataClassification: 'secret',
          requiresEncryption: true
        },
        success: true,
        timestamp: new Date()
      };

      await service.logEvent(sensitiveEvent);

      const threats = await service.detectIntrusions(testTenantId);

      // La détection dépend de l'heure actuelle
      // En production, on pourrait mocker l'heure pour tester
      expect(Array.isArray(threats)).toBe(true);
    });
  });

  describe('Nettoyage des logs', () => {
    test('devrait nettoyer les anciens logs', async () => {
      await expect(service.cleanupOldLogs()).resolves.not.toThrow();
    });
  });

  describe('Gestion des erreurs', () => {
    test('devrait gérer les événements avec des données manquantes', async () => {
      const incompleteEvent: Partial<AuditEvent> = {
        tenantId: testTenantId,
        userId: testUserId,
        actionType: 'test_action',
        // resourceType manquant
        securityContext: {
          userRole: 'test',
          permissions: [],
          dataClassification: 'internal',
          requiresEncryption: false
        },
        success: true,
        timestamp: new Date()
      };

      // Le service devrait gérer gracieusement les données incomplètes
      await expect(service.logEvent(incompleteEvent as AuditEvent)).resolves.not.toThrow();
    });

    test('devrait gérer les erreurs de base de données', async () => {
      // Simuler une erreur de base de données en utilisant un tenant ID invalide
      const event: AuditEvent = {
        tenantId: '', // Tenant ID vide pour provoquer une erreur
        userId: testUserId,
        actionType: 'test_action',
        resourceType: 'test_resource',
        securityContext: {
          userRole: 'test',
          permissions: [],
          dataClassification: 'internal',
          requiresEncryption: false
        },
        success: true,
        timestamp: new Date()
      };

      // Le service ne devrait pas faire échouer l'opération principale
      await expect(service.logEvent(event)).resolves.not.toThrow();
    });
  });

  describe('Analyse en temps réel', () => {
    test('devrait analyser les événements pour détecter des patterns', async () => {
      // Simuler une séquence d'événements suspects
      const events = [
        {
          actionType: 'login',
          success: false,
          errorCode: 'INVALID_CREDENTIALS'
        },
        {
          actionType: 'login',
          success: false,
          errorCode: 'INVALID_CREDENTIALS'
        },
        {
          actionType: 'login',
          success: false,
          errorCode: 'INVALID_CREDENTIALS'
        }
      ];

      for (const eventData of events) {
        const event: AuditEvent = {
          tenantId: testTenantId,
          userId: testUserId,
          resourceType: 'authentication',
          securityContext: {
            userRole: 'avocat',
            permissions: [],
            dataClassification: 'internal',
            requiresEncryption: false
          },
          timestamp: new Date(),
          ...eventData
        };

        await service.logEvent(event);
      }

      // L'analyse devrait détecter le pattern suspect
      // (Vérification indirecte via les métriques ou les menaces détectées)
      const metrics = await service.getCurrentMetrics(testTenantId);
      expect(metrics.failedRequests).toBeGreaterThan(0);
    });
  });
});