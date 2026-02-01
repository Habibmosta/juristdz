import { Pool } from 'pg';
import {
  LearningModule,
  StudentProgress,
  Exercise,
  ExerciseAttempt,
  StudentProfile,
  LearningPath,
  Recommendation,
  StudySession,
  LearningAnalytics,
  AdaptiveEngine,
  LearningRestriction,
  ErrorExplanation,
  ContextualHelp,
  CreateModuleRequest,
  UpdateProgressRequest,
  SubmitExerciseRequest,
  GetRecommendationsRequest,
  LearningDashboard,
  StudyLevel,
  LegalDomain,
  Difficulty,
  ProgressStatus,
  ExerciseType,
  RecommendationType,
  RestrictionType,
  Priority,
  LearningStyle,
  ObjectiveType,
  ContentType
} from '../types/learning.js';
import { logger } from '../utils/logger.js';

export class LearningService {
  constructor(private db: Pool) {}

  /**
   * Create a new learning module
   */
  async createModule(request: CreateModuleRequest, createdBy: string): Promise<LearningModule> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Create the module
      const moduleQuery = `
        INSERT INTO learning_modules (
          title, description, domain, level, prerequisites, objectives,
          estimated_duration, difficulty, tags, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const moduleResult = await client.query(moduleQuery, [
        request.title,
        request.description,
        request.domain,
        request.level,
        JSON.stringify(request.prerequisites || []),
        JSON.stringify(request.objectives),
        request.estimatedDuration,
        request.difficulty,
        JSON.stringify(request.tags || []),
        createdBy
      ]);

      const moduleId = moduleResult.rows[0].id;

      // Create module content
      for (const [index, content] of request.content.entries()) {
        const contentQuery = `
          INSERT INTO module_content (
            module_id, type, title, content, media_url, duration, 
            order_index, is_interactive, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        await client.query(contentQuery, [
          moduleId,
          content.type,
          content.title,
          content.content,
          content.mediaUrl,
          content.duration,
          index,
          content.isInteractive,
          JSON.stringify(content.metadata)
        ]);
      }

      await client.query('COMMIT');

      const module = this.mapRowToModule(moduleResult.rows[0]);
      logger.info('Learning module created', { moduleId, title: request.title });
      
      return module;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating learning module', { error, request });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get learning modules for a student based on their level and progress
   */
  async getModulesForStudent(studentId: string, domain?: LegalDomain, level?: StudyLevel): Promise<LearningModule[]> {
    try {
      // Get student profile to determine appropriate modules
      const studentProfile = await this.getStudentProfile(studentId);
      const targetLevel = level || studentProfile.studyLevel;

      let query = `
        SELECT lm.*, 
               COALESCE(sp.completion_percentage, 0) as completion_percentage,
               COALESCE(sp.status, 'not_started') as progress_status
        FROM learning_modules lm
        LEFT JOIN student_progress sp ON lm.id = sp.module_id AND sp.student_id = $1
        WHERE lm.is_active = true
        AND (lm.level = $2 OR lm.level IN (
          SELECT unnest(CASE 
            WHEN $2 = 'l1' THEN ARRAY['l1']
            WHEN $2 = 'l2' THEN ARRAY['l1', 'l2']
            WHEN $2 = 'l3' THEN ARRAY['l1', 'l2', 'l3']
            WHEN $2 = 'm1' THEN ARRAY['l1', 'l2', 'l3', 'm1']
            WHEN $2 = 'm2' THEN ARRAY['l1', 'l2', 'l3', 'm1', 'm2']
            ELSE ARRAY['l1', 'l2', 'l3', 'm1', 'm2', 'professional', 'continuing']
          END)
        ))
      `;

      const params: any[] = [studentId, targetLevel];

      if (domain) {
        query += ` AND lm.domain = $${params.length + 1}`;
        params.push(domain);
      }

      // Filter by student interests if no specific domain
      if (!domain && studentProfile.interests.length > 0) {
        query += ` AND lm.domain = ANY($${params.length + 1})`;
        params.push(studentProfile.interests);
      }

      query += ` ORDER BY lm.difficulty, lm.created_at DESC`;

      const result = await this.db.query(query, params);
      return result.rows.map(row => this.mapRowToModule(row));
    } catch (error) {
      logger.error('Error getting modules for student', { error, studentId, domain, level });
      throw error;
    }
  }

