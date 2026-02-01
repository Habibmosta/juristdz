// Learning system types for student mode

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  domain: LegalDomain;
  level: StudyLevel;
  prerequisites: string[];
  objectives: LearningObjective[];
  content: ModuleContent[];
  exercises: Exercise[];
  assessments: Assessment[];
  estimatedDuration: number; // in minutes
  difficulty: Difficulty;
  tags: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum LegalDomain {
  CIVIL_LAW = 'civil_law',
  CRIMINAL_LAW = 'criminal_law',
  COMMERCIAL_LAW = 'commercial_law',
  ADMINISTRATIVE_LAW = 'administrative_law',
  FAMILY_LAW = 'family_law',
  LABOR_LAW = 'labor_law',
  REAL_ESTATE_LAW = 'real_estate_law',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  TAX_LAW = 'tax_law',
  CONSTITUTIONAL_LAW = 'constitutional_law',
  INTERNATIONAL_LAW = 'international_law',
  PROCEDURAL_LAW = 'procedural_law'
}

export enum StudyLevel {
  L1 = 'l1', // Licence 1ère année
  L2 = 'l2', // Licence 2ème année
  L3 = 'l3', // Licence 3ème année
  M1 = 'm1', // Master 1ère année
  M2 = 'm2', // Master 2ème année
  PROFESSIONAL = 'professional', // Formation professionnelle
  CONTINUING = 'continuing' // Formation continue
}

export enum Difficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface LearningObjective {
  id: string;
  description: string;
  type: ObjectiveType;
  measurable: boolean;
  assessmentCriteria: string[];
}

export enum ObjectiveType {
  KNOWLEDGE = 'knowledge', // Connaître
  COMPREHENSION = 'comprehension', // Comprendre
  APPLICATION = 'application', // Appliquer
  ANALYSIS = 'analysis', // Analyser
  SYNTHESIS = 'synthesis', // Synthétiser
  EVALUATION = 'evaluation' // Évaluer
}

export interface ModuleContent {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  mediaUrl?: string;
  duration?: number;
  order: number;
  isInteractive: boolean;
  metadata: ContentMetadata;
}

export enum ContentType {
  TEXT = 'text',
  VIDEO = 'video',
  AUDIO = 'audio',
  IMAGE = 'image',
  DOCUMENT = 'document',
  INTERACTIVE = 'interactive',
  CASE_STUDY = 'case_study',
  LEGAL_TEXT = 'legal_text',
  JURISPRUDENCE = 'jurisprudence'
}

export interface ContentMetadata {
  keywords: string[];
  legalReferences: string[];
  difficulty: Difficulty;
  estimatedReadTime?: number;
  language: string;
  lastUpdated: Date;
}

export interface Exercise {
  id: string;
  moduleId: string;
  type: ExerciseType;
  title: string;
  description: string;
  question: string;
  options?: ExerciseOption[];
  correctAnswer: string | string[];
  explanation: string;
  hints: string[];
  difficulty: Difficulty;
  points: number;
  timeLimit?: number; // in minutes
  attempts: number;
  feedback: ExerciseFeedback;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ExerciseType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay',
  CASE_ANALYSIS = 'case_analysis',
  LEGAL_DRAFTING = 'legal_drafting',
  MATCHING = 'matching',
  ORDERING = 'ordering',
  SIMULATION = 'simulation'
}

export interface ExerciseOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface ExerciseFeedback {
  correct: string;
  incorrect: string;
  partial?: string;
  hints: string[];
  additionalResources: string[];
}

export interface Assessment {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: AssessmentType;
  exercises: string[]; // Exercise IDs
  passingScore: number;
  maxAttempts: number;
  timeLimit?: number; // in minutes
  isProctored: boolean;
  availableFrom: Date;
  availableUntil?: Date;
  weight: number; // for final grade calculation
  instructions: string;
  resources: AssessmentResource[];
  createdAt: Date;
  updatedAt: Date;
}

export enum AssessmentType {
  QUIZ = 'quiz',
  EXAM = 'exam',
  PROJECT = 'project',
  PRESENTATION = 'presentation',
  PRACTICAL = 'practical',
  CONTINUOUS = 'continuous'
}

export interface AssessmentResource {
  type: 'document' | 'link' | 'video';
  title: string;
  url: string;
  description?: string;
}

