import { Pool } from 'pg';
import { logger } from '../utils/logger.js';
import {
  ModerationItem,
  ModerationStatus,
  ModerationAction,
  ContentType,
  ModerationReason,
  AutoModerationRule,
  AutoModerationFlag,
  ModerationReport,
  ModerationWorkflow,
  ModerationQueue,
  ModerationStatistics,
  ModerationSearchCriteria,
  ModerationSearchResult,
  CreateModerationItemRequest,
  UpdateModerationItemRequest,
  PerformModerationActionRequest,
  CreateModerationReportRequest,
  CreateModerationWorkflowRequest,
  UpdateModerationWorkflowRequest,
  AutoModerationResult,
  ModerationDashboard,
  ModerationAlert
} from '../types/moderation.js';

export class ModerationService {
  constructor(private db: Pool) {}

  /**
   * Créer un nouvel élément de modération
   */
  async createModerationItem(request: CreateModerationItemRequest, userId: string): Promise<ModerationItem> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Exécuter la modération automatique d'abord
      const autoModerationResult = await this.performAutoModeration(
        request.contentType,
        request.contentPreview
      );

      // Déterminer le workflow approprié
      const workflowId = request.workflowId || await this.getDefaultWorkflowId(request.contentType);

      // Créer l'élément de modération
      const itemQuery = `
        INSERT INTO moderation_items (
          content_type, content_id, content_title, content_preview,
          submitted_by, priority, workflow_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const status = autoModerationResult.passed && !autoModerationResult.requiresManualReview 
        ? ModerationStatus.APPROVED 
        : ModerationStatus.PENDING;

      const itemResult = await client.query(itemQuery, [
        request.contentType,
        request.contentId,
        request.contentTitle,
        request.contentPreview,
        request.submittedBy,
        request.priority || 'medium',
        workflowId,
        status
      ]);

      const itemId = itemResult.rows[0].id;

      // Ajouter les flags de modération automatique
      for (const flag of autoModerationResult.flags) {
        await client.query(`
          INSERT INTO auto_moderation_flags (
            moderation_item_id, rule, severity, confidence,
            details, flagged_content, suggested_action
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          itemId,
          flag.rule,
          flag.severity,
          flag.confidence,
          flag.details,
          flag.flaggedContent,
          flag.suggestedAction
        ]);
      }

      // Créer l'entrée d'audit
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, details
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        'CREATE_MODERATION_ITEM',
        'moderation_item',
        itemId,
        JSON.stringify({
          contentType: request.contentType,
          contentId: request.contentId,
          autoModerationResult: {
            passed: autoModerationResult.passed,
            flagsCount: autoModerationResult.flags.length
          }
        })
      ]);

      await client.query('COMMIT');

      const item = await this.getModerationItemById(itemId);
      
      logger.info('Élément de modération créé', { 
        itemId, 
        contentType: request.contentType,
        status,
        userId 
      });

      return item!;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la création de l\'élément de modération', { error, request, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtenir un élément de modération par ID
   */
  async getModerationItemById(itemId: string): Promise<ModerationItem | null> {
    try {
      const query = `
        SELECT 
          mi.*,
          u1.first_name || ' ' || u1.last_name as submitted_by_name,
          u1.role as submitted_by_role,
          u2.first_name || ' ' || u2.last_name as assigned_moderator_name,
          u3.first_name || ' ' || u3.last_name as reviewer_name
        FROM moderation_items mi
        LEFT JOIN users u1 ON mi.submitted_by = u1.id
        LEFT JOIN users u2 ON mi.assigned_moderator = u2.id
        LEFT JOIN users u3 ON mi.reviewed_by = u3.id
        WHERE mi.id = $1
      `;

      const result = await this.db.query(query, [itemId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const item = result.rows[0];

      // Récupérer les flags de modération automatique
      const flagsResult = await this.db.query(`
        SELECT * FROM auto_moderation_flags 
        WHERE moderation_item_id = $1 
        ORDER BY created_at DESC
      `, [itemId]);

      // Récupérer les rapports manuels
      const reportsResult = await this.db.query(`
        SELECT mr.*, u.first_name || ' ' || u.last_name as reporter_name, u.role as reporter_role
        FROM moderation_reports mr
        LEFT JOIN users u ON mr.reported_by = u.id
        WHERE mr.moderation_item_id = $1 
        ORDER BY mr.created_at DESC
      `, [itemId]);

      return this.mapRowToModerationItem(item, flagsResult.rows, reportsResult.rows);
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'élément de modération', { error, itemId });
      throw error;
    }
  }

  /**
   * Rechercher des éléments de modération
   */
  async searchModerationItems(criteria: ModerationSearchCriteria): Promise<ModerationSearchResult> {
    try {
      let query = `
        SELECT 
          mi.*,
          u1.first_name || ' ' || u1.last_name as submitted_by_name,
          u1.role as submitted_by_role,
          u2.first_name || ' ' || u2.last_name as assigned_moderator_name,
          u3.first_name || ' ' || u3.last_name as reviewer_name,
          COUNT(*) OVER() as total_count
        FROM moderation_items mi
        LEFT JOIN users u1 ON mi.submitted_by = u1.id
        LEFT JOIN users u2 ON mi.assigned_moderator = u2.id
        LEFT JOIN users u3 ON mi.reviewed_by = u3.id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Construire les conditions de recherche
      if (criteria.status) {
        query += ` AND mi.status = $${paramIndex}`;
        params.push(criteria.status);
        paramIndex++;
      }

      if (criteria.contentType) {
        query += ` AND mi.content_type = $${paramIndex}`;
        params.push(criteria.contentType);
        paramIndex++;
      }

      if (criteria.priority) {
        query += ` AND mi.priority = $${paramIndex}`;
        params.push(criteria.priority);
        paramIndex++;
      }

      if (criteria.assignedModerator) {
        query += ` AND mi.assigned_moderator = $${paramIndex}`;
        params.push(criteria.assignedModerator);
        paramIndex++;
      }

      if (criteria.submittedBy) {
        query += ` AND mi.submitted_by = $${paramIndex}`;
        params.push(criteria.submittedBy);
        paramIndex++;
      }

      if (criteria.dateFrom) {
        query += ` AND mi.created_at >= $${paramIndex}`;
        params.push(criteria.dateFrom);
        paramIndex++;
      }

      if (criteria.dateTo) {
        query += ` AND mi.created_at <= $${paramIndex}`;
        params.push(criteria.dateTo);
        paramIndex++;
      }

      if (criteria.hasAutoFlags) {
        query += ` AND EXISTS (SELECT 1 FROM auto_moderation_flags WHERE moderation_item_id = mi.id)`;
      }

      if (criteria.hasManualReports) {
        query += ` AND EXISTS (SELECT 1 FROM moderation_reports WHERE moderation_item_id = mi.id)`;
      }

      if (criteria.search) {
        query += ` AND (mi.content_title ILIKE $${paramIndex} OR mi.content_preview ILIKE $${paramIndex})`;
        params.push(`%${criteria.search}%`);
        paramIndex++;
      }

      // Tri
      const sortBy = criteria.sortBy || 'createdAt';
      const sortOrder = criteria.sortOrder || 'desc';
      const sortColumn = this.mapSortColumn(sortBy);
      query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

      // Pagination
      const page = criteria.page || 1;
      const limit = criteria.limit || 20;
      const offset = (page - 1) * limit;

      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);

      const items: ModerationItem[] = [];
      for (const row of result.rows) {
        // Récupérer les flags et rapports pour chaque élément
        const flagsResult = await this.db.query(`
          SELECT * FROM auto_moderation_flags 
          WHERE moderation_item_id = $1
        `, [row.id]);

        const reportsResult = await this.db.query(`
          SELECT mr.*, u.first_name || ' ' || u.last_name as reporter_name, u.role as reporter_role
          FROM moderation_reports mr
          LEFT JOIN users u ON mr.reported_by = u.id
          WHERE mr.moderation_item_id = $1
        `, [row.id]);

        items.push(this.mapRowToModerationItem(row, flagsResult.rows, reportsResult.rows));
      }

      const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
      const totalPages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        totalPages
      };
    } catch (error) {
      logger.error('Erreur lors de la recherche d\'éléments de modération', { error, criteria });
      throw error;
    }
  }

  /**
   * Mettre à jour un élément de modération
   */
  async updateModerationItem(itemId: string, request: UpdateModerationItemRequest, userId: string): Promise<ModerationItem> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier que l'élément existe
      const existingItem = await this.getModerationItemById(itemId);
      if (!existingItem) {
        throw new Error('Élément de modération non trouvé');
      }

      // Construire la requête de mise à jour
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (request.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(request.status);
        paramIndex++;
      }

      if (request.assignedModerator !== undefined) {
        updateFields.push(`assigned_moderator = $${paramIndex}`);
        updateValues.push(request.assignedModerator);
        paramIndex++;
      }

      if (request.priority !== undefined) {
        updateFields.push(`priority = $${paramIndex}`);
        updateValues.push(request.priority);
        paramIndex++;
      }

      if (request.reviewNotes !== undefined) {
        updateFields.push(`review_notes = $${paramIndex}`);
        updateValues.push(request.reviewNotes);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        throw new Error('Aucune modification fournie');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(itemId);

      const updateQuery = `
        UPDATE moderation_items SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      await client.query(updateQuery, updateValues);

      // Créer l'entrée d'audit
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, details
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        'UPDATE_MODERATION_ITEM',
        'moderation_item',
        itemId,
        JSON.stringify({
          previousData: {
            status: existingItem.status,
            assignedModerator: existingItem.assignedModerator,
            priority: existingItem.priority
          },
          newData: request
        })
      ]);

      await client.query('COMMIT');

      const updatedItem = await this.getModerationItemById(itemId);
      
      logger.info('Élément de modération mis à jour', { 
        itemId, 
        changes: request,
        userId 
      });

      return updatedItem!;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la mise à jour de l\'élément de modération', { error, itemId, request, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Effectuer une action de modération
   */
  async performModerationAction(itemId: string, request: PerformModerationActionRequest, userId: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier que l'élément existe
      const existingItem = await this.getModerationItemById(itemId);
      if (!existingItem) {
        throw new Error('Élément de modération non trouvé');
      }

      // Déterminer le nouveau statut basé sur l'action
      let newStatus: ModerationStatus;
      switch (request.action) {
        case ModerationAction.APPROVE:
          newStatus = ModerationStatus.APPROVED;
          break;
        case ModerationAction.REJECT:
          newStatus = ModerationStatus.REJECTED;
          break;
        case ModerationAction.FLAG:
          newStatus = ModerationStatus.FLAGGED;
          break;
        case ModerationAction.REQUEST_CHANGES:
          newStatus = ModerationStatus.PENDING;
          break;
        case ModerationAction.ESCALATE:
          newStatus = ModerationStatus.UNDER_REVIEW;
          break;
        default:
          throw new Error('Action de modération invalide');
      }

      // Mettre à jour l'élément de modération
      await client.query(`
        UPDATE moderation_items SET 
          status = $1,
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = $2,
          review_notes = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [newStatus, userId, request.notes, itemId]);

      // Enregistrer l'action de modération
      await client.query(`
        INSERT INTO moderation_actions (
          moderation_item_id, action, performed_by, reason, notes
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        itemId,
        request.action,
        userId,
        request.reason,
        request.notes
      ]);

      // Créer l'entrée d'audit
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, details
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        'PERFORM_MODERATION_ACTION',
        'moderation_item',
        itemId,
        JSON.stringify({
          action: request.action,
          reason: request.reason,
          previousStatus: existingItem.status,
          newStatus
        })
      ]);

      await client.query('COMMIT');
      
      logger.info('Action de modération effectuée', { 
        itemId, 
        action: request.action,
        newStatus,
        userId 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de l\'action de modération', { error, itemId, request, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Créer un rapport de modération
   */
  async createModerationReport(request: CreateModerationReportRequest, userId: string): Promise<void> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Vérifier si un élément de modération existe déjà pour ce contenu
      let moderationItemId: string;
      
      const existingItemResult = await client.query(`
        SELECT id FROM moderation_items 
        WHERE content_type = $1 AND content_id = $2
      `, [request.contentType, request.contentId]);

      if (existingItemResult.rows.length > 0) {
        moderationItemId = existingItemResult.rows[0].id;
      } else {
        // Créer un nouvel élément de modération
        const newItemResult = await client.query(`
          INSERT INTO moderation_items (
            content_type, content_id, content_title, content_preview,
            submitted_by, status, priority
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          request.contentType,
          request.contentId,
          'Contenu signalé',
          'Contenu signalé par un utilisateur',
          userId,
          ModerationStatus.FLAGGED,
          'high'
        ]);
        
        moderationItemId = newItemResult.rows[0].id;
      }

      // Créer le rapport de modération
      await client.query(`
        INSERT INTO moderation_reports (
          moderation_item_id, reported_by, reason, description, evidence
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        moderationItemId,
        userId,
        request.reason,
        request.description,
        request.evidence || []
      ]);

      // Créer l'entrée d'audit
      await client.query(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, details
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        userId,
        'CREATE_MODERATION_REPORT',
        'moderation_report',
        moderationItemId,
        JSON.stringify({
          contentType: request.contentType,
          contentId: request.contentId,
          reason: request.reason
        })
      ]);

      await client.query('COMMIT');
      
      logger.info('Rapport de modération créé', { 
        moderationItemId, 
        reason: request.reason,
        userId 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erreur lors de la création du rapport de modération', { error, request, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtenir la file d'attente de modération
   */
  async getModerationQueue(moderatorId?: string): Promise<ModerationQueue> {
    try {
      let whereClause = '1=1';
      const params: any[] = [];
      
      if (moderatorId) {
        whereClause = 'assigned_moderator = $1';
        params.push(moderatorId);
      }

      const query = `
        SELECT 
          mi.*,
          u1.first_name || ' ' || u1.last_name as submitted_by_name,
          u1.role as submitted_by_role,
          u2.first_name || ' ' || u2.last_name as assigned_moderator_name
        FROM moderation_items mi
        LEFT JOIN users u1 ON mi.submitted_by = u1.id
        LEFT JOIN users u2 ON mi.assigned_moderator = u2.id
        WHERE ${whereClause}
        ORDER BY 
          CASE priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          created_at ASC
      `;

      const result = await this.db.query(query, params);

      const items: ModerationItem[] = [];
      for (const row of result.rows) {
        const flagsResult = await this.db.query(`
          SELECT * FROM auto_moderation_flags 
          WHERE moderation_item_id = $1
        `, [row.id]);

        const reportsResult = await this.db.query(`
          SELECT mr.*, u.first_name || ' ' || u.last_name as reporter_name, u.role as reporter_role
          FROM moderation_reports mr
          LEFT JOIN users u ON mr.reported_by = u.id
          WHERE mr.moderation_item_id = $1
        `, [row.id]);

        items.push(this.mapRowToModerationItem(row, flagsResult.rows, reportsResult.rows));
      }

      // Calculer les statistiques de la file d'attente
      const total = items.length;
      const pending = items.filter(item => item.status === ModerationStatus.PENDING).length;
      const underReview = items.filter(item => item.status === ModerationStatus.UNDER_REVIEW).length;
      const flagged = items.filter(item => item.status === ModerationStatus.FLAGGED).length;
      const highPriority = items.filter(item => item.priority === 'high' || item.priority === 'urgent').length;

      return {
        items,
        total,
        pending,
        underReview,
        flagged,
        highPriority
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération de la file d\'attente de modération', { error, moderatorId });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques de modération
   */
  async getModerationStatistics(dateFrom?: Date, dateTo?: Date): Promise<ModerationStatistics> {
    try {
      const from = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = dateTo || new Date();

      // Utiliser la fonction PostgreSQL pour les statistiques de base
      const statsResult = await this.db.query(
        'SELECT get_moderation_statistics($1, $2) as stats',
        [from, to]
      );

      const baseStats = statsResult.rows[0].stats;

      // Récupérer les statistiques de charge de travail des modérateurs
      const workloadResult = await this.db.query(`
        SELECT 
          u.id as moderator_id,
          u.first_name || ' ' || u.last_name as moderator_name,
          COUNT(CASE WHEN mi.status IN ('pending', 'under_review') THEN 1 END) as assigned_items,
          COUNT(CASE WHEN mi.status IN ('approved', 'rejected') THEN 1 END) as completed_items,
          COALESCE(AVG(CASE WHEN mi.reviewed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (mi.reviewed_at - mi.created_at)) / 60 
            ELSE NULL END), 0) as average_review_time
        FROM users u
        LEFT JOIN moderation_items mi ON u.id = mi.assigned_moderator
          AND mi.created_at BETWEEN $1 AND $2
        WHERE u.role = 'ADMIN' OR EXISTS (
          SELECT 1 FROM moderation_workflows mw 
          WHERE u.id = ANY(mw.reviewer_roles::UUID[])
        )
        GROUP BY u.id, u.first_name, u.last_name
      `, [from, to]);

      // Récupérer la répartition par type de contenu
      const contentTypeResult = await this.db.query(`
        SELECT content_type, COUNT(*) as count
        FROM moderation_items
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY content_type
      `, [from, to]);

      // Récupérer la répartition par raison
      const reasonResult = await this.db.query(`
        SELECT reason, COUNT(*) as count
        FROM moderation_reports mr
        JOIN moderation_items mi ON mr.moderation_item_id = mi.id
        WHERE mi.created_at BETWEEN $1 AND $2
        GROUP BY reason
      `, [from, to]);

      // Récupérer les tendances dans le temps
      const trendsResult = await this.db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN status = 'approved' AND reviewed_at IS NULL THEN 1 END) as auto_approved,
          COUNT(CASE WHEN reviewed_at IS NOT NULL THEN 1 END) as manual_reviews,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejections,
          COALESCE(AVG(CASE WHEN reviewed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 60 
            ELSE NULL END), 0) as average_review_time
        FROM moderation_items
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `, [from, to]);

      const moderatorWorkload = workloadResult.rows.map(row => ({
        moderatorId: row.moderator_id,
        moderatorName: row.moderator_name,
        assignedItems: parseInt(row.assigned_items),
        completedItems: parseInt(row.completed_items),
        averageReviewTime: parseFloat(row.average_review_time),
        accuracy: 95 // Simulé - à calculer avec des données réelles
      }));

      const contentTypeBreakdown = contentTypeResult.rows.reduce((acc, row) => {
        acc[row.content_type as ContentType] = parseInt(row.count);
        return acc;
      }, {} as Record<ContentType, number>);

      const reasonBreakdown = reasonResult.rows.reduce((acc, row) => {
        acc[row.reason as ModerationReason] = parseInt(row.count);
        return acc;
      }, {} as Record<ModerationReason, number>);

      const trendsOverTime = trendsResult.rows.map(row => ({
        date: row.date,
        totalSubmissions: parseInt(row.total_submissions),
        autoApproved: parseInt(row.auto_approved),
        manualReviews: parseInt(row.manual_reviews),
        rejections: parseInt(row.rejections),
        averageReviewTime: parseFloat(row.average_review_time)
      }));

      return {
        totalItems: baseStats.totalItems,
        pendingItems: baseStats.pendingItems,
        approvedItems: baseStats.approvedItems,
        rejectedItems: baseStats.rejectedItems,
        flaggedItems: baseStats.flaggedItems,
        averageReviewTime: baseStats.averageReviewTime,
        autoModerationAccuracy: 92, // Simulé - à calculer avec des données réelles
        moderatorWorkload,
        contentTypeBreakdown,
        reasonBreakdown,
        trendsOverTime
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques de modération', { error, dateFrom, dateTo });
      throw error;
    }
  }

  /**
   * Obtenir le tableau de bord de modération
   */
  async getModerationDashboard(moderatorId: string): Promise<ModerationDashboard> {
    try {
      const [queue, statistics, myItems, recentActions, alerts] = await Promise.all([
        this.getModerationQueue(),
        this.getModerationStatistics(),
        this.getMyAssignedItems(moderatorId),
        this.getRecentModerationActions(moderatorId),
        this.getModerationAlerts()
      ]);

      return {
        queue,
        statistics,
        myAssignedItems: myItems,
        recentActions,
        alerts
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération du tableau de bord de modération', { error, moderatorId });
      throw error;
    }
  }

  /**
   * Effectuer la modération automatique
   */
  private async performAutoModeration(contentType: ContentType, content: string): Promise<AutoModerationResult> {
    try {
      const flags: AutoModerationFlag[] = [];
      let overallConfidence = 1.0;
      let requiresManualReview = false;

      // Récupérer les règles de modération automatique actives
      const rulesResult = await this.db.query(`
        SELECT * FROM auto_moderation_rules_config 
        WHERE enabled = true
      `);

      for (const rule of rulesResult.rows) {
        const ruleResult = await this.applyAutoModerationRule(rule, content);
        
        if (!ruleResult.passed) {
          flags.push({
            id: '', // Sera généré lors de l'insertion
            rule: rule.rule_name as AutoModerationRule,
            severity: ruleResult.severity,
            confidence: ruleResult.confidence,
            details: ruleResult.details,
            flaggedContent: ruleResult.flaggedContent,
            suggestedAction: ruleResult.suggestedAction,
            createdAt: new Date()
          });

          overallConfidence = Math.min(overallConfidence, ruleResult.confidence);
          
          if (ruleResult.severity === 'high' || ruleResult.confidence > 0.8) {
            requiresManualReview = true;
          }
        }
      }

      const passed = flags.length === 0;
      const suggestedAction = this.determineSuggestedAction(flags);

      return {
        passed,
        flags,
        suggestedAction,
        confidence: overallConfidence,
        requiresManualReview: requiresManualReview || flags.length > 0
      };
    } catch (error) {
      logger.error('Erreur lors de la modération automatique', { error, contentType, content });
      
      // En cas d'erreur, retourner un résultat sûr qui nécessite une révision manuelle
      return {
        passed: false,
        flags: [],
        suggestedAction: ModerationAction.FLAG,
        confidence: 0,
        requiresManualReview: true
      };
    }
  }

  /**
   * Appliquer une règle de modération automatique
   */
  private async applyAutoModerationRule(rule: any, content: string): Promise<{
    passed: boolean;
    severity: string;
    confidence: number;
    details: string;
    flaggedContent: string;
    suggestedAction: ModerationAction;
  }> {
    const keywords = rule.keywords || [];
    const patterns = rule.patterns || [];
    
    let flaggedContent = '';
    let confidence = 0;
    let details = '';

    // Vérifier les mots-clés
    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        flaggedContent += keyword + ' ';
        confidence = Math.max(confidence, 0.7);
        details += `Mot-clé détecté: ${keyword}. `;
      }
    }

    // Vérifier les patterns regex
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        if (matches) {
          flaggedContent += matches.join(', ') + ' ';
          confidence = Math.max(confidence, 0.8);
          details += `Pattern détecté: ${pattern}. `;
        }
      } catch (error) {
        logger.warn('Pattern regex invalide', { pattern, error });
      }
    }

    const passed = confidence < parseFloat(rule.confidence_threshold);
    const severity = confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low';
    const suggestedAction = confidence > 0.8 ? ModerationAction.REJECT : ModerationAction.FLAG;

    return {
      passed,
      severity,
      confidence,
      details: details || `Règle ${rule.rule_name} appliquée`,
      flaggedContent: flaggedContent.trim(),
      suggestedAction
    };
  }

  /**
   * Déterminer l'action suggérée basée sur les flags
   */
  private determineSuggestedAction(flags: AutoModerationFlag[]): ModerationAction {
    if (flags.length === 0) {
      return ModerationAction.APPROVE;
    }

    const highSeverityFlags = flags.filter(f => f.severity === 'high');
    const highConfidenceFlags = flags.filter(f => f.confidence > 0.8);

    if (highSeverityFlags.length > 0 || highConfidenceFlags.length > 0) {
      return ModerationAction.REJECT;
    }

    return ModerationAction.FLAG;
  }

  /**
   * Obtenir les éléments assignés à un modérateur
   */
  private async getMyAssignedItems(moderatorId: string): Promise<ModerationItem[]> {
    const result = await this.getModerationQueue(moderatorId);
    return result.items.filter(item => 
      item.status === ModerationStatus.PENDING || 
      item.status === ModerationStatus.UNDER_REVIEW
    ).slice(0, 10); // Limiter à 10 éléments
  }

  /**
   * Obtenir les actions récentes de modération
   */
  private async getRecentModerationActions(moderatorId: string): Promise<ModerationAction[]> {
    const result = await this.db.query(`
      SELECT ma.*, u.first_name || ' ' || u.last_name as performed_by_name
      FROM moderation_actions ma
      LEFT JOIN users u ON ma.performed_by = u.id
      WHERE ma.performed_by = $1
      ORDER BY ma.created_at DESC
      LIMIT 10
    `, [moderatorId]);

    return result.rows.map(row => ({
      id: row.id,
      moderationItemId: row.moderation_item_id,
      action: row.action,
      performedBy: row.performed_by,
      performedByName: row.performed_by_name,
      reason: row.reason,
      notes: row.notes,
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * Obtenir les alertes de modération
   */
  private async getModerationAlerts(): Promise<ModerationAlert[]> {
    const result = await this.db.query(`
      SELECT * FROM moderation_alerts
      WHERE acknowledged = false
      ORDER BY created_at DESC
      LIMIT 20
    `);

    return result.rows.map(row => ({
      id: row.id,
      type: row.type,
      message: row.message,
      itemId: row.moderation_item_id,
      createdAt: new Date(row.created_at),
      acknowledged: row.acknowledged
    }));
  }

  /**
   * Obtenir l'ID du workflow par défaut pour un type de contenu
   */
  private async getDefaultWorkflowId(contentType: ContentType): Promise<string> {
    const result = await this.db.query(`
      SELECT id FROM moderation_workflows
      WHERE $1 = ANY(content_types) AND is_active = true
      ORDER BY created_at ASC
      LIMIT 1
    `, [contentType]);

    if (result.rows.length === 0) {
      throw new Error('Aucun workflow de modération trouvé pour ce type de contenu');
    }

    return result.rows[0].id;
  }

  /**
   * Mapper une ligne de base de données vers un objet ModerationItem
   */
  private mapRowToModerationItem(row: any, flags: any[], reports: any[]): ModerationItem {
    return {
      id: row.id,
      contentType: row.content_type,
      contentId: row.content_id,
      contentTitle: row.content_title,
      contentPreview: row.content_preview,
      submittedBy: row.submitted_by,
      submittedByName: row.submitted_by_name,
      submittedByRole: row.submitted_by_role,
      status: row.status,
      priority: row.priority,
      autoModerationFlags: flags.map(flag => ({
        id: flag.id,
        rule: flag.rule,
        severity: flag.severity,
        confidence: parseFloat(flag.confidence),
        details: flag.details,
        flaggedContent: flag.flagged_content,
        suggestedAction: flag.suggested_action,
        createdAt: new Date(flag.created_at)
      })),
      manualReports: reports.map(report => ({
        id: report.id,
        reportedBy: report.reported_by,
        reporterName: report.reporter_name,
        reporterRole: report.reporter_role,
        reason: report.reason,
        description: report.description,
        evidence: report.evidence || [],
        createdAt: new Date(report.created_at)
      })),
      assignedModerator: row.assigned_moderator,
      assignedModeratorName: row.assigned_moderator_name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
      reviewedBy: row.reviewed_by,
      reviewerName: row.reviewer_name,
      reviewNotes: row.review_notes,
      escalatedAt: row.escalated_at ? new Date(row.escalated_at) : undefined,
      escalatedBy: row.escalated_by,
      escalationReason: row.escalation_reason
    };
  }

  /**
   * Mapper une colonne de tri vers le nom de colonne SQL
   */
  private mapSortColumn(sortBy: string): string {
    const mapping: Record<string, string> = {
      'createdAt': 'mi.created_at',
      'updatedAt': 'mi.updated_at',
      'priority': 'mi.priority',
      'status': 'mi.status'
    };
    return mapping[sortBy] || 'mi.created_at';
  }
}
// Create and export instance
import { db } from '@/database/connection';
export const moderationService = new ModerationService(db);