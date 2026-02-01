import { getDb } from '@/database/connection';
import { encryptionService } from './encryptionService';
import { auditService } from './auditService';
import { logger } from '@/utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Service de sauvegarde et restauration sécurisées
 * Implémente la sauvegarde automatique avec chiffrement et vérification d'intégrité
 */

export interface BackupConfig {
  schedule: string; // Cron expression
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  includeTables: string[];
  excludeTables: string[];
  backupPath: string;
}

export interface BackupMetadata {
  id: string;
  tenantId?: string; // Si null, sauvegarde globale
  type: 'full' | 'incremental' | 'differential';
  createdAt: Date;
  size: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
  tables: string[];
  version: string;
  status: 'in_progress' | 'completed' | 'failed' | 'corrupted';
  errorMessage?: string;
}

export interface RestoreOptions {
  backupId: string;
  tenantId?: string;
  targetTenantId?: string; // Pour restaurer vers un autre tenant
  tables?: string[]; // Tables spécifiques à restaurer
  pointInTime?: Date;
  validateIntegrity: boolean;
  dryRun: boolean;
}

export interface RestoreResult {
  success: boolean;
  restoredTables: string[];
  skippedTables: string[];
  errors: string[];
  duration: number;
  recordsRestored: number;
}

export class BackupService {
  private readonly db = getDb();
  private readonly defaultConfig: BackupConfig = {
    schedule: '0 2 * * *', // Tous les jours à 2h du matin
    retentionDays: 30,
    compressionEnabled: true,
    encryptionEnabled: true,
    includeTables: [],
    excludeTables: ['security_audit_logs'], // Exclure les logs temporaires
    backupPath: process.env.BACKUP_PATH || './backups'
  };