export interface StudentProgress {
  id: string;
  studentId: string;
  moduleId: string;
  status: ProgressStatus;
  completionPercentage: number;
  currentContentId?: string;
  timeSpent: number; // in minutes
  exercisesCompleted: number;
  exercisesTotal: number;
  averageScore: number;
  lastAccessed: Date;
  startedAt: Date;
  completedAt?: Date;
  notes: string;
  bookmarks: string[]; // Content IDs
  achievements: Achievement[];
}

export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  FAILED = 'failed'
}

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt: Date;
  criteria: AchievementCriteria;
}

export enum AchievementType {
  COMPLETION = 'completion',
  PERFORMANCE = 'performance',
  CONSISTENCY = 'consistency',
  IMPROVEMENT = 'improvement',
  PARTICIPATION = 'participation',
  MASTERY = 'mastery'
}

export interface AchievementCriteria {
  type: string;
  value: number;
  description: string;
}

export interface ExerciseAttempt {
  id: string;
  studentId: string;
  exerciseId: string;
  attempt: number;
  answers: Record<string, any>;
  score: number;
  maxScore: number;
  timeSpent: number; // in seconds
  startedAt: Date;
  submittedAt: Date;
  feedback: AttemptFeedback;
  isCorrect: boolean;
  hintsUsed: number;
}

export interface AttemptFeedback {
  overall: string;
  detailed: Record<string, string>;
  suggestions: string[];
  nextSteps: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  level: StudyLevel;
  modules: string[]; // Module IDs in order
  prerequisites: string[];
  estimatedDuration: number; // in hours
  difficulty: Difficulty;
  tags: string[];
  isRecommended: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studyLevel: StudyLevel;
  specialization?: string;
  university?: string;
  yearOfStudy: number;
  preferredLanguage: string;
  learningStyle: LearningStyle;
  goals: LearningGoal[];
  interests: LegalDomain[];
  strengths: string[];
  weaknesses: string[];
  preferences: LearningPreferences;
  statistics: LearningStatistics;
  createdAt: Date;
  updatedAt: Date;
}

export enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  KINESTHETIC = 'kinesthetic',
  READING_WRITING = 'reading_writing',
  MIXED = 'mixed'
}

