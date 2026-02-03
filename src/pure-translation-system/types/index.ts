/**
 * Core Types for Pure Translation System
 * 
 * Comprehensive type definitions for the Pure Translation System,
 * supporting zero tolerance language mixing policies.
 */

// Define Language as enum for the Pure Translation System
export enum Language {
  ARABIC = 'ar',
  FRENCH = 'fr'
}

// Core Translation Types
export interface TranslationRequest {
  text: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  contentType: ContentType;
  priority: TranslationPriority;
  userId?: string;
  context?: TranslationContext;
}

export interface PureTranslationResult {
  translatedText: string;
  purityScore: number;
  qualityMetrics: QualityMetrics;
  processingTime: number;
  method: TranslationMethod;
  confidence: number;
  warnings: TranslationWarning[];
  metadata: TranslationMetadata;
}

export interface TranslationMetadata {
  requestId: string;
  timestamp: Date;
  processingSteps: ProcessingStep[];
  fallbackUsed: boolean;
  cacheHit: boolean;
}

export interface ProcessingStep {
  step: string;
  duration: number;
  success: boolean;
  details?: any;
}

// Content Types
export enum ContentType {
  LEGAL_DOCUMENT = 'legal_document',
  CHAT_MESSAGE = 'chat_message',
  UI_TEXT = 'ui_text',
  LEGAL_FORM = 'legal_form',
  CASE_DESCRIPTION = 'case_description',
  LEGAL_ADVICE = 'legal_advice',
  COURT_DOCUMENT = 'court_document',
  CONTRACT = 'contract',
  REGULATION = 'regulation',
  JURISPRUDENCE = 'jurisprudence'
}

export enum TranslationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  REAL_TIME = 'real_time'
}

export interface TranslationContext {
  legalDomain?: LegalDomain;
  userRole?: string;
  documentType?: string;
  jurisdiction?: string;
  previousTranslations?: string[];
  relatedConcepts?: string[];
}

// Legal Domain Types
export enum LegalDomain {
  CIVIL_LAW = 'civil_law',
  CRIMINAL_LAW = 'criminal_law',
  COMMERCIAL_LAW = 'commercial_law',
  ADMINISTRATIVE_LAW = 'administrative_law',
  FAMILY_LAW = 'family_law',
  PROCEDURAL_LAW = 'procedural_law',
  CONSTITUTIONAL_LAW = 'constitutional_law',
  LABOR_LAW = 'labor_law',
  TAX_LAW = 'tax_law',
  INTERNATIONAL_LAW = 'international_law'
}

// Translation Methods
export enum TranslationMethod {
  PRIMARY_AI = 'primary_ai',
  SECONDARY_AI = 'secondary_ai',
  RULE_BASED = 'rule_based',
  HYBRID = 'hybrid',
  FALLBACK_GENERATED = 'fallback_generated',
  CACHED = 'cached',
  LEGAL_DICTIONARY = 'legal_dictionary',
  TEMPLATE_BASED = 'template_based'
}

// Quality and Purity Types
export interface QualityMetrics {
  purityScore: number;
  terminologyAccuracy: number;
  contextualRelevance: number;
  readabilityScore: number;
  professionalismScore: number;
  encodingIntegrity: number;
  userSatisfaction?: number;
}

export interface PurityScore {
  overall: number;
  scriptPurity: number;
  terminologyConsistency: number;
  encodingIntegrity: number;
  contextualCoherence: number;
  uiElementsRemoved: number;
}

export interface PurityValidationResult {
  isPure: boolean;
  purityScore: PurityScore;
  violations: PurityViolation[];
  recommendations: PurityRecommendation[];
  passesZeroTolerance: boolean;
}

export interface PurityViolation {
  type: ViolationType;
  position: TextPosition;
  content: string;
  severity: Severity;
  suggestedFix: string;
  confidence: number;
}

export interface PurityRecommendation {
  type: RecommendationType;
  description: string;
  action: string;
  priority: Priority;
}

export enum ViolationType {
  MIXED_SCRIPTS = 'mixed_scripts',
  FOREIGN_FRAGMENTS = 'foreign_fragments',
  CORRUPTED_CHARACTERS = 'corrupted_characters',
  INCONSISTENT_TERMINOLOGY = 'inconsistent_terminology',
  UI_ARTIFACTS = 'ui_artifacts',
  ENCODING_ERROR = 'encoding_error',
  CYRILLIC_CHARACTERS = 'cyrillic_characters',
  ENGLISH_FRAGMENTS = 'english_fragments'
}

