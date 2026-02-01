import express from 'express';
import { Pool } from 'pg';
import { LearningService } from '../services/learningService.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { logger } from '../utils/logger.js';
import {
  CreateModuleRequest,
  UpdateProgressRequest,
  SubmitExerciseRequest,
  GetRecommendationsRequest,
  StudyLevel,
  LegalDomain,
  RecommendationType
} from '../types/learning.js';

// Helper function to create learning permission strings
function createLearningPermission(resource: string, action: string): string {
  return `learning:${action}`;
}

export function createLearningRoutes(db: Pool): express.Router {
  const router = express.Router();
  const learningService = new LearningService(db);

  // Apply authentication to all routes
  router.use(authenticateToken);

  /**
   * GET /api/learning/modules
   * Get learning modules for a student
   */
  router.get('/modules', checkPermission(createLearningPermission('module', 'read')), async (req, res) => {
    try {
      const { domain, level } = req.query;
      const studentId = req.user!.id;

      const modules = await learningService.getModulesForStudent(
        studentId,
        domain as LegalDomain,
        level as StudyLevel
      );

      res.json({
        success: true,
        data: modules,
        message: 'Modules récupérés avec succès'
      });
    } catch (error) {
      logger.error('Error getting learning modules', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des modules'
      });
    }
  });

  /**
   * POST /api/learning/modules
   * Create a new learning module (Admin/Teacher only)
   */
  router.post('/modules', checkPermission(createLearningPermission('module', 'create')), async (req, res) => {
    try {
      const moduleRequest: CreateModuleRequest = req.body;
      const createdBy = req.user!.id;

      const module = await learningService.createModule(moduleRequest, createdBy);

      res.status(201).json({
        success: true,
        data: module,
        message: 'Module créé avec succès'
      });
    } catch (error) {
      logger.error('Error creating learning module', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du module'
      });
    }
  });

  /**
   * GET /api/learning/progress/:moduleId
   * Get student progress for a specific module
   */
  router.get('/progress/:moduleId', checkPermission(createLearningPermission('progress', 'read')), async (req, res) => {
    try {
      const { moduleId } = req.params;
      const studentId = req.user!.id;

      const progress = await learningService.getStudentProgress(studentId, moduleId);

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: 'Progression non trouvée'
        });
      }

      res.json({
        success: true,
        data: progress,
        message: 'Progression récupérée avec succès'
      });
    } catch (error) {
      logger.error('Error getting student progress', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la progression'
      });
    }
  });

  /**
   * PUT /api/learning/progress
   * Update student progress
   */
  router.put('/progress', checkPermission(createLearningPermission('progress', 'update')), async (req, res) => {
    try {
      const progressRequest: UpdateProgressRequest = req.body;
      const studentId = req.user!.id;

      const progress = await learningService.updateProgress(studentId, progressRequest);

      res.json({
        success: true,
        data: progress,
        message: 'Progression mise à jour avec succès'
      });
    } catch (error) {
      logger.error('Error updating student progress', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la progression'
      });
    }
  });

  /**
   * POST /api/learning/exercises/submit
   * Submit exercise attempt
   */
  router.post('/exercises/submit', checkPermission(createLearningPermission('exercise', 'submit')), async (req, res) => {
    try {
      const submitRequest: SubmitExerciseRequest = req.body;
      const studentId = req.user!.id;

      const attempt = await learningService.submitExercise(studentId, submitRequest);

      res.json({
        success: true,
        data: attempt,
        message: 'Exercice soumis avec succès'
      });
    } catch (error) {
      logger.error('Error submitting exercise', { error, userId: req.user!.id });
      
      if (error instanceof Error && error.message === 'Exercise not found') {
        return res.status(404).json({
          success: false,
          message: 'Exercice non trouvé'
        });
      }
      
      if (error instanceof Error && error.message === 'Maximum attempts exceeded') {
        return res.status(400).json({
          success: false,
          message: 'Nombre maximum de tentatives dépassé'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la soumission de l\'exercice'
      });
    }
  });

  /**
   * GET /api/learning/recommendations
   * Get personalized recommendations
   */
  router.get('/recommendations', checkPermission(createLearningPermission('recommendation', 'read')), async (req, res) => {
    try {
      const { type, limit, includeViewed } = req.query;
      const studentId = req.user!.id;

      const recommendationsRequest: GetRecommendationsRequest = {
        studentId,
        type: type as RecommendationType,
        limit: limit ? parseInt(limit as string) : undefined,
        includeViewed: includeViewed === 'true'
      };

      const recommendations = await learningService.getRecommendations(recommendationsRequest);

      res.json({
        success: true,
        data: recommendations,
        message: 'Recommandations récupérées avec succès'
      });
    } catch (error) {
      logger.error('Error getting recommendations', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des recommandations'
      });
    }
  });

  /**
   * POST /api/learning/recommendations/generate
   * Generate adaptive recommendations
   */
  router.post('/recommendations/generate', checkPermission(createLearningPermission('recommendation', 'create')), async (req, res) => {
    try {
      const studentId = req.user!.id;

      const recommendations = await learningService.generateAdaptiveRecommendations(studentId);

      res.json({
        success: true,
        data: recommendations,
        message: 'Recommandations générées avec succès'
      });
    } catch (error) {
      logger.error('Error generating recommendations', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des recommandations'
      });
    }
  });

  /**
   * GET /api/learning/dashboard
   * Get student learning dashboard
   */
  router.get('/dashboard', checkPermission(createLearningPermission('statistics', 'read')), async (req, res) => {
    try {
      const studentId = req.user!.id;

      const dashboard = await learningService.getLearningDashboard(studentId);

      res.json({
        success: true,
        data: dashboard,
        message: 'Tableau de bord récupéré avec succès'
      });
    } catch (error) {
      logger.error('Error getting learning dashboard', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du tableau de bord'
      });
    }
  });

  /**
   * GET /api/learning/help/:context
   * Get contextual help
   */
  router.get('/help/:context', checkPermission(createLearningPermission('help', 'read')), async (req, res) => {
    try {
      const { context } = req.params;
      const { level, language = 'fr' } = req.query;

      const help = await learningService.getContextualHelp(
        context,
        level as StudyLevel,
        language as string
      );

      res.json({
        success: true,
        data: help,
        message: 'Aide contextuelle récupérée avec succès'
      });
    } catch (error) {
      logger.error('Error getting contextual help', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'aide'
      });
    }
  });

  /**
   * GET /api/learning/errors/:exerciseId/:errorType
   * Get error explanation
   */
  router.get('/errors/:exerciseId/:errorType', checkPermission(createLearningPermission('help', 'read')), async (req, res) => {
    try {
      const { exerciseId, errorType } = req.params;
      const { language = 'fr' } = req.query;

      const explanation = await learningService.getErrorExplanation(
        exerciseId,
        errorType,
        language as string
      );

      if (!explanation) {
        return res.status(404).json({
          success: false,
          message: 'Explication d\'erreur non trouvée'
        });
      }

      res.json({
        success: true,
        data: explanation,
        message: 'Explication d\'erreur récupérée avec succès'
      });
    } catch (error) {
      logger.error('Error getting error explanation', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'explication'
      });
    }
  });

  /**
   * GET /api/learning/restrictions/check
   * Check learning restrictions
   */
  router.get('/restrictions/check', checkPermission(createLearningPermission('restriction', 'read')), async (req, res) => {
    try {
      const { resourceType, resourceId } = req.query;
      const studentId = req.user!.id;

      if (!resourceType || !resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Type de ressource et ID requis'
        });
      }

      const hasAccess = await learningService.checkLearningRestrictions(
        studentId,
        resourceType as string,
        resourceId as string
      );

      res.json({
        success: true,
        data: { hasAccess },
        message: hasAccess ? 'Accès autorisé' : 'Accès restreint'
      });
    } catch (error) {
      logger.error('Error checking learning restrictions', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des restrictions'
      });
    }
  });

  /**
   * GET /api/learning/statistics
   * Get learning statistics for student
   */
  router.get('/statistics', checkPermission(createLearningPermission('statistics', 'read')), async (req, res) => {
    try {
      const studentId = req.user!.id;

      // This would use a method from learningService to get detailed statistics
      const query = `
        SELECT 
          ls.*,
          COUNT(DISTINCT sp.module_id) as modules_in_progress,
          COUNT(DISTINCT ea.exercise_id) as unique_exercises_attempted,
          AVG(ea.score::DECIMAL / ea.max_score * 100) as recent_average_score
        FROM learning_statistics ls
        LEFT JOIN student_progress sp ON ls.student_id = sp.student_id AND sp.status = 'in_progress'
        LEFT JOIN exercise_attempts ea ON ls.student_id = ea.student_id 
          AND ea.submitted_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
        WHERE ls.student_id = $1
        GROUP BY ls.student_id, ls.total_time_spent, ls.modules_completed, ls.exercises_completed,
                 ls.average_score, ls.streak_days, ls.longest_streak, ls.total_points,
                 ls.rank, ls.achievements, ls.last_activity, ls.weekly_goal, ls.weekly_progress
      `;

      const result = await db.query(query, [studentId]);
      
      const statistics = result.rows[0] || {
        student_id: studentId,
        total_time_spent: 0,
        modules_completed: 0,
        exercises_completed: 0,
        average_score: 0,
        streak_days: 0,
        longest_streak: 0,
        total_points: 0,
        rank: 0,
        achievements: 0,
        last_activity: new Date(),
        weekly_goal: 120,
        weekly_progress: 0,
        modules_in_progress: 0,
        unique_exercises_attempted: 0,
        recent_average_score: 0
      };

      res.json({
        success: true,
        data: statistics,
        message: 'Statistiques récupérées avec succès'
      });
    } catch (error) {
      logger.error('Error getting learning statistics', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  });

  /**
   * POST /api/learning/sessions
   * Start a new study session
   */
  router.post('/sessions', checkPermission(createLearningPermission('progress', 'update')), async (req, res) => {
    try {
      const { moduleId, exerciseId } = req.body;
      const studentId = req.user!.id;

      const query = `
        INSERT INTO study_sessions (student_id, module_id, exercise_id, start_time)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const result = await db.query(query, [studentId, moduleId || null, exerciseId || null]);
      const session = result.rows[0];

      res.status(201).json({
        success: true,
        data: {
          id: session.id,
          studentId: session.student_id,
          moduleId: session.module_id,
          exerciseId: session.exercise_id,
          startTime: session.start_time
        },
        message: 'Session d\'étude démarrée avec succès'
      });
    } catch (error) {
      logger.error('Error starting study session', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors du démarrage de la session'
      });
    }
  });

  /**
   * PUT /api/learning/sessions/:sessionId/end
   * End a study session
   */
  router.put('/sessions/:sessionId/end', checkPermission(createLearningPermission('progress', 'update')), async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { activitiesCompleted, score, notes, satisfaction } = req.body;
      const studentId = req.user!.id;

      const query = `
        UPDATE study_sessions SET
          end_time = CURRENT_TIMESTAMP,
          duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time)) / 60,
          activities_completed = $3,
          score = $4,
          notes = $5,
          satisfaction = $6
        WHERE id = $1 AND student_id = $2
        RETURNING *
      `;

      const result = await db.query(query, [
        sessionId, studentId, activitiesCompleted || 0, 
        score, notes, satisfaction
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Session non trouvée'
        });
      }

      const session = result.rows[0];

      res.json({
        success: true,
        data: {
          id: session.id,
          duration: session.duration,
          activitiesCompleted: session.activities_completed,
          score: session.score
        },
        message: 'Session terminée avec succès'
      });
    } catch (error) {
      logger.error('Error ending study session', { error, userId: req.user!.id });
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la fin de session'
      });
    }
  });

  return router;
}