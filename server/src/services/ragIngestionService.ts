import { logger } from '@/utils/logger';
import { db } from '@/database/connection';
import { embeddingService } from './embeddingService';
import { RagSourceType } from './ragService';

export interface IngestDocumentInput {
  sourceType: RagSourceType;
  sourceId: string;
  title: string;
  content: string;        // texte complet à découper
  domain: string;         // civil, penal, commercial, etc.
  jurisdiction?: string;  // défaut: 'Algeria'
  language?: 'fr' | 'ar'; // défaut: 'fr'
  referenceCode?: string; // ex: "Article 124 du Code civil"
  keywords?: string[];
  metadata?: Record<string, unknown>;
}

interface IngestionStats {
  total: number;
  inserted: number;
  skipped: number;
  errors: number;
}

/**
 * Service d'ingestion des sources juridiques dans la base vectorielle RAG.
 *
 * Responsabilités :
 *  - Découpe le texte en chunks chevauchants
 *  - Calcule les embeddings via Gemini
 *  - Upsert dans rag_documents (idempotent grâce à UNIQUE source_type+source_id+chunk_index)
 */
export class RagIngestionService {
  /**
   * Ingère un document complet dans la base vectorielle.
   * Remplace tous les chunks existants pour la même source.
   */
  async ingestDocument(input: IngestDocumentInput): Promise<IngestionStats> {
    const stats: IngestionStats = {
      total: 0,
      inserted: 0,
      skipped: 0,
      errors: 0
    };

    const jurisdiction = input.jurisdiction ?? 'Algeria';
    const language = input.language ?? 'fr';
    const keywords = input.keywords ?? [];
    const metadata = input.metadata ?? {};

    try {
      // 1. Découper en chunks
      const chunks = embeddingService.chunkText(input.content);
      stats.total = chunks.length;

      if (chunks.length === 0) {
        logger.warn('RAG ingestion: empty content', { sourceId: input.sourceId });
        return stats;
      }

      // 2. Supprimer les anciens chunks pour cette source
      await db.query(
        `DELETE FROM rag_documents WHERE source_type = $1 AND source_id = $2`,
        [input.sourceType, input.sourceId]
      );

      // 3. Calculer les embeddings par batch
      const embeddings = await embeddingService.embedBatch(chunks);

      // 4. Insérer en transaction
      await db.transaction(async (client) => {
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = embeddings[i];
          if (!chunk || !embedding) {
            stats.skipped++;
            continue;
          }

          const vectorStr = `[${embedding.embedding.join(',')}]`;

          await client.query(
            `INSERT INTO rag_documents
             (source_type, source_id, title, domain, jurisdiction, language,
              reference_code, keywords, metadata, chunk_index, chunk_text,
              chunk_tokens, embedding)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::vector)`,
            [
              input.sourceType,
              input.sourceId,
              input.title,
              input.domain,
              jurisdiction,
              language,
              input.referenceCode ?? null,
              keywords,
              JSON.stringify(metadata),
              i,
              chunk,
              Math.ceil(chunk.length / 4),
              vectorStr
            ]
          );
          stats.inserted++;
        }
      });

      logger.info('RAG document ingested', {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        chunks: stats.inserted
      });

      return stats;
    } catch (error) {
      stats.errors++;
      logger.error('RAG ingestion failed', {
        error,
        sourceType: input.sourceType,
        sourceId: input.sourceId
      });
      throw error;
    }
  }

  /**
   * Supprime tous les chunks d'une source (utile pour les corrections).
   */
  async deleteSource(
    sourceType: RagSourceType,
    sourceId: string
  ): Promise<number> {
    const result = await db.query(
      `DELETE FROM rag_documents WHERE source_type = $1 AND source_id = $2`,
      [sourceType, sourceId]
    );
    const count = (result as { rowCount?: number }).rowCount ?? 0;
    logger.info('RAG source deleted', { sourceType, sourceId, count });
    return count;
  }

  /**
   * Ingeste en batch tous les documents d'un type donné depuis la base
   * source (jurisprudence_cases, legal_articles, etc.).
   *
   * Utilisé par le script d'indexation initial.
   */
  async ingestFromSourceTable(
    sourceType: RagSourceType,
    options: { batchSize?: number; reindexAll?: boolean } = {}
  ): Promise<IngestionStats> {
    const batchSize = options.batchSize ?? 50;
    const reindexAll = options.reindexAll ?? false;

    const globalStats: IngestionStats = {
      total: 0,
      inserted: 0,
      skipped: 0,
      errors: 0
    };

    try {
      const sources = this.getSourceQuery(sourceType, reindexAll);
      const result = await db.query(sources.query, sources.params);
      const rows = (result as { rows: Array<{ id: string; content: string } & Record<string, unknown>> }).rows;

      logger.info('RAG batch ingestion started', {
        sourceType,
        rowCount: rows.length,
        reindexAll
      });

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        for (const row of batch) {
          try {
            const stats = await this.ingestDocument({
              sourceType,
              sourceId: row.id as string,
              title: (row.title as string) ?? 'Sans titre',
              content: row.content as string,
              domain: (row.domain as string) ?? 'civil',
              referenceCode: row.reference_code as string | undefined,
              keywords: row.keywords as string[] | undefined,
              metadata: { indexedAt: new Date().toISOString() }
            });
            globalStats.total += stats.total;
            globalStats.inserted += stats.inserted;
            globalStats.skipped += stats.skipped;
            globalStats.errors += stats.errors;
          } catch (err) {
            globalStats.errors++;
            logger.error('RAG batch item failed', { error: err, sourceId: row.id });
          }
        }
      }

      logger.info('RAG batch ingestion completed', {
        sourceType,
        ...globalStats
      });

      return globalStats;
    } catch (error) {
      logger.error('RAG batch ingestion failed', { error, sourceType });
      throw error;
    }
  }

  private getSourceQuery(
    sourceType: RagSourceType,
    reindexAll: boolean
  ): { query: string; params: unknown[] } {
    const notIndexedClause = reindexAll
      ? ''
      : `WHERE NOT EXISTS (
           SELECT 1 FROM rag_documents r
           WHERE r.source_type = '${sourceType}'
             AND r.source_id = t.id
         )`;

    switch (sourceType) {
      case 'jurisprudence_case':
        return {
          query: `
            SELECT id, summary || E'\\n\\n' || COALESCE(full_text, '') AS content,
                   court_name AS title, legal_domain AS domain, keywords
            FROM jurisprudence_cases t
            ${notIndexedClause}
            ORDER BY decision_date DESC
            LIMIT 1000
          `,
          params: []
        };
      case 'legal_article':
        return {
          query: `
            SELECT id, title || E'\\n\\n' || content AS content,
                   CONCAT('Article ', article_number) AS title, 'civil' AS domain,
                   ARRAY[chapter, section] AS keywords, code_id AS reference_code
            FROM legal_articles t
            ${notIndexedClause}
            LIMIT 5000
          `,
          params: []
        };
      case 'jora_publication':
        return {
          query: `
            SELECT id, title || E'\\n\\n' || COALESCE(content, '') AS content,
                   title, document_type AS domain, keywords,
                   CONCAT('JORA n°', jora_number, ' du ', publication_date) AS reference_code
            FROM jora_publications t
            ${notIndexedClause}
            ORDER BY publication_date DESC
            LIMIT 2000
          `,
          params: []
        };
      case 'legal_reference':
        return {
          query: `
            SELECT id, title || E'\\n\\n' || COALESCE(content, '') AS content,
                   title, domain, keywords, reference AS reference_code
            FROM legal_references t
            ${notIndexedClause}
            LIMIT 1000
          `,
          params: []
        };
      case 'compliance_rule':
        return {
          query: `
            SELECT id, name || E'\\n\\n' || description AS content,
                   name AS title, domain, ARRAY[category] AS keywords
            FROM compliance_rules t
            WHERE is_active = true
              ${reindexAll ? '' : `AND NOT EXISTS (
                SELECT 1 FROM rag_documents r
                WHERE r.source_type = 'compliance_rule' AND r.source_id = t.id
              )`}
            LIMIT 500
          `,
          params: []
        };
      default:
        throw new Error(`Unsupported source type: ${sourceType}`);
    }
  }
}

export const ragIngestionService = new RagIngestionService();
