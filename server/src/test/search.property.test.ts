import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import * as fc from 'fast-check';
import { legalSearchService } from '../services/legalSearchService';
import { SearchQuery, JurisprudenceResult, LegalText, SearchFilters } from '../types/search';
import { setupTestDatabase, cleanupTestDatabase } from './setup';

/**
 * Property-Based Tests for Legal Search Service
 * 
 * These tests validate the correctness properties defined in the design document:
 * - Property 7: Search in Jurisprudence Database
 * - Property 8: Search Results Ranking
 * - Property 9: Search Results Filtering
 * 
 * **Validates: Requirements 3.1-3.4**
 */

describe('Legal Search Service - Property-Based Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  /**
   * Property 7: Search in Jurisprudence Database
   * For any search query by an authorized user, results must come exclusively 
   * from the Algerian jurisprudence database and respect specified search criteria
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Property 7: Recherche dans la Base Jurisprudentielle', () => {
    test('All search results must come from Algerian jurisprudence database', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid search queries
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 200 }),
            filters: fc.record({
              domain: fc.option(fc.constantFrom('civil', 'commercial', 'penal', 'administratif')),
              court: fc.option(fc.constantFrom('cour_supreme', 'conseil_etat', 'cour_appel')),
              dateFrom: fc.option(fc.date({ min: new Date('2000-01-01'), max: new Date() })),
              dateTo: fc.option(fc.date({ min: new Date('2000-01-01'), max: new Date() }))
            }, { requiredKeys: [] }),
            limit: fc.integer({ min: 1, max: 50 }),
            offset: fc.integer({ min: 0, max: 100 })
          }),
          async (query: SearchQuery) => {
            try {
              const results = await legalSearchService.searchJurisprudence(query);
              
              // Property: All results must be from Algerian jurisprudence
              for (const result of results.results) {
                expect(result).toHaveProperty('id');
                expect(result).toHaveProperty('title');
                expect(result).toHaveProperty('court');
                expect(result).toHaveProperty('date');
                expect(result).toHaveProperty('legalDomain');
                
                // Verify court is Algerian
                expect(['cour_supreme', 'conseil_etat', 'cour_appel', 'tribunal_premiere_instance'])
                  .toContain(result.court.type);
                
                // Verify legal domain is valid
                expect(['civil', 'commercial', 'penal', 'administratif', 'famille'])
                  .toContain(result.legalDomain);
              }
              
              // Property: Results respect search criteria
              if (query.filters?.domain) {
                for (const result of results.results) {
                  expect(result.legalDomain).toBe(query.filters.domain);
                }
              }
              
              if (query.filters?.court) {
                for (const result of results.results) {
                  expect(result.court.type).toBe(query.filters.court);
                }
              }
              
              if (query.filters?.dateFrom) {
                for (const result of results.results) {
                  expect(result.date.getTime()).toBeGreaterThanOrEqual(query.filters.dateFrom.getTime());
                }
              }
              
              if (query.filters?.dateTo) {
                for (const result of results.results) {
                  expect(result.date.getTime()).toBeLessThanOrEqual(query.filters.dateTo.getTime());
                }
              }
              
            } catch (error) {
              // Allow for expected errors (empty results, invalid queries)
              if (error instanceof Error && !error.message.includes('No results found')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 50, timeout: 10000 }
      );
    });

    test('Search text must be present in results when specified', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            text: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
            filters: fc.record({}, { requiredKeys: [] }),
            limit: fc.integer({ min: 1, max: 20 })
          }),
          async (query: SearchQuery) => {
            try {
              const results = await legalSearchService.searchJurisprudence(query);
              
              if (results.results.length > 0) {
                const searchTerms = query.text.toLowerCase().split(/\s+/).filter(term => term.length > 2);
                
                // Property: At least one search term should appear in each result
                for (const result of results.results) {
                  const resultText = (
                    result.title + ' ' + 
                    (result.summary || '') + ' ' + 
                    (result.fullText || '') + ' ' +
                    (result.keywords?.join(' ') || '')
                  ).toLowerCase();
                  
                  const hasSearchTerm = searchTerms.some(term => resultText.includes(term));
                  expect(hasSearchTerm).toBe(true);
                }
              }
            } catch (error) {
              // Allow for expected errors
              if (error instanceof Error && !error.message.includes('No results found')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  /**
   * Property 8: Search Results Ranking
   * For any non-empty search result set, results must be ranked by decreasing relevance
   * and, for equal relevance, by decreasing date
   * **Validates: Requirements 3.3**
   */
  describe('Property 8: Classement des Résultats de Recherche', () => {
    test('Results must be ordered by relevance score (descending)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            text: fc.string({ minLength: 3, maxLength: 100 }),
            filters: fc.record({}, { requiredKeys: [] }),
            limit: fc.integer({ min: 5, max: 20 })
          }),
          async (query: SearchQuery) => {
            try {
              const results = await legalSearchService.searchJurisprudence(query);
              
              if (results.results.length > 1) {
                // Property: Results ordered by relevance score (descending)
                for (let i = 0; i < results.results.length - 1; i++) {
                  const current = results.results[i];
                  const next = results.results[i + 1];
                  
                  if (current.relevanceScore !== undefined && next.relevanceScore !== undefined) {
                    expect(current.relevanceScore).toBeGreaterThanOrEqual(next.relevanceScore);
                  }
                }
              }
            } catch (error) {
              if (error instanceof Error && !error.message.includes('No results found')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });

    test('Results with equal relevance must be ordered by date (descending)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            text: fc.string({ minLength: 3, maxLength: 100 }),
            filters: fc.record({}, { requiredKeys: [] }),
            limit: fc.integer({ min: 5, max: 20 })
          }),
          async (query: SearchQuery) => {
            try {
              const results = await legalSearchService.searchJurisprudence(query);
              
              if (results.results.length > 1) {
                // Property: For equal relevance, order by date (descending)
                for (let i = 0; i < results.results.length - 1; i++) {
                  const current = results.results[i];
                  const next = results.results[i + 1];
                  
                  // If relevance scores are equal (or very close), check date ordering
                  if (current.relevanceScore !== undefined && next.relevanceScore !== undefined) {
                    const relevanceDiff = Math.abs(current.relevanceScore - next.relevanceScore);
                    if (relevanceDiff < 0.01) { // Consider equal if difference < 1%
                      expect(current.date.getTime()).toBeGreaterThanOrEqual(next.date.getTime());
                    }
                  }
                }
              }
            } catch (error) {
              if (error instanceof Error && !error.message.includes('No results found')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });
  });

  /**
   * Property 9: Search Results Filtering
   * For any applied filter (jurisdiction, decision type, period), all returned results
   * must satisfy exactly the filter criteria
   * **Validates: Requirements 3.4**
   */
  describe('Property 9: Filtrage des Résultats de Recherche', () => {
    test('All results must satisfy jurisdiction filter when applied', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 100 }),
            filters: fc.record({
              court: fc.constantFrom('cour_supreme', 'conseil_etat', 'cour_appel')
            }),
            limit: fc.integer({ min: 1, max: 20 })
          }),
          async (query: SearchQuery) => {
            try {
              const results = await legalSearchService.searchJurisprudence(query);
              
              // Property: All results must match the court filter
              for (const result of results.results) {
                expect(result.court.type).toBe(query.filters!.court);
              }
            } catch (error) {
              if (error instanceof Error && !error.message.includes('No results found')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 25, timeout: 10000 }
      );
    });

    test('All results must satisfy domain filter when applied', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 100 }),
            filters: fc.record({
              domain: fc.constantFrom('civil', 'commercial', 'penal', 'administratif')
            }),
            limit: fc.integer({ min: 1, max: 20 })
          }),
          async (query: SearchQuery) => {
            try {
              const results = await legalSearchService.searchJurisprudence(query);
              
              // Property: All results must match the domain filter
              for (const result of results.results) {
                expect(result.legalDomain).toBe(query.filters!.domain);
              }
            } catch (error) {
              if (error instanceof Error && !error.message.includes('No results found')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 25, timeout: 10000 }
      );
    });

    test('All results must satisfy date range filter when applied', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 100 }),
            filters: fc.record({
              dateFrom: fc.date({ min: new Date('2010-01-01'), max: new Date('2020-01-01') }),
              dateTo: fc.date({ min: new Date('2020-01-01'), max: new Date() })
            }),
            limit: fc.integer({ min: 1, max: 20 })
          }),
          async (query: SearchQuery) => {
            try {
              const results = await legalSearchService.searchJurisprudence(query);
              
              // Property: All results must be within the date range
              for (const result of results.results) {
                expect(result.date.getTime()).toBeGreaterThanOrEqual(query.filters!.dateFrom!.getTime());
                expect(result.date.getTime()).toBeLessThanOrEqual(query.filters!.dateTo!.getTime());
              }
            } catch (error) {
              if (error instanceof Error && !error.message.includes('No results found')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 25, timeout: 10000 }
      );
    });

    test('Combined filters must all be satisfied simultaneously', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 100 }),
            filters: fc.record({
              domain: fc.constantFrom('civil', 'commercial'),
              court: fc.constantFrom('cour_supreme', 'cour_appel'),
              dateFrom: fc.date({ min: new Date('2015-01-01'), max: new Date('2020-01-01') })
            }),
            limit: fc.integer({ min: 1, max: 15 })
          }),
          async (query: SearchQuery) => {
            try {
              const results = await legalSearchService.searchJurisprudence(query);
              
              // Property: All filters must be satisfied simultaneously
              for (const result of results.results) {
                expect(result.legalDomain).toBe(query.filters!.domain);
                expect(result.court.type).toBe(query.filters!.court);
                expect(result.date.getTime()).toBeGreaterThanOrEqual(query.filters!.dateFrom!.getTime());
              }
            } catch (error) {
              if (error instanceof Error && !error.message.includes('No results found')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 20, timeout: 10000 }
      );
    });
  });

  /**
   * Additional Property: Search Result Consistency
   * Search results should be consistent and deterministic for identical queries
   */
  describe('Search Result Consistency', () => {
    test('Identical queries should return identical results', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            text: fc.string({ minLength: 3, maxLength: 50 }),
            filters: fc.record({
              domain: fc.option(fc.constantFrom('civil', 'commercial'))
            }, { requiredKeys: [] }),
            limit: fc.integer({ min: 1, max: 10 })
          }),
          async (query: SearchQuery) => {
            try {
              // Execute the same query twice
              const results1 = await legalSearchService.searchJurisprudence(query);
              const results2 = await legalSearchService.searchJurisprudence(query);
              
              // Property: Results should be identical
              expect(results1.totalCount).toBe(results2.totalCount);
              expect(results1.results.length).toBe(results2.results.length);
              
              // Check that result IDs are in the same order
              for (let i = 0; i < results1.results.length; i++) {
                expect(results1.results[i].id).toBe(results2.results[i].id);
              }
            } catch (error) {
              if (error instanceof Error && !error.message.includes('No results found')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 15, timeout: 10000 }
      );
    });
  });

  /**
   * Additional Property: Search Performance
   * Search operations should complete within reasonable time limits
   */
  describe('Search Performance Properties', () => {
    test('Search queries should complete within reasonable time', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 200 }),
            filters: fc.record({}, { requiredKeys: [] }),
            limit: fc.integer({ min: 1, max: 50 })
          }),
          async (query: SearchQuery) => {
            const startTime = Date.now();
            
            try {
              await legalSearchService.searchJurisprudence(query);
              const endTime = Date.now();
              const duration = endTime - startTime;
              
              // Property: Search should complete within 5 seconds
              expect(duration).toBeLessThan(5000);
            } catch (error) {
              const endTime = Date.now();
              const duration = endTime - startTime;
              
              // Even errors should occur within reasonable time
              expect(duration).toBeLessThan(5000);
              
              if (error instanceof Error && !error.message.includes('No results found')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 20, timeout: 15000 }
      );
    });
  });
});