export interface SearchQuery {
  text: string;
  filters: SearchFilter[];
  jurisdiction?: Jurisdiction;
  dateRange?: DateRange;
  domain?: LegalDomain;
  maxResults: number;
  sortBy?: SortOption;
  language?: 'fr' | 'ar';
}

export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'range';
  value: any;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export enum Jurisdiction {
  SUPREME_COURT = 'supreme_court',
  COUNCIL_OF_STATE = 'council_of_state',
  COURT_OF_CASSATION = 'court_of_cassation',
  APPEAL_COURT = 'appeal_court',
  FIRST_INSTANCE = 'first_instance',
  COMMERCIAL_COURT = 'commercial_court',
  ADMINISTRATIVE_COURT = 'administrative_court',
  CRIMINAL_COURT = 'criminal_court'
}

export enum LegalDomain {
  CIVIL = 'civil',
  CRIMINAL = 'criminal',
  COMMERCIAL = 'commercial',
  ADMINISTRATIVE = 'administrative',
  FAMILY = 'family',
  LABOR = 'labor',
  TAX = 'tax',
  CONSTITUTIONAL = 'constitutional',
  INTERNATIONAL = 'international'
}

export enum SortOption {
  RELEVANCE = 'relevance',
  DATE_DESC = 'date_desc',
  DATE_ASC = 'date_asc',
  JURISDICTION = 'jurisdiction'
}

export interface JurisprudenceResult {
  id: string;
  caseNumber: string;
  title: string;
  summary: string;
  fullText: string;
  court: Court;
  date: Date;
  parties: Party[];
  legalDomain: LegalDomain;
  keywords: string[];
  citations: LegalReference[];
  precedentValue: PrecedentValue;
  relevanceScore: number;
  isPublic: boolean;
  documentUrl?: string;
}

export interface Court {
  id: string;
  name: string;
  type: CourtType;
  jurisdiction: Jurisdiction;
  level: CourtLevel;
  location: string;
  region?: string;
}

export enum CourtType {
  CIVIL = 'civil',
  CRIMINAL = 'criminal',
  COMMERCIAL = 'commercial',
  ADMINISTRATIVE = 'administrative',
  SUPREME = 'supreme',
  CONSTITUTIONAL = 'constitutional'
}

export enum CourtLevel {
  FIRST_INSTANCE = 'first_instance',
  APPEAL = 'appeal',
  SUPREME = 'supreme'
}

export interface Party {
  name: string;
  type: 'plaintiff' | 'defendant' | 'appellant' | 'respondent' | 'third_party';
  role?: string;
}

export interface LegalReference {
  type: 'law' | 'decree' | 'regulation' | 'jurisprudence' | 'doctrine';
  reference: string;
  title?: string;
  article?: string;
  url?: string;
}

export enum PrecedentValue {
  BINDING = 'binding',
  PERSUASIVE = 'persuasive',
  INFORMATIVE = 'informative'
}

export interface LegalText {
  id: string;
  type: 'code' | 'law' | 'decree' | 'regulation' | 'ordinance';
  reference: string;
  title: string;
  content: string;
  domain: LegalDomain;
  publicationDate: Date;
  effectiveDate?: Date;
  status: 'active' | 'repealed' | 'amended';
  amendments?: Amendment[];
  relatedTexts: string[];
  joraReference?: string;
}

export interface Amendment {
  date: Date;
  reference: string;
  description: string;
  type: 'modification' | 'addition' | 'repeal';
}

export interface SearchResult<T> {
  results: T[];
  totalCount: number;
  searchTime: number;
  suggestions?: SearchSuggestion[];
  facets?: SearchFacet[];
  query: SearchQuery;
}

export interface SearchSuggestion {
  term: string;
  type: 'keyword' | 'legal_reference' | 'case_name' | 'court';
  frequency: number;
  context?: string;
}

export interface SearchFacet {
  field: string;
  values: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
  selected: boolean;
}

export interface LegalAnalysis {
  mainIssues: string[];
  legalPrinciples: string[];
  precedents: RelatedCase[];
  suggestedCitations: LegalReference[];
  keyTerms: string[];
  confidence: number;
}

export interface RelatedCase {
  id: string;
  caseNumber: string;
  title: string;
  court: string;
  date: Date;
  relationshipType: 'cited_by' | 'cites' | 'overruled_by' | 'overrules' | 'distinguished' | 'followed';
  relevanceScore: number;
}