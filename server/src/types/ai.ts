import { DocumentType, DocumentCategory } from './document';
import { LegalDomain, LegalReference } from './search';
import { Profession } from './auth';

// AI Legal Service Types
export interface AILegalService {
  generateDocumentDraft(type: DocumentType, context: LegalContext): Promise<DocumentDraft>;
  analyzeCompliance(document: string, domain: LegalDomain): Promise<ComplianceAnalysis>;
  suggestImprovements(document: string, userRole: Profession): Promise<Suggestion[]>;
  explainLegalConcept(concept: string, level: ExplanationLevel): Promise<Explanation>;
  validateLegalReasoning(argument: string): Promise<ValidationResult>;
  generateClause(clauseType: ClauseType, context: ClauseContext): Promise<GeneratedClause>;
  reviewContract(contract: string, reviewType: ReviewType): Promise<ContractReview>;
  extractLegalEntities(document: string): Promise<LegalEntity[]>;
  summarizeDocument(document: string, summaryType: SummaryType): Promise<DocumentSummary>;
  translateLegalText(text: string, fromLang: 'fr' | 'ar', toLang: 'fr' | 'ar'): Promise<TranslationResult>;
}

export interface LegalContext {
  userRole: Profession;
  jurisdiction: string;
  legalDomain: LegalDomain;
  clientInfo?: ClientInfo;
  caseInfo?: CaseInfo;
  precedents?: string[];
  applicableLaws?: LegalReference[];
  customInstructions?: string;
  language: 'fr' | 'ar';
  urgency?: 'low' | 'medium' | 'high';
  complexity?: 'simple' | 'medium' | 'complex';
}

export interface ClientInfo {
  id: string;
  name: string;
  type: 'individual' | 'company' | 'organization';
  industry?: string;
  size?: 'small' | 'medium' | 'large';
  location?: string;
  specialRequirements?: string[];
}

