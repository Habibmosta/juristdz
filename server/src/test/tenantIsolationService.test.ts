import { tenantIsolationService, TenantIsolationService, TenantContext } from '@/services/tenantIsolationService';

describe('TenantIsolationService', () => {
  let service: TenantIsolationService;
  let testContext: TenantContext;

  beforeEach(() => {
    service = new TenantIsolationService();
    testContext = {
      tenantId: 'tenant-123',
      organizationId: 'org-456',
      userId: 'user-789',
      userRole: 'avocat',
      permissions: ['read_dossier', 'write_dossier', 'read_jurisprudence']
    };
  });

  describe('Isolation des requêtes', () => {
    test('devrait appliquer le filtre tenant aux requêtes', () => {
      const baseQuery = {
        select: ['*'],
        from: 'documents',
        where: { status: 'active' }
      };

      const isolatedQuery = service.applyTenantIsolation(baseQuery, testContext);

      expect(isolatedQuery.tenantFilter).toEqual({
        tenant_id: testContext.tenantId,
        organization_id: testContext.organizationId
      });

      expect(isolatedQuery.baseQuery.where).toEqual({
        status: 'active',
        tenant_id: testContext.tenantId,
        organization_id: testContext.organizationId
      });
    });

    test('devrait appliquer l\'isolation aux requêtes complexes', () => {
      const complexQuery = {
        select: ['*'],
        from: 'documents',
        joins: [
          {
            table: 'clients',
            on: 'documents.client_id = clients.id'
          }
        ],
        where: { 'documents.status': 'active' }
      };

      const isolatedQuery = service.applyTenantIsolation(complexQuery, testContext);

      expect(isolatedQuery.baseQuery.where).toMatchObject({
        'documents.status': 'active',
        tenant_id: testContext.tenantId,
        organization_id: testContext.organizationId
      });
    });
  });

  describe('Validation d\'accès aux ressources', () => {
    test('devrait autoriser l\'accès avec les bonnes permissions', async () => {
      const hasAccess = await service.validateResourceAccess(
        'dossier',
        'dossier-123',
        testContext,
        'read_dossier'
      );

      expect(hasAccess).toBe(true);
    });

    test('devrait refuser l\'accès sans les permissions requises', async () => {
      const hasAccess = await service.validateResourceAccess(
        'dossier',
        'dossier-123',
        testContext,
        'delete_dossier' // Permission non accordée
      );

      expect(hasAccess).toBe(false);
    });

    test('devrait valider l\'accès spécifique par rôle', async () => {
      const etudiantContext: TenantContext = {
        ...testContext,
        userRole: 'etudiant',
        permissions: ['read_cours', 'read_exercice']
      };

      // Étudiant peut accéder aux cours
      const canAccessCours = await service.validateResourceAccess(
        'cours',
        'cours-123',
        etudiantContext,
        'read_cours'
      );
      expect(canAccessCours).toBe(true);

      // Étudiant ne peut pas accéder aux dossiers clients
      const canAccessDossier = await service.validateResourceAccess(
        'dossier_client',
        'dossier-123',
        etudiantContext,
        'read_dossier'
      );
      expect(canAccessDossier).toBe(false);
    });
  });

  describe('Chiffrement avec isolation tenant', () => {
    test('devrait chiffrer des données avec métadonnées tenant', async () => {
      const testData = {
        clientName: 'Jean Dupont',
        caseDetails: 'Détails confidentiels'
      };

      const encrypted = await service.encryptTenantData(testData, testContext);

      expect(encrypted).toBeDefined();
      expect(encrypted.data).toBeDefined();
      expect(encrypted.keyId).toBeDefined();
    });

    test('devrait déchiffrer et valider l\'isolation tenant', async () => {
      const testData = {
        clientName: 'Jean Dupont',
        caseDetails: 'Détails confidentiels'
      };

      const encrypted = await service.encryptTenantData(testData, testContext);
      const decrypted = await service.decryptTenantData(encrypted, testContext);

      expect(decrypted).toEqual(testData);
    });

    test('devrait rejeter les données d\'un autre tenant', async () => {
      const testData = { info: 'test' };
      const encrypted = await service.encryptTenantData(testData, testContext);

      const otherContext: TenantContext = {
        ...testContext,
        tenantId: 'autre-tenant',
        organizationId: 'autre-org'
      };

      await expect(
        service.decryptTenantData(encrypted, otherContext)
      ).rejects.toThrow('Violation d\'isolation tenant');
    });
  });

  describe('Création de contexte tenant', () => {
    test('devrait créer un contexte tenant valide', async () => {
      const context = await service.createTenantContext(
        'user-123',
        'org-456',
        'avocat'
      );

      expect(context).toBeDefined();
      expect(context.userId).toBe('user-123');
      expect(context.organizationId).toBe('org-456');
      expect(context.userRole).toBe('avocat');
      expect(context.tenantId).toBeDefined();
      expect(context.permissions).toContain('read_dossier');
    });

    test('devrait générer des tenant IDs cohérents pour la même organisation', async () => {
      const context1 = await service.createTenantContext('user1', 'org-123', 'avocat');
      const context2 = await service.createTenantContext('user2', 'org-123', 'notaire');

      expect(context1.tenantId).toBe(context2.tenantId);
    });
  });

  describe('Validation d\'intégrité tenant', () => {
    test('devrait valider l\'intégrité d\'un tenant sain', async () => {
      const integrity = await service.validateTenantIntegrity(testContext.tenantId);

      expect(integrity.isValid).toBe(true);
      expect(integrity.violations).toHaveLength(0);
    });

    test('devrait détecter les violations potentielles', async () => {
      // Simuler des violations en modifiant l'état interne
      const integrity = await service.validateTenantIntegrity('tenant-avec-problemes');

      // Les violations dépendent de l'implémentation des détections
      expect(integrity).toHaveProperty('violations');
      expect(integrity).toHaveProperty('recommendations');
    });
  });

  describe('Rapport d\'audit', () => {
    test('devrait générer un rapport d\'audit complet', async () => {
      // Simuler quelques accès
      await service.validateResourceAccess('dossier', 'dossier-1', testContext, 'read_dossier');
      await service.validateResourceAccess('dossier', 'dossier-2', testContext, 'write_dossier');
      await service.validateResourceAccess('document', 'doc-1', testContext, 'delete_document');

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago
      const endDate = new Date();

      const report = service.generateAccessAuditReport(
        testContext.tenantId,
        startDate,
        endDate
      );

      expect(report).toBeDefined();
      expect(report.totalAccess).toBeGreaterThan(0);
      expect(report.successfulAccess).toBeDefined();
      expect(report.failedAccess).toBeDefined();
      expect(report.topUsers).toBeDefined();
      expect(report.topResources).toBeDefined();
      expect(report.securityEvents).toBeDefined();
    });

    test('devrait identifier les événements de sécurité', async () => {
      // Simuler des accès échoués
      await service.validateResourceAccess('dossier', 'dossier-1', testContext, 'permission_inexistante');
      await service.validateResourceAccess('dossier', 'dossier-2', testContext, 'autre_permission_inexistante');

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const report = service.generateAccessAuditReport(
        testContext.tenantId,
        startDate,
        endDate
      );

      expect(report.failedAccess).toBeGreaterThan(0);
      expect(report.securityEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Gestion des rôles spécialisés', () => {
    test('devrait appliquer les restrictions d\'avocat', async () => {
      const avocatContext: TenantContext = {
        ...testContext,
        userRole: 'avocat',
        permissions: ['read_dossier', 'write_dossier']
      };

      const canAccess = await service.validateResourceAccess(
        'dossier_client',
        'dossier-123',
        avocatContext,
        'read_dossier'
      );

      expect(canAccess).toBe(true);
    });

    test('devrait appliquer les restrictions de notaire', async () => {
      const notaireContext: TenantContext = {
        ...testContext,
        userRole: 'notaire',
        permissions: ['read_acte', 'write_acte', 'read_minutier']
      };

      const canAccessActe = await service.validateResourceAccess(
        'acte_authentique',
        'acte-123',
        notaireContext,
        'read_acte'
      );

      expect(canAccessActe).toBe(true);
    });

    test('devrait appliquer les restrictions d\'étudiant', async () => {
      const etudiantContext: TenantContext = {
        ...testContext,
        userRole: 'etudiant',
        permissions: ['read_cours', 'read_exercice']
      };

      // Étudiant peut accéder aux ressources pédagogiques
      const canAccessCours = await service.validateResourceAccess(
        'cours',
        'cours-123',
        etudiantContext,
        'read_cours'
      );
      expect(canAccessCours).toBe(true);

      // Étudiant ne peut pas accéder aux dossiers clients réels
      const canAccessDossier = await service.validateResourceAccess(
        'dossier_client',
        'dossier-123',
        etudiantContext,
        'read_dossier'
      );
      expect(canAccessDossier).toBe(false);
    });
  });

  describe('Gestion des erreurs', () => {
    test('devrait gérer les contextes invalides', async () => {
      const invalidContext = {
        ...testContext,
        tenantId: '',
        organizationId: ''
      };

      await expect(
        service.validateResourceAccess('dossier', 'dossier-123', invalidContext, 'read_dossier')
      ).rejects.toThrow();
    });

    test('devrait gérer les permissions manquantes', async () => {
      const contextSansPermissions: TenantContext = {
        ...testContext,
        permissions: []
      };

      const hasAccess = await service.validateResourceAccess(
        'dossier',
        'dossier-123',
        contextSansPermissions,
        'read_dossier'
      );

      expect(hasAccess).toBe(false);
    });
  });
});