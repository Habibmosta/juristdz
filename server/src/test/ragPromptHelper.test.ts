import {
  injectRagContext,
  extractCitedSources,
  buildRagFiltersFromContext
} from '@/services/ragPromptHelper';
import { LegalDomain } from '@/types/search';
import { Profession } from '@/types/auth';
import { RagContextBlock } from '@/services/ragService';
import { LegalContext } from '@/types/ai';

const mockContext: LegalContext = {
  userRole: Profession.AVOCAT,
  jurisdiction: 'Algeria',
  legalDomain: LegalDomain.CIVIL,
  language: 'fr'
};

const mockRagContext: RagContextBlock = {
  formatted: '[Article 124 du Code civil]\nLe consentement doit être libre et éclairé.',
  results: [
    {
      id: 'doc-1',
      sourceType: 'legal_article',
      sourceId: 'src-1',
      title: 'Code civil - Article 124',
      referenceCode: 'Article 124 du Code civil',
      chunkText: 'Le consentement doit être libre et éclairé.',
      chunkIndex: 0,
      score: 0.85,
      domain: 'civil',
      metadata: {}
    }
  ]
};

describe('ragPromptHelper', () => {
  describe('injectRagContext', () => {
    it('should return original prompt when context is null', () => {
      const prompt = 'What is the contract law?';
      expect(injectRagContext(prompt, null)).toBe(prompt);
    });

    it('should return original prompt when context has no results', () => {
      const emptyContext: RagContextBlock = { formatted: '', results: [] };
      const prompt = 'What is the contract law?';
      expect(injectRagContext(prompt, emptyContext)).toBe(prompt);
    });

    it('should inject context block with clear delimiters', () => {
      const prompt = 'Explain the consent requirement.';
      const result = injectRagContext(prompt, mockRagContext);
      expect(result).toContain('SOURCES JURIDIQUES PERTINENTES');
      expect(result).toContain('Article 124 du Code civil');
      expect(result).toContain('DEMANDE UTILISATEUR');
      expect(result).toContain(prompt);
    });
  });

  describe('extractCitedSources', () => {
    it('should return empty when context is null', () => {
      expect(extractCitedSources('any text', null)).toEqual([]);
    });

    it('should extract references cited in the response', () => {
      const response =
        'Selon l\'Article 124 du Code civil, le consentement doit être libre et éclairé. ' +
        'Cette règle est fondamentale.';
      const cited = extractCitedSources(response, mockRagContext);
      expect(cited).toContain('Article 124 du Code civil');
    });

    it('should deduplicate citations', () => {
      const response =
        'Article 124 du Code civil. Encore Article 124 du Code civil.';
      const cited = extractCitedSources(response, mockRagContext);
      expect(cited).toHaveLength(1);
    });
  });

  describe('buildRagFiltersFromContext', () => {
    it('should map legal context to RAG filters', () => {
      const filters = buildRagFiltersFromContext(mockContext);
      expect(filters.domain).toBe(LegalDomain.CIVIL);
      expect(filters.jurisdiction).toBe('Algeria');
      expect(filters.language).toBe('fr');
    });

    it('should default jurisdiction to Algeria', () => {
      const filters = buildRagFiltersFromContext({
        ...mockContext,
        jurisdiction: undefined as unknown as string
      });
      expect(filters.jurisdiction).toBe('Algeria');
    });
  });
});