export interface LearningGoal {
  id: string;
  description: string;
  targetDate: Date;
  priority: Priority;
  status: GoalStatus;
  progress: number;
  milestones: Milestone[];
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

export interface Milestone {
  id: string;
  description: string;
  targetDate: Date;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface LearningPreferences {
  sessionDuration: number; // preferred session length in minutes
  reminderFrequency: ReminderFrequency;
  difficultyProgression: DifficultyProgression;
  feedbackType: FeedbackType;
  contentTypes: ContentType[];
  studyTimes: StudyTime[];
}

export enum ReminderFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  NEVER = 'never'
}

export enum DifficultyProgression {
  GRADUAL = 'gradual',
  ADAPTIVE = 'adaptive',
  FIXED = 'fixed',
  CHALLENGE = 'challenge'
}

export enum FeedbackType {
  IMMEDIATE = 'immediate',
  DELAYED = 'delayed',
  SUMMARY = 'summary',
  DETAILED = 'detailed'
}

export interface StudyTime {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface LearningStatistics {
  totalTimeSpent: number; // in minutes
  modulesCompleted: number;
  exercisesCompleted: number;
  averageScore: number;
  streakDays: number;
  longestStreak: number;
  totalPoints: number;
  rank: number;
  achievements: number;
  lastActivity: Date;
  weeklyGoal: number; // minutes per week
  weeklyProgress: number; // minutes this week
}

export interface Recommendation {
  id: string;
  studentId: string;
  type: RecommendationType;
  title: string;
  description: string;
  targetId: string; // Module, Exercise, or Path ID
  reason: string;
  confidence: number; // 0-1
  priority: Priority;
  validUntil?: Date;
  isViewed: boolean;
  isAccepted?: boolean;
  createdAt: Date;
}

export enum RecommendationType {
  MODULE = 'module',
  EXERCISE = 'exercise',
  PATH = 'path',
  REVIEW = 'review',
  PRACTICE = 'practice',
  CHALLENGE = 'challenge'
}

export interface StudySession {
  id: string;
  studentId: string;
  moduleId?: string;
  exerciseId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  activitiesCompleted: number;
  score?: number;
  notes?: string;
  interruptions: number;
  focusScore: number; // 0-100
  satisfaction: number; // 1-5
}

export interface LearningAnalytics {
  studentId: string;
  period: AnalyticsPeriod;
  metrics: AnalyticsMetrics;
  trends: AnalyticsTrend[];
  insights: AnalyticsInsight[];
  recommendations: Recommendation[];
  generatedAt: Date;
}

export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export interface AnalyticsMetrics {
  timeSpent: number;
  modulesCompleted: number;
  exercisesCompleted: number;
  averageScore: number;
  improvementRate: number;
  consistencyScore: number;
  engagementLevel: number;
  difficultyProgression: number;
}

export interface AnalyticsTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  significance: 'low' | 'medium' | 'high';
}

export interface AnalyticsInsight {
  type: InsightType;
  title: string;
  description: string;
  actionable: boolean;
  suggestions: string[];
  impact: 'low' | 'medium' | 'high';
}

export enum InsightType {
  PERFORMANCE = 'performance',
  BEHAVIOR = 'behavior',
  PREFERENCE = 'preference',
  DIFFICULTY = 'difficulty',
  ENGAGEMENT = 'engagement',
  PROGRESS = 'progress'
}

export interface AdaptiveEngine {
  studentId: string;
  currentLevel: Difficulty;
  masteryThreshold: number;
  adaptationRate: number;
  performanceHistory: PerformancePoint[];
  nextRecommendations: Recommendation[];
  lastUpdated: Date;
}

export interface PerformancePoint {
  timestamp: Date;
  exerciseId: string;
  difficulty: Difficulty;
  score: number;
  timeSpent: number;
  hintsUsed: number;
}

export interface LearningRestriction {
  id: string;
  studentId: string;
  type: RestrictionType;
  resource: string;
  reason: string;
  isActive: boolean;
  expiresAt?: Date;
  createdBy: string;
  createdAt: Date;
}

export enum RestrictionType {
  MODULE_ACCESS = 'module_access',
  EXERCISE_ATTEMPTS = 'exercise_attempts',
  TIME_LIMIT = 'time_limit',
  CONTENT_TYPE = 'content_type',
  FEATURE_ACCESS = 'feature_access'
}

export interface ErrorExplanation {
  id: string;
  exerciseId: string;
  errorType: string;
  commonMistake: string;
  explanation: string;
  correctApproach: string;
  examples: string[];
  relatedConcepts: string[];
  additionalResources: string[];
  language: string;
}

export interface ContextualHelp {
  id: string;
  context: string; // page, feature, or concept
  title: string;
  content: string;
  type: HelpType;
  level: StudyLevel;
  examples: string[];
  relatedTopics: string[];
  isInteractive: boolean;
  mediaUrl?: string;
  language: string;
}

export enum HelpType {
  TOOLTIP = 'tooltip',
  GUIDE = 'guide',
  TUTORIAL = 'tutorial',
  FAQ = 'faq',
  VIDEO = 'video',
  INTERACTIVE = 'interactive'
}

// Request/Response types
export interface CreateModuleRequest {
  title: string;
  description: string;
  domain: LegalDomain;
  level: StudyLevel;
  prerequisites?: string[];
  objectives: Omit<LearningObjective, 'id'>[];
  content: Omit<ModuleContent, 'id'>[];
  exercises?: string[];
  estimatedDuration: number;
  difficulty: Difficulty;
  tags?: string[];
}

export interface UpdateProgressRequest {
  moduleId: string;
  contentId?: string;
  timeSpent: number;
  completed?: boolean;
  score?: number;
  notes?: string;
}

export interface SubmitExerciseRequest {
  exerciseId: string;
  answers: Record<string, any>;
  timeSpent: number;
  hintsUsed?: number;
}

export interface GetRecommendationsRequest {
  studentId: string;
  type?: RecommendationType;
  limit?: number;
  includeViewed?: boolean;
}

export interface LearningDashboard {
  student: StudentProfile;
  currentProgress: StudentProgress[];
  recentActivity: StudySession[];
  recommendations: Recommendation[];
  achievements: Achievement[];
  statistics: LearningStatistics;
  upcomingDeadlines: Assessment[];
  streakInfo: {
    current: number;
    longest: number;
    lastActivity: Date;
  };
}