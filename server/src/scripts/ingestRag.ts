/**
 * Script d'indexation initial de la base RAG.
 *
 * Usage:
 *   npm run rag:ingest              # indexe tout ce qui n'est pas encore indexé
 *   npm run rag:ingest -- --all     # réindexe tout
 *   npm run rag:ingest -- --type jurisprudence_case
 */
import { db, connectDatabase, closeDatabase } from '../database/connection.js';
import { ragIngestionService } from '../services/ragIngestionService.js';
import { logger } from '../utils/logger.js';
import { RagSourceType } from '../services/ragService.js';

const ALL_SOURCE_TYPES: RagSourceType[] = [
  'jurisprudence_case',
  'legal_article',
  'jora_publication',
  'legal_reference',
  'compliance_rule'
];

function parseArgs(): { reindexAll: boolean; onlyType?: RagSourceType } {
  const args = process.argv.slice(2);
  const reindexAll = args.includes('--all');
  const typeIndex = args.indexOf('--type');
  const onlyType =
    typeIndex >= 0 ? (args[typeIndex + 1] as RagSourceType | undefined) : undefined;
  return { reindexAll, onlyType };
}

async function main(): Promise<void> {
  const { reindexAll, onlyType } = parseArgs();

  await connectDatabase();

  const sourceTypes = onlyType ? [onlyType] : ALL_SOURCE_TYPES;

  logger.info('Starting RAG initial ingestion', {
    sourceTypes,
    reindexAll
  });

  const startTime = Date.now();
  let totalInserted = 0;
  let totalErrors = 0;

  for (const sourceType of sourceTypes) {
    try {
      const stats = await ragIngestionService.ingestFromSourceTable(sourceType, {
        reindexAll
      });
      totalInserted += stats.inserted;
      totalErrors += stats.errors;
      console.log(
        `[${sourceType}] indexed=${stats.inserted} skipped=${stats.skipped} errors=${stats.errors}`
      );
    } catch (error) {
      totalErrors++;
      logger.error('Source type failed', { error, sourceType });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✓ RAG ingestion completed in ${duration}s`);
  console.log(`  - Total chunks inserted: ${totalInserted}`);
  console.log(`  - Errors: ${totalErrors}`);

  await closeDatabase();
  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch(async (error) => {
  logger.error('RAG ingestion script failed', { error });
  console.error('Fatal error:', error);
  try {
    await closeDatabase();
  } catch {
    // ignore
  }
  process.exit(1);
});
