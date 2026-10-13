import { EmbeddingService } from '@/services/embeddingService';

describe('EmbeddingService', () => {
  describe('chunkText', () => {
    const service = new EmbeddingService('test-key');

    it('should return single chunk for short text', () => {
      const text = 'This is a short legal text about contracts.';
      const chunks = service.chunkText(text);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it('should split long text into overlapping chunks', () => {
      const text = 'A'.repeat(5000);
      const chunks = service.chunkText(text, { maxChars: 1000, overlapChars: 100 });
      expect(chunks.length).toBeGreaterThan(1);
      // Chaque chunk fait au plus maxChars
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(1000);
      }
    });

    it('should normalize whitespace before chunking', () => {
      const text = 'Hello    \n\n\n   World';
      const chunks = service.chunkText(text);
      expect(chunks[0]).not.toMatch(/\s{2,}/);
    });

    it('should expose the embedding dimension', () => {
      expect(service.dimension).toBe(768);
    });
  });

  describe('constructor', () => {
    it('should throw if API key is missing', () => {
      expect(() => new EmbeddingService('')).toThrow('GEMINI_API_KEY');
    });
  });
});
