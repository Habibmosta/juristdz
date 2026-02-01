import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { db } from './connection';
import { logger } from '@/utils/logger';

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

class MigrationRunner {
  private migrationsPath = join(process.cwd(), 'src/database/migrations');

  async createMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await db.query(sql);
  }

  async getExecutedMigrations(): Promise<string[]> {
    const result = await db.query('SELECT id FROM migrations ORDER BY executed_at');
    
    return (result as { rows: { id: string }[] }).rows.map(row => row.id);
  }

  async loadMigrations(): Promise<Migration[]> {
    try {
      const files = await readdir(this.migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      const migrations: Migration[] = [];
      
      for (const filename of migrationFiles) {
        const id = filename.replace('.sql', '');
        const filepath = join(this.migrationsPath, filename);
        const sql = await readFile(filepath, 'utf-8');
        
        migrations.push({ id, filename, sql });
      }
      
      return migrations;
    } catch (error) {
      logger.error('Failed to load migrations:', error);
      
      return [];
    }
  }

  async runMigration(migration: Migration): Promise<void> {
    await db.transaction(async (client) => {
      // Execute migration SQL
      await client.query(migration.sql);
      
      // Record migration as executed
      await client.query(
        'INSERT INTO migrations (id, filename) VALUES ($1, $2)',
        [migration.id, migration.filename]
      );
      
      logger.info(`Migration ${migration.filename} executed successfully`);
    });
  }

  async run(): Promise<void> {
    try {
      logger.info('Starting database migrations...');
      
      // Ensure migrations table exists
      await this.createMigrationsTable();
      
      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      
      // Load all migrations
      const allMigrations = await this.loadMigrations();
      
      // Filter pending migrations
      const pendingMigrations = allMigrations.filter(
        migration => !executedMigrations.includes(migration.id)
      );
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        
        return;
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      // Execute pending migrations
      for (const migration of pendingMigrations) {
        await this.runMigration(migration);
      }
      
      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new MigrationRunner();
  
  runner.run()
    .then(() => {
      logger.info('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

export { MigrationRunner };