import { logger } from '@/utils/logger';

// gemini-embedding-001 : text-embedding-004 a été éteint le 14/01/2026.
// outputDimensionality = 768 pour rester compatible avec le schéma vector(768).
const GEMINI_EMBEDDING_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents';

const GEMINI_EMBEDDING_MODEL = 'models/gemini-embedding-001';

const EMBEDDING_DIM = 768;
const MAX_BATCH_SIZE = 100;
const MAX_INPUT_CHARS = 8000; // ~2000 tokens, garde-fou

export interface EmbeddingResult {
  text: string;
  embedding: number[];
}

export class EmbeddingService {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    // Ne pas throw à l'import : la clé peut manquer au boot (serverless).
    // L'erreur surviendra à l'usage, avec un message explicite.
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY absent : embeddings (RAG) indisponibles');
    }
    this.apiKey = apiKey;
  }

  /**
   * Calcule l'embedding d'un texte unique.
   */
  async embed(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    const first = results[0];
    if (!first) {
      throw new Error('Embedding service returned no result');
    }
    return first.embedding;
  }

  /**
   * Calcule les embeddings pour un batch de textes.
   * Découpe automatiquement les batchs > MAX_BATCH_SIZE.
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];

    const cleaned = texts.map((t) => this.sanitize(t));
    const allResults: EmbeddingResult[] = [];

    for (let i = 0; i < cleaned.length; i += MAX_BATCH_SIZE) {
      const slice = cleaned.slice(i, i + MAX_BATCH_SIZE);
      const batchResults = await this.callEmbeddingApi(slice);
      allResults.push(...batchResults);
    }

    return allResults;
  }

  /**
   * Découpe un texte long en chunks chevauchants pour l'indexation.
   * Utilise une heuristique caractères → ~tokens (1 token ≈ 4 char en FR).
   */
  chunkText(
    text: string,
    options: { maxChars?: number; overlapChars?: number } = {}
  ): string[] {
    const maxChars = options.maxChars ?? 2000; // ~500 tokens
    const overlapChars = options.overlapChars ?? 200;
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxChars) return [cleaned];

    const chunks: string[] = [];
    let start = 0;
    while (start < cleaned.length) {
      const end = Math.min(start + maxChars, cleaned.length);
      const chunk = cleaned.substring(start, end);
      chunks.push(chunk);
      if (end === cleaned.length) break;
      start = end - overlapChars;
    }
    return chunks;
  }

  get dimension(): number {
    return EMBEDDING_DIM;
  }

  private sanitize(text: string): string {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      throw new Error('Cannot embed empty text');
    }
    if (trimmed.length > MAX_INPUT_CHARS) {
      return trimmed.substring(0, MAX_INPUT_CHARS);
    }
    return trimmed;
  }

  private async callEmbeddingApi(texts: string[]): Promise<EmbeddingResult[]> {
    const url = `${GEMINI_EMBEDDING_URL}?key=${this.apiKey}`;

    const body = {
      requests: texts.map((text) => ({
        model: GEMINI_EMBEDDING_MODEL,
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: EMBEDDING_DIM
      }))
    };

    const startTime = Date.now();

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Gemini embedding API error', {
        status: response.status,
        body: errorText
      });
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      embeddings?: Array<{ values: number[] }>;
    };

    if (!data.embeddings || data.embeddings.length !== texts.length) {
      throw new Error('Embedding API returned mismatched number of embeddings');
    }

    logger.debug('Gemini embedding batch completed', {
      count: texts.length,
      durationMs: Date.now() - startTime
    });

    return data.embeddings.map((emb, idx) => ({
      text: texts[idx] ?? '',
      embedding: emb.values
    }));
  }
}

export const embeddingService = new EmbeddingService(
  process.env.GEMINI_API_KEY ?? ''
);