  /**
   * Get student progress for a specific module
   */
  async getStudentProgress(studentId: string, moduleId: string): Promise<StudentProgress | null> {
    try {
      const query = `
        SELECT sp.*, lm.title as module_title
        FROM student_progress sp
        JOIN learning_modules lm ON sp.module_id = lm.id
        WHERE sp.student_id = $1 AND sp.module_id = $2
      `;

      const result = await this.db.query(query, [studentId, moduleId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToProgress(result.rows[0]);
    } catch (error) {
      logger.error('Error getting student progress', { error, studentId, moduleId });
      throw error;
    }
  }

  /**
   * Update student progress
   */
  async updateProgress(studentId: string, request: UpdateProgressRequest): Promise<StudentProgress> {
    try {
      const { moduleId, contentId, timeSpent, completed, score, notes } = request;

      // Get or create progress record
      let progress = await this.getStudentProgress(studentId, moduleId);
      
      if (!progress) {
        // Create new progress record
        const createQuery = `
          INSERT INTO student_progress (
            student_id, module_id, status, completion_percentage, 
            current_content_id, time_spent, started_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          RETURNING *
        `;

        const result = await this.db.query(createQuery, [
          studentId, moduleId, ProgressStatus.IN_PROGRESS, 0, contentId, timeSpent
        ]);

        progress = this.mapRowToProgress(result.rows[0]);
      } else {
        // Update existing progress
        const updateQuery = `
          UPDATE student_progress SET
            current_content_id = COALESCE($3, current_content_id),
            time_spent = time_spent + $4,
            completion_percentage = CASE 
              WHEN $5 THEN 100 
              ELSE GREATEST(completion_percentage, $6)
            END,
            status = CASE 
              WHEN $5 THEN 'completed'::progress_status
              ELSE 'in_progress'::progress_status
            END,
            completed_at = CASE WHEN $5 THEN CURRENT_TIMESTAMP ELSE completed_at END,
            last_accessed = CURRENT_TIMESTAMP,
            notes = COALESCE($7, notes),
            average_score = CASE 
              WHEN $8 IS NOT NULL THEN 
                CASE WHEN average_score = 0 THEN $8 
                ELSE (average_score + $8) / 2 
                END
              ELSE average_score
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE student_id = $1 AND module_id = $2
          RETURNING *
        `;

        const newCompletionPercentage = completed ? 100 : Math.min(progress.completionPercentage + 10, 95);

        const result = await this.db.query(updateQuery, [
          studentId, moduleId, contentId, timeSpent, completed, 
          newCompletionPercentage, notes, score
        ]);

        progress = this.mapRowToProgress(result.rows[0]);
      }

      // Update learning statistics
      await this.updateLearningStatistics(studentId, timeSpent, completed, score);

      // Check for achievements
      await this.checkAchievements(studentId, progress);

      logger.info('Student progress updated', { studentId, moduleId, progress: progress.completionPercentage });
      return progress;
    } catch (error) {
      logger.error('Error updating student progress', { error, studentId, request });
      throw error;
    }
  }

  /**
   * Submit exercise attempt
   */
  async submitExercise(studentId: string, request: SubmitExerciseRequest): Promise<ExerciseAttempt> {
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');

      // Get exercise details
      const exerciseQuery = 'SELECT * FROM exercises WHERE id = $1';
      const exerciseResult = await client.query(exerciseQuery, [request.exerciseId]);
      
      if (exerciseResult.rows.length === 0) {
        throw new Error('Exercise not found');
      }

      const exercise = exerciseResult.rows[0];

      // Get attempt number
      const attemptQuery = `
        SELECT COALESCE(MAX(attempt), 0) + 1 as next_attempt
        FROM exercise_attempts
        WHERE student_id = $1 AND exercise_id = $2
      `;
      const attemptResult = await client.query(attemptQuery, [studentId, request.exerciseId]);
      const attemptNumber = attemptResult.rows[0].next_attempt;

      // Check if student has exceeded max attempts
      if (attemptNumber > exercise.attempts) {
        throw new Error('Maximum attempts exceeded');
      }

      // Calculate score
      const { score, maxScore, isCorrect, feedback } = await this.calculateExerciseScore(
        exercise, request.answers
      );

      // Create attempt record
      const insertQuery = `
        INSERT INTO exercise_attempts (
          student_id, exercise_id, attempt, answers, score, max_score,
          time_spent, started_at, submitted_at, feedback, is_correct, hints_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9, $10, $11)
        RETURNING *
      `;

      const startTime = new Date(Date.now() - request.timeSpent * 1000);
      const attemptRecord = await client.query(insertQuery, [
        studentId, request.exerciseId, attemptNumber, JSON.stringify(request.answers),
        score, maxScore, request.timeSpent, startTime, JSON.stringify(feedback),
        isCorrect, request.hintsUsed || 0
      ]);

      // Update exercise completion in progress
      await this.updateExerciseCompletion(client, studentId, exercise.module_id, isCorrect);

      await client.query('COMMIT');

      const attempt = this.mapRowToAttempt(attemptRecord.rows[0]);
      
      // Generate adaptive recommendations based on performance
      await this.updateAdaptiveEngine(studentId, attempt);

      logger.info('Exercise submitted', { 
        studentId, 
        exerciseId: request.exerciseId, 
        attempt: attemptNumber,
        score,
        isCorrect 
      });

      return attempt;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error submitting exercise', { error, studentId, request });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get personalized recommendations for a student
   */
  async getRecommendations(request: GetRecommendationsRequest): Promise<Recommendation[]> {
    try {
      const { studentId, type, limit = 10, includeViewed = false } = request;

      let query = `
        SELECT r.*, lm.title as target_title, lm.description as target_description
        FROM recommendations r
        LEFT JOIN learning_modules lm ON r.target_id = lm.id AND r.type = 'module'
        WHERE r.student_id = $1
        AND (r.valid_until IS NULL OR r.valid_until > CURRENT_TIMESTAMP)
      `;

      const params: any[] = [studentId];

      if (type) {
        query += ` AND r.type = $${params.length + 1}`;
        params.push(type);
      }

      if (!includeViewed) {
        query += ` AND r.is_viewed = false`;
      }

      query += ` ORDER BY r.priority DESC, r.confidence DESC, r.created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await this.db.query(query, params);
      return result.rows.map(row => this.mapRowToRecommendation(row));
    } catch (error) {
      logger.error('Error getting recommendations', { error, request });
      throw error;
    }
  }

  /**
   * Generate adaptive recommendations based on student performance
   */
  async generateAdaptiveRecommendations(studentId: string): Promise<Recommendation[]> {
    try {
      // Get student profile and recent performance
      const studentProfile = await this.getStudentProfile(studentId);
      const recentAttempts = await this.getRecentAttempts(studentId, 20);
      
      const recommendations: Recommendation[] = [];

      // Analyze performance patterns
      const weakAreas = this.identifyWeakAreas(recentAttempts);
      const strongAreas = this.identifyStrongAreas(recentAttempts);

      // Recommend review for weak areas
      for (const area of weakAreas) {
        const reviewModules = await this.findReviewModules(area.domain, studentProfile.studyLevel);
        for (const module of reviewModules.slice(0, 2)) {
          recommendations.push({
            id: `review_${module.id}_${Date.now()}`,
            studentId,
            type: RecommendationType.REVIEW,
            title: `Révision recommandée: ${module.title}`,
            description: `Basé sur vos performances récentes en ${area.domain}`,
            targetId: module.id,
            reason: `Performance faible détectée en ${area.domain} (${area.averageScore}%)`,
            confidence: 0.8,
            priority: Priority.HIGH,
            isViewed: false,
            createdAt: new Date()
          });
        }
      }

      // Recommend advanced content for strong areas
      for (const area of strongAreas) {
        const advancedModules = await this.findAdvancedModules(area.domain, studentProfile.studyLevel);
        for (const module of advancedModules.slice(0, 1)) {
          recommendations.push({
            id: `advance_${module.id}_${Date.now()}`,
            studentId,
            type: RecommendationType.MODULE,
            title: `Défi avancé: ${module.title}`,
            description: `Vous excellez en ${area.domain}, prêt pour le niveau suivant?`,
            targetId: module.id,
            reason: `Excellente performance en ${area.domain} (${area.averageScore}%)`,
            confidence: 0.7,
            priority: Priority.MEDIUM,
            isViewed: false,
            createdAt: new Date()
          });
        }
      }

      // Save recommendations to database
      for (const rec of recommendations) {
        await this.saveRecommendation(rec);
      }

      logger.info('Adaptive recommendations generated', { 
        studentId, 
        count: recommendations.length 
      });

      return recommendations;
    } catch (error) {
      logger.error('Error generating adaptive recommendations', { error, studentId });
      throw error;
    }
  }

  /**
   * Get student learning dashboard
   */
  async getLearningDashboard(studentId: string): Promise<LearningDashboard> {
    try {
      const [
        student,
        currentProgress,
        recentActivity,
        recommendations,
        achievements,
        statistics,
        upcomingDeadlines
      ] = await Promise.all([
        this.getStudentProfile(studentId),
        this.getCurrentProgress(studentId),
        this.getRecentActivity(studentId, 10),
        this.getRecommendations({ studentId, limit: 5 }),
        this.getRecentAchievements(studentId, 5),
        this.getLearningStatistics(studentId),
        this.getUpcomingDeadlines(studentId)
      ]);

      const streakInfo = await this.getStreakInfo(studentId);

      return {
        student,
        currentProgress,
        recentActivity,
        recommendations,
        achievements,
        statistics,
        upcomingDeadlines,
        streakInfo
      };
    } catch (error) {
      logger.error('Error getting learning dashboard', { error, studentId });
      throw error;
    }
  }

  /**
   * Get contextual help for a specific context
   */
  async getContextualHelp(context: string, level: StudyLevel, language: string = 'fr'): Promise<ContextualHelp[]> {
    try {
      const query = `
        SELECT * FROM contextual_help
        WHERE context = $1 
        AND (level = $2 OR level IS NULL)
        AND language = $3
        ORDER BY level DESC, created_at DESC
      `;

      const result = await this.db.query(query, [context, level, language]);
      return result.rows.map(row => this.mapRowToContextualHelp(row));
    } catch (error) {
      logger.error('Error getting contextual help', { error, context, level, language });
      return [];
    }
  }

  /**
   * Get error explanation for a specific mistake
   */
  async getErrorExplanation(exerciseId: string, errorType: string, language: string = 'fr'): Promise<ErrorExplanation | null> {
    try {
      const query = `
        SELECT * FROM error_explanations
        WHERE exercise_id = $1 AND error_type = $2 AND language = $3
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await this.db.query(query, [exerciseId, errorType, language]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToErrorExplanation(result.rows[0]);
    } catch (error) {
      logger.error('Error getting error explanation', { error, exerciseId, errorType, language });
      return null;
    }
  }

  /**
   * Check and apply learning restrictions for a student
   */
  async checkLearningRestrictions(studentId: string, resourceType: string, resourceId: string): Promise<boolean> {
    try {
      const query = `
        SELECT * FROM learning_restrictions
        WHERE student_id = $1 
        AND type = $2 
        AND resource = $3
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      `;

      const result = await this.db.query(query, [studentId, resourceType, resourceId]);
      
      if (result.rows.length > 0) {
        logger.info('Learning restriction applied', { 
          studentId, 
          resourceType, 
          resourceId,
          restriction: result.rows[0].reason 
        });
        return false; // Access denied
      }

      return true; // Access allowed
    } catch (error) {
      logger.error('Error checking learning restrictions', { error, studentId, resourceType, resourceId });
      return true; // Default to allow access on error
    }
  }

  // Private helper methods

  private async calculateExerciseScore(exercise: any, answers: Record<string, any>): Promise<{
    score: number;
    maxScore: number;
    isCorrect: boolean;
    feedback: any;
  }> {
    const maxScore = exercise.points;
    let score = 0;
    let isCorrect = false;
    const feedback: any = { overall: '', detailed: {}, suggestions: [], nextSteps: [] };

    try {
      const correctAnswer = JSON.parse(exercise.correct_answer);
      const exerciseFeedback = JSON.parse(exercise.feedback);

      switch (exercise.type) {
        case ExerciseType.MULTIPLE_CHOICE:
          isCorrect = answers.selected === correctAnswer;
          score = isCorrect ? maxScore : 0;
          feedback.overall = isCorrect ? exerciseFeedback.correct : exerciseFeedback.incorrect;
          break;

        case ExerciseType.TRUE_FALSE:
          isCorrect = answers.answer === correctAnswer;
          score = isCorrect ? maxScore : 0;
          feedback.overall = isCorrect ? exerciseFeedback.correct : exerciseFeedback.incorrect;
          break;

        case ExerciseType.FILL_BLANK:
          const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
          const studentAnswers = Array.isArray(answers.answers) ? answers.answers : [answers.answers];
          let correctCount = 0;
          
          for (let i = 0; i < correctAnswers.length; i++) {
            if (studentAnswers[i] && studentAnswers[i].toLowerCase().trim() === correctAnswers[i].toLowerCase().trim()) {
              correctCount++;
            }
          }
          
          score = Math.round((correctCount / correctAnswers.length) * maxScore);
          isCorrect = correctCount === correctAnswers.length;
          feedback.overall = isCorrect ? exerciseFeedback.correct : exerciseFeedback.partial || exerciseFeedback.incorrect;
          break;

        case ExerciseType.SHORT_ANSWER:
          // Simple keyword matching for now - could be enhanced with NLP
          const keywords = correctAnswer.toLowerCase().split(' ');
          const studentAnswer = answers.answer.toLowerCase();
          const matchedKeywords = keywords.filter(keyword => studentAnswer.includes(keyword));
          
          score = Math.round((matchedKeywords.length / keywords.length) * maxScore);
          isCorrect = score >= maxScore * 0.8; // 80% threshold
          feedback.overall = isCorrect ? exerciseFeedback.correct : exerciseFeedback.partial || exerciseFeedback.incorrect;
          break;

        default:
          // For complex exercise types, default to manual grading
          score = 0;
          isCorrect = false;
          feedback.overall = 'Réponse soumise pour évaluation manuelle';
      }

      // Add hints and suggestions
      feedback.suggestions = exerciseFeedback.hints || [];
      feedback.nextSteps = exerciseFeedback.additionalResources || [];

    } catch (error) {
      logger.error('Error calculating exercise score', { error, exerciseId: exercise.id });
      score = 0;
      isCorrect = false;
      feedback.overall = 'Erreur lors de l\'évaluation';
    }

    return { score, maxScore, isCorrect, feedback };
  }

  private async updateExerciseCompletion(client: any, studentId: string, moduleId: string, isCorrect: boolean): Promise<void> {
    const updateQuery = `
      UPDATE student_progress SET
        exercises_completed = exercises_completed + 1,
        average_score = CASE 
          WHEN exercises_completed = 0 THEN CASE WHEN $3 THEN 100 ELSE 0 END
          ELSE (average_score * exercises_completed + CASE WHEN $3 THEN 100 ELSE 0 END) / (exercises_completed + 1)
        END,
        last_accessed = CURRENT_TIMESTAMP
      WHERE student_id = $1 AND module_id = $2
    `;

    await client.query(updateQuery, [studentId, moduleId, isCorrect]);
  }

  private async updateLearningStatistics(studentId: string, timeSpent: number, completed: boolean, score?: number): Promise<void> {
    const updateQuery = `
      INSERT INTO learning_statistics (student_id, total_time_spent, exercises_completed, total_points, last_activity)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (student_id) DO UPDATE SET
        total_time_spent = learning_statistics.total_time_spent + $2,
        exercises_completed = learning_statistics.exercises_completed + $3,
        total_points = learning_statistics.total_points + $4,
        last_activity = CURRENT_TIMESTAMP,
        average_score = CASE 
          WHEN learning_statistics.exercises_completed = 0 THEN COALESCE($5, learning_statistics.average_score)
          ELSE (learning_statistics.average_score * learning_statistics.exercises_completed + COALESCE($5, 0)) / (learning_statistics.exercises_completed + $3)
        END
    `;

    await this.db.query(updateQuery, [
      studentId, 
      timeSpent, 
      completed ? 1 : 0, 
      score || 0,
      score
    ]);
  }

  private async checkAchievements(studentId: string, progress: StudentProgress): Promise<void> {
    // Check for completion achievement
    if (progress.status === ProgressStatus.COMPLETED) {
      await this.awardAchievement(studentId, 'module_completion', {
        moduleId: progress.moduleId,
        completionPercentage: progress.completionPercentage
      });
    }

    // Check for streak achievements
    const streak = await this.getCurrentStreak(studentId);
    if (streak >= 7) {
      await this.awardAchievement(studentId, 'weekly_streak', { streak });
    }
  }

  private async awardAchievement(studentId: string, type: string, criteria: any): Promise<void> {
    const query = `
      INSERT INTO achievements (student_id, type, title, description, points, criteria, unlocked_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (student_id, type, criteria) DO NOTHING
    `;

    const achievementData = this.getAchievementData(type, criteria);
    
    await this.db.query(query, [
      studentId,
      type,
      achievementData.title,
      achievementData.description,
      achievementData.points,
      JSON.stringify(criteria)
    ]);
  }

  private getAchievementData(type: string, criteria: any): { title: string; description: string; points: number } {
    const achievements: Record<string, any> = {
      module_completion: {
        title: 'Module Terminé',
        description: 'Félicitations pour avoir terminé un module!',
        points: 100
      },
      weekly_streak: {
        title: 'Série Hebdomadaire',
        description: `${criteria.streak} jours consécutifs d'apprentissage!`,
        points: 50
      }
    };

    return achievements[type] || { title: 'Réussite', description: 'Objectif atteint!', points: 10 };
  }

  private async getCurrentStreak(studentId: string): Promise<number> {
    const query = `
      SELECT streak_days FROM learning_statistics WHERE student_id = $1
    `;

    const result = await this.db.query(query, [studentId]);
    return result.rows[0]?.streak_days || 0;
  }

  private identifyWeakAreas(attempts: ExerciseAttempt[]): Array<{ domain: string; averageScore: number }> {
    const domainScores: Record<string, number[]> = {};

    for (const attempt of attempts) {
      // This would need to be enhanced to get domain from exercise
      const domain = 'general'; // Placeholder
      if (!domainScores[domain]) {
        domainScores[domain] = [];
      }
      domainScores[domain].push(attempt.score);
    }

    return Object.entries(domainScores)
      .map(([domain, scores]) => ({
        domain,
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .filter(area => area.averageScore < 60); // Below 60% is considered weak
  }

  private identifyStrongAreas(attempts: ExerciseAttempt[]): Array<{ domain: string; averageScore: number }> {
    const domainScores: Record<string, number[]> = {};

    for (const attempt of attempts) {
      const domain = 'general'; // Placeholder
      if (!domainScores[domain]) {
        domainScores[domain] = [];
      }
      domainScores[domain].push(attempt.score);
    }

    return Object.entries(domainScores)
      .map(([domain, scores]) => ({
        domain,
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .filter(area => area.averageScore >= 80); // Above 80% is considered strong
  }

  private async findReviewModules(domain: string, level: StudyLevel): Promise<LearningModule[]> {
    const query = `
      SELECT * FROM learning_modules
      WHERE domain = $1 AND level = $2 AND difficulty IN ('beginner', 'intermediate')
      ORDER BY difficulty, created_at
      LIMIT 5
    `;

    const result = await this.db.query(query, [domain, level]);
    return result.rows.map(row => this.mapRowToModule(row));
  }

  private async findAdvancedModules(domain: string, level: StudyLevel): Promise<LearningModule[]> {
    const query = `
      SELECT * FROM learning_modules
      WHERE domain = $1 AND difficulty IN ('advanced', 'expert')
      ORDER BY difficulty, created_at
      LIMIT 3
    `;

    const result = await this.db.query(query, [domain]);
    return result.rows.map(row => this.mapRowToModule(row));
  }

  private async saveRecommendation(recommendation: Recommendation): Promise<void> {
    const query = `
      INSERT INTO recommendations (
        id, student_id, type, title, description, target_id, reason,
        confidence, priority, valid_until, is_viewed, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING
    `;

    await this.db.query(query, [
      recommendation.id,
      recommendation.studentId,
      recommendation.type,
      recommendation.title,
      recommendation.description,
      recommendation.targetId,
      recommendation.reason,
      recommendation.confidence,
      recommendation.priority,
      recommendation.validUntil,
      recommendation.isViewed,
      recommendation.createdAt
    ]);
  }

  // Mapping methods
  private mapRowToModule(row: any): LearningModule {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      domain: row.domain,
      level: row.level,
      prerequisites: JSON.parse(row.prerequisites || '[]'),
      objectives: JSON.parse(row.objectives || '[]'),
      content: [], // Would be loaded separately
      exercises: [], // Would be loaded separately
      assessments: [], // Would be loaded separately
      estimatedDuration: row.estimated_duration,
      difficulty: row.difficulty,
      tags: JSON.parse(row.tags || '[]'),
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToProgress(row: any): StudentProgress {
    return {
      id: row.id,
      studentId: row.student_id,
      moduleId: row.module_id,
      status: row.status,
      completionPercentage: row.completion_percentage,
      currentContentId: row.current_content_id,
      timeSpent: row.time_spent,
      exercisesCompleted: row.exercises_completed,
      exercisesTotal: row.exercises_total,
      averageScore: row.average_score,
      lastAccessed: new Date(row.last_accessed),
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      notes: row.notes,
      bookmarks: JSON.parse(row.bookmarks || '[]'),
      achievements: JSON.parse(row.achievements || '[]')
    };
  }

  private mapRowToAttempt(row: any): ExerciseAttempt {
    return {
      id: row.id,
      studentId: row.student_id,
      exerciseId: row.exercise_id,
      attempt: row.attempt,
      answers: JSON.parse(row.answers),
      score: row.score,
      maxScore: row.max_score,
      timeSpent: row.time_spent,
      startedAt: new Date(row.started_at),
      submittedAt: new Date(row.submitted_at),
      feedback: JSON.parse(row.feedback),
      isCorrect: row.is_correct,
      hintsUsed: row.hints_used
    };
  }

  private mapRowToRecommendation(row: any): Recommendation {
    return {
      id: row.id,
      studentId: row.student_id,
      type: row.type,
      title: row.title,
      description: row.description,
      targetId: row.target_id,
      reason: row.reason,
      confidence: row.confidence,
      priority: row.priority,
      validUntil: row.valid_until ? new Date(row.valid_until) : undefined,
      isViewed: row.is_viewed,
      isAccepted: row.is_accepted,
      createdAt: new Date(row.created_at)
    };
  }

  private mapRowToContextualHelp(row: any): ContextualHelp {
    return {
      id: row.id,
      context: row.context,
      title: row.title,
      content: row.content,
      type: row.type,
      level: row.level,
      examples: JSON.parse(row.examples || '[]'),
      relatedTopics: JSON.parse(row.related_topics || '[]'),
      isInteractive: row.is_interactive,
      mediaUrl: row.media_url,
      language: row.language
    };
  }

  private mapRowToErrorExplanation(row: any): ErrorExplanation {
    return {
      id: row.id,
      exerciseId: row.exercise_id,
      errorType: row.error_type,
      commonMistake: row.common_mistake,
      explanation: row.explanation,
      correctApproach: row.correct_approach,
      examples: JSON.parse(row.examples || '[]'),
      relatedConcepts: JSON.parse(row.related_concepts || '[]'),
      additionalResources: JSON.parse(row.additional_resources || '[]'),
      language: row.language
    };
  }

  // Helper methods implementation
  private async getStudentProfile(studentId: string): Promise<StudentProfile> {
    try {
      const query = `
        SELECT sp.*, u.email, u.first_name, u.last_name
        FROM student_profiles sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.user_id = $1
      `;

      const result = await this.db.query(query, [studentId]);
      
      if (result.rows.length === 0) {
        // Create default profile if not exists
        return await this.createDefaultStudentProfile(studentId);
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        studyLevel: row.study_level || StudyLevel.L1,
        specialization: row.specialization,
        university: row.university,
        yearOfStudy: row.year_of_study || 1,
        preferredLanguage: row.preferred_language || 'fr',
        learningStyle: row.learning_style || LearningStyle.MIXED,
        goals: JSON.parse(row.goals || '[]'),
        interests: JSON.parse(row.interests || '[]'),
        strengths: JSON.parse(row.strengths || '[]'),
        weaknesses: JSON.parse(row.weaknesses || '[]'),
        preferences: JSON.parse(row.preferences || '{}'),
        statistics: JSON.parse(row.statistics || '{}'),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      logger.error('Error getting student profile', { error, studentId });
      return await this.createDefaultStudentProfile(studentId);
    }
  }

  private async createDefaultStudentProfile(studentId: string): Promise<StudentProfile> {
    const defaultProfile = {
      userId: studentId,
      studyLevel: StudyLevel.L1,
      yearOfStudy: 1,
      preferredLanguage: 'fr',
      learningStyle: LearningStyle.MIXED,
      goals: [],
      interests: [LegalDomain.CIVIL_LAW, LegalDomain.CRIMINAL_LAW],
      strengths: [],
      weaknesses: [],
      preferences: {
        sessionDuration: 30,
        reminderFrequency: 'weekly',
        difficultyProgression: 'gradual',
        feedbackType: 'immediate',
        contentTypes: [ContentType.TEXT, ContentType.VIDEO],
        studyTimes: []
      },
      statistics: {
        totalTimeSpent: 0,
        modulesCompleted: 0,
        exercisesCompleted: 0,
        averageScore: 0,
        streakDays: 0,
        longestStreak: 0,
        totalPoints: 0,
        rank: 0,
        achievements: 0,
        lastActivity: new Date(),
        weeklyGoal: 120,
        weeklyProgress: 0
      }
    };

    const query = `
      INSERT INTO student_profiles (
        user_id, study_level, year_of_study, preferred_language, learning_style,
        goals, interests, strengths, weaknesses, preferences, statistics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      studentId,
      defaultProfile.studyLevel,
      defaultProfile.yearOfStudy,
      defaultProfile.preferredLanguage,
      defaultProfile.learningStyle,
      JSON.stringify(defaultProfile.goals),
      JSON.stringify(defaultProfile.interests),
      JSON.stringify(defaultProfile.strengths),
      JSON.stringify(defaultProfile.weaknesses),
      JSON.stringify(defaultProfile.preferences),
      JSON.stringify(defaultProfile.statistics)
    ]);

    return {
      id: result.rows[0].id,
      ...defaultProfile,
      createdAt: new Date(result.rows[0].created_at),
      updatedAt: new Date(result.rows[0].updated_at)
    };
  }

  private async getCurrentProgress(studentId: string): Promise<StudentProgress[]> {
    try {
      const query = `
        SELECT sp.*, lm.title as module_title, lm.domain, lm.level
        FROM student_progress sp
        JOIN learning_modules lm ON sp.module_id = lm.id
        WHERE sp.student_id = $1 
        AND sp.status IN ('in_progress', 'completed')
        ORDER BY sp.last_accessed DESC
        LIMIT 10
      `;

      const result = await this.db.query(query, [studentId]);
      return result.rows.map(row => this.mapRowToProgress(row));
    } catch (error) {
      logger.error('Error getting current progress', { error, studentId });
      return [];
    }
  }

  private async getRecentActivity(studentId: string, limit: number): Promise<StudySession[]> {
    try {
      const query = `
        SELECT ss.*, lm.title as module_title, e.title as exercise_title
        FROM study_sessions ss
        LEFT JOIN learning_modules lm ON ss.module_id = lm.id
        LEFT JOIN exercises e ON ss.exercise_id = e.id
        WHERE ss.student_id = $1
        ORDER BY ss.start_time DESC
        LIMIT $2
      `;

      const result = await this.db.query(query, [studentId, limit]);
      return result.rows.map(row => ({
        id: row.id,
        studentId: row.student_id,
        moduleId: row.module_id,
        exerciseId: row.exercise_id,
        startTime: new Date(row.start_time),
        endTime: row.end_time ? new Date(row.end_time) : undefined,
        duration: row.duration,
        activitiesCompleted: row.activities_completed,
        score: row.score,
        notes: row.notes,
        interruptions: row.interruptions,
        focusScore: row.focus_score,
        satisfaction: row.satisfaction
      }));
    } catch (error) {
      logger.error('Error getting recent activity', { error, studentId, limit });
      return [];
    }
  }

  private async getRecentAchievements(studentId: string, limit: number): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM achievements
        WHERE student_id = $1
        ORDER BY unlocked_at DESC
        LIMIT $2
      `;

      const result = await this.db.query(query, [studentId, limit]);
      return result.rows.map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description,
        icon: row.icon,
        points: row.points,
        unlockedAt: new Date(row.unlocked_at),
        criteria: JSON.parse(row.criteria)
      }));
    } catch (error) {
      logger.error('Error getting recent achievements', { error, studentId, limit });
      return [];
    }
  }

  private async getLearningStatistics(studentId: string): Promise<any> {
    try {
      const query = `
        SELECT * FROM learning_statistics WHERE student_id = $1
      `;

      const result = await this.db.query(query, [studentId]);
      
      if (result.rows.length === 0) {
        return {
          totalTimeSpent: 0,
          modulesCompleted: 0,
          exercisesCompleted: 0,
          averageScore: 0,
          streakDays: 0,
          longestStreak: 0,
          totalPoints: 0,
          rank: 0,
          achievements: 0,
          lastActivity: new Date(),
          weeklyGoal: 120,
          weeklyProgress: 0
        };
      }

      const row = result.rows[0];
      return {
        totalTimeSpent: row.total_time_spent,
        modulesCompleted: row.modules_completed,
        exercisesCompleted: row.exercises_completed,
        averageScore: row.average_score,
        streakDays: row.streak_days,
        longestStreak: row.longest_streak,
        totalPoints: row.total_points,
        rank: row.rank,
        achievements: row.achievements,
        lastActivity: new Date(row.last_activity),
        weeklyGoal: row.weekly_goal,
        weeklyProgress: row.weekly_progress
      };
    } catch (error) {
      logger.error('Error getting learning statistics', { error, studentId });
      return {};
    }
  }

  private async getUpcomingDeadlines(studentId: string): Promise<any[]> {
    try {
      const query = `
        SELECT a.*, lm.title as module_title
        FROM assessments a
        JOIN learning_modules lm ON a.module_id = lm.id
        JOIN student_progress sp ON lm.id = sp.module_id
        WHERE sp.student_id = $1
        AND a.available_until > CURRENT_TIMESTAMP
        AND a.available_from <= CURRENT_TIMESTAMP
        ORDER BY a.available_until ASC
        LIMIT 5
      `;

      const result = await this.db.query(query, [studentId]);
      return result.rows.map(row => ({
        id: row.id,
        moduleId: row.module_id,
        title: row.title,
        description: row.description,
        type: row.type,
        availableUntil: new Date(row.available_until),
        moduleTitle: row.module_title
      }));
    } catch (error) {
      logger.error('Error getting upcoming deadlines', { error, studentId });
      return [];
    }
  }

  private async getStreakInfo(studentId: string): Promise<any> {
    try {
      const query = `
        SELECT streak_days, longest_streak, last_activity
        FROM learning_statistics
        WHERE student_id = $1
      `;

      const result = await this.db.query(query, [studentId]);
      
      if (result.rows.length === 0) {
        return { current: 0, longest: 0, lastActivity: new Date() };
      }

      const row = result.rows[0];
      return {
        current: row.streak_days,
        longest: row.longest_streak,
        lastActivity: new Date(row.last_activity)
      };
    } catch (error) {
      logger.error('Error getting streak info', { error, studentId });
      return { current: 0, longest: 0, lastActivity: new Date() };
    }
  }

  private async getRecentAttempts(studentId: string, limit: number): Promise<ExerciseAttempt[]> {
    try {
      const query = `
        SELECT ea.*, e.domain, e.difficulty
        FROM exercise_attempts ea
        JOIN exercises e ON ea.exercise_id = e.id
        WHERE ea.student_id = $1
        ORDER BY ea.submitted_at DESC
        LIMIT $2
      `;

      const result = await this.db.query(query, [studentId, limit]);
      return result.rows.map(row => this.mapRowToAttempt(row));
    } catch (error) {
      logger.error('Error getting recent attempts', { error, studentId, limit });
      return [];
    }
  }

  private async updateAdaptiveEngine(studentId: string, attempt: ExerciseAttempt): Promise<void> {
    try {
      const performancePoint = {
        timestamp: attempt.submittedAt,
        exerciseId: attempt.exerciseId,
        difficulty: 'intermediate', // Would get from exercise
        score: attempt.score,
        timeSpent: attempt.timeSpent,
        hintsUsed: attempt.hintsUsed
      };

      // Update or create adaptive engine record
      const query = `
        INSERT INTO adaptive_engines (
          student_id, current_level, mastery_threshold, adaptation_rate,
          performance_history, last_updated
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (student_id) DO UPDATE SET
          performance_history = adaptive_engines.performance_history || $5,
          last_updated = CURRENT_TIMESTAMP,
          current_level = CASE 
            WHEN $6 > 80 AND adaptive_engines.current_level = 'beginner' THEN 'intermediate'
            WHEN $6 > 90 AND adaptive_engines.current_level = 'intermediate' THEN 'advanced'
            ELSE adaptive_engines.current_level
          END
      `;

      await this.db.query(query, [
        studentId,
        'beginner', // Default starting level
        0.8, // 80% mastery threshold
        0.1, // 10% adaptation rate
        JSON.stringify([performancePoint]),
        attempt.score
      ]);

      // Generate new recommendations based on performance
      await this.generateAdaptiveRecommendations(studentId);
    } catch (error) {
      logger.error('Error updating adaptive engine', { error, studentId, attempt });
    }
  }
}
// Create and export instance
import { db } from '@/database/connection';
export const learningService = new LearningService(db);