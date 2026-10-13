import { Pool, PoolClient } from 'pg';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor() {
    // Pool configurable par variables d'environnement.
    // serverless (Vercel) : timeouts longs (le pooler Supabase peut mettre ~10s)
    // et pool réduit pour ne pas saturer les limites de connexions.
    this.pool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: Number(process.env.DB_POOL_MAX) || (process.env.VERCEL ? 3 : 20),
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS) || 10000,
      connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 15000
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }

    return DatabaseConnection.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async query(text: string, params?: unknown[]): Promise<unknown> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(text, params);
      
      return result;
    } finally {
      client.release();
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.query('SELECT 1');
      client.release();
      
      return true;
    } catch (error) {
      logger.error('Database connection test failed:', error);
      
      return false;
    }
  }
}

export const db = DatabaseConnection.getInstance();

export function getDb(): Pool {
  return db.getPool();
}

export async function connectDatabase(): Promise<void> {
  const isConnected = await db.testConnection();

  if (!isConnected) {
    throw new Error('Failed to connect to database');
  }

  logger.info('Database connection established');
}

export async function closeDatabase(): Promise<void> {
  await db.close();
  logger.info('Database connection closed');
}