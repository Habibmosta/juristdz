import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { createLearningRoutes } from '../routes/learning.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import {
  LegalDomain,
  StudyLevel,
  Difficulty,
  ExerciseType,
  ContentType,
  ObjectiveType
} from '../types/learning.js';

// Mock dependencies
jest.mock('../middleware/auth.js');
jest.mock('../middleware/rbacMiddleware.js');
jest.mock('../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

const mockDb = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
} as unknown as Pool;

const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

describe('Learning System Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
      req.user = { id: 'student-123', role: 'Étudiant_Droit' };
      next();
    });

    // Mock RBAC middleware
    (checkPermission as jest.Mock).mockImplementation(() => (req, res, next) => next());

    app.use('/api/learning', createLearningRoutes(mockDb));

    jest.clearAllMocks();
    (mockDb.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  describe('GET /api/learning/modules', () => {
    it('should return learning modules for student', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'student-123',
        study_level: StudyLevel.L2,
        interests: [LegalDomain.CIVIL_LAW],
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockModules = [{
        id: 'module-1',
        title: 'Droit Civil L2',
        description: 'Module de droit civil niveau L2',
        domain: LegalDomain.CIVIL_LAW,
        level: StudyLevel.L2,
        prerequisites: '[]',
        objectives: JSON.stringify([{
          id: '1',
          description: 'Comprendre les contrats',
          type: ObjectiveType.COMPREHENSION,
          measurable: true,
          assessmentCriteria: ['Identifier les éléments', 'Analyser la validité']
        }]),
        estimated_duration: 120,
        difficulty: Difficulty.INTERMEDIATE,
        tags: '["contrats", "obligations"]',
        is_active: true,
        created_by: 'admin-123',
        created_at: new Date(),
        updated_at: new Date()
      }];

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockProfile] })
        .mockResolvedValueOnce({ rows: mockModules });

      const response = await request(app)
        .get('/api/learning/modules')
        .query({ domain: LegalDomain.CIVIL_LAW, level: StudyLevel.L2 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: 'module-1',
        title: 'Droit Civil L2',
        domain: LegalDomain.CIVIL_LAW,
        level: StudyLevel.L2
      });
    });

    it('should handle database errors gracefully', async () => {
      (mockDb.query as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/learning/modules');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Erreur lors de la récupération des modules');
    });
  });

  describe('POST /api/learning/modules', () => {
    it('should create a new learning module', async () => {
      const moduleRequest = {
        title: 'Nouveau Module de Droit',
        description: 'Description du nouveau module',
        domain: LegalDomain.CIVIL_LAW,
        level: StudyLevel.L1,
        objectives: [{
          description: 'Objectif d\'apprentissage',
          type: ObjectiveType.KNOWLEDGE,
          measurable: true,
          assessmentCriteria: ['Critère 1', 'Critère 2']
        }],
        content: [{
          type: ContentType.TEXT,
          title: 'Introduction',
          content: 'Contenu d\'introduction',
          order: 0,
          isInteractive: false,
          metadata: {
            keywords: ['introduction'],
            legalReferences: [],
            difficulty: Difficulty.BEGINNER,
            language: 'fr',
            lastUpdated: new Date()
          }
        }],
        estimatedDuration: 90,
        difficulty: Difficulty.BEGINNER,
        tags: ['introduction', 'base']
      };

      const mockCreatedModule = {
        id: 'new-module-123',
        ...moduleRequest,
        prerequisites: '[]',
        objectives: JSON.stringify(moduleRequest.objectives),
        tags: JSON.stringify(moduleRequest.tags),
        is_active: true,
        created_by: 'student-123',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockCreatedModule] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/learning/modules')
        .send(moduleRequest);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'new-module-123',
        title: moduleRequest.title,
        domain: moduleRequest.domain
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('GET /api/learning/progress/:moduleId', () => {
    it('should return student progress for module', async () => {
      const moduleId = 'module-123';
      const mockProgress = {
        id: 'progress-123',
        student_id: 'student-123',
        module_id: moduleId,
        status: 'in_progress',
        completion_percentage: 65,
        current_content_id: 'content-1',
        time_spent: 120,
        exercises_completed: 5,
        exercises_total: 10,
        average_score: 78.5,
        last_accessed: new Date(),
        started_at: new Date(),
        completed_at: null,
        notes: 'Progression satisfaisante',
        bookmarks: '["content-1", "content-3"]',
        achievements: '[]',
        module_title: 'Droit Civil'
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockProgress] });

      const response = await request(app)
        .get(`/api/learning/progress/${moduleId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'progress-123',
        studentId: 'student-123',
        moduleId,
        status: 'in_progress',
        completionPercentage: 65
      });
    });

    it('should return 404 when progress not found', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/learning/progress/nonexistent-module');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Progression non trouvée');
    });
  });

  describe('PUT /api/learning/progress', () => {
    it('should update student progress', async () => {
      const progressUpdate = {
        moduleId: 'module-123',
        contentId: 'content-2',
        timeSpent: 30,
        completed: false,
        score: 85,
        notes: 'Bonne compréhension'
      };

      const existingProgress = {
        id: 'progress-123',
        student_id: 'student-123',
        module_id: 'module-123',
        status: 'in_progress',
        completion_percentage: 50,
        time_spent: 90,
        average_score: 75,
        last_accessed: new Date(),
        started_at: new Date(),
        notes: null,
        bookmarks: '[]',
        achievements: '[]'
      };

      const updatedProgress = {
        ...existingProgress,
        current_content_id: 'content-2',
        time_spent: 120,
        completion_percentage: 60,
        notes: 'Bonne compréhension',
        average_score: 80
      };

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [existingProgress] })
        .mockResolvedValueOnce({ rows: [updatedProgress] });

      const response = await request(app)
        .put('/api/learning/progress')
        .send(progressUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.timeSpent).toBe(120);
      expect(response.body.data.notes).toBe('Bonne compréhension');
    });
  });

  describe('POST /api/learning/exercises/submit', () => {
    it('should submit exercise and return attempt result', async () => {
      const exerciseSubmission = {
        exerciseId: 'exercise-123',
        answers: { selected: 'A' },
        timeSpent: 300,
        hintsUsed: 1
      };

      const mockExercise = {
        id: 'exercise-123',
        module_id: 'module-123',
        type: ExerciseType.MULTIPLE_CHOICE,
        correct_answer: '"A"',
        points: 10,
        attempts: 3,
        feedback: JSON.stringify({
          correct: 'Excellente réponse!',
          incorrect: 'Réponse incorrecte',
          hints: ['Pensez aux sources du droit']
        })
      };

      const mockAttempt = {
        id: 'attempt-123',
        student_id: 'student-123',
        exercise_id: 'exercise-123',
        attempt: 1,
        answers: JSON.stringify(exerciseSubmission.answers),
        score: 10,
        max_score: 10,
        time_spent: 300,
        started_at: new Date(),
        submitted_at: new Date(),
        feedback: JSON.stringify({
          overall: 'Excellente réponse!',
          detailed: {},
          suggestions: [],
          nextSteps: []
        }),
        is_correct: true,
        hints_used: 1
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockExercise] })
        .mockResolvedValueOnce({ rows: [{ next_attempt: 1 }] })
        .mockResolvedValueOnce({ rows: [mockAttempt] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/learning/exercises/submit')
        .send(exerciseSubmission);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'attempt-123',
        studentId: 'student-123',
        exerciseId: 'exercise-123',
        score: 10,
        isCorrect: true
      });
    });

    it('should handle maximum attempts exceeded', async () => {
      const exerciseSubmission = {
        exerciseId: 'exercise-123',
        answers: { selected: 'A' },
        timeSpent: 300
      };

      const mockExercise = {
        id: 'exercise-123',
        attempts: 3
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockExercise] })
        .mockResolvedValueOnce({ rows: [{ next_attempt: 4 }] });

      const response = await request(app)
        .post('/api/learning/exercises/submit')
        .send(exerciseSubmission);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Nombre maximum de tentatives dépassé');
    });
  });

  describe('GET /api/learning/recommendations', () => {
    it('should return personalized recommendations', async () => {
      const mockRecommendations = [{
        id: 'rec-1',
        student_id: 'student-123',
        type: 'module',
        title: 'Module recommandé',
        description: 'Basé sur vos performances',
        target_id: 'module-456',
        reason: 'Performance excellente en droit civil',
        confidence: 0.85,
        priority: 'high',
        valid_until: null,
        is_viewed: false,
        is_accepted: null,
        created_at: new Date(),
        target_title: 'Droit Civil Avancé',
        target_description: 'Module avancé'
      }];

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockRecommendations });

      const response = await request(app)
        .get('/api/learning/recommendations')
        .query({ type: 'module', limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: 'rec-1',
        studentId: 'student-123',
        type: 'module',
        title: 'Module recommandé'
      });
    });
  });

  describe('GET /api/learning/dashboard', () => {
    it('should return complete learning dashboard', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'student-123',
        study_level: StudyLevel.L2,
        interests: [LegalDomain.CIVIL_LAW],
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock all dashboard queries
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockProfile] }) // Student profile
        .mockResolvedValueOnce({ rows: [] }) // Current progress
        .mockResolvedValueOnce({ rows: [] }) // Recent activity
        .mockResolvedValueOnce({ rows: [] }) // Recommendations
        .mockResolvedValueOnce({ rows: [] }) // Achievements
        .mockResolvedValueOnce({ rows: [] }) // Statistics
        .mockResolvedValueOnce({ rows: [] }) // Upcoming deadlines
        .mockResolvedValueOnce({ rows: [] }); // Streak info

      const response = await request(app)
        .get('/api/learning/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('student');
      expect(response.body.data).toHaveProperty('currentProgress');
      expect(response.body.data).toHaveProperty('recentActivity');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('achievements');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('upcomingDeadlines');
      expect(response.body.data).toHaveProperty('streakInfo');
    });
  });

  describe('GET /api/learning/help/:context', () => {
    it('should return contextual help', async () => {
      const context = 'module_navigation';
      const mockHelp = [{
        id: 'help-1',
        context,
        title: 'Navigation dans les modules',
        content: 'Utilisez la barre de progression pour suivre votre avancement.',
        type: 'tooltip',
        level: StudyLevel.L1,
        examples: '["Cliquez sur Suivant"]',
        related_topics: '["progression", "navigation"]',
        is_interactive: false,
        media_url: null,
        language: 'fr'
      }];

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockHelp });

      const response = await request(app)
        .get(`/api/learning/help/${context}`)
        .query({ level: StudyLevel.L1, language: 'fr' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: 'help-1',
        context,
        title: 'Navigation dans les modules',
        type: 'tooltip'
      });
    });
  });

  describe('GET /api/learning/restrictions/check', () => {
    it('should check learning restrictions', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/learning/restrictions/check')
        .query({ resourceType: 'module_access', resourceId: 'module-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasAccess).toBe(true);
      expect(response.body.message).toBe('Accès autorisé');
    });

    it('should return access denied when restriction exists', async () => {
      const mockRestriction = [{
        id: 'restriction-1',
        student_id: 'student-123',
        type: 'module_access',
        resource: 'module-123',
        is_active: true
      }];

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockRestriction });

      const response = await request(app)
        .get('/api/learning/restrictions/check')
        .query({ resourceType: 'module_access', resourceId: 'module-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasAccess).toBe(false);
      expect(response.body.message).toBe('Accès restreint');
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/api/learning/restrictions/check');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Type de ressource et ID requis');
    });
  });

  describe('POST /api/learning/sessions', () => {
    it('should start a new study session', async () => {
      const sessionData = {
        moduleId: 'module-123',
        exerciseId: null
      };

      const mockSession = {
        id: 'session-123',
        student_id: 'student-123',
        module_id: 'module-123',
        exercise_id: null,
        start_time: new Date()
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockSession] });

      const response = await request(app)
        .post('/api/learning/sessions')
        .send(sessionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'session-123',
        studentId: 'student-123',
        moduleId: 'module-123'
      });
    });
  });

  describe('PUT /api/learning/sessions/:sessionId/end', () => {
    it('should end a study session', async () => {
      const sessionId = 'session-123';
      const sessionEnd = {
        activitiesCompleted: 3,
        score: 85,
        notes: 'Session productive',
        satisfaction: 4
      };

      const mockUpdatedSession = {
        id: sessionId,
        student_id: 'student-123',
        duration: 45,
        activities_completed: 3,
        score: 85,
        notes: 'Session productive',
        satisfaction: 4
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUpdatedSession] });

      const response = await request(app)
        .put(`/api/learning/sessions/${sessionId}/end`)
        .send(sessionEnd);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: sessionId,
        duration: 45,
        activitiesCompleted: 3,
        score: 85
      });
    });

    it('should return 404 for non-existent session', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/api/learning/sessions/nonexistent/end')
        .send({ activitiesCompleted: 1 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Session non trouvée');
    });
  });
});