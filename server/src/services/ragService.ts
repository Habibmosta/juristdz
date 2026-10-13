import { logger } from '@/utils/logger';
import { db } from '@/database/connection';
import { embeddingService } from './embeddingService';
import { LegalDomain } from '@/types/search';
import { config } from '@/config/environment';

export type RagSourceType =
  | 'jurisprudence_case'
  | 'legal_article'
  | 'jora_publication'
  | 'legal_reference'
  | 'document_template'
  | 'compliance_rule';

export interface RagFilters {
  domain?: LegalDomain | string;
  jurisdiction?: string;
  language?: 'fr' | 'ar';
  sourceType?: RagSourceType | RagSourceType[];
}

export interface RagSearchResult {
  id: string;
  sourceType: RagSourceType;
  sourceId: string;
  title: string;
  referenceCode: string | null;
  chunkText: string;
  chunkIndex: number;
  score: number; // similarité cosinus ∈ [0, 1]
  domain: string;
  metadata: Record<string, unknown>;
}

export interface RagContextBlock {
  formatted: string;
  results: RagSearchResult[];
}

interface RagDocumentRow {
  id: string;
  source_type: RagSourceType;
  source_id: string;
  title: string;
  reference_code: string | null;
  chunk_text: string;
  chunk_index: number;
  score: number;
  domain: string;
  metadata: Record<string, unknown>;
}

const DEFAULT_TOP_K = 5;
const DEFAULT_MIN_SCORE = 0.5;

export class RagService {
  private readonly enabled: boolean;

  constructor() {
    this.enabled = config.apis.gemini.length > 0;
  }

  /**
   * Recherche hybride vector + metadata, retourne les top-k chunks.
   */
  async search(
    query: string,
    filters: RagFilters = {},
    options: { topK?: number; minScore?: number } = {}
  ): Promise<RagSearchResult[]> {
    if (!this.enabled) {
      logger.warn('RAG disabled: GEMINI_API_KEY missing');
      return [];
    }

    const topK = options.topK ?? DEFAULT_TOP_K;
    const minScore = options.minScore ?? DEFAULT_MIN_SCORE;

    const startTime = Date.now();

    try {
      const queryEmbedding = await embeddingService.embed(query);
      const embeddingMs = Date.now() - startTime;

      const retrievalStart = Date.now();
      const rows = await this.vectorSearch(queryEmbedding, filters, topK, minScore);
      const retrievalMs = Date.now() - retrievalStart;

      logger.info('RAG search completed', {
        queryLength: query.length,
        resultsCount: rows.length,
        embeddingMs,
        retrievalMs,
        filters
      });

      // Best-effort log (non-bloquant)
      void this.logQuery(query, embeddingMs, retrievalMs, rows.length, filters).catch(
        (err) => logger.error('Failed to log RAG query', err)
      );

      return rows;
    } catch (error) {
      logger.error('RAG search failed', { error, query: query.substring(0, 100) });
      return [];
    }
  }

  /**
   * Construit un bloc de contexte formaté à injecter dans un prompt LLM.
   * Si aucun résultat pertinent, retourne null.
   */
  async buildContextBlock(
    query: string,
    filters: RagFilters = {},
    options: { topK?: number; minScore?: number; maxChars?: number } = {}
  ): Promise<RagContextBlock | null> {
    const results = await this.search(query, filters, options);
    if (results.length === 0) return null;

    const maxChars = options.maxChars ?? 4000;
    const parts: string[] = [];
    let usedChars = 0;

    for (const r of results) {
      const block = `[${r.referenceCode ?? r.title}]\n${r.chunkText}`;
      if (usedChars + block.length > maxChars) break;
      parts.push(block);
      usedChars += block.length;
    }

    if (parts.length === 0) return null;

    return {
      formatted: parts.join('\n\n---\n\n'),
      results
    };
  }

  private async vectorSearch(
    queryEmbedding: number[],
    filters: RagFilters,
    topK: number,
    minScore: number
  ): Promise<RagSearchResult[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    const conditions: string[] = ['1 - (embedding <=> $1::vector) >= $2'];
    const params: unknown[] = [vectorStr, minScore];
    let paramIndex = 3;

    if (filters.domain) {
      conditions.push(`domain = $${paramIndex}`);
      params.push(filters.domain);
      paramIndex++;
    }
    if (filters.jurisdiction) {
      conditions.push(`jurisdiction = $${paramIndex}`);
      params.push(filters.jurisdiction);
      paramIndex++;
    }
    if (filters.language) {
      conditions.push(`language = $${paramIndex}`);
      params.push(filters.language);
      paramIndex++;
    }
    if (filters.sourceType) {
      const types = Array.isArray(filters.sourceType)
        ? filters.sourceType
        : [filters.sourceType];
      conditions.push(`source_type = ANY($${paramIndex}::text[])`);
      params.push(types);
      paramIndex++;
    }

    const sql = `
      SELECT
        id,
        source_type,
        source_id,
        title,
        reference_code,
        chunk_text,
        chunk_index,
        1 - (embedding <=> $1::vector) AS score,
        domain,
        metadata
      FROM rag_documents
      WHERE ${conditions.join(' AND ')}
      ORDER BY embedding <=> $1::vector
      LIMIT $${paramIndex}
    `;

    params.push(topK);

    const result = await db.query(sql, params);
    const rows = ((result as { rows: RagDocumentRow[] }).rows) ?? [];

    return rows.map((row) => ({
      id: row.id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      title: row.title,
      referenceCode: row.reference_code,
      chunkText: row.chunk_text,
      chunkIndex: row.chunk_index,
      score: Number(row.score),
      domain: row.domain,
      metadata: row.metadata ?? {}
    }));
  }

  private async logQuery(
    query: string,
    embeddingMs: number,
    retrievalMs: number,
    resultsCount: number,
    filters: RagFilters
  ): Promise<void> {
    await db.query(
      `INSERT INTO rag_query_logs
       (query_text, query_embedding_time_ms, retrieval_time_ms, total_results, filters)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        query.substring(0, 1000),
        embeddingMs,
        retrievalMs,
        resultsCount,
        JSON.stringify(filters)
      ]
    );
  }
}

export const ragService = new RagService();
