import { 
  SearchQuery, 
  SearchResult, 
  JurisprudenceResult, 
  LegalText, 
  RelatedCase,
  LegalAnalysis 
} from '../types/search';

class SearchService {
  private baseUrl = '/api/search';

  /**
   * Search jurisprudence database
   * Validates: Requirements 3.1, 3.3 - Jurisprudence search with relevance ranking
   */
  async searchJurisprudence(query: SearchQuery): Promise<SearchResult<JurisprudenceResult>> {
    try {
      const response = await fetch(`${this.baseUrl}/jurisprudence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform date strings to Date objects
      data.data.results = data.data.results.map((result: any) => ({
        ...result,
        date: new Date(result.date)
      }));

      return data.data;
    } catch (error) {
      console.error('Jurisprudence search error:', error);
      throw error;
    }
  }

  /**
   * Search legal texts (codes, laws, regulations)
   * Validates: Requirements 3.2 - Legal text search by keywords and references
   */
  async searchLegalTexts(query: SearchQuery): Promise<SearchResult<LegalText>> {
    try {
      const response = await fetch(`${this.baseUrl}/legal-texts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`Legal texts search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform date strings to Date objects
      data.data.results = data.data.results.map((result: any) => ({
        ...result,
        publicationDate: new Date(result.publicationDate),
        effectiveDate: result.effectiveDate ? new Date(result.effectiveDate) : undefined
      }));

      return data.data;
    } catch (error) {
      console.error('Legal texts search error:', error);
      throw error;
    }
  }

  /**
   * Get related cases for a specific case
   * Validates: Requirements 3.4 - Related case discovery
   */
  async getRelatedCases(caseId: string): Promise<RelatedCase[]> {
    try {
      const response = await fetch(`${this.baseUrl}/related-cases/${caseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get related cases: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform date strings to Date objects
      return data.data.map((relatedCase: any) => ({
        ...relatedCase,
        date: new Date(relatedCase.date)
      }));
    } catch (error) {
      console.error('Related cases error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions for autocomplete
   * Validates: Requirements 3.5 - Alternative term suggestions
   */
  async getSearchSuggestions(partialQuery: string): Promise<string[]> {
    try {
      if (partialQuery.length < 2) {
        return [];
      }

      const response = await fetch(`${this.baseUrl}/suggestions?q=${encodeURIComponent(partialQuery)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get suggestions: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  /**
   * Analyze legal document for key concepts and references
   * Validates: Requirements 3.1 - Legal document analysis
   */
  async analyzeLegalDocument(document: string): Promise<LegalAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ document })
      });

      if (!response.ok) {
        throw new Error(`Document analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform date strings to Date objects in precedents
      data.data.precedents = data.data.precedents.map((precedent: any) => ({
        ...precedent,
        date: new Date(precedent.date)
      }));

      return data.data;
    } catch (error) {
      console.error('Document analysis error:', error);
      throw error;
    }
  }

  /**
   * Get available search filters and options
   */
  async getSearchFilters(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/filters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get filters: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Get filters error:', error);
      throw error;
    }
  }

  private getAuthToken(): string {
    // Get token from localStorage or context
    return localStorage.getItem('authToken') || '';
  }
}

export const searchService = new SearchService();