  private backupConfigs: Map<string, BackupConfig> = new Map();
  private scheduledBackups: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeBackupDirectory();
    this.scheduleAutomaticBackups();
  }

  /**
   * Configure la sauvegarde pour un tenant
   */
  async configureBackup(tenantId: string, config: Partial<BackupConfig>): Promise<void> {
    const fullConfig = { ...this.defaultConfig, ...config };
    this.backupConfigs.set(tenantId, fullConfig);
    
    // Reprogrammer les sauvegardes automatiques
    await this.scheduleBackupForTenant(tenantId, fullConfig);
    
    logger.info(`Configuration de sauvegarde mise à jour pour le tenant ${tenantId}`);
  }

  /**
   * Effectue une sauvegarde complète
   */
  async createFullBackup(tenantId?: string): Promise<BackupMetadata> {
    const backupId = crypto.randomUUID();
    const startTime = Date.now();

    logger.info(`Début de sauvegarde complète ${backupId} pour tenant ${tenantId || 'global'}`);

    try {
      const metadata: BackupMetadata = {
        id: backupId,
        tenantId,
        type: 'full',
        createdAt: new Date(),
        size: 0,
        checksum: '',
        encrypted: true,
        compressed: true,
        tables: [],
        version: process.env.npm_package_version || '1.0.0',
        status: 'in_progress'
      };

      // Enregistrer les métadonnées de sauvegarde
      await this.saveBackupMetadata(metadata);

      // Obtenir la liste des tables à sauvegarder
      const tables = await this.getTablesToBackup(tenantId);
      metadata.tables = tables;

      // Créer le répertoire de sauvegarde
      const backupDir = await this.createBackupDirectory(backupId);

      // Sauvegarder chaque table
      const backupFiles: string[] = [];
      for (const table of tables) {
        const tableFile = await this.backupTable(table, tenantId, backupDir);
        backupFiles.push(tableFile);
      }

      // Créer l'archive de sauvegarde
      const archiveFile = await this.createBackupArchive(backupId, backupFiles);
      
      // Calculer la taille et le checksum
      const stats = await fs.stat(archiveFile);
      metadata.size = stats.size;
      metadata.checksum = await this.calculateFileChecksum(archiveFile);
      metadata.status = 'completed';

      // Mettre à jour les métadonnées
      await this.saveBackupMetadata(metadata);

      // Nettoyer les fichiers temporaires
      await this.cleanupTemporaryFiles(backupFiles);

      const duration = Date.now() - startTime;
      logger.info(`Sauvegarde complète ${backupId} terminée en ${duration}ms`);

      // Enregistrer l'événement d'audit
      await auditService.logEvent({
        tenantId: tenantId || 'system',
        userId: 'system',
        actionType: 'backup_created',
        resourceType: 'backup',
        resourceId: backupId,
        securityContext: {
          userRole: 'system',
          permissions: ['backup_create'],
          dataClassification: 'internal',
          requiresEncryption: true
        },
        success: true,
        timestamp: new Date(),
        metadata: { duration, size: metadata.size, tables: tables.length }
      });

      return metadata;

    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde ${backupId}:`, error);
      
      // Mettre à jour le statut d'erreur
      await this.updateBackupStatus(backupId, 'failed', error instanceof Error ? error.message : 'Erreur inconnue');
      
      throw error;
    }
  }

  /**
   * Effectue une sauvegarde incrémentale
   */
  async createIncrementalBackup(tenantId?: string, lastBackupDate?: Date): Promise<BackupMetadata> {
    const backupId = crypto.randomUUID();
    const startTime = Date.now();

    logger.info(`Début de sauvegarde incrémentale ${backupId} pour tenant ${tenantId || 'global'}`);

    try {
      // Déterminer la date de la dernière sauvegarde
      const sinceDate = lastBackupDate || await this.getLastBackupDate(tenantId);
      
      if (!sinceDate) {
        logger.warn('Aucune sauvegarde précédente trouvée, création d\'une sauvegarde complète');
        return await this.createFullBackup(tenantId);
      }

      const metadata: BackupMetadata = {
        id: backupId,
        tenantId,
        type: 'incremental',
        createdAt: new Date(),
        size: 0,
        checksum: '',
        encrypted: true,
        compressed: true,
        tables: [],
        version: process.env.npm_package_version || '1.0.0',
        status: 'in_progress'
      };

      await this.saveBackupMetadata(metadata);

      // Obtenir les tables modifiées depuis la dernière sauvegarde
      const tables = await this.getTablesToBackup(tenantId);
      const backupDir = await this.createBackupDirectory(backupId);
      const backupFiles: string[] = [];

      for (const table of tables) {
        const hasChanges = await this.tableHasChanges(table, tenantId, sinceDate);
        if (hasChanges) {
          const tableFile = await this.backupTableIncremental(table, tenantId, sinceDate, backupDir);
          backupFiles.push(tableFile);
          metadata.tables.push(table);
        }
      }

      if (backupFiles.length === 0) {
        logger.info('Aucune modification détectée, sauvegarde incrémentale annulée');
        metadata.status = 'completed';
        await this.saveBackupMetadata(metadata);
        return metadata;
      }

      // Créer l'archive
      const archiveFile = await this.createBackupArchive(backupId, backupFiles);
      
      const stats = await fs.stat(archiveFile);
      metadata.size = stats.size;
      metadata.checksum = await this.calculateFileChecksum(archiveFile);
      metadata.status = 'completed';

      await this.saveBackupMetadata(metadata);
      await this.cleanupTemporaryFiles(backupFiles);

      const duration = Date.now() - startTime;
      logger.info(`Sauvegarde incrémentale ${backupId} terminée en ${duration}ms`);

      return metadata;

    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde incrémentale ${backupId}:`, error);
      await this.updateBackupStatus(backupId, 'failed', error instanceof Error ? error.message : 'Erreur inconnue');
      throw error;
    }
  }

  /**
   * Restaure une sauvegarde
   */
  async restoreBackup(options: RestoreOptions): Promise<RestoreResult> {
    const startTime = Date.now();
    logger.info(`Début de restauration de la sauvegarde ${options.backupId}`);

    try {
      // Valider les options
      await this.validateRestoreOptions(options);

      // Récupérer les métadonnées de sauvegarde
      const metadata = await this.getBackupMetadata(options.backupId);
      if (!metadata) {
        throw new Error(`Sauvegarde ${options.backupId} non trouvée`);
      }

      // Vérifier l'intégrité si demandé
      if (options.validateIntegrity) {
        const isValid = await this.validateBackupIntegrity(metadata);
        if (!isValid) {
          throw new Error('Intégrité de la sauvegarde compromise');
        }
      }

      const result: RestoreResult = {
        success: false,
        restoredTables: [],
        skippedTables: [],
        errors: [],
        duration: 0,
        recordsRestored: 0
      };

      // Mode dry-run : simulation sans modification
      if (options.dryRun) {
        logger.info('Mode dry-run activé, simulation de la restauration');
        result.success = true;
        result.restoredTables = metadata.tables;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Extraire l'archive de sauvegarde
      const extractedDir = await this.extractBackupArchive(options.backupId);

      // Restaurer chaque table
      const tablesToRestore = options.tables || metadata.tables;
      
      for (const table of tablesToRestore) {
        try {
          const recordsRestored = await this.restoreTable(
            table, 
            extractedDir, 
            options.tenantId || metadata.tenantId,
            options.targetTenantId
          );
          
          result.restoredTables.push(table);
          result.recordsRestored += recordsRestored;
          
        } catch (error) {
          const errorMsg = `Erreur lors de la restauration de la table ${table}: ${error}`;
          logger.error(errorMsg);
          result.errors.push(errorMsg);
          result.skippedTables.push(table);
        }
      }

      // Nettoyer les fichiers temporaires
      await this.cleanupTemporaryFiles([extractedDir]);

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      logger.info(`Restauration terminée: ${result.restoredTables.length} tables restaurées, ${result.errors.length} erreurs`);

      // Enregistrer l'événement d'audit
      await auditService.logEvent({
        tenantId: options.tenantId || metadata.tenantId || 'system',
        userId: 'system',
        actionType: 'backup_restored',
        resourceType: 'backup',
        resourceId: options.backupId,
        securityContext: {
          userRole: 'system',
          permissions: ['backup_restore'],
          dataClassification: 'internal',
          requiresEncryption: true
        },
        success: result.success,
        timestamp: new Date(),
        metadata: { 
          duration: result.duration, 
          tablesRestored: result.restoredTables.length,
          recordsRestored: result.recordsRestored,
          errors: result.errors.length
        }
      });

      return result;

    } catch (error) {
      logger.error(`Erreur lors de la restauration ${options.backupId}:`, error);
      throw error;
    }
  }

  /**
   * Liste les sauvegardes disponibles
   */
  async listBackups(tenantId?: string): Promise<BackupMetadata[]> {
    try {
      const query = tenantId 
        ? 'SELECT * FROM backup_metadata WHERE tenant_id = $1 ORDER BY created_at DESC'
        : 'SELECT * FROM backup_metadata ORDER BY created_at DESC';
      
      const params = tenantId ? [tenantId] : [];
      const result = await this.db.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        type: row.type,
        createdAt: row.created_at,
        size: row.size,
        checksum: row.checksum,
        encrypted: row.encrypted,
        compressed: row.compressed,
        tables: JSON.parse(row.tables || '[]'),
        version: row.version,
        status: row.status,
        errorMessage: row.error_message
      }));

    } catch (error) {
      logger.error('Erreur lors de la récupération des sauvegardes:', error);
      throw error;
    }
  }

  /**
   * Supprime une sauvegarde
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      // Récupérer les métadonnées
      const metadata = await this.getBackupMetadata(backupId);
      if (!metadata) {
        throw new Error(`Sauvegarde ${backupId} non trouvée`);
      }

      // Supprimer le fichier de sauvegarde
      const backupFile = path.join(this.defaultConfig.backupPath, `${backupId}.backup`);
      try {
        await fs.unlink(backupFile);
      } catch (error) {
        logger.warn(`Fichier de sauvegarde ${backupFile} non trouvé`);
      }

      // Supprimer les métadonnées
      await this.db.query('DELETE FROM backup_metadata WHERE id = $1', [backupId]);

      logger.info(`Sauvegarde ${backupId} supprimée`);

    } catch (error) {
      logger.error(`Erreur lors de la suppression de la sauvegarde ${backupId}:`, error);
      throw error;
    }
  }

  /**
   * Nettoie les anciennes sauvegardes selon la politique de rétention
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      for (const [tenantId, config] of this.backupConfigs) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

        const query = `
          SELECT id FROM backup_metadata 
          WHERE tenant_id = $1 AND created_at < $2 AND status = 'completed'
        `;
        
        const result = await this.db.query(query, [tenantId, cutoffDate]);
        
        for (const row of result.rows) {
          await this.deleteBackup(row.id);
        }

        if (result.rows.length > 0) {
          logger.info(`${result.rows.length} anciennes sauvegardes supprimées pour le tenant ${tenantId}`);
        }
      }

    } catch (error) {
      logger.error('Erreur lors du nettoyage des sauvegardes:', error);
    }
  }

  /**
   * Valide l'intégrité d'une sauvegarde
   */
  async validateBackupIntegrity(metadata: BackupMetadata): Promise<boolean> {
    try {
      const backupFile = path.join(this.defaultConfig.backupPath, `${metadata.id}.backup`);
      
      // Vérifier l'existence du fichier
      try {
        await fs.access(backupFile);
      } catch (error) {
        logger.error(`Fichier de sauvegarde ${backupFile} non trouvé`);
        return false;
      }

      // Vérifier le checksum
      const currentChecksum = await this.calculateFileChecksum(backupFile);
      if (currentChecksum !== metadata.checksum) {
        logger.error(`Checksum invalide pour la sauvegarde ${metadata.id}`);
        await this.updateBackupStatus(metadata.id, 'corrupted', 'Checksum invalide');
        return false;
      }

      // Vérifier la taille
      const stats = await fs.stat(backupFile);
      if (stats.size !== metadata.size) {
        logger.error(`Taille invalide pour la sauvegarde ${metadata.id}`);
        await this.updateBackupStatus(metadata.id, 'corrupted', 'Taille invalide');
        return false;
      }

      return true;

    } catch (error) {
      logger.error(`Erreur lors de la validation de l'intégrité:`, error);
      return false;
    }
  }

  // Méthodes privées

  private async initializeBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.defaultConfig.backupPath, { recursive: true });
      
      // Créer la table des métadonnées si elle n'existe pas
      await this.createBackupMetadataTable();
      
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du répertoire de sauvegarde:', error);
    }
  }

  private async createBackupMetadataTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS backup_metadata (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        size BIGINT DEFAULT 0,
        checksum VARCHAR(255),
        encrypted BOOLEAN DEFAULT true,
        compressed BOOLEAN DEFAULT true,
        tables JSONB DEFAULT '[]'::jsonb,
        version VARCHAR(50),
        status VARCHAR(50) DEFAULT 'in_progress',
        error_message TEXT
      )
    `;

    await this.db.query(query);
  }

  private async scheduleAutomaticBackups(): Promise<void> {
    // Programmer les sauvegardes automatiques pour tous les tenants configurés
    for (const [tenantId, config] of this.backupConfigs) {
      await this.scheduleBackupForTenant(tenantId, config);
    }

    // Programmer le nettoyage automatique (tous les jours à 3h)
    setInterval(async () => {
      await this.cleanupOldBackups();
    }, 24 * 60 * 60 * 1000); // 24 heures
  }

  private async scheduleBackupForTenant(tenantId: string, config: BackupConfig): Promise<void> {
    // Annuler la programmation précédente
    const existingTimeout = this.scheduledBackups.get(tenantId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Programmer la prochaine sauvegarde (simplification - en production utiliser node-cron)
    const backupInterval = 24 * 60 * 60 * 1000; // 24 heures
    const timeout = setTimeout(async () => {
      try {
        await this.createIncrementalBackup(tenantId);
        // Reprogrammer la suivante
        await this.scheduleBackupForTenant(tenantId, config);
      } catch (error) {
        logger.error(`Erreur lors de la sauvegarde automatique pour ${tenantId}:`, error);
      }
    }, backupInterval);

    this.scheduledBackups.set(tenantId, timeout);
  }

  private async getTablesToBackup(tenantId?: string): Promise<string[]> {
    // Récupérer toutes les tables de la base de données
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    const result = await this.db.query(query);
    let tables = result.rows.map(row => row.table_name);

    // Filtrer selon la configuration
    const config = tenantId ? this.backupConfigs.get(tenantId) : this.defaultConfig;
    if (config) {
      if (config.includeTables.length > 0) {
        tables = tables.filter(table => config.includeTables.includes(table));
      }
      if (config.excludeTables.length > 0) {
        tables = tables.filter(table => !config.excludeTables.includes(table));
      }
    }

    return tables;
  }

  private async createBackupDirectory(backupId: string): Promise<string> {
    const backupDir = path.join(this.defaultConfig.backupPath, 'temp', backupId);
    await fs.mkdir(backupDir, { recursive: true });
    return backupDir;
  }

  private async backupTable(tableName: string, tenantId: string | undefined, backupDir: string): Promise<string> {
    const outputFile = path.join(backupDir, `${tableName}.sql`);
    
    // Construire la requête avec filtre tenant si applicable
    let query = `SELECT * FROM ${tableName}`;
    const params: any[] = [];
    
    if (tenantId && await this.tableHasTenantColumn(tableName)) {
      query += ' WHERE tenant_id = $1';
      params.push(tenantId);
    }

    const result = await this.db.query(query, params);
    
    // Générer le script SQL
    let sqlContent = `-- Sauvegarde de la table ${tableName}\n`;
    sqlContent += `-- Date: ${new Date().toISOString()}\n`;
    sqlContent += `-- Tenant: ${tenantId || 'global'}\n\n`;

    if (result.rows.length > 0) {
      const columns = Object.keys(result.rows[0]);
      
      for (const row of result.rows) {
        const values = columns.map(col => {
          const value = row[col];
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (value instanceof Date) return `'${value.toISOString()}'`;
          return value.toString();
        });

        sqlContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }
    }

    // Chiffrer le contenu si nécessaire
    if (tenantId) {
      const encryptedContent = await encryptionService.encryptData(sqlContent, tenantId);
      await fs.writeFile(outputFile, JSON.stringify(encryptedContent));
    } else {
      await fs.writeFile(outputFile, sqlContent);
    }

    return outputFile;
  }

  private async backupTableIncremental(
    tableName: string, 
    tenantId: string | undefined, 
    sinceDate: Date, 
    backupDir: string
  ): Promise<string> {
    const outputFile = path.join(backupDir, `${tableName}.sql`);
    
    // Requête pour les enregistrements modifiés
    let query = `SELECT * FROM ${tableName} WHERE `;
    const params: any[] = [];
    let paramIndex = 1;

    // Filtre par date de modification
    if (await this.tableHasTimestampColumn(tableName)) {
      query += `updated_at >= $${paramIndex}`;
      params.push(sinceDate);
      paramIndex++;
    } else if (await this.tableHasCreatedAtColumn(tableName)) {
      query += `created_at >= $${paramIndex}`;
      params.push(sinceDate);
      paramIndex++;
    } else {
      // Fallback: sauvegarder toute la table
      query = `SELECT * FROM ${tableName}`;
    }

    // Ajouter le filtre tenant
    if (tenantId && await this.tableHasTenantColumn(tableName)) {
      if (params.length > 0) query += ' AND ';
      query += `tenant_id = $${paramIndex}`;
      params.push(tenantId);
    }

    const result = await this.db.query(query, params);
    
    // Générer le script SQL (même logique que backupTable)
    let sqlContent = `-- Sauvegarde incrémentale de la table ${tableName}\n`;
    sqlContent += `-- Date: ${new Date().toISOString()}\n`;
    sqlContent += `-- Depuis: ${sinceDate.toISOString()}\n`;
    sqlContent += `-- Tenant: ${tenantId || 'global'}\n\n`;

    if (result.rows.length > 0) {
      const columns = Object.keys(result.rows[0]);
      
      for (const row of result.rows) {
        const values = columns.map(col => {
          const value = row[col];
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (value instanceof Date) return `'${value.toISOString()}'`;
          return value.toString();
        });

        sqlContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO UPDATE SET `;
        const updateClauses = columns.filter(col => col !== 'id').map(col => `${col} = EXCLUDED.${col}`);
        sqlContent += updateClauses.join(', ') + ';\n';
      }
    }

    // Chiffrer si nécessaire
    if (tenantId) {
      const encryptedContent = await encryptionService.encryptData(sqlContent, tenantId);
      await fs.writeFile(outputFile, JSON.stringify(encryptedContent));
    } else {
      await fs.writeFile(outputFile, sqlContent);
    }

    return outputFile;
  }

  private async createBackupArchive(backupId: string, files: string[]): Promise<string> {
    const archiveFile = path.join(this.defaultConfig.backupPath, `${backupId}.backup`);
    
    // Créer une archive simple (en production, utiliser tar ou zip)
    const archiveContent = {
      id: backupId,
      createdAt: new Date().toISOString(),
      files: {}
    };

    for (const file of files) {
      const fileName = path.basename(file);
      const content = await fs.readFile(file, 'utf8');
      (archiveContent.files as any)[fileName] = content;
    }

    await fs.writeFile(archiveFile, JSON.stringify(archiveContent));
    return archiveFile;
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const query = `
      INSERT INTO backup_metadata (
        id, tenant_id, type, created_at, size, checksum, 
        encrypted, compressed, tables, version, status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        size = EXCLUDED.size,
        checksum = EXCLUDED.checksum,
        status = EXCLUDED.status,
        error_message = EXCLUDED.error_message
    `;

    const values = [
      metadata.id,
      metadata.tenantId,
      metadata.type,
      metadata.createdAt,
      metadata.size,
      metadata.checksum,
      metadata.encrypted,
      metadata.compressed,
      JSON.stringify(metadata.tables),
      metadata.version,
      metadata.status,
      metadata.errorMessage
    ];

    await this.db.query(query, values);
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    const result = await this.db.query('SELECT * FROM backup_metadata WHERE id = $1', [backupId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type,
      createdAt: row.created_at,
      size: row.size,
      checksum: row.checksum,
      encrypted: row.encrypted,
      compressed: row.compressed,
      tables: JSON.parse(row.tables || '[]'),
      version: row.version,
      status: row.status,
      errorMessage: row.error_message
    };
  }

  private async updateBackupStatus(backupId: string, status: string, errorMessage?: string): Promise<void> {
    await this.db.query(
      'UPDATE backup_metadata SET status = $1, error_message = $2 WHERE id = $3',
      [status, errorMessage, backupId]
    );
  }

  private async getLastBackupDate(tenantId?: string): Promise<Date | null> {
    const query = tenantId
      ? 'SELECT MAX(created_at) as last_backup FROM backup_metadata WHERE tenant_id = $1 AND status = $2'
      : 'SELECT MAX(created_at) as last_backup FROM backup_metadata WHERE status = $1';
    
    const params = tenantId ? [tenantId, 'completed'] : ['completed'];
    const result = await this.db.query(query, params);
    
    return result.rows[0]?.last_backup || null;
  }

  private async tableHasChanges(tableName: string, tenantId: string | undefined, sinceDate: Date): Promise<boolean> {
    let query = `SELECT COUNT(*) as count FROM ${tableName} WHERE `;
    const params: any[] = [];
    let paramIndex = 1;

    // Vérifier les modifications depuis la date
    if (await this.tableHasTimestampColumn(tableName)) {
      query += `updated_at >= $${paramIndex}`;
      params.push(sinceDate);
      paramIndex++;
    } else if (await this.tableHasCreatedAtColumn(tableName)) {
      query += `created_at >= $${paramIndex}`;
      params.push(sinceDate);
      paramIndex++;
    } else {
      return true; // Pas de colonne de timestamp, considérer comme modifié
    }

    if (tenantId && await this.tableHasTenantColumn(tableName)) {
      query += ` AND tenant_id = $${paramIndex}`;
      params.push(tenantId);
    }

    const result = await this.db.query(query, params);
    return parseInt(result.rows[0].count) > 0;
  }

  private async tableHasTenantColumn(tableName: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = $1 AND column_name = 'tenant_id'`,
      [tableName]
    );
    return result.rows.length > 0;
  }

  private async tableHasTimestampColumn(tableName: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = $1 AND column_name = 'updated_at'`,
      [tableName]
    );
    return result.rows.length > 0;
  }

  private async tableHasCreatedAtColumn(tableName: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = $1 AND column_name = 'created_at'`,
      [tableName]
    );
    return result.rows.length > 0;
  }

  private async cleanupTemporaryFiles(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        if (stats.isDirectory()) {
          await fs.rmdir(file, { recursive: true });
        } else {
          await fs.unlink(file);
        }
      } catch (error) {
        logger.warn(`Impossible de supprimer le fichier temporaire ${file}:`, error);
      }
    }
  }

  private async validateRestoreOptions(options: RestoreOptions): Promise<void> {
    if (!options.backupId) {
      throw new Error('ID de sauvegarde requis');
    }

    if (options.pointInTime && options.pointInTime > new Date()) {
      throw new Error('La date de restauration ne peut pas être dans le futur');
    }

    // Autres validations...
  }

  private async extractBackupArchive(backupId: string): Promise<string> {
    const archiveFile = path.join(this.defaultConfig.backupPath, `${backupId}.backup`);
    const extractDir = path.join(this.defaultConfig.backupPath, 'temp', `restore_${backupId}`);
    
    await fs.mkdir(extractDir, { recursive: true });
    
    // Lire l'archive
    const archiveContent = JSON.parse(await fs.readFile(archiveFile, 'utf8'));
    
    // Extraire les fichiers
    for (const [fileName, content] of Object.entries(archiveContent.files)) {
      const filePath = path.join(extractDir, fileName);
      await fs.writeFile(filePath, content as string);
    }
    
    return extractDir;
  }

  private async restoreTable(
    tableName: string, 
    extractDir: string, 
    tenantId?: string, 
    targetTenantId?: string
  ): Promise<number> {
    const tableFile = path.join(extractDir, `${tableName}.sql`);
    
    try {
      await fs.access(tableFile);
    } catch (error) {
      throw new Error(`Fichier de table ${tableName} non trouvé dans la sauvegarde`);
    }

    let sqlContent = await fs.readFile(tableFile, 'utf8');
    
    // Déchiffrer si nécessaire
    if (tenantId) {
      try {
        const encryptedData = JSON.parse(sqlContent);
        sqlContent = await encryptionService.decryptData(encryptedData, tenantId);
      } catch (error) {
        // Le contenu n'est peut-être pas chiffré
        logger.warn(`Impossible de déchiffrer le contenu de ${tableName}, tentative en clair`);
      }
    }

    // Modifier les tenant_id si restauration vers un autre tenant
    if (targetTenantId && targetTenantId !== tenantId) {
      sqlContent = sqlContent.replace(
        new RegExp(`'${tenantId}'`, 'g'),
        `'${targetTenantId}'`
      );
    }

    // Exécuter les requêtes SQL
    const statements = sqlContent.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
    let recordsRestored = 0;

    for (const statement of statements) {
      if (statement.trim()) {
        await this.db.query(statement.trim());
        recordsRestored++;
      }
    }

    return recordsRestored;
  }
}

export const backupService = new BackupService();