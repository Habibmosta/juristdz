import { Router } from 'express';
import { Pool } from 'pg';
import { ModerationService } from '../services/moderationService.js';
import { 
  CreateModerationItemRequest, 
  UpdateModerationItemRequest,
  PerformModerationActionRequest,
  CreateModerationReportRequest,
  ModerationSearchCriteria,
  ContentType,
  ModerationStatus,
  ModerationReason
} from '../types/moderation.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export function createModerationRoutes(db: Pool): Router {
  const router = Router();
  const moderationService = new ModerationService(db);

  // Apply authentication to all routes
  router.use(authenticateToken);

  /**
   * GET /api/moderation/queue
   * Obtenir la file d'attente de modération
   */
  router.get('/queue', checkPermission('moderation:read'), asyncHandler(async (req, res) => {
    const moderatorId = req.query.moderatorId as string;
    const queue = await moderationService.getModerationQueue(moderatorId);

    res.json({
      success: true,
      data: queue,
      message: 'File d\'attente de modération récupérée avec succès'
    });
  }));

  /**
   * GET /api/moderation/dashboard
   * Obtenir le tableau de bord de modération
   */
  router.get('/dashboard', checkPermission('moderation:read'), asyncHandler(async (req, res) => {
    const moderatorId = req.user!.id;
    const dashboard = await moderationService.getModerationDashboard(moderatorId);

    res.json({
      success: true,
      data: dashboard,
      message: 'Tableau de bord de modération récupéré avec succès'
    });
  }));

  /**
   * GET /api/moderation/items
   * Rechercher des éléments de modération
   */
  router.get('/items', checkPermission('moderation:read'), asyncHandler(async (req, res) => {
    const criteria: ModerationSearchCriteria = {
      status: req.query.status as ModerationStatus,
      contentType: req.query.contentType as ContentType,
      priority: req.query.priority as any,
      assignedModerator: req.query.assignedModerator as string,
      submittedBy: req.query.submittedBy as string,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      hasAutoFlags: req.query.hasAutoFlags === 'true',
      hasManualReports: req.query.hasManualReports === 'true',
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await moderationService.searchModerationItems(criteria);

    res.json({
      success: true,
      data: result,
      message: 'Éléments de modération récupérés avec succès'
    });
  }));

  /**
   * POST /api/moderation/items
   * Créer un nouvel élément de modération
   */
  router.post('/items', checkPermission('moderation:create'), asyncHandler(async (req, res) => {
    const request: CreateModerationItemRequest = req.body;
    const userId = req.user!.id;

    // Validation des données
    if (!request.contentType || !request.contentId || !request.contentTitle || !request.submittedBy) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être fournis'
      });
    }

    // Validation du type de contenu
    if (!Object.values(ContentType).includes(request.contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de contenu invalide'
      });
    }

    const item = await moderationService.createModerationItem(request, userId);

    res.status(201).json({
      success: true,
      data: item,
      message: 'Élément de modération créé avec succès'
    });
  }));

  /**
   * GET /api/moderation/items/:itemId
   * Obtenir un élément de modération par ID
   */
  router.get('/items/:itemId', checkPermission('moderation:read'), asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const item = await moderationService.getModerationItemById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Élément de modération non trouvé'
      });
    }

    res.json({
      success: true,
      data: item,
      message: 'Élément de modération récupéré avec succès'
    });
  }));

  /**
   * PUT /api/moderation/items/:itemId
   * Mettre à jour un élément de modération
   */
  router.put('/items/:itemId', checkPermission('moderation:update'), asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const request: UpdateModerationItemRequest = req.body;
    const userId = req.user!.id;

    // Validation du statut si fourni
    if (request.status && !Object.values(ModerationStatus).includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut de modération invalide'
      });
    }

    const item = await moderationService.updateModerationItem(itemId, request, userId);

    res.json({
      success: true,
      data: item,
      message: 'Élément de modération mis à jour avec succès'
    });
  }));

  /**
   * POST /api/moderation/items/:itemId/actions
   * Effectuer une action de modération
   */
  router.post('/items/:itemId/actions', checkPermission('moderation:moderate'), asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const request: PerformModerationActionRequest = req.body;
    const userId = req.user!.id;

    // Validation des données
    if (!request.action || !request.reason) {
      return res.status(400).json({
        success: false,
        message: 'Action et raison sont obligatoires'
      });
    }

    await moderationService.performModerationAction(itemId, request, userId);

    res.json({
      success: true,
      message: 'Action de modération effectuée avec succès'
    });
  }));

  /**
   * POST /api/moderation/reports
   * Créer un rapport de modération
   */
  router.post('/reports', checkPermission('moderation:report'), asyncHandler(async (req, res) => {
    const request: CreateModerationReportRequest = req.body;
    const userId = req.user!.id;

    // Validation des données
    if (!request.contentType || !request.contentId || !request.reason || !request.description) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être fournis'
      });
    }

    // Validation du type de contenu
    if (!Object.values(ContentType).includes(request.contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de contenu invalide'
      });
    }

    // Validation de la raison
    if (!Object.values(ModerationReason).includes(request.reason)) {
      return res.status(400).json({
        success: false,
        message: 'Raison de signalement invalide'
      });
    }

    await moderationService.createModerationReport(request, userId);

    res.status(201).json({
      success: true,
      message: 'Rapport de modération créé avec succès'
    });
  }));

  /**
   * GET /api/moderation/statistics
   * Obtenir les statistiques de modération
   */
  router.get('/statistics', checkPermission('moderation:read'), asyncHandler(async (req, res) => {
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const statistics = await moderationService.getModerationStatistics(dateFrom, dateTo);

    res.json({
      success: true,
      data: statistics,
      message: 'Statistiques de modération récupérées avec succès'
    });
  }));

  /**
   * GET /api/moderation/content-types
   * Obtenir la liste des types de contenu disponibles
   */
  router.get('/content-types', checkPermission('moderation:read'), asyncHandler(async (req, res) => {
    const contentTypes = Object.values(ContentType).map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getContentTypeDescription(type)
    }));

    res.json({
      success: true,
      data: contentTypes,
      message: 'Types de contenu récupérés avec succès'
    });
  }));

  /**
   * GET /api/moderation/reasons
   * Obtenir la liste des raisons de modération disponibles
   */
  router.get('/reasons', checkPermission('moderation:read'), asyncHandler(async (req, res) => {
    const reasons = Object.values(ModerationReason).map(reason => ({
      value: reason,
      label: reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getModerationReasonDescription(reason)
    }));

    res.json({
      success: true,
      data: reasons,
      message: 'Raisons de modération récupérées avec succès'
    });
  }));

  /**
   * GET /api/moderation/statuses
   * Obtenir la liste des statuts de modération disponibles
   */
  router.get('/statuses', checkPermission('moderation:read'), asyncHandler(async (req, res) => {
    const statuses = Object.values(ModerationStatus).map(status => ({
      value: status,
      label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getModerationStatusDescription(status)
    }));

    res.json({
      success: true,
      data: statuses,
      message: 'Statuts de modération récupérés avec succès'
    });
  }));

  return router;
}

