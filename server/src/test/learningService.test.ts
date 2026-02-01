import { Pool } from 'pg';
import { LearningService } from '../services/learningService.js';
import {
  LearningModule,
  StudentProgress,
  ExerciseAttempt,
  CreateModuleRequest,
  UpdateProgressRequest,
  SubmitExerciseRequest,
  LegalDomain,
  StudyLevel,
  Difficulty,
  ExerciseType,
  ProgressStatus,
  ContentType,
  ObjectiveType
} from '../types/learning.js';

// Mock database
const mockDb = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
} as unknown as Pool;

const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

describe('LearningService', () => {
  let learningService: LearningService;

  beforeEach(() => {
    learningService = new LearningService(mockDb);
    jest.clearAllMocks();
    (mockDb.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  describe('createModule', () => {
    it('should create a learning module successfully', async () => {
      const request: CreateModuleRequest = {
        title: 'Introduction au Droit Civil',
        description: 'Module d\'introduction aux principes du droit civil',
        domain: LegalDomain.CIVIL_LAW,
        level: StudyLevel.L1,
        objectives: [{
          description: 'Comprendre les sources du droit',
          type: ObjectiveType.COMPREHENSION,
          measurable: true,
          assessmentCriteria: ['Identifier les sources', 'Expliquer la hiérarchie']
        }],
        content: [{
          type: ContentType.TEXT,
          title: 'Les sources du droit',
          content: 'Le droit civil algérien puise ses sources...',
          order: 0,
          isInteractive: false,
          metadata: {
            keywords: ['sources', 'droit civil'],
            legalReferences: ['Code civil art. 1'],
            difficulty: Difficulty.BEGINNER,
            language: 'fr',
            lastUpdated: new Date()
          }
        }],
        estimatedDuration: 120,
        difficulty: Difficulty.BEGINNER,
        tags: ['introduction', 'droit civil']
      };

      const mockModuleRow = {
        id: 'module-123',
        title: request.title,
        description: request.description,
        domain: request.domain,
        level: request.level,
        prerequisites: '[]',
        objectives: JSON.stringify(request.objectives),
        estimated_duration: request.estimatedDuration,
        difficulty: request.difficulty,
        tags: JSON.stringify(request.tags),
        is_active: true,
        created_by: 'user-123',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockModuleRow] }) // Module creation
        .mockResolvedValueOnce({ rows: [] }); // Content creation

      const result = await learningService.createModule(request, 'user-123');

      expect(result).toMatchObject({
        id: 'module-123',
        title: request.title,
        description: request.description,
        domain: request.domain,
        level: request.level
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should rollback on error', async () => {
      const request: CreateModuleRequest = {
        title: 'Test Module',
        description: 'Test Description',
        domain: LegalDomain.CIVIL_LAW,
        level: StudyLevel.L1,
        objectives: [],
        content: [],
        estimatedDuration: 60,
        difficulty: Difficulty.BEGINNER
      };

      mockClient.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(learningService.createModule(request, 'user-123'))
        .rejects.toThrow('Database error');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getModulesForStudent', () => {
    it('should return modules appropriate for student level', async () => {
      const studentId = 'student-123';
      const mockStudentProfile = {
        id: 'profile-123',
        user_id: studentId,
        study_level: StudyLevel.L2,
        interests: [LegalDomain.CIVIL_LAW, LegalDomain.CRIMINAL_LAW],
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
        objectives: '[]',
        estimated_duration: 120,
        difficulty: Difficulty.INTERMEDIATE,
        tags: '["droit civil"]',
        is_active: true,
        created_by: 'admin-123',
        created_at: new Date(),
        updated_at: new Date(),
        completion_percentage: 0,
        progress_status: 'not_started'
      }];

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockStudentProfile] }) // Student profile
        .mockResolvedValueOnce({ rows: mockModules }); // Modules

      const result = await learningService.getModulesForStudent(studentId, LegalDomain.CIVIL_LAW);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'module-1',
        title: 'Droit Civil L2',
        domain: LegalDomain.CIVIL_LAW,
        level: StudyLevel.L2
      });
    });
  });

  describe('updateProgress', () => {
    it('should create new progress record if none exists', async () => {
      const studentId = 'student-123';
      const request: UpdateProgressRequest = {
        moduleId: 'module-123',
        contentId: 'content-1',
        timeSpent: 30,
        completed: false,
        score: 85
      };

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // No existing progress
        .mockResolvedValueOnce({ // Create new progress
          rows: [{
            id: 'progress-123',
            student_id: studentId,
            module_id: request.moduleId,
            status: ProgressStatus.IN_PROGRESS,
            completion_percentage: 0,
            current_content_id: request.contentId,
            time_spent: request.timeSpent,
            exercises_completed: 0,
            exercises_total: 0,
            average_score: 0,
            last_accessed: new Date(),
            started_at: new Date(),
            notes: null,
            bookmarks: '[]',
            achievements: '[]'
          }]
        });

      const result = await learningService.updateProgress(studentId, request);

      expect(result).toMatchObject({
        id: 'progress-123',
        studentId,
        moduleId: request.moduleId,
        status: ProgressStatus.IN_PROGRESS
      });
    });

    it('should update existing progress record', async () => {
      const studentId = 'student-123';
      const request: UpdateProgressRequest = {
        moduleId: 'module-123',
        timeSpent: 15,
        completed: true,
        score: 90
      };

      const existingProgress = {
        id: 'progress-123',
        student_id: studentId,
        module_id: request.moduleId,
        status: ProgressStatus.IN_PROGRESS,
        completion_percentage: 50,
        time_spent: 60,
        average_score: 80,
        last_accessed: new Date(),
        started_at: new Date(),
        notes: null,
        bookmarks: '[]',
        achievements: '[]'
      };

      const updatedProgress = {
        ...existingProgress,
        status: ProgressStatus.COMPLETED,
        completion_percentage: 100,
        time_spent: 75,
        completed_at: new Date()
      };

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [existingProgress] }) // Existing progress
        .mockResolvedValueOnce({ rows: [updatedProgress] }); // Updated progress

      const result = await learningService.updateProgress(studentId, request);

      expect(result.status).toBe(ProgressStatus.COMPLETED);
      expect(result.completionPercentage).toBe(100);
    });
  });

  describe('submitExercise', () => {
    it('should submit exercise and calculate score correctly', async () => {
      const studentId = 'student-123';
      const request: SubmitExerciseRequest = {
        exerciseId: 'exercise-123',
        answers: { selected: 'A' },
        timeSpent: 300, // 5 minutes
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
          incorrect: 'Réponse incorrecte, réessayez.',
          hints: ['Pensez aux sources du droit']
        })
      };

      const mockAttempt = {
        id: 'attempt-123',
        student_id: studentId,
        exercise_id: request.exerciseId,
        attempt: 1,
        answers: JSON.stringify(request.answers),
        score: 10,
        max_score: 10,
        time_spent: request.timeSpent,
        started_at: new Date(),
        submitted_at: new Date(),
        feedback: JSON.stringify({
          overall: 'Excellente réponse!',
          detailed: {},
          suggestions: ['Pensez aux sources du droit'],
          nextSteps: []
        }),
        is_correct: true,
        hints_used: request.hintsUsed
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockExercise] }) // Get exercise
        .mockResolvedValueOnce({ rows: [{ next_attempt: 1 }] }) // Get attempt number
        .mockResolvedValueOnce({ rows: [mockAttempt] }) // Create attempt
        .mockResolvedValueOnce({ rows: [] }); // Update progress

      const result = await learningService.submitExercise(studentId, request);

      expect(result).toMatchObject({
        id: 'attempt-123',
        studentId,
        exerciseId: request.exerciseId,
        score: 10,
        isCorrect: true
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should handle maximum attempts exceeded', async () => {
      const studentId = 'student-123';
      const request: SubmitExerciseRequest = {
        exerciseId: 'exercise-123',
        answers: { selected: 'A' },
        timeSpent: 300
      };

      const mockExercise = {
        id: 'exercise-123',
        attempts: 3
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockExercise] }) // Get exercise
        .mockResolvedValueOnce({ rows: [{ next_attempt: 4 }] }); // Attempt number exceeds limit

      await expect(learningService.submitExercise(studentId, request))
        .rejects.toThrow('Maximum attempts exceeded');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getRecommendations', () => {
    it('should return personalized recommendations', async () => {
      const studentId = 'student-123';
      const mockRecommendations = [{
        id: 'rec-1',
        student_id: studentId,
        type: 'module',
        title: 'Module recommandé',
        description: 'Basé sur vos performances',
        target_id: 'module-123',
        reason: 'Performance excellente en droit civil',
        confidence: 0.85,
        priority: 'high',
        valid_until: null,
        is_viewed: false,
        is_accepted: null,
        created_at: new Date(),
        target_title: 'Droit Civil Avancé',
        target_description: 'Module avancé de droit civil'
      }];

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockRecommendations });

      const result = await learningService.getRecommendations({
        studentId,
        limit: 5
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'rec-1',
        studentId,
        type: 'module',
        title: 'Module recommandé'
      });
    });
  });

  describe('getLearningDashboard', () => {
    it('should return complete learning dashboard', async () => {
      const studentId = 'student-123';
      
      // Mock all the dashboard components
      const mockProfile = {
        id: 'profile-123',
        user_id: studentId,
        study_level: StudyLevel.L2,
        interests: [LegalDomain.CIVIL_LAW],
        created_at: new Date(),
        updated_at: new Date()
      };

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockProfile] }) // Student profile
        .mockResolvedValueOnce({ rows: [] }) // Current progress
        .mockResolvedValueOnce({ rows: [] }) // Recent activity
        .mockResolvedValueOnce({ rows: [] }) // Recommendations
        .mockResolvedValueOnce({ rows: [] }) // Achievements
        .mockResolvedValueOnce({ rows: [] }) // Statistics
        .mockResolvedValueOnce({ rows: [] }) // Upcoming deadlines
        .mockResolvedValueOnce({ rows: [] }); // Streak info

      const result = await learningService.getLearningDashboard(studentId);

      expect(result).toHaveProperty('student');
      expect(result).toHaveProperty('currentProgress');
      expect(result).toHaveProperty('recentActivity');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('achievements');
      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('upcomingDeadlines');
      expect(result).toHaveProperty('streakInfo');
    });
  });

  describe('getContextualHelp', () => {
    it('should return contextual help for given context and level', async () => {
      const context = 'module_navigation';
      const level = StudyLevel.L1;
      const language = 'fr';

      const mockHelp = [{
        id: 'help-1',
        context,
        title: 'Navigation dans les modules',
        content: 'Utilisez la barre de progression...',
        type: 'tooltip',
        level,
        examples: '["Cliquez sur Suivant"]',
        related_topics: '["progression", "navigation"]',
        is_interactive: false,
        media_url: null,
        language
      }];

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockHelp });

      const result = await learningService.getContextualHelp(context, level, language);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'help-1',
        context,
        title: 'Navigation dans les modules',
        type: 'tooltip'
      });
    });
  });

  describe('checkLearningRestrictions', () => {
    it('should return true when no restrictions exist', async () => {
      const studentId = 'student-123';
      const resourceType = 'module_access';
      const resourceId = 'module-123';

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await learningService.checkLearningRestrictions(
        studentId, resourceType, resourceId
      );

      expect(result).toBe(true);
    });

    it('should return false when active restriction exists', async () => {
      const studentId = 'student-123';
      const resourceType = 'module_access';
      const resourceId = 'module-123';

      const mockRestriction = [{
        id: 'restriction-1',
        student_id: studentId,
        type: resourceType,
        resource: resourceId,
        reason: 'Prerequisite not completed',
        is_active: true,
        expires_at: null
      }];

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockRestriction });

      const result = await learningService.checkLearningRestrictions(
        studentId, resourceType, resourceId
      );

      expect(result).toBe(false);
    });
  });
});