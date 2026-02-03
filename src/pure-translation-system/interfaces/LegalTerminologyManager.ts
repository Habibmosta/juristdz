/**
 * Legal Terminology Manager Interface
 * 
 * Comprehensive legal terminology management system for French-Arabic
 * legal term mappings with Algerian legal standards compliance.
 */

import {
  LegalTermTranslation,
  TerminologyValidation,
  LegalDictionary,
  LegalDomain,
  Language,
  LegalContext,
  LegalTermEntry,
  TerminologyUpdate
} from '../types';

export interface ILegalTerminologyManager {
  /**
   * Translate legal term with context awareness
   * @param term Legal term to translate
   * @param sourceLang Source language of the term
   * @param targetLang Target language for translation
   * @returns Legal term translation with alternatives
   */
  translateLegalTerm(
    term: string, 
    sourceLang: Language, 
    targetLang: Language
  ): Promise<LegalTermTranslation>;

  /**
   * Validate legal terminology consistency in text
   * @param text Text to validate for terminology consistency
   * @param targetLang Target language for validation
   * @returns Terminology validation result
   */
  validateLegalTerminology(text: string, targetLang: Language): Promise<TerminologyValidation>;

  /**
   * Get legal dictionary for specific domain
   * @param domain Legal domain for dictionary
   * @returns Domain-specific legal dictionary
   */
  getLegalDictionary(domain: LegalDomain): Promise<LegalDictionary>;

  /**
   * Update terminology with new entries or corrections
   * @param updates Array of terminology updates
   */
  updateTerminology(updates: TerminologyUpdate[]): Promise<void>;

  /**
   * Get Algerian legal standards and terminology guidelines
   * @returns Algerian legal standards reference
   */
  getAlgerianLegalStandards(): Promise<LegalStandards>;

  /**
   * Search for legal terms with fuzzy matching
   * @param query Search query for legal terms
   * @param domain Optional legal domain filter
   * @param language Optional language filter
   * @returns Array of matching legal terms
   */
  searchLegalTerms(
    query: string, 
    domain?: LegalDomain, 
    language?: Language
  ): Promise<LegalTermSearchResult[]>;

  /**
   * Validate term usage in specific legal context
   * @param term Legal term to validate
   * @param context Legal context for validation
   * @returns Context validation result
   */
  validateTermContext(term: string, context: LegalContext): Promise<TermContextValidation>;

  /**
   * Get term suggestions for improved terminology
   * @param text Text to analyze for terminology improvements
   * @param targetLang Target language
   * @returns Array of terminology suggestions
   */
  getTerminologySuggestions(text: string, targetLang: Language): Promise<TerminologySuggestion[]>;

  /**
   * Add custom legal terms to dictionary
   * @param entries Array of custom legal term entries
   * @param domain Legal domain for the terms
   */
  addCustomTerms(entries: LegalTermEntry[], domain: LegalDomain): Promise<void>;

  /**
   * Get terminology statistics and usage metrics
   * @returns Terminology usage statistics
   */
  getTerminologyStats(): Promise<TerminologyStats>;
}

export interface LegalStandards {
  jurisdiction: string;
  authority: string;
  version: string;
  lastUpdated: Date;
  terminologyGuidelines: TerminologyGuideline[];
  officialDictionaries: OfficialDictionary[];
  legalReferences: LegalReference[];
}

export interface TerminologyGuideline {
  domain: LegalDomain;
  guideline: string;
  examples: string[];
  authority: string;
  lastUpdated: Date;
}

export interface OfficialDictionary {
  name: string;
  authority: string;
  url?: string;
  version: string;
  domains: LegalDomain[];
  lastUpdated: Date;
}

export interface LegalReference {
  type: string;
  citation: string;
  title: string;
  authority: string;
  url?: string;
  relevantDomains: LegalDomain[];
}

export interface LegalTermSearchResult {
  term: LegalTermEntry;
  relevanceScore: number;
  matchType: MatchType;
  context: LegalContext;
}

export enum MatchType {
  EXACT = 'exact',
  PARTIAL = 'partial',
  FUZZY = 'fuzzy',
  SEMANTIC = 'semantic',
  SYNONYM = 'synonym'
}

export interface TermContextValidation {
  isValid: boolean;
  contextScore: number;
  appropriateContexts: LegalContext[];
  inappropriateReasons: string[];
  suggestions: string[];
}

export interface TerminologySuggestion {
  originalTerm: string;
  suggestedTerm: string;
  reason: string;
  confidence: number;
  context: LegalContext;
  impact: ImpactLevel;
}

export enum ImpactLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface TerminologyUpdate {
  action: UpdateAction;
  term: string;
  newTranslation?: string;
  domain: LegalDomain;
  context?: LegalContext;
  source: string;
  confidence: number;
}

export enum UpdateAction {
  ADD = 'add',
  UPDATE = 'update',
  DELETE = 'delete',
  VERIFY = 'verify',
  DEPRECATE = 'deprecate'
}

export interface TerminologyStats {
  totalTerms: number;
  termsByDomain: Map<LegalDomain, number>;
  termsByLanguage: Map<Language, number>;
  recentUpdates: number;
  validationAccuracy: number;
  usageFrequency: Map<string, number>;
  lastSyncDate: Date;
}