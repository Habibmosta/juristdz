/**
 * Search types for jurisprudence and legal text search
 */

export type LegalDomain =
  | 'civil'
  | 'penal'
  | 'commercial'
  | 'administratif'
  | 'travail'
  | 'famille'
  | 'immobilier'
  | 'fiscal'
  | 'constitutionnel'
  | 'international';

export type Jurisdiction =
  | 'cour_supreme'
  | 'conseil_etat'
  | 'tribunal_administratif'
  | 'cour_appel'
  | 'tribunal'
  | 'tribunal_commerce';

export type SortOption = 'relevance' | 'date_desc' | 'date_asc' | 'court';

export type PrecedentValue = 'binding' | 'persuasive' | 'informative';

export interface SearchFilter {
  dateFrom?: string;
  dateTo?: string;
  domain?: LegalDomain;
  jurisdiction?: Jurisdiction;
  wilaya?: string;
  keywords?: string[];
}

export interface SearchQuery {
  text: string;
  type?: 'jurisprudence' | 'legal_texts' | 'all';
  filters?: SearchFilter;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface SearchResult<T> {
  query: SearchQuery;
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  took?: number;
}

export interface Court {
  id: string;
  name: string;
  jurisdiction: Jurisdiction;
  wilaya?: string;
}

export interface Party {
  name: string;
  role: 'plaintiff' | 'defendant' | 'appellant' | 'respondent';
}

export interface Citation {
  reference: string;
  text?: string;
  url?: string;
}

export interface JurisprudenceResult {
  id: string;
  caseNumber: string;
  date: string;
  court: Court;
  legalDomain: LegalDomain;
  parties?: Party[];
  summary?: string;
  fullText?: string;
  keywords?: string[];
  citations?: Citation[];
  precedentValue?: PrecedentValue;
  relevanceScore?: number;
  documentUrl?: string;
}

export interface LegalText {
  id: string;
  reference: string;
  title: string;
  domain: LegalDomain;
  publicationDate: string;
  content: string;
  joraReference?: string;
  url?: string;
}

export interface RelatedCase {
  id: string;
  caseNumber: string;
  date: string;
  summary: string;
  relevance: number;
}

export interface LegalAnalysis {
  caseId: string;
  summary: string;
  keyPoints: string[];
  relatedCases: RelatedCase[];
  applicableLaw: string[];
}