// Helper function to get content type descriptions
function getContentTypeDescription(contentType: ContentType): string {
  const descriptions: Record<ContentType, string> = {
    [ContentType.DOCUMENT]: 'Documents juridiques et fichiers',
    [ContentType.TEMPLATE]: 'Modèles de documents',
    [ContentType.COMMENT]: 'Commentaires et discussions',
    [ContentType.CASE_NOTE]: 'Notes de dossiers clients',
    [ContentType.USER_PROFILE]: 'Profils utilisateurs',
    [ContentType.LEGAL_OPINION]: 'Avis et opinions juridiques'
  };

  return descriptions[contentType] || 'Type de contenu';
}

// Helper function to get moderation reason descriptions
function getModerationReasonDescription(reason: ModerationReason): string {
  const descriptions: Record<ModerationReason, string> = {
    [ModerationReason.INAPPROPRIATE_CONTENT]: 'Contenu inapproprié ou offensant',
    [ModerationReason.LEGAL_VIOLATION]: 'Violation des règles légales',
    [ModerationReason.SPAM]: 'Contenu spam ou promotionnel',
    [ModerationReason.PLAGIARISM]: 'Plagiat ou violation de droits d\'auteur',
    [ModerationReason.CONFIDENTIALITY_BREACH]: 'Violation de confidentialité',
    [ModerationReason.PROFESSIONAL_MISCONDUCT]: 'Faute professionnelle',
    [ModerationReason.TECHNICAL_ERROR]: 'Erreur technique',
    [ModerationReason.OTHER]: 'Autre raison'
  };

  return descriptions[reason] || 'Raison de modération';
}

// Helper function to get moderation status descriptions
function getModerationStatusDescription(status: ModerationStatus): string {
  const descriptions: Record<ModerationStatus, string> = {
    [ModerationStatus.PENDING]: 'En attente de révision',
    [ModerationStatus.APPROVED]: 'Approuvé et publié',
    [ModerationStatus.REJECTED]: 'Rejeté et non publié',
    [ModerationStatus.FLAGGED]: 'Signalé pour révision',
    [ModerationStatus.UNDER_REVIEW]: 'En cours de révision'
  };

  return descriptions[status] || 'Statut de modération';
}

// Legacy export for backward compatibility
export { createModerationRoutes as moderationRouter };