export interface CaseInfo {
  id: string;
  number: string;
  type: string;
  description: string;
  parties: Party[];
  timeline: CaseEvent[];
  currentStatus: string;
  nextDeadline?: Date;
  estimatedValue?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface Party {
  name: string;
  role: 'plaintiff' | 'defendant' | 'third_party' | 'witness' | 'expert';
  type: 'individual' | 'company' | 'organization' | 'government';
  contact?: ContactInfo;
  representation?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

export interface CaseEvent {
  date: Date;
  type: string;
  description: string;
  documents?: string[];
  participants?: string[];
}

export interface DocumentDraft {
  content: string;
  title: string;
  type: DocumentType;
  category: DocumentCategory;
  metadata: DraftMetadata;
  suggestions: DraftSuggestion[];
  confidence: number;
  estimatedCompletionTime: number; // in minutes
  requiredVariables: string[];
  optionalVariables: string[];
  legalReferences: LegalReference[];
  warnings: string[];
}

export interface DraftMetadata {
  generatedAt: Date;
  model: string;
  version: string;
  parameters: Record<string, any>;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  processingTime: number; // in milliseconds
}

export interface DraftSuggestion {
  type: 'improvement' | 'alternative' | 'addition' | 'removal' | 'clarification';
  section: string;
  current?: string;
  suggested: string;
  reason: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  legalBasis?: LegalReference[];
}

export interface ComplianceAnalysis {
  isCompliant: boolean;
  overallScore: number; // 0-100
  issues: ComplianceIssue[];
  suggestions: ImprovementSuggestion[];
  confidence: number;
  legalReferences: LegalReference[];
  checkedRules: ComplianceRule[];
  summary: string;
  riskAssessment: RiskAssessment;
}

export interface ComplianceIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location: TextLocation;
  rule: ComplianceRule;
  suggestedFix?: string;
  examples?: string[];
  legalBasis: LegalReference[];
  impact: string;
}

export interface TextLocation {
  start: number;
  end: number;
  line?: number;
  column?: number;
  section?: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: string;
  jurisdiction: string;
  legalBasis: LegalReference[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  isActive: boolean;
  lastUpdated: Date;
}

export interface ImprovementSuggestion {
  id: string;
  type: 'structure' | 'content' | 'style' | 'legal' | 'clarity';
  title: string;
  description: string;
  before?: string;
  after: string;
  location?: TextLocation;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  confidence: number;
  legalBasis?: LegalReference[];
  examples?: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  recommendedActions: string[];
  timeline: string;
  estimatedCost?: number;
}

export interface RiskFactor {
  type: string;
  description: string;
  probability: number; // 0-1
  impact: number; // 0-1
  riskScore: number; // probability * impact
  mitigation?: string;
}

export interface Suggestion {
  id: string;
  type: 'grammar' | 'style' | 'legal' | 'structure' | 'clarity' | 'completeness';
  title: string;
  description: string;
  location: TextLocation;
  original: string;
  suggested: string;
  reason: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  category: string;
  legalBasis?: LegalReference[];
  examples?: string[];
  isAccepted?: boolean;
  userFeedback?: string;
}

export interface Explanation {
  concept: string;
  definition: string;
  context: string;
  examples: ExplanationExample[];
  relatedConcepts: string[];
  legalBasis: LegalReference[];
  practicalApplications: string[];
  commonMisunderstandings: string[];
  level: ExplanationLevel;
  language: 'fr' | 'ar';
  lastUpdated: Date;
  sources: string[];
}

export enum ExplanationLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface ExplanationExample {
  title: string;
  description: string;
  scenario: string;
  outcome: string;
  legalBasis?: LegalReference[];
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  logicalGaps: LogicalGap[];
  supportingEvidence: Evidence[];
  counterArguments: CounterArgument[];
  recommendations: string[];
  confidence: number;
  reasoning: string;
}

export interface LogicalGap {
  type: 'missing_premise' | 'invalid_inference' | 'unsupported_claim' | 'circular_reasoning';
  description: string;
  location: TextLocation;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface Evidence {
  type: 'legal_precedent' | 'statute' | 'regulation' | 'doctrine' | 'fact';
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
  relevance: number; // 0-1
  source: LegalReference;
  location?: TextLocation;
}

export interface CounterArgument {
  argument: string;
  strength: 'strong' | 'moderate' | 'weak';
  response?: string;
  legalBasis?: LegalReference[];
}

// Clause Generation
export enum ClauseType {
  CONFIDENTIALITY = 'confidentiality',
  NON_COMPETE = 'non_compete',
  TERMINATION = 'termination',
  PAYMENT = 'payment',
  LIABILITY = 'liability',
  FORCE_MAJEURE = 'force_majeure',
  DISPUTE_RESOLUTION = 'dispute_resolution',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  DATA_PROTECTION = 'data_protection',
  GOVERNING_LAW = 'governing_law'
}

export interface ClauseContext {
  contractType: string;
  parties: ContractParty[];
  jurisdiction: string;
  industry?: string;
  value?: number;
  duration?: number;
  riskLevel: 'low' | 'medium' | 'high';
  customRequirements?: string[];
  language: 'fr' | 'ar';
}

export interface ContractParty {
  name: string;
  type: 'individual' | 'company' | 'organization';
  role: 'client' | 'service_provider' | 'buyer' | 'seller' | 'licensor' | 'licensee';
  jurisdiction: string;
  industry?: string;
}

export interface GeneratedClause {
  type: ClauseType;
  title: string;
  content: string;
  alternatives: string[];
  explanation: string;
  legalBasis: LegalReference[];
  riskLevel: 'low' | 'medium' | 'high';
  customization: ClauseCustomization[];
  precedents: string[];
  warnings: string[];
  confidence: number;
}

export interface ClauseCustomization {
  parameter: string;
  description: string;
  options: string[];
  defaultValue: string;
  required: boolean;
}

// Contract Review
export enum ReviewType {
  COMPREHENSIVE = 'comprehensive',
  RISK_FOCUSED = 'risk_focused',
  COMPLIANCE = 'compliance',
  COMMERCIAL = 'commercial',
  QUICK = 'quick'
}

export interface ContractReview {
  summary: ReviewSummary;
  sections: SectionReview[];
  riskAnalysis: ContractRiskAnalysis;
  recommendations: ReviewRecommendation[];
  missingClauses: MissingClause[];
  redFlags: RedFlag[];
  score: number; // 0-100
  confidence: number;
  reviewTime: number; // in minutes
}

export interface ReviewSummary {
  contractType: string;
  parties: string[];
  keyTerms: KeyTerm[];
  mainObligations: Obligation[];
  criticalIssues: string[];
  overallAssessment: string;
}

export interface KeyTerm {
  term: string;
  value: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  location: TextLocation;
}

export interface Obligation {
  party: string;
  description: string;
  deadline?: Date;
  conditions?: string[];
  penalties?: string;
}

export interface SectionReview {
  title: string;
  content: string;
  analysis: string;
  issues: string[];
  suggestions: string[];
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ContractRiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskCategories: RiskCategory[];
  mitigationStrategies: string[];
  dealBreakers: string[];
  negotiationPoints: NegotiationPoint[];
}

export interface RiskCategory {
  category: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  likelihood: string;
  mitigation: string[];
}

export interface NegotiationPoint {
  clause: string;
  issue: string;
  position: 'favorable' | 'neutral' | 'unfavorable';
  priority: 'high' | 'medium' | 'low';
  strategy: string;
  alternatives: string[];
}

export interface ReviewRecommendation {
  type: 'add' | 'modify' | 'remove' | 'clarify';
  priority: 'critical' | 'high' | 'medium' | 'low';
  section: string;
  description: string;
  rationale: string;
  suggestedText?: string;
  legalBasis?: LegalReference[];
  impact: string;
}

export interface MissingClause {
  type: ClauseType;
  title: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  suggestedText: string;
  legalBasis: LegalReference[];
  riskIfMissing: string;
}

export interface RedFlag {
  type: 'legal' | 'commercial' | 'operational' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location: TextLocation;
  impact: string;
  recommendation: string;
  legalBasis?: LegalReference[];
}

// Legal Entity Extraction
export interface LegalEntity {
  type: EntityType;
  text: string;
  location: TextLocation;
  confidence: number;
  attributes: EntityAttribute[];
  relationships: EntityRelationship[];
  standardForm?: string;
  variations: string[];
}

export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  COURT = 'court',
  LAW = 'law',
  ARTICLE = 'article',
  CASE = 'case',
  DATE = 'date',
  AMOUNT = 'amount',
  ADDRESS = 'address',
  CONTRACT = 'contract',
  PROCEDURE = 'procedure'
}

export interface EntityAttribute {
  name: string;
  value: string;
  confidence: number;
}

export interface EntityRelationship {
  type: string;
  target: string;
  confidence: number;
}

// Document Summarization
export enum SummaryType {
  EXECUTIVE = 'executive',
  TECHNICAL = 'technical',
  LEGAL = 'legal',
  BULLET_POINTS = 'bullet_points',
  ABSTRACT = 'abstract'
}

export interface DocumentSummary {
  type: SummaryType;
  summary: string;
  keyPoints: string[];
  mainParties: string[];
  importantDates: Date[];
  financialTerms: FinancialTerm[];
  legalImplications: string[];
  actionItems: ActionItem[];
  confidence: number;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
}

export interface FinancialTerm {
  type: 'amount' | 'percentage' | 'rate' | 'fee';
  value: number;
  currency?: string;
  description: string;
  context: string;
}

export interface ActionItem {
  description: string;
  assignee?: string;
  deadline?: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
}

// Translation
export interface TranslationResult {
  originalText: string;
  translatedText: string;
  fromLanguage: 'fr' | 'ar';
  toLanguage: 'fr' | 'ar';
  confidence: number;
  alternatives: string[];
  terminology: TerminologyMapping[];
  warnings: string[];
  preservedElements: PreservedElement[];
  qualityScore: number; // 0-100
}

export interface TerminologyMapping {
  original: string;
  translated: string;
  type: 'legal_term' | 'technical_term' | 'proper_noun';
  confidence: number;
  alternatives: string[];
}

export interface PreservedElement {
  type: 'legal_reference' | 'date' | 'number' | 'name' | 'address';
  text: string;
  location: TextLocation;
  reason: string;
}

// AI Model Configuration
export interface AIModelConfig {
  model: string;
  version: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
  customPrompts: Record<string, string>;
  domainSpecificSettings: Record<LegalDomain, ModelSettings>;
}

export interface ModelSettings {
  temperature: number;
  maxTokens: number;
  specialInstructions: string[];
  terminology: Record<string, string>;
  examples: string[];
}

// AI Service Analytics
export interface AIServiceAnalytics {
  totalRequests: number;
  requestsByType: Record<string, number>;
  averageResponseTime: number;
  successRate: number;
  userSatisfaction: number; // 0-5
  mostUsedFeatures: string[];
  errorTypes: Record<string, number>;
  costAnalysis: CostAnalysis;
  performanceMetrics: PerformanceMetrics;
}

export interface CostAnalysis {
  totalCost: number;
  costByFeature: Record<string, number>;
  averageCostPerRequest: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  projectedMonthlyCost: number;
}

export interface PerformanceMetrics {
  averageAccuracy: number;
  averageConfidence: number;
  userAcceptanceRate: number;
  feedbackScore: number;
  improvementSuggestions: string[];
}