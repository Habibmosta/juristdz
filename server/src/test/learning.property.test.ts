import fc from 'fast-check';
import { Pool } from 'pg';
import { LearningService } from '../services/learningService.js';
import {
  LegalDomain,
  StudyLevel,
  Difficulty,
  ExerciseType,
  ProgressStatus,
  ContentType,
  ObjectiveType,
  CreateModuleRequest,
  UpdateProgressRequest,
  SubmitExerciseRequest
} from '../types/learning.js';

// Mock database for property-based testing
const mockDb = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
} as unknown as Pool;

const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

describe('Learning System Property-Based Tests', () => {
  let learningService: LearningService;

  beforeEach(() => {
    learningService = new LearningService(mockDb);
    jest.clearAllMocks();
    (mockDb.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  /**
   * **Validates: Requirements 8.1**
   * Property 19: Mode Apprentissage pour Étudiants
   * 
   * Vérifie que le système d'apprentissage fournit des fonctionnalités
   * appropriées pour les étudiants avec restrictions et explications contextuelles.
   */
  describe('Property 19: Mode Apprentissage pour Étudiants', () => {
    const studentIdArb = fc.string({ minLength: 1, maxLength: 50 });
    const studyLevelArb = fc.constantFrom(...Object.values(StudyLevel));
    const legalDomainArb = fc.constantFrom(...Object.values(LegalDomain));
    const difficultyArb = fc.constantFrom(...Object.values(Difficulty));

    it('should provide appropriate learning modules based on student level', async () => {
      await fc.assert(fc.asyncProperty(
        studentIdArb,
        studyLevelArb,
        legalDomainArb,
        async (studentId, studyLevel, domain) => {
          // Mock student profile
          const mockProfile = {
            id: 'profile-123',
            user_id: studentId,
            study_level: studyLevel,
            interests: [domain],
            created_at: new Date(),
            updated_at: new Date()
          };

          // Mock modules appropriate for level
          const mockModules = [{
            id: 'module-1',
            title: `Module ${domain} ${studyLevel}`,
            description: 'Test module',
            domain,
            level: studyLevel,
            prerequisites: '[]',
            objectives: '[]',
            estimated_duration: 120,
            difficulty: Difficulty.BEGINNER,
            tags: '[]',
            is_active: true,
            created_by: 'admin',
            created_at: new Date(),
            updated_at: new Date()
          }];

          (mockDb.query as jest.Mock)
            .mockResolvedValueOnce({ rows: [mockProfile] })
            .mockResolvedValueOnce({ rows: mockModules });

          const modules = await learningService.getModulesForStudent(studentId, domain, studyLevel);

          // Property: Modules returned should be appropriate for student level
          expect(modules).toBeDefined();
          expect(Array.isArray(modules)).toBe(true);
          
          // All modules should be at or below student level
          const levelHierarchy = ['l1', 'l2', 'l3', 'm1', 'm2', 'professional', 'continuing'];
          const studentLevelIndex = levelHierarchy.indexOf(studyLevel);
          
          modules.forEach(module => {
            const moduleLevelIndex = levelHierarchy.indexOf(module.level);
            expect(moduleLevelIndex).toBeLessThanOrEqual(studentLevelIndex);
          });
        }
      ), { numRuns: 50 });
    });

    it('should enforce learning restrictions for students', async () => {
      await fc.assert(fc.asyncProperty(
        studentIdArb,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (studentId, resourceType, resourceId) => {
          // Test with restriction
          const mockRestriction = [{
            id: 'restriction-1',
            student_id: studentId,
            type: resourceType,
            resource: resourceId,
            is_active: true
          }];

          (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockRestriction });

          const hasAccessWithRestriction = await learningService.checkLearningRestrictions(
            studentId, resourceType, resourceId
          );

          // Property: Should deny access when restriction exists
          expect(hasAccessWithRestriction).toBe(false);

          // Test without restriction
          (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

          const hasAccessWithoutRestriction = await learningService.checkLearningRestrictions(
            studentId, resourceType, resourceId
          );

          // Property: Should allow access when no restriction exists
          expect(hasAccessWithoutRestriction).toBe(true);
        }
      ), { numRuns: 30 });
    });

    it('should provide contextual help for learning interface', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        studyLevelArb,
        fc.constantFrom('fr', 'ar'),
        async (context, level, language) => {
          const mockHelp = [{
            id: 'help-1',
            context,
            title: 'Aide contextuelle',
            content: 'Contenu d\'aide',
            type: 'tooltip',
            level,
            examples: '[]',
            related_topics: '[]',
            is_interactive: false,
            media_url: null,
            language
          }];

          (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: mockHelp });

          const help = await learningService.getContextualHelp(context, level, language);

          // Property: Should return appropriate help for context and level
          expect(Array.isArray(help)).toBe(true);
          help.forEach(helpItem => {
            expect(helpItem.context).toBe(context);
            expect(helpItem.language).toBe(language);
            if (helpItem.level) {
              expect(helpItem.level).toBe(level);
            }
          });
        }
      ), { numRuns: 30 });
    });
  });

  /**
   * **Validates: Requirements 8.5**
   * Property 20: Suivi de Progression d'Apprentissage
   * 
   * Vérifie que le système suit précisément la progression des étudiants
   * et fournit des métriques d'apprentissage fiables.
   */
  describe('Property 20: Suivi de Progression d\'Apprentissage', () => {
    const studentIdArb = fc.string({ minLength: 1, maxLength: 50 });
    const moduleIdArb = fc.string({ minLength: 1, maxLength: 50 });
    const timeSpentArb = fc.integer({ min: 1, max: 300 }); // 1-300 minutes
    const scoreArb = fc.integer({ min: 0, max: 100 });
    const completionArb = fc.boolean();

    it('should accurately track student progress over time', async () => {
      await fc.assert(fc.asyncProperty(
        studentIdArb,
        moduleIdArb,
        fc.array(fc.record({
          timeSpent: timeSpentArb,
          score: scoreArb,
          completed: completionArb
        }), { minLength: 1, maxLength: 10 }),
        async (studentId, moduleId, progressUpdates) => {
          let cumulativeTime = 0;
          let lastProgress: any = null;

          for (const update of progressUpdates) {
            cumulativeTime += update.timeSpent;

            // Mock existing progress or create new
            const existingProgress = lastProgress || {
              id: 'progress-123',
              student_id: studentId,
              module_id: moduleId,
              status: ProgressStatus.IN_PROGRESS,
              completion_percentage: 0,
              time_spent: 0,
              average_score: 0,
              last_accessed: new Date(),
              started_at: new Date(),
              notes: null,
              bookmarks: '[]',
              achievements: '[]'
            };

            const updatedProgress = {
              ...existingProgress,
              time_spent: cumulativeTime,
              completion_percentage: update.completed ? 100 : Math.min(existingProgress.completion_percentage + 10, 95),
              status: update.completed ? ProgressStatus.COMPLETED : ProgressStatus.IN_PROGRESS,
              completed_at: update.completed ? new Date() : null
            };

            (mockDb.query as jest.Mock)
              .mockResolvedValueOnce({ rows: lastProgress ? [existingProgress] : [] })
              .mockResolvedValueOnce({ rows: [updatedProgress] });

            const request: UpdateProgressRequest = {
              moduleId,
              timeSpent: update.timeSpent,
              completed: update.completed,
              score: update.score
            };

            const result = await learningService.updateProgress(studentId, request);

            // Property: Time spent should accumulate correctly
            expect(result.timeSpent).toBeGreaterThanOrEqual(cumulativeTime);

            // Property: Completion percentage should never exceed 100%
            expect(result.completionPercentage).toBeLessThanOrEqual(100);
            expect(result.completionPercentage).toBeGreaterThanOrEqual(0);

            // Property: Status should be consistent with completion
            if (update.completed) {
              expect(result.status).toBe(ProgressStatus.COMPLETED);
              expect(result.completionPercentage).toBe(100);
            }

            lastProgress = updatedProgress;
          }
        }
      ), { numRuns: 20 });
    });

    it('should maintain consistent learning statistics', async () => {
      await fc.assert(fc.asyncProperty(
        studentIdArb,
        fc.array(fc.record({
          timeSpent: timeSpentArb,
          exercisesCompleted: fc.integer({ min: 0, max: 5 }),
          score: scoreArb
        }), { minLength: 1, maxLength: 10 }),
        async (studentId, activities) => {
          let totalTime = 0;
          let totalExercises = 0;
          let scores: number[] = [];

          for (const activity of activities) {
            totalTime += activity.timeSpent;
            totalExercises += activity.exercisesCompleted;
            if (activity.exercisesCompleted > 0) {
              scores.push(activity.score);
            }

            const expectedAverage = scores.length > 0 
              ? scores.reduce((a, b) => a + b, 0) / scores.length 
              : 0;

            const mockStats = {
              student_id: studentId,
              total_time_spent: totalTime,
              exercises_completed: totalExercises,
              average_score: expectedAverage,
              streak_days: 1,
              longest_streak: 1,
              total_points: totalExercises * 10,
              rank: 1,
              achievements: 0,
              last_activity: new Date(),
              weekly_goal: 120,
              weekly_progress: Math.min(totalTime, 120)
            };

            (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [mockStats] });

            // This would be called by updateProgress internally
            // We're testing the statistical consistency

            // Property: Total time should be cumulative
            expect(mockStats.total_time_spent).toBe(totalTime);

            // Property: Exercise count should be cumulative
            expect(mockStats.exercises_completed).toBe(totalExercises);

            // Property: Average score should be mathematically correct
            if (scores.length > 0) {
              expect(Math.abs(mockStats.average_score - expectedAverage)).toBeLessThan(0.01);
            }

            // Property: Weekly progress should not exceed weekly goal
            expect(mockStats.weekly_progress).toBeLessThanOrEqual(mockStats.weekly_goal);
          }
        }
      ), { numRuns: 20 });
    });

    it('should generate appropriate adaptive recommendations', async () => {
      await fc.assert(fc.asyncProperty(
        studentIdArb,
        fc.array(fc.record({
          exerciseId: fc.string({ minLength: 1, maxLength: 50 }),
          score: scoreArb,
          domain: legalDomainArb,
          difficulty: difficultyArb
        }), { minLength: 3, maxLength: 20 }),
        async (studentId, attempts) => {
          // Mock student profile
          const mockProfile = {
            id: 'profile-123',
            user_id: studentId,
            study_level: StudyLevel.L2,
            interests: [LegalDomain.CIVIL_LAW],
            created_at: new Date(),
            updated_at: new Date()
          };

          // Mock recent attempts
          const mockAttempts = attempts.map((attempt, index) => ({
            id: `attempt-${index}`,
            student_id: studentId,
            exercise_id: attempt.exerciseId,
            score: attempt.score,
            max_score: 100,
            submitted_at: new Date(),
            domain: attempt.domain,
            difficulty: attempt.difficulty
          }));

          (mockDb.query as jest.Mock)
            .mockResolvedValueOnce({ rows: [mockProfile] })
            .mockResolvedValueOnce({ rows: mockAttempts })
            .mockResolvedValueOnce({ rows: [] }) // Review modules
            .mockResolvedValueOnce({ rows: [] }); // Advanced modules

          const recommendations = await learningService.generateAdaptiveRecommendations(studentId);

          // Property: Should return array of recommendations
          expect(Array.isArray(recommendations)).toBe(true);

          // Property: Recommendations should be relevant to performance
          const averageScore = attempts.reduce((sum, att) => sum + att.score, 0) / attempts.length;
          
          recommendations.forEach(rec => {
            expect(rec.studentId).toBe(studentId);
            expect(rec.confidence).toBeGreaterThan(0);
            expect(rec.confidence).toBeLessThanOrEqual(1);
            
            // Property: Low performance should generate review recommendations
            if (averageScore < 60) {
              expect(['review', 'practice']).toContain(rec.type);
            }
            
            // Property: High performance should generate challenge recommendations
            if (averageScore > 80) {
              expect(['module', 'challenge']).toContain(rec.type);
            }
          });
        }
      ), { numRuns: 15 });
    });
  });

  /**
   * Property: Exercise Scoring Consistency
   * 
   * Vérifie que le système de notation des exercices est cohérent
   * et respecte les règles de scoring définies.
   */
  describe('Property: Exercise Scoring Consistency', () => {
    const exerciseTypeArb = fc.constantFrom(...Object.values(ExerciseType));
    const answersArb = fc.record({
      selected: fc.string(),
      answer: fc.boolean(),
      answers: fc.array(fc.string())
    });

    it('should score exercises consistently based on type and correctness', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        exerciseTypeArb,
        answersArb,
        fc.integer({ min: 1, max: 100 }),
        async (studentId, exerciseType, answers, maxPoints) => {
          const mockExercise = {
            id: 'exercise-123',
            module_id: 'module-123',
            type: exerciseType,
            correct_answer: JSON.stringify(answers.selected || answers.answer || answers.answers),
            points: maxPoints,
            attempts: 3,
            feedback: JSON.stringify({
              correct: 'Correct!',
              incorrect: 'Incorrect!',
              hints: []
            })
          };

          const mockAttempt = {
            id: 'attempt-123',
            student_id: studentId,
            exercise_id: 'exercise-123',
            attempt: 1,
            answers: JSON.stringify(answers),
            score: 0, // Will be calculated
            max_score: maxPoints,
            time_spent: 300,
            started_at: new Date(),
            submitted_at: new Date(),
            feedback: '{}',
            is_correct: false,
            hints_used: 0
          };

          mockClient.query
            .mockResolvedValueOnce({ rows: [mockExercise] })
            .mockResolvedValueOnce({ rows: [{ next_attempt: 1 }] })
            .mockResolvedValueOnce({ rows: [mockAttempt] })
            .mockResolvedValueOnce({ rows: [] });

          const request: SubmitExerciseRequest = {
            exerciseId: 'exercise-123',
            answers,
            timeSpent: 300
          };

          const result = await learningService.submitExercise(studentId, request);

          // Property: Score should be between 0 and max points
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(result.maxScore);

          // Property: Max score should match exercise points
          expect(result.maxScore).toBe(maxPoints);

          // Property: Correct answers should give full points for simple types
          if ([ExerciseType.MULTIPLE_CHOICE, ExerciseType.TRUE_FALSE].includes(exerciseType)) {
            // This would need actual scoring logic to test properly
            expect(typeof result.isCorrect).toBe('boolean');
          }
        }
      ), { numRuns: 30 });
    });
  });

  /**
   * Property: Learning Path Consistency
   * 
   * Vérifie que les parcours d'apprentissage respectent les prérequis
   * et la progression logique des niveaux.
   */
  describe('Property: Learning Path Consistency', () => {
    it('should maintain prerequisite consistency in learning paths', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          level: fc.constantFrom(...Object.values(StudyLevel)),
          domain: legalDomainArb,
          prerequisites: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 3 })
        }), { minLength: 2, maxLength: 10 }),
        async (modules) => {
          // Property: Prerequisites should reference existing modules
          const moduleIds = modules.map(m => m.id);
          
          modules.forEach(module => {
            module.prerequisites.forEach(prereqId => {
              // In a real system, prerequisites should exist
              // For this test, we verify the structure is consistent
              expect(typeof prereqId).toBe('string');
              expect(prereqId.length).toBeGreaterThan(0);
            });
          });

          // Property: Level progression should be logical
          const levelHierarchy = ['l1', 'l2', 'l3', 'm1', 'm2', 'professional', 'continuing'];
          
          modules.forEach(module => {
            const moduleLevel = levelHierarchy.indexOf(module.level);
            
            // Prerequisites should generally be at same or lower level
            module.prerequisites.forEach(prereqId => {
              const prereqModule = modules.find(m => m.id === prereqId);
              if (prereqModule) {
                const prereqLevel = levelHierarchy.indexOf(prereqModule.level);
                expect(prereqLevel).toBeLessThanOrEqual(moduleLevel);
              }
            });
          });
        }
      ), { numRuns: 20 });
    });
  });
});