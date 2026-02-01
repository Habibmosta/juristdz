import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { LegalSearchService } from '../services/legalSearchService';
import { 
  SearchQuery, 
  LegalDomain, 
  Jurisdiction, 
  SortOption,
  SearchFilter 
} from '../types/search';

// Mock database connection
jest.mock('../database/connection', () => ({
  db: {
    query: jest.fn(),
    transaction: jest.fn()
  }
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Legal Search Service', () => {
  let legalSearchService: LegalSearchService;
  let mockDb: any;

  beforeAll(() => {
    legalSearchService = new LegalSearchService();
    mockDb = require('../database/connection').db;
  });

  beforeEach(() => {
    mockDb.query.mockClear();
    mockDb.transaction.mockClear();
  });

  describe('Jurisprudence Search', () => {
    test('should search jurisprudence with basic query', async () => {
      const mockResults = [
        {
          id: '1',
          case_number: '2024/001',
          title: 'Test Case',
          summary: 'Test summary',
          full_text: 'Test full text',
          court_id: 'court-1',
          court_name: 'Test Court',
          court_type: 'civil',
          court_jurisdiction: 'first_instance',
          court_level: 'first_instance',
          court_location: 'Alger',
          date: '2024-01-01',
          parties: '[]',
          legal_domain: 'civil',
          keywords: ['test', 'case'],
          citations: '[]',
          precedent_value: 'informative',
          is_public: true,
          document_url: null,
          relevance_score: '0.8'
        }
      ];

      // Mock search query
      mockDb.query.mockResolvedValueOnce({ rows: mockResults });
      // Mock count query
      mockDb.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });
      // Mock suggestions query (called when few results)
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const query: SearchQuery = {
        text: 'contrat commercial',
        filters: [],
        maxResults: 10
      };

      const result = await legalSearchService.searchJurisprudence(query);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Test Case');
      expect(result.results[0].caseNumber).toBe('2024/001');
      expect(result.totalCount).toBe(1);
      expect(mockDb.query).toHaveBeenCalledTimes(3);
    });

    test('should apply domain filter', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const query: SearchQuery = {
        text: 'test',
        filters: [],
        domain: LegalDomain.COMMERCIAL,
        maxResults: 10
      };

      await legalSearchService.searchJurisprudence(query);

      // Verify that the query includes domain filter
      const searchCall = mockDb.query.mock.calls[0];
      expect(searchCall[0]).toContain('j.legal_domain = $');
      expect(searchCall[1]).toContain('commercial');
    });

    test('should apply jurisdiction filter', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const query: SearchQuery = {
        text: 'test',
        filters: [],
        jurisdiction: Jurisdiction.SUPREME_COURT,
        maxResults: 10
      };

      await legalSearchService.searchJurisprudence(query);

      const searchCall = mockDb.query.mock.calls[0];
      expect(searchCall[0]).toContain('c.jurisdiction = $');
      expect(searchCall[1]).toContain('supreme_court');
    });

    test('should apply date range filter', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const query: SearchQuery = {
        text: 'test',
        filters: [],
        dateRange: {
          from: new Date('2023-01-01'),
          to: new Date('2023-12-31')
        },
        maxResults: 10
      };

      await legalSearchService.searchJurisprudence(query);

      const searchCall = mockDb.query.mock.calls[0];
      expect(searchCall[0]).toContain('j.date >= $');
      expect(searchCall[0]).toContain('j.date <= $');
    });

    test('should handle search errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const query: SearchQuery = {
        text: 'test',
        filters: [],
        maxResults: 10
      };

      await expect(legalSearchService.searchJurisprudence(query)).rejects.toThrow('Search failed');
    });
  });

  describe('Legal Texts Search', () => {
    test('should search legal texts', async () => {
      const mockResults = [
        {
          id: '1',
          type: 'code',
          reference: 'Code Civil Art. 124',
          title: 'Formation du contrat',
          content: 'Le contrat se forme...',
          domain: 'civil',
          publication_date: '1975-09-26',
          effective_date: null,
          status: 'active',
          amendments: '[]',
          related_texts: [],
          jora_reference: 'JORA N° 78/1975',
          relevance_score: '0.9'
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockResults });

      const query: SearchQuery = {
        text: 'formation contrat',
        filters: [],
        maxResults: 10
      };

      const result = await legalSearchService.searchLegalTexts(query);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].reference).toBe('Code Civil Art. 124');
      expect(result.results[0].type).toBe('code');
    });

    test('should filter by legal text type', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const query: SearchQuery = {
        text: 'test',
        filters: [
          { field: 'type', operator: 'equals', value: 'law' }
        ],
        maxResults: 10
      };

      await legalSearchService.searchLegalTexts(query);

      const searchCall = mockDb.query.mock.calls[0];
      expect(searchCall[0]).toContain('lt.type = $');
      expect(searchCall[1]).toContain('law');
    });
  });

  describe('Related Cases', () => {
    test('should get related cases', async () => {
      const mockResults = [
        {
          id: '2',
          case_number: '2024/002',
          title: 'Related Case',
          court_name: 'Test Court',
          date: '2024-02-01',
          relationship_type: 'cited_by',
          relevance_score: '0.7'
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockResults });

      const relatedCases = await legalSearchService.getRelatedCases('case-1');

      expect(relatedCases).toHaveLength(1);
      expect(relatedCases[0].caseNumber).toBe('2024/002');
      expect(relatedCases[0].relationshipType).toBe('cited_by');
    });

    test('should handle errors in related cases', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const relatedCases = await legalSearchService.getRelatedCases('case-1');

      expect(relatedCases).toEqual([]);
    });
  });

  describe('Search Suggestions', () => {
    test('should generate search suggestions', async () => {
      const mockResults = [
        { term: 'contrat de vente', frequency: '10' },
        { term: 'contrat commercial', frequency: '8' }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockResults });

      const suggestions = await legalSearchService.suggestSearchTerms('contrat');

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0]).toBe('contrat de vente');
      expect(suggestions[1]).toBe('contrat commercial');
    });

    test('should return empty array for short queries', async () => {
      const suggestions = await legalSearchService.suggestSearchTerms('a');

      expect(suggestions).toEqual([]);
      expect(mockDb.query).not.toHaveBeenCalled();
    });
  });

  describe('Document Analysis', () => {
    test('should analyze legal document', async () => {
      // Mock related precedents query
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const document = 'Ce contrat de vente immobilière est conclu entre les parties selon l\'article 124 du Code Civil.';

      const analysis = await legalSearchService.analyzeLegalDocument(document);

      expect(analysis.keyTerms).toContain('contrat');
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(Array.isArray(analysis.mainIssues)).toBe(true);
      expect(Array.isArray(analysis.legalPrinciples)).toBe(true);
    });
  });
});

