import { Router } from 'express';
import { Pool } from 'pg';
import { AdminService, CreateUserRequest, UpdateUserRequest, UserSearchCriteria, AdminReportType } from '../services/adminService.js';
import { AIConfigService, CreateAIModelRequest, UpdateAIModelRequest, AIModelSearchCriteria, AIProvider, DomaineJuridique } from '../services/aiConfigService.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { Profession } from '../types/auth.js';

export function createAdminRoutes(db: Pool): Router {
  const router = Router();
  const adminService = new AdminService(db);
  const aiConfigService = new AIConfigService(db);

  // Apply authentication to all routes
  router.use(authenticateToken);

  /**
   * GET /api/admin/users
   * Rechercher et lister les utilisateurs
   */
  router.get('/users', checkPermission('user:read'), asyncHandler(async (req, res) => {
    const criteria: UserSearchCriteria = {
      email: req.query.email as string,
      role: req.query.role as Profession,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      organizationId: req.query.organizationId as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await adminService.searchUsers(criteria);

    res.json({
      success: true,
      data: result,
      message: 'Utilisateurs récupérés avec succès'
    });
  }));

  /**
   * POST /api/admin/users
   * Créer un nouvel utilisateur
   */
  router.post('/users', checkPermission('user:create'), asyncHandler(async (req, res) => {
    const request: CreateUserRequest = req.body;
    const adminId = req.user!.id;

    // Validation des données
    if (!request.email || !request.firstName || !request.lastName || !request.role || !request.password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être fournis'
      });
    }

    // Validation du rôle
    if (!Object.values(Profession).includes(request.role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    // Validation du mot de passe
    if (request.password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    const user = await adminService.createUser(request, adminId);

    res.status(201).json({
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès'
    });
  }));

  /**
   * GET /api/admin/users/:userId
   * Obtenir un utilisateur par ID
   */
  router.get('/users/:userId', checkPermission('user:read'), asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await adminService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'Utilisateur récupéré avec succès'
    });
  }));

  /**
   * PUT /api/admin/users/:userId
   * Mettre à jour un utilisateur
   */
  router.put('/users/:userId', checkPermission('user:update'), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const request: UpdateUserRequest = req.body;
    const adminId = req.user!.id;

    // Validation du rôle si fourni
    if (request.role && !Object.values(Profession).includes(request.role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    const user = await adminService.updateUser(userId, request, adminId);

    res.json({
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès'
    });
  }));

  /**
   * DELETE /api/admin/users/:userId
   * Supprimer un utilisateur (soft delete)
   */
  router.delete('/users/:userId', checkPermission('user:delete'), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const adminId = req.user!.id;

    await adminService.deleteUser(userId, adminId);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  }));

  /**
   * GET /api/admin/statistics/users
   * Obtenir les statistiques des utilisateurs
   */
  router.get('/statistics/users', checkPermission('user:read'), asyncHandler(async (req, res) => {
    const statistics = await adminService.getUserStatistics();

    res.json({
      success: true,
      data: statistics,
      message: 'Statistiques utilisateurs récupérées avec succès'
    });
  }));

  /**
   * POST /api/admin/users/:userId/reset-password
   * Réinitialiser le mot de passe d'un utilisateur
   */
  router.post('/users/:userId/reset-password', checkPermission('user:update'), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const adminId = req.user!.id;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
      });
    }

    await adminService.resetUserPassword(userId, newPassword, adminId);

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  }));

  /**
   * POST /api/admin/users/:userId/unlock
   * Débloquer un utilisateur
   */
  router.post('/users/:userId/unlock', checkPermission('user:update'), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const adminId = req.user!.id;

    await adminService.unlockUser(userId, adminId);

    res.json({
      success: true,
      message: 'Utilisateur débloqué avec succès'
    });
  }));

  /**
   * GET /api/admin/roles
   * Obtenir la liste des rôles disponibles
   */
  router.get('/roles', checkPermission('role:read'), asyncHandler(async (req, res) => {
    const roles = Object.values(Profession).map(role => ({
      value: role,
      label: role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getRoleDescription(role)
    }));

    res.json({
      success: true,
      data: roles,
      message: 'Rôles récupérés avec succès'
    });
  }));

  /**
   * GET /api/admin/organizations
   * Obtenir la liste des organisations
   */
  router.get('/organizations', checkPermission('organization:read'), asyncHandler(async (req, res) => {
    const query = `
      SELECT id, name, type, description, created_at
      FROM organizations
      WHERE is_active = true
      ORDER BY name ASC
    `;

    const result = await db.query(query);
    const organizations = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      data: organizations,
      message: 'Organisations récupérées avec succès'
    });
  }));

  /**
   * GET /api/admin/audit-logs
   * Obtenir les logs d'audit
   */
  router.get('/audit-logs', checkPermission('audit:read'), asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.query.userId as string;
    const action = req.query.action as string;
    const resourceType = req.query.resourceType as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;

    let query = `
      SELECT al.*, u.email as user_email, u.first_name, u.last_name,
             COUNT(*) OVER() as total_count
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND al.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (action) {
      query += ` AND al.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (resourceType) {
      query += ` AND al.resource_type = $${paramIndex}`;
      params.push(resourceType);
      paramIndex++;
    }

    if (dateFrom) {
      query += ` AND al.created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND al.created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    query += ` ORDER BY al.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);

    const result = await db.query(query, params);
    const logs = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : null,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      details: row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at
    }));

    const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        logs,
        total,
        page,
        totalPages
      },
      message: 'Logs d\'audit récupérés avec succès'
    });
  }));

  // ===== AI MODEL CONFIGURATION ROUTES =====

  /**
   * GET /api/admin/ai-models
   * Rechercher et lister les configurations de modèles IA
   */
  router.get('/ai-models', checkPermission('configuration:read'), asyncHandler(async (req, res) => {
    const criteria: AIModelSearchCriteria = {
      provider: req.query.provider as AIProvider,
      domainJuridique: req.query.domainJuridique as DomaineJuridique,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const result = await aiConfigService.searchAIModels(criteria);

    res.json({
      success: true,
      data: result,
      message: 'Configurations de modèles IA récupérées avec succès'
    });
  }));

  /**
   * POST /api/admin/ai-models
   * Créer une nouvelle configuration de modèle IA
   */
  router.post('/ai-models', checkPermission('configuration:create'), asyncHandler(async (req, res) => {
    const request: CreateAIModelRequest = req.body;
    const adminId = req.user!.id;

    // Validation des données
    if (!request.name || !request.provider || !request.modelId || !request.domainJuridique || !request.configuration) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être fournis'
      });
    }

    // Validation du provider
    if (!Object.values(AIProvider).includes(request.provider)) {
      return res.status(400).json({
        success: false,
        message: 'Fournisseur IA invalide'
      });
    }

    // Validation du domaine juridique
    if (!Object.values(DomaineJuridique).includes(request.domainJuridique)) {
      return res.status(400).json({
        success: false,
        message: 'Domaine juridique invalide'
      });
    }

    // Validation de la configuration
    if (!request.configuration.systemPrompt || request.configuration.temperature < 0 || request.configuration.temperature > 2) {
      return res.status(400).json({
        success: false,
        message: 'Configuration du modèle invalide'
      });
    }

    const model = await aiConfigService.createAIModel(request, adminId);

    res.status(201).json({
      success: true,
      data: model,
      message: 'Configuration de modèle IA créée avec succès'
    });
  }));

  /**
   * GET /api/admin/ai-models/:modelId
   * Obtenir une configuration de modèle IA par ID
   */
  router.get('/ai-models/:modelId', checkPermission('configuration:read'), asyncHandler(async (req, res) => {
    const { modelId } = req.params;

    const model = await aiConfigService.getAIModelById(modelId);

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Configuration de modèle IA non trouvée'
      });
    }

    res.json({
      success: true,
      data: model,
      message: 'Configuration de modèle IA récupérée avec succès'
    });
  }));

  /**
   * PUT /api/admin/ai-models/:modelId
   * Mettre à jour une configuration de modèle IA
   */
  router.put('/ai-models/:modelId', checkPermission('configuration:update'), asyncHandler(async (req, res) => {
    const { modelId } = req.params;
    const request: UpdateAIModelRequest = req.body;
    const adminId = req.user!.id;

    // Validation de la configuration si fournie
    if (request.configuration) {
      if (request.configuration.temperature !== undefined && (request.configuration.temperature < 0 || request.configuration.temperature > 2)) {
        return res.status(400).json({
          success: false,
          message: 'Température invalide (doit être entre 0 et 2)'
        });
      }
    }

    const model = await aiConfigService.updateAIModel(modelId, request, adminId);

    res.json({
      success: true,
      data: model,
      message: 'Configuration de modèle IA mise à jour avec succès'
    });
  }));

  /**
   * DELETE /api/admin/ai-models/:modelId
   * Supprimer une configuration de modèle IA
   */
  router.delete('/ai-models/:modelId', checkPermission('configuration:delete'), asyncHandler(async (req, res) => {
    const { modelId } = req.params;
    const adminId = req.user!.id;

    await aiConfigService.deleteAIModel(modelId, adminId);

    res.json({
      success: true,
      message: 'Configuration de modèle IA supprimée avec succès'
    });
  }));

  /**
   * POST /api/admin/ai-models/:modelId/test
   * Tester une configuration de modèle IA
   */
  router.post('/ai-models/:modelId/test', checkPermission('configuration:update'), asyncHandler(async (req, res) => {
    const { modelId } = req.params;
    const { testPrompt } = req.body;

    if (!testPrompt || testPrompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prompt de test requis'
      });
    }

    const result = await aiConfigService.testAIModel(modelId, testPrompt);

    res.json({
      success: true,
      data: result,
      message: result.success ? 'Test du modèle IA réussi' : 'Test du modèle IA échoué'
    });
  }));

  /**
   * GET /api/admin/ai-models/statistics/usage
   * Obtenir les statistiques d'utilisation des modèles IA
   */
  router.get('/ai-models/statistics/usage', checkPermission('configuration:read'), asyncHandler(async (req, res) => {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const statistics = await aiConfigService.getAIUsageStatistics(dateFrom, dateTo);

    res.json({
      success: true,
      data: statistics,
      message: 'Statistiques d\'utilisation des modèles IA récupérées avec succès'
    });
  }));

  /**
   * GET /api/admin/ai-providers
   * Obtenir la liste des fournisseurs IA disponibles
   */
  router.get('/ai-providers', checkPermission('configuration:read'), asyncHandler(async (req, res) => {
    const providers = Object.values(AIProvider).map(provider => ({
      value: provider,
      label: provider.toUpperCase(),
      description: getProviderDescription(provider)
    }));

    res.json({
      success: true,
      data: providers,
      message: 'Fournisseurs IA récupérés avec succès'
    });
  }));

  /**
   * GET /api/admin/legal-domains
   * Obtenir la liste des domaines juridiques
   */
  router.get('/legal-domains', checkPermission('configuration:read'), asyncHandler(async (req, res) => {
    const domains = Object.values(DomaineJuridique).map(domain => ({
      value: domain,
      label: domain.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getDomainDescription(domain)
    }));

    res.json({
      success: true,
      data: domains,
      message: 'Domaines juridiques récupérés avec succès'
    });
  }));

  // ===== ADMINISTRATIVE REPORTING ROUTES =====

  /**
   * GET /api/admin/statistics/platform
   * Obtenir les statistiques complètes de la plateforme
   */
  router.get('/statistics/platform', checkPermission('admin:read'), asyncHandler(async (req, res) => {
    const statistics = await adminService.getPlatformStatistics();

    res.json({
      success: true,
      data: statistics,
      message: 'Statistiques de la plateforme récupérées avec succès'
    });
  }));

  /**
   * GET /api/admin/statistics/usage
   * Obtenir les statistiques d'utilisation
   */
  router.get('/statistics/usage', checkPermission('admin:read'), asyncHandler(async (req, res) => {
    const statistics = await adminService.getUsageStatistics();

    res.json({
      success: true,
      data: statistics,
      message: 'Statistiques d\'utilisation récupérées avec succès'
    });
  }));

  /**
   * GET /api/admin/statistics/performance
   * Obtenir les statistiques de performance
   */
  router.get('/statistics/performance', checkPermission('admin:read'), asyncHandler(async (req, res) => {
    const statistics = await adminService.getPerformanceStatistics();

    res.json({
      success: true,
      data: statistics,
      message: 'Statistiques de performance récupérées avec succès'
    });
  }));

  /**
   * GET /api/admin/statistics/financial
   * Obtenir les statistiques financières
   */
  router.get('/statistics/financial', checkPermission('admin:read'), asyncHandler(async (req, res) => {
    const statistics = await adminService.getFinancialStatistics();

    res.json({
      success: true,
      data: statistics,
      message: 'Statistiques financières récupérées avec succès'
    });
  }));

  /**
   * GET /api/admin/statistics/content
   * Obtenir les statistiques de contenu
   */
  router.get('/statistics/content', checkPermission('admin:read'), asyncHandler(async (req, res) => {
    const statistics = await adminService.getContentStatistics();

    res.json({
      success: true,
      data: statistics,
      message: 'Statistiques de contenu récupérées avec succès'
    });
  }));

  /**
   * GET /api/admin/system/health
   * Obtenir le rapport de santé du système
   */
  router.get('/system/health', checkPermission('admin:read'), asyncHandler(async (req, res) => {
    const healthReport = await adminService.getSystemHealthReport();

    res.json({
      success: true,
      data: healthReport,
      message: 'Rapport de santé du système récupéré avec succès'
    });
  }));

  /**
   * POST /api/admin/reports/generate
   * Générer un rapport personnalisé
   */
  router.post('/reports/generate', checkPermission('admin:read'), asyncHandler(async (req, res) => {
    const { reportType, parameters } = req.body;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Type de rapport requis'
      });
    }

    // Validation du type de rapport
    const validReportTypes = Object.values(AdminReportType);
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de rapport invalide'
      });
    }

    const report = await adminService.generateCustomReport(reportType, parameters || {});

    res.json({
      success: true,
      data: report,
      message: 'Rapport généré avec succès'
    });
  }));

  /**
   * GET /api/admin/reports/types
   * Obtenir la liste des types de rapports disponibles
   */
  router.get('/reports/types', checkPermission('admin:read'), asyncHandler(async (req, res) => {
    const reportTypes = Object.values(AdminReportType).map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getReportTypeDescription(type)
    }));

    res.json({
      success: true,
      data: reportTypes,
      message: 'Types de rapports récupérés avec succès'
    });
  }));

  return router;
}