export enum RecommendationType {
  CONTENT_CLEANING = 'content_cleaning',
  TERMINOLOGY_UPDATE = 'terminology_update',
  ENCODING_FIX = 'encoding_fix',
  CONTEXT_ENHANCEMENT = 'context_enhancement',
  FALLBACK_IMPROVEMENT = 'fallback_improvement'
}

export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum Priority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Text Processing Types
export interface TextPosition {
  start: number;
  end: number;
  line?: number;
  column?: number;
}

export interface CleanedContent {
  cleanedText: string;
  removedElements: RemovedElement[];
  cleaningActions: CleaningAction[];
  originalLength: number;
  cleanedLength: number;
  confidence: number;
  processingTime: number;
}

export interface RemovedElement {
  type: PatternType;
  content: string;
  position: TextPosition;
  reason: string;
}

export interface CleaningAction {
  type: CleaningActionType;
  pattern: string;
  position: TextPosition;
  reason: string;
}

export enum CleaningActionType {
  REMOVE = 'remove',
  REPLACE = 'replace',
  NORMALIZE = 'normalize',
  ENCODE = 'encode',
  FILTER = 'filter',
  CLEAN = 'clean'
}

export interface ProblematicPattern {
  pattern: string;
  type: PatternType;
  position: number;
  severity: Severity;
  action: CleaningActionType;
}

export enum PatternType {
  CYRILLIC_CHARACTERS = 'cyrillic_characters',
  UI_ELEMENTS = 'ui_elements',
  ENGLISH_FRAGMENTS = 'english_fragments',
  FRENCH_FRAGMENTS = 'french_fragments',
  MIXED_SCRIPTS = 'mixed_scripts',
  CORRUPTED_ENCODING = 'corrupted_encoding',
  VERSION_NUMBERS = 'version_numbers',
  SYSTEM_ARTIFACTS = 'system_artifacts',
  INVALID_UNICODE = 'invalid_unicode',
  USER_REPORTED = 'user_reported'
}

// Translation Engine Types
export interface TranslationAttempt {
  result: string;
  method: TranslationMethod;
  confidence: number;
  processingTime: number;
  errors: TranslationError[];
  warnings: TranslationWarning[];
  metadata: any;
}

export interface TranslationError {
  code: string;
  message: string;
  severity: Severity;
  recoverable: boolean;
  context?: any;
}

export interface TranslationWarning {
  code: string;
  message: string;
  suggestion?: string;
  context?: any;
}

// Content Intent and Fallback Types
export interface ContentIntent {
  category: LegalCategory;
  concepts: LegalConcept[];
  context: LegalContext;
  complexity: ComplexityLevel;
  audience: AudienceType;
  confidence: number;
}

export interface LegalConcept {
  term: string;
  domain: LegalDomain;
  importance: number;
  alternatives: string[];
}

export interface LegalContext {
  jurisdiction: string;
  lawType: string;
  procedureType?: string;
  courtLevel?: string;
  caseType?: string;
}

export enum LegalCategory {
  CIVIL_LAW = 'civil_law',
  CRIMINAL_LAW = 'criminal_law',
  COMMERCIAL_LAW = 'commercial_law',
  ADMINISTRATIVE_LAW = 'administrative_law',
  FAMILY_LAW = 'family_law',
  PROCEDURAL_LAW = 'procedural_law',
  CONSTITUTIONAL_LAW = 'constitutional_law'
}

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  EXPERT = 'expert'
}

export enum AudienceType {
  GENERAL_PUBLIC = 'general_public',
  LEGAL_PROFESSIONAL = 'legal_professional',
  STUDENT = 'student',
  JUDGE = 'judge',
  LAWYER = 'lawyer',
  NOTARY = 'notary'
}

export interface FallbackContent {
  content: string;
  confidence: number;
  method: FallbackMethod;
  context: ContentIntent;
  alternatives: string[];
}

export enum FallbackMethod {
  TEMPLATE_BASED = 'template_based',
  CONTEXT_GENERATED = 'context_generated',
  DICTIONARY_LOOKUP = 'dictionary_lookup',
  RULE_BASED = 'rule_based',
  EMERGENCY_GENERIC = 'emergency_generic'
}

// Legal Terminology Types
export interface LegalTermTranslation {
  originalTerm: string;
  translatedTerm: string;
  confidence: number;
  context: LegalContext;
  alternatives: string[];
  usage: TermUsage;
  source: TermSource;
}