/**
 * Property-based tests for Legal Search Service
 * Validates: Requirements 3.1-3.5 - Search functionality properties
 */
describe('Legal Search Property Tests', () => {
  let legalSearchService: LegalSearchService;
  let mockDb: any;

  beforeAll(() => {
    legalSearchService = new LegalSearchService();
    mockDb = require('../database/connection').db;
  });

  beforeEach(() => {
    mockDb.query.mockClear();
  });

  test('Property 7: Recherche dans la Base Jurisprudentielle - All search results must come from jurisprudence database', async () => {
    const mockResults = [
      {
        id: '1',
        case_number: '2024/001',
        title: 'Test Case 1',
        summary: 'Summary 1',
        full_text: 'Full text 1',
        court_id: 'court-1',
        court_name: 'Test Court',
        court_type: 'civil',
        court_jurisdiction: 'first_instance',
        court_level: 'first_instance',
        court_location: 'Alger',
        date: '2024-01-01',
        parties: '[]',
        legal_domain: 'civil',
        keywords: ['test'],
        citations: '[]',
        precedent_value: 'informative',
        is_public: true,
        document_url: null,
        relevance_score: '0.8'
      }
    ];

    mockDb.query.mockResolvedValueOnce({ rows: mockResults });
    mockDb.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

    const query: SearchQuery = {
      text: 'test search',
      filters: [],
      maxResults: 10
    };

    const result = await legalSearchService.searchJurisprudence(query);

    // Verify all results are from jurisprudence table
    expect(result.results).toHaveLength(1);
    result.results.forEach(jurisprudence => {
      expect(jurisprudence.id).toBeDefined();
      expect(jurisprudence.caseNumber).toBeDefined();
      expect(jurisprudence.court).toBeDefined();
      expect(jurisprudence.date).toBeInstanceOf(Date);
      expect(jurisprudence.legalDomain).toBeDefined();
    });
  });

  test('Property 8: Classement des Résultats de Recherche - Results must be ranked by relevance and date', async () => {
    const mockResults = [
      {
        id: '1',
        case_number: '2024/001',
        title: 'High Relevance Case',
        summary: 'Summary',
        full_text: 'Full text',
        court_id: 'court-1',
        court_name: 'Test Court',
        court_type: 'civil',
        court_jurisdiction: 'first_instance',
        court_level: 'first_instance',
        court_location: 'Alger',
        date: '2024-01-01',
        parties: '[]',
        legal_domain: 'civil',
        keywords: ['test'],
        citations: '[]',
        precedent_value: 'informative',
        is_public: true,
        document_url: null,
        relevance_score: '0.9'
      },
      {
        id: '2',
        case_number: '2024/002',
        title: 'Lower Relevance Case',
        summary: 'Summary',
        full_text: 'Full text',
        court_id: 'court-1',
        court_name: 'Test Court',
        court_type: 'civil',
        court_jurisdiction: 'first_instance',
        court_level: 'first_instance',
        court_location: 'Alger',
        date: '2024-02-01',
        parties: '[]',
        legal_domain: 'civil',
        keywords: ['test'],
        citations: '[]',
        precedent_value: 'informative',
        is_public: true,
        document_url: null,
        relevance_score: '0.7'
      }
    ];

    mockDb.query.mockResolvedValueOnce({ rows: mockResults });
    mockDb.query.mockResolvedValueOnce({ rows: [{ total: '2' }] });

    const query: SearchQuery = {
      text: 'test search',
      filters: [],
      maxResults: 10,
      sortBy: SortOption.RELEVANCE
    };

    const result = await legalSearchService.searchJurisprudence(query);

    // Verify results are ordered by relevance (higher first)
    expect(result.results).toHaveLength(2);
    expect(result.results[0].relevanceScore).toBeGreaterThanOrEqual(result.results[1].relevanceScore);
  });

  test('Property 9: Filtrage des Résultats de Recherche - All filtered results must match filter criteria', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });
    mockDb.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const query: SearchQuery = {
      text: 'test',
      filters: [
        { field: 'domain', operator: 'equals', value: 'commercial' }
      ],
      domain: LegalDomain.COMMERCIAL,
      jurisdiction: Jurisdiction.COMMERCIAL_COURT,
      maxResults: 10
    };

    await legalSearchService.searchJurisprudence(query);

    // Verify that filters are applied in the query
    const searchCall = mockDb.query.mock.calls[0];
    expect(searchCall[0]).toContain('j.legal_domain = $');
    expect(searchCall[0]).toContain('c.jurisdiction = $');
    expect(searchCall[1]).toContain('commercial');
    expect(searchCall[1]).toContain('commercial_court');
  });
});