// Helper function to get role descriptions
function getRoleDescription(role: Profession): string {
  const descriptions: Record<Profession, string> = {
    [Profession.AVOCAT]: 'Professionnel du droit représentant et conseillant les clients',
    [Profession.NOTAIRE]: 'Officier public authentifiant les actes et contrats',
    [Profession.HUISSIER]: 'Officier ministériel chargé de l\'exécution des décisions de justice',
    [Profession.MAGISTRAT]: 'Membre de l\'autorité judiciaire rendant la justice',
    [Profession.ETUDIANT]: 'Étudiant en droit avec accès limité aux fonctionnalités',
    [Profession.JURISTE_ENTREPRISE]: 'Juriste travaillant au sein d\'une entreprise',
    [Profession.ADMIN]: 'Administrateur de la plateforme avec tous les droits'
  };

  return descriptions[role] || 'Rôle professionnel';
}

// Helper function to get AI provider descriptions
function getProviderDescription(provider: AIProvider): string {
  const descriptions: Record<AIProvider, string> = {
    [AIProvider.OPENAI]: 'OpenAI GPT models (GPT-4, GPT-3.5)',
    [AIProvider.ANTHROPIC]: 'Anthropic Claude models',
    [AIProvider.GOOGLE]: 'Google Gemini and PaLM models',
    [AIProvider.GROQ]: 'Groq high-speed inference',
    [AIProvider.MISTRAL]: 'Mistral AI models',
    [AIProvider.LOCAL]: 'Local or self-hosted models'
  };

  return descriptions[provider] || 'Fournisseur IA';
}

// Helper function to get legal domain descriptions
function getDomainDescription(domain: DomaineJuridique): string {
  const descriptions: Record<DomaineJuridique, string> = {
    [DomaineJuridique.DROIT_CIVIL]: 'Droit des personnes, des biens et des obligations',
    [DomaineJuridique.DROIT_PENAL]: 'Droit criminel et procédure pénale',
    [DomaineJuridique.DROIT_COMMERCIAL]: 'Droit des affaires et du commerce',
    [DomaineJuridique.DROIT_ADMINISTRATIF]: 'Droit de l\'administration publique',
    [DomaineJuridique.DROIT_CONSTITUTIONNEL]: 'Droit constitutionnel et institutions',
    [DomaineJuridique.DROIT_INTERNATIONAL]: 'Droit international public et privé',
    [DomaineJuridique.DROIT_TRAVAIL]: 'Droit du travail et de l\'emploi',
    [DomaineJuridique.DROIT_FAMILLE]: 'Droit de la famille et des personnes',
    [DomaineJuridique.DROIT_IMMOBILIER]: 'Droit immobilier et de la construction',
    [DomaineJuridique.DROIT_FISCAL]: 'Droit fiscal et taxation',
    [DomaineJuridique.GENERAL]: 'Domaine juridique général'
  };

  return descriptions[domain] || 'Domaine juridique';
}

// Helper function to get report type descriptions
function getReportTypeDescription(reportType: AdminReportType): string {
  const descriptions: Record<AdminReportType, string> = {
    [AdminReportType.USER_ACTIVITY]: 'Rapport d\'activité des utilisateurs par rôle et période',
    [AdminReportType.SYSTEM_PERFORMANCE]: 'Rapport de performance système avec métriques détaillées',
    [AdminReportType.FINANCIAL_SUMMARY]: 'Résumé financier avec revenus et abonnements',
    [AdminReportType.CONTENT_ANALYTICS]: 'Analyse du contenu et des documents générés',
    [AdminReportType.SECURITY_AUDIT]: 'Audit de sécurité avec événements et alertes',
    [AdminReportType.AI_USAGE]: 'Rapport d\'utilisation des modèles IA et coûts',
    [AdminReportType.CUSTOM]: 'Rapport personnalisé avec paramètres spécifiques'
  };

  return descriptions[reportType] || 'Rapport administratif';
}

// Legacy export for backward compatibility
export { createAdminRoutes as adminRouter };