export interface LegalDictionary {
  domain: LegalDomain;
  terms: Map<string, LegalTermEntry>;
  lastUpdated: Date;
  version: string;
  authority: LegalAuthority;
}

export interface LegalTermEntry {
  frenchTerm: string;
  arabicTerm: string;
  definition: string;
  context: LegalContext;
  examples: string[];
  references: LegalReference[];
  confidence: number;
  lastVerified: Date;
}

export interface LegalReference {
  type: ReferenceType;
  citation: string;
  url?: string;
  authority: LegalAuthority;
}

export enum ReferenceType {
  LAW = 'law',
  REGULATION = 'regulation',
  JURISPRUDENCE = 'jurisprudence',
  DOCTRINE = 'doctrine',
  INTERNATIONAL_TREATY = 'international_treaty'
}

export enum LegalAuthority {
  ALGERIAN_GOVERNMENT = 'algerian_government',
  SUPREME_COURT = 'supreme_court',
  CONSTITUTIONAL_COUNCIL = 'constitutional_council',
  MINISTRY_OF_JUSTICE = 'ministry_of_justice',
  BAR_ASSOCIATION = 'bar_association',
  LEGAL_SCHOLAR = 'legal_scholar'
}

export enum TermUsage {
  FORMAL = 'formal',
  INFORMAL = 'informal',
  TECHNICAL = 'technical',
  COLLOQUIAL = 'colloquial',
  ARCHAIC = 'archaic'
}

export enum TermSource {
  OFFICIAL_DICTIONARY = 'official_dictionary',
  LEGAL_DATABASE = 'legal_database',
  EXPERT_VALIDATION = 'expert_validation',
  MACHINE_LEARNING = 'machine_learning',
  USER_CONTRIBUTION = 'user_contribution'
}

// Monitoring and Metrics Types
export interface TranslationMetrics {
  totalTranslations: number;
  pureTranslations: number;
  purityRate: number;
  averageQualityScore: number;
  failureRate: number;
  averageProcessingTime: number;
  userSatisfactionScore: number;
  issuesByType: Map<IssueType, number>;
  methodEffectiveness: Map<TranslationMethod, MethodMetrics>;
  timeRange: TimeRange;
}

export interface MethodMetrics {
  successRate: number;
  averageQuality: number;
  averageTime: number;
  userPreference: number;
  totalUsage: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

// Quality Control Types
export interface QualityReport {
  translationId: string;
  overallScore: number;
  purityValidation: PurityValidationResult;
  terminologyValidation: TerminologyValidation;
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  timestamp: Date;
  processingTime: number;
}

export interface TerminologyValidation {
  isValid: boolean;
  score: number;
  inconsistencies: TerminologyInconsistency[];
  suggestions: TerminologySuggestion[];
}

export interface TerminologyInconsistency {
  term: string;
  expectedTranslation: string;
  actualTranslation: string;
  confidence: number;
  context: LegalContext;
}

export interface TerminologySuggestion {
  term: string;
  suggestion: string;
  reason: string;
  confidence: number;
}

export interface QualityIssue {
  type: IssueType;
  severity: Severity;
  description: string;
  position: TextPosition;
  suggestedFix: string;
  impact: QualityImpact;
  confidence: number;
}

export interface QualityRecommendation {
  type: RecommendationType;
  description: string;
  action: string;
  priority: Priority;
  estimatedImpact: number;
}

export enum IssueType {
  LANGUAGE_MIXING = 'language_mixing',
  CORRUPTED_CHARACTERS = 'corrupted_characters',
  POOR_TERMINOLOGY = 'poor_terminology',
  CONTEXT_LOSS = 'context_loss',
  ENCODING_ERROR = 'encoding_error',
  UI_CONTAMINATION = 'ui_contamination',
  INCONSISTENT_STYLE = 'inconsistent_style',
  READABILITY_ISSUE = 'readability_issue'
}

export enum QualityImpact {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NEGLIGIBLE = 'negligible'
}

// Error Handling Types
export interface SystemError {
  code: string;
  message: string;
  severity: Severity;
  timestamp: Date;
  context: any;
  stackTrace?: string;
}

export enum ErrorRecoveryAction {
  RETRY_WITH_SECONDARY = 'retry_with_secondary',
  GENERATE_FALLBACK = 'generate_fallback',
  USE_CACHED_RESULT = 'use_cached_result',
  APPLY_EMERGENCY_CONTENT = 'apply_emergency_content',
  ESCALATE_TO_ADMIN = 'escalate_to_admin',
  NOTIFY_USER = 'notify_user'
}

// User Feedback Types
export interface TranslationIssue {
  id: string;
  userId: string;
  translationId: string;
  issueType: IssueType;
  description: string;
  originalText: string;
  translatedText: string;
  expectedResult?: string;
  severity: Severity;
  timestamp: Date;
  status: IssueStatus;
  resolution?: IssueResolution;
}

export interface IssueResolution {
  resolvedBy: string;
  resolvedAt: Date;
  action: string;
  notes: string;
  preventionMeasures: string[];
}

export enum IssueStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  DUPLICATE = 'duplicate'
}

// Configuration Types
export interface PureTranslationSystemConfig {
  zeroToleranceEnabled: boolean;
  minimumPurityScore: number;
  maxRetryAttempts: number;
  fallbackEnabled: boolean;
  cachingEnabled: boolean;
  monitoringEnabled: boolean;
  realTimeProcessing: boolean;
  concurrentRequestLimit: number;
  processingTimeout: number;
  qualityThresholds: QualityThresholds;
  cleaningRules: CleaningRules;
  terminologySettings: TerminologySettings;
}

export interface QualityThresholds {
  minimumPurityScore: number;
  minimumConfidence: number;
  maximumProcessingTime: number;
  terminologyAccuracyThreshold: number;
  readabilityThreshold: number;
}

export interface CleaningRules {
  removeUIElements: boolean;
  removeCyrillicCharacters: boolean;
  removeEnglishFragments: boolean;
  normalizeEncoding: boolean;
  aggressiveCleaning: boolean;
  customPatterns: string[];
}

export interface TerminologySettings {
  useOfficialDictionary: boolean;
  allowUserContributions: boolean;
  validateConsistency: boolean;
  updateFrequency: number;
  confidenceThreshold: number;
}

// Cache Types
export interface TranslationCache {
  get(key: string): Promise<PureTranslationResult | null>;
  set(key: string, value: PureTranslationResult, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): Promise<CacheStats>;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
}

// Event Types for Monitoring
export interface TranslationEvent {
  type: EventType;
  timestamp: Date;
  data: any;
  severity: Severity;
  source: string;
}

export enum EventType {
  TRANSLATION_STARTED = 'translation_started',
  TRANSLATION_COMPLETED = 'translation_completed',
  TRANSLATION_FAILED = 'translation_failed',
  PURITY_VIOLATION = 'purity_violation',
  FALLBACK_TRIGGERED = 'fallback_triggered',
  QUALITY_THRESHOLD_BREACH = 'quality_threshold_breach',
  USER_FEEDBACK_RECEIVED = 'user_feedback_received',
  SYSTEM_ERROR = 'system_error',
  PERFORMANCE_ALERT = 'performance_alert'
}

// Logging Types
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}
// Language Detection Types
export interface LanguageDetectionResult {
  detectedLanguage: Language;
  confidence: number;
  scriptAnalysis: ScriptAnalysis;
  wordAnalysis: WordAnalysis;
  processingTime: number;
  alternativeLanguages: Language[];
  warnings: string[];
}

export interface ScriptAnalysis {
  arabicCharacters: number;
  latinCharacters: number;
  otherCharacters: number;
  totalCharacters: number;
  arabicPercentage: number;
  latinPercentage: number;
  otherPercentage: number;
  dominantScript: 'arabic' | 'latin' | 'mixed' | 'unknown';
  mixedScriptPositions: TextPosition[];
  scriptChangeCount: number;
  isPureScript: boolean;
}

export interface WordAnalysis {
  arabicScore: number;
  frenchScore: number;
  indicators: string[];
  totalWords: number;
  recognizedWords: number;
  confidence: number;
}

export interface EncodingValidation {
  isValid: boolean;
  confidence: number;
  issues: string[];
  normalizedText: string;
  encoding: string;
  hasInvalidCharacters: boolean;
  recommendations: string[];
}

// Update existing PurityValidation to include more specific violation types
export interface PurityViolation {
  type: ViolationType;
  position: TextPosition;
  content: string;
  severity: Severity;
  suggestedFix: string;
  confidence?: number;
}

export interface PurityRecommendation {
  type: RecommendationType;
  description: string;
  action: string;
  priority: Priority;
  estimatedImpact?: number;
}