import {
  extractJsonString,
  safeJsonParse,
  buildJsonForcedPrompt,
  JsonParseError
} from '@/utils/jsonForcer';

describe('jsonForcer', () => {
  describe('extractJsonString', () => {
    it('should extract JSON from markdown fence', () => {
      const raw = 'Here is the answer:\n```json\n{"title": "test", "value": 42}\n```\nDone.';
      const result = extractJsonString(raw);
      expect(result).toBe('{"title": "test", "value": 42}');
    });

    it('should extract JSON from fence without json tag', () => {
      const raw = '```\n{"a": 1}\n```';
      const result = extractJsonString(raw);
      expect(result).toBe('{"a": 1}');
    });

    it('should extract JSON object from surrounding prose', () => {
      const raw = 'Some intro text. {"key": "value", "count": 3} and more text.';
      const result = extractJsonString(raw);
      expect(result).toBe('{"key": "value", "count": 3}');
    });

    it('should extract JSON array', () => {
      const raw = 'Here: [1, 2, {"a": 1}]';
      const result = extractJsonString(raw);
      expect(result).toBe('[1, 2, {"a": 1}]');
    });

    it('should return null when no JSON found', () => {
      expect(extractJsonString('plain text')).toBeNull();
      expect(extractJsonString('')).toBeNull();
      expect(extractJsonString(null as unknown as string)).toBeNull();
    });
  });

  describe('safeJsonParse', () => {
    it('should parse clean JSON', () => {
      const result = safeJsonParse<{ a: number }>('{"a": 42}');
      expect(result).toEqual({ a: 42 });
    });

    it('should parse JSON from markdown fence', () => {
      const result = safeJsonParse<{ a: number }>('```json\n{"a": 1}\n```');
      expect(result).toEqual({ a: 1 });
    });

    it('should repair trailing commas', () => {
      const result = safeJsonParse<{ a: number[]; b: string }>(
        '{"a": [1, 2, 3,], "b": "test",}'
      );
      expect(result.a).toEqual([1, 2, 3]);
      expect(result.b).toBe('test');
    });

    it('should throw JsonParseError on invalid input', () => {
      expect(() => safeJsonParse('not json at all')).toThrow(JsonParseError);
    });

    it('should throw on empty string', () => {
      expect(() => safeJsonParse('')).toThrow(JsonParseError);
    });
  });

  describe('buildJsonForcedPrompt', () => {
    it('should include the schema description and instructions', () => {
      const prompt = buildJsonForcedPrompt('{"field": "type"}');
      expect(prompt).toContain('JSON VALIDE');
      expect(prompt).toContain('{"field": "type"}');
      expect(prompt.toLowerCase()).toContain('json');
    });
  });
});
