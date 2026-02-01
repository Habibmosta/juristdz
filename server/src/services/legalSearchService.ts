import { db } from '@/database/connection';
import { logger } from '@/utils/logger';
import {
  SearchQuery,
  SearchResult,
  JurisprudenceResult,
  LegalText,
  RelatedCase,
  LegalAnalysis,
  SearchSuggestion,
  SearchConfiguration,
  LegalDomain,
  Jurisdiction,
  SortOption,
  Court,
  CourtType,
  CourtLevel,
  PrecedentValue
} from '@/types/search';

export class LegalSearchService {
  private readonly config: SearchConfiguration = {
    defaultMaxResults: 50,
    searchTimeout: 5000,
    enableFuzzySearch: true,
    enableSynonyms: true,
    boostFactors: {
      title: 3.0,
      summary: 2.0,
      keywords: 2.5,
      fullText: 1.0
    },
    minimumScore: 0.1
  };

  /**
   * Search jurisprudence database
   * Validates: Requirements 3.1, 3.3 - Jurisprudence search with relevance ranking
   */
  async searchJurisprudence(query: SearchQuery): Promise<SearchResult<JurisprudenceResult>> {
    const startTime = Date.now();
    
    try {
      logger.info('Jurisprudence search initiated', { query: query.text, filters: query.filters.length });

      // Build search conditions
      const searchConditions = this.buildSearchConditions(query);
      const orderClause = this.buildOrderClause(query.sortBy || SortOption.RELEVANCE);
      
      // Execute search query
      const searchQuery = `
        SELECT 
          j.*,
          c.name as court_name,
          c.type as court_type,
          c.jurisdiction as court_jurisdiction,
          c.level as court_level,
          c.location as court_location,
          ts_rank(
            setweight(to_tsvector('french', COALESCE(j.title, '')), 'A') ||
            setweight(to_tsvector('french', COALESCE(j.summary, '')), 'B') ||
            setweight(to_tsvector('french', COALESCE(array_to_string(j.keywords, ' '), '')), 'C') ||
            setweight(to_tsvector('french', COALESCE(j.full_text, '')), 'D'),
            plainto_tsquery('french', $1)
          ) as relevance_score
        FROM jurisprudence j
        LEFT JOIN courts c ON j.court_id = c.id
        WHERE ${searchConditions.where}
        ${orderClause}
        LIMIT $${searchConditions.params.length + 1}
        OFFSET $${searchConditions.params.length + 2}
      `;

      const params = [
        query.text,
        ...searchConditions.params,
        query.maxResults || this.config.defaultMaxResults,
        0 // offset for pagination
      ];

      const result = await db.query(searchQuery, params);
      const rows = (result as any).rows;

      // Transform results
      const jurisprudenceResults: JurisprudenceResult[] = rows.map((row: any) => ({
        id: row.id,
        caseNumber: row.case_number,
        title: row.title,
        summary: row.summary,
        fullText: row.full_text,
        court: {
          id: row.court_id,
          name: row.court_name,
          type: row.court_type as CourtType,
          jurisdiction: row.court_jurisdiction as Jurisdiction,
          level: row.court_level as CourtLevel,
          location: row.court_location
        },
        date: new Date(row.date),
        parties: JSON.parse(row.parties || '[]'),
        legalDomain: row.legal_domain as LegalDomain,
        keywords: row.keywords || [],
        citations: JSON.parse(row.citations || '[]'),
        precedentValue: row.precedent_value as PrecedentValue,
        relevanceScore: parseFloat(row.relevance_score || '0'),
        isPublic: row.is_public,
        documentUrl: row.document_url
      }));

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM jurisprudence j
        LEFT JOIN courts c ON j.court_id = c.id
        WHERE ${searchConditions.where}
      `;
      
      const countResult = await db.query(countQuery, [query.text, ...searchConditions.params]);
      const totalCount = parseInt((countResult as any).rows[0].total);

      // Generate suggestions if few results
      let suggestions: SearchSuggestion[] = [];
      if (jurisprudenceResults.length < 5) {
        suggestions = await this.generateSearchSuggestions(query.text);
      }

      const searchTime = Date.now() - startTime;
      
      logger.info('Jurisprudence search completed', { 
        resultsCount: jurisprudenceResults.length, 
        totalCount,
        searchTime 
      });

      return {
        results: jurisprudenceResults,
        totalCount,
        searchTime,
        suggestions,
        query
      };

    } catch (error) {
      logger.error('Jurisprudence search error:', error);
      throw new Error('Search failed');
    }
  }

  /**
   * Search legal texts (codes, laws, regulations)
   * Validates: Requirements 3.2 - Legal text search by keywords and references
   */
  async searchLegalTexts(query: SearchQuery): Promise<SearchResult<LegalText>> {
    const startTime = Date.now();
    
    try {
      logger.info('Legal texts search initiated', { query: query.text });

      const searchConditions = this.buildLegalTextSearchConditions(query);
      const orderClause = this.buildOrderClause(query.sortBy || SortOption.RELEVANCE);

      const searchQuery = `
        SELECT 
          lt.*,
          ts_rank(
            setweight(to_tsvector('french', COALESCE(lt.title, '')), 'A') ||
            setweight(to_tsvector('french', COALESCE(lt.reference, '')), 'B') ||
            setweight(to_tsvector('french', COALESCE(lt.content, '')), 'C'),
            plainto_tsquery('french', $1)
          ) as relevance_score
        FROM legal_texts lt
        WHERE ${searchConditions.where}
        ${orderClause}
        LIMIT $${searchConditions.params.length + 1}
      `;

      const params = [
        query.text,
        ...searchConditions.params,
        query.maxResults || this.config.defaultMaxResults
      ];

      const result = await db.query(searchQuery, params);
      const rows = (result as any).rows;

      const legalTexts: LegalText[] = rows.map((row: any) => ({
        id: row.id,
        type: row.type,
        reference: row.reference,
        title: row.title,
        content: row.content,
        domain: row.domain as LegalDomain,
        publicationDate: new Date(row.publication_date),
        effectiveDate: row.effective_date ? new Date(row.effective_date) : undefined,
        status: row.status,
        amendments: JSON.parse(row.amendments || '[]'),
        relatedTexts: row.related_texts || [],
        joraReference: row.jora_reference
      }));

      const searchTime = Date.now() - startTime;

      return {
        results: legalTexts,
        totalCount: legalTexts.length,
        searchTime,
        query
      };

    } catch (error) {
      logger.error('Legal texts search error:', error);
      throw new Error('Legal texts search failed');
    }
  }

  /**
   * Get related cases for a specific case
   * Validates: Requirements 3.4 - Related case discovery
   */
  async getRelatedCases(caseId: string): Promise<RelatedCase[]> {
    try {
      const query = `
        SELECT 
          j.id,
          j.case_number,
          j.title,
          c.name as court_name,
          j.date,
          rc.relationship_type,
          rc.relevance_score
        FROM jurisprudence j
        JOIN related_cases rc ON (j.id = rc.related_case_id OR j.id = rc.source_case_id)
        JOIN courts c ON j.court_id = c.id
        WHERE (rc.source_case_id = $1 OR rc.related_case_id = $1)
        AND j.id != $1
        ORDER BY rc.relevance_score DESC
        LIMIT 20
      `;

      const result = await db.query(query, [caseId]);
      const rows = (result as any).rows;

      return rows.map((row: any) => ({
        id: row.id,
        caseNumber: row.case_number,
        title: row.title,
        court: row.court_name,
        date: new Date(row.date),
        relationshipType: row.relationship_type,
        relevanceScore: parseFloat(row.relevance_score)
      }));

    } catch (error) {
      logger.error('Get related cases error:', error);
      return [];
    }
  }

  /**
   * Generate search term suggestions
   * Validates: Requirements 3.5 - Alternative term suggestions
   */
  async suggestSearchTerms(partialQuery: string): Promise<string[]> {
    try {
      if (partialQuery.length < 2) {
        return [];
      }

      const query = `
        SELECT DISTINCT term, frequency
        FROM (
          SELECT unnest(keywords) as term, COUNT(*) as frequency
          FROM jurisprudence
          WHERE array_to_string(keywords, ' ') ILIKE $1
          GROUP BY term
          
          UNION ALL
          
          SELECT title as term, 1 as frequency
          FROM legal_texts
          WHERE title ILIKE $1
          
          UNION ALL
          
          SELECT reference as term, 1 as frequency
          FROM legal_texts
          WHERE reference ILIKE $1
        ) suggestions
        WHERE LENGTH(term) > 2
        ORDER BY frequency DESC, term
        LIMIT 10
      `;

      const result = await db.query(query, [`%${partialQuery}%`]);
      const rows = (result as any).rows;

      return rows.map((row: any) => row.term);

    } catch (error) {
      logger.error('Search suggestions error:', error);
      return [];
    }
  }

  /**
   * Analyze legal document for key concepts and references
   * Validates: Requirements 3.1 - Legal document analysis
   */
  async analyzeLegalDocument(document: string): Promise<LegalAnalysis> {
    try {
      // Extract key terms using simple text analysis
      const keyTerms = this.extractKeyTerms(document);
      
      // Find related legal references
      const suggestedCitations = await this.findLegalReferences(document);
      
      // Find related precedents
      const precedents = await this.findRelatedPrecedents(keyTerms);

      return {
        mainIssues: this.extractMainIssues(document),
        legalPrinciples: this.extractLegalPrinciples(document),
        precedents,
        suggestedCitations,
        keyTerms,
        confidence: 0.8 // Simple confidence score
      };

    } catch (error) {
      logger.error('Legal document analysis error:', error);
      throw new Error('Document analysis failed');
    }
  }

  // Private helper methods

  private buildSearchConditions(query: SearchQuery): { where: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 2; // Start from 2 since $1 is the search text

    // Full-text search condition
    conditions.push(`(
      to_tsvector('french', COALESCE(j.title, '')) ||
      to_tsvector('french', COALESCE(j.summary, '')) ||
      to_tsvector('french', COALESCE(array_to_string(j.keywords, ' '), '')) ||
      to_tsvector('french', COALESCE(j.full_text, ''))
    ) @@ plainto_tsquery('french', $1)`);

    // Apply filters
    for (const filter of query.filters) {
      switch (filter.field) {
        case 'domain':
          conditions.push(`j.legal_domain = $${paramIndex}`);
          params.push(filter.value);
          paramIndex++;
          break;
        case 'jurisdiction':
          conditions.push(`c.jurisdiction = $${paramIndex}`);
          params.push(filter.value);
          paramIndex++;
          break;
        case 'court_type':
          conditions.push(`c.type = $${paramIndex}`);
          params.push(filter.value);
          paramIndex++;
          break;
      }
    }

    // Date range filter
    if (query.dateRange) {
      if (query.dateRange.from) {
        conditions.push(`j.date >= $${paramIndex}`);
        params.push(query.dateRange.from);
        paramIndex++;
      }
      if (query.dateRange.to) {
        conditions.push(`j.date <= $${paramIndex}`);
        params.push(query.dateRange.to);
        paramIndex++;
      }
    }

    // Domain filter
    if (query.domain) {
      conditions.push(`j.legal_domain = $${paramIndex}`);
      params.push(query.domain);
      paramIndex++;
    }

    // Jurisdiction filter
    if (query.jurisdiction) {
      conditions.push(`c.jurisdiction = $${paramIndex}`);
      params.push(query.jurisdiction);
      paramIndex++;
    }

    // Only public cases for non-admin users
    conditions.push('j.is_public = true');

    return {
      where: conditions.join(' AND '),
      params
    };
  }

  private buildLegalTextSearchConditions(query: SearchQuery): { where: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 2;

    // Full-text search condition
    conditions.push(`(
      to_tsvector('french', COALESCE(lt.title, '')) ||
      to_tsvector('french', COALESCE(lt.reference, '')) ||
      to_tsvector('french', COALESCE(lt.content, ''))
    ) @@ plainto_tsquery('french', $1)`);

    // Apply filters
    for (const filter of query.filters) {
      switch (filter.field) {
        case 'type':
          conditions.push(`lt.type = $${paramIndex}`);
          params.push(filter.value);
          paramIndex++;
          break;
        case 'domain':
          conditions.push(`lt.domain = $${paramIndex}`);
          params.push(filter.value);
          paramIndex++;
          break;
        case 'status':
          conditions.push(`lt.status = $${paramIndex}`);
          params.push(filter.value);
          paramIndex++;
          break;
      }
    }

    // Only active texts
    conditions.push('lt.status = \'active\'');

    return {
      where: conditions.join(' AND '),
      params
    };
  }

  private buildOrderClause(sortBy: SortOption): string {
    switch (sortBy) {
      case SortOption.RELEVANCE:
        return 'ORDER BY relevance_score DESC, date DESC';
      case SortOption.DATE_DESC:
        return 'ORDER BY date DESC';
      case SortOption.DATE_ASC:
        return 'ORDER BY date ASC';
      case SortOption.JURISDICTION:
        return 'ORDER BY court_jurisdiction, date DESC';
      default:
        return 'ORDER BY relevance_score DESC';
    }
  }

  private async generateSearchSuggestions(searchText: string): Promise<SearchSuggestion[]> {
    try {
      // Generate suggestions based on similar terms in the database
      const query = `
        SELECT DISTINCT term, COUNT(*) as frequency
        FROM (
          SELECT unnest(keywords) as term
          FROM jurisprudence
          WHERE array_to_string(keywords, ' ') % $1
        ) similar_terms
        GROUP BY term
        ORDER BY frequency DESC
        LIMIT 5
      `;

      const result = await db.query(query, [searchText]);
      const rows = (result as any).rows;

      return rows.map((row: any) => ({
        term: row.term,
        type: 'keyword' as const,
        frequency: parseInt(row.frequency),
        context: 'Similar legal terms'
      }));

    } catch (error) {
      logger.error('Generate suggestions error:', error);
      return [];
    }
  }

  private extractKeyTerms(document: string): string[] {
    // Simple keyword extraction - in production, use NLP libraries
    const legalTerms = [
      'contrat', 'obligation', 'responsabilité', 'dommage', 'préjudice',
      'nullité', 'résolution', 'résiliation', 'force majeure', 'faute',
      'prescription', 'délai', 'procédure', 'jugement', 'arrêt',
      'cassation', 'appel', 'première instance', 'compétence', 'juridiction'
    ];

    const words = document.toLowerCase().split(/\W+/);
    return legalTerms.filter(term => words.includes(term));
  }

  private extractMainIssues(document: string): string[] {
    // Simple issue extraction - in production, use NLP
    const issuePatterns = [
      /question de (.*?)(?:\.|,|;)/gi,
      /problème de (.*?)(?:\.|,|;)/gi,
      /litige concernant (.*?)(?:\.|,|;)/gi
    ];

    const issues: string[] = [];
    for (const pattern of issuePatterns) {
      const matches = document.match(pattern);
      if (matches) {
        issues.push(...matches.map(match => match.trim()));
      }
    }

    return issues.slice(0, 5); // Limit to 5 main issues
  }

  private extractLegalPrinciples(document: string): string[] {
    // Extract legal principles mentioned in the document
    const principlePatterns = [
      /principe de (.*?)(?:\.|,|;)/gi,
      /règle de (.*?)(?:\.|,|;)/gi,
      /selon lequel (.*?)(?:\.|,|;)/gi
    ];

    const principles: string[] = [];
    for (const pattern of principlePatterns) {
      const matches = document.match(pattern);
      if (matches) {
        principles.push(...matches.map(match => match.trim()));
      }
    }

    return principles.slice(0, 5);
  }

  private async findLegalReferences(document: string): Promise<any[]> {
    // Find legal references in the document
    const referencePatterns = [
      /article (\d+)/gi,
      /loi n°\s*(\d{2}-\d{2})/gi,
      /décret n°\s*(\d{2}-\d{3})/gi
    ];

    const references: any[] = [];
    for (const pattern of referencePatterns) {
      const matches = document.match(pattern);
      if (matches) {
        references.push(...matches.map(match => ({
          type: 'law',
          reference: match.trim(),
          title: `Référence légale: ${match.trim()}`
        })));
      }
    }

    return references.slice(0, 10);
  }

  private async findRelatedPrecedents(keyTerms: string[]): Promise<RelatedCase[]> {
    if (keyTerms.length === 0) return [];

    try {
      const query = `
        SELECT j.id, j.case_number, j.title, c.name as court_name, j.date
        FROM jurisprudence j
        JOIN courts c ON j.court_id = c.id
        WHERE j.keywords && $1
        ORDER BY array_length(j.keywords & $1, 1) DESC
        LIMIT 5
      `;

      const result = await db.query(query, [keyTerms]);
      const rows = (result as any).rows;

      return rows.map((row: any) => ({
        id: row.id,
        caseNumber: row.case_number,
        title: row.title,
        court: row.court_name,
        date: new Date(row.date),
        relationshipType: 'cited_by' as const,
        relevanceScore: 0.7
      }));

    } catch (error) {
      logger.error('Find related precedents error:', error);
      return [];
    }
  }
}

export const legalSearchService = new LegalSearchService();