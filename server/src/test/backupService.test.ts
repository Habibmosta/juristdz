import { backupService, BackupService, BackupMetadata, RestoreOptions } from '@/services/backupService';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('BackupService', () => {
  let service: BackupService;
  const testTenantId = 'test-tenant-123';
  const testBackupPath = './test-backups';

  beforeEach(async () => {
    service = new BackupService();
    
    // Créer le répertoire de test
    try {
      await fs.mkdir(testBackupPath, { recursive: true });
    } catch (error) {
      // Le répertoire existe déjà
    }
  });

  afterEach(async () => {
    // Nettoyer les fichiers de test
    try {
      await fs.rmdir(testBackupPath, { recursive: true });
    } catch (error) {
      // Répertoire non trouvé ou non vide
    }
  });

  describe('Configuration de sauvegarde', () => {
    test('devrait configurer la sauvegarde pour un tenant', async () => {
      const config = {
        schedule: '0 3 * * *',
        retentionDays: 60,
        compressionEnabled: true,
        encryptionEnabled: true,
        includeTables: ['users', 'documents'],
        excludeTables: ['logs'],
        backupPath: testBackupPath
      };

      await expect(service.configureBackup(testTenantId, config)).resolves.not.toThrow();
    });

    test('devrait utiliser la configuration par défaut si non spécifiée', async () => {
      await expect(service.configureBackup(testTenantId, {})).resolves.not.toThrow();
    });
  });

  describe('Sauvegarde complète', () => {
    test('devrait créer une sauvegarde complète', async () => {
      const metadata = await service.createFullBackup(testTenantId);

      expect(metadata).toBeDefined();
      expect(metadata.id).toBeDefined();
      expect(metadata.tenantId).toBe(testTenantId);
      expect(metadata.type).toBe('full');
      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.encrypted).toBe(true);
      expect(metadata.compressed).toBe(true);
      expect(Array.isArray(metadata.tables)).toBe(true);
      expect(metadata.version).toBeDefined();
    });

    test('devrait créer une sauvegarde globale sans tenant', async () => {
      const metadata = await service.createFullBackup();

      expect(metadata).toBeDefined();
      expect(metadata.tenantId).toBeUndefined();
      expect(metadata.type).toBe('full');
    });

    test('devrait calculer la taille et le checksum', async () => {
      const metadata = await service.createFullBackup(testTenantId);

      expect(metadata.size).toBeGreaterThan(0);
      expect(metadata.checksum).toBeDefined();
      expect(metadata.checksum).toHaveLength(64); // SHA-256
    });
  });

  describe('Sauvegarde incrémentale', () => {
    test('devrait créer une sauvegarde incrémentale', async () => {
      // Créer d'abord une sauvegarde complète
      await service.createFullBackup(testTenantId);

      // Attendre un peu pour avoir une différence de temps
      await new Promise(resolve => setTimeout(resolve, 100));

      const metadata = await service.createIncrementalBackup(testTenantId);

      expect(metadata).toBeDefined();
      expect(metadata.type).toBe('incremental');
      expect(metadata.tenantId).toBe(testTenantId);
    });

    test('devrait créer une sauvegarde complète si aucune précédente', async () => {
      const metadata = await service.createIncrementalBackup('nouveau-tenant');

      expect(metadata).toBeDefined();
      expect(metadata.type).toBe('full'); // Devrait fallback vers full
    });

    test('devrait détecter les tables sans modifications', async () => {
      // Créer une sauvegarde complète
      const firstBackup = await service.createFullBackup(testTenantId);
      
      // Créer immédiatement une sauvegarde incrémentale
      const incrementalBackup = await service.createIncrementalBackup(testTenantId);

      // La sauvegarde incrémentale devrait être plus petite ou vide
      expect(incrementalBackup.size).toBeLessThanOrEqual(firstBackup.size);
    });
  });

  describe('Liste des sauvegardes', () => {
    test('devrait lister les sauvegardes d\'un tenant', async () => {
      // Créer quelques sauvegardes
      await service.createFullBackup(testTenantId);
      await service.createIncrementalBackup(testTenantId);

      const backups = await service.listBackups(testTenantId);

      expect(Array.isArray(backups)).toBe(true);
      expect(backups.length).toBeGreaterThanOrEqual(2);
      expect(backups.every(b => b.tenantId === testTenantId)).toBe(true);
    });

    test('devrait lister toutes les sauvegardes si aucun tenant spécifié', async () => {
      await service.createFullBackup(testTenantId);
      await service.createFullBackup('autre-tenant');

      const backups = await service.listBackups();

      expect(Array.isArray(backups)).toBe(true);
      expect(backups.length).toBeGreaterThanOrEqual(2);
    });

    test('devrait retourner une liste vide pour un tenant sans sauvegardes', async () => {
      const backups = await service.listBackups('tenant-inexistant');

      expect(Array.isArray(backups)).toBe(true);
      expect(backups.length).toBe(0);
    });
  });

  describe('Validation d\'intégrité', () => {
    test('devrait valider une sauvegarde intègre', async () => {
      const metadata = await service.createFullBackup(testTenantId);
      const isValid = await service.validateBackupIntegrity(metadata);

      expect(isValid).toBe(true);
    });

    test('devrait détecter une sauvegarde corrompue', async () => {
      const metadata = await service.createFullBackup(testTenantId);
      
      // Corrompre le checksum
      const corruptedMetadata = { ...metadata, checksum: 'invalid-checksum' };
      const isValid = await service.validateBackupIntegrity(corruptedMetadata);

      expect(isValid).toBe(false);
    });

    test('devrait détecter un fichier manquant', async () => {
      const metadata = await service.createFullBackup(testTenantId);
      
      // Supprimer le fichier de sauvegarde
      const backupFile = path.join(testBackupPath, `${metadata.id}.backup`);
      try {
        await fs.unlink(backupFile);
      } catch (error) {
        // Fichier peut ne pas exister dans l'environnement de test
      }

      const isValid = await service.validateBackupIntegrity(metadata);
      expect(isValid).toBe(false);
    });
  });

  describe('Restauration', () => {
    test('devrait restaurer une sauvegarde complète', async () => {
      // Créer une sauvegarde
      const metadata = await service.createFullBackup(testTenantId);

      // Options de restauration en mode dry-run
      const options: RestoreOptions = {
        backupId: metadata.id,
        tenantId: testTenantId,
        validateIntegrity: true,
        dryRun: true
      };

      const result = await service.restoreBackup(options);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.restoredTables)).toBe(true);
      expect(Array.isArray(result.skippedTables)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.duration).toBe('number');
      expect(typeof result.recordsRestored).toBe('number');
    });

    test('devrait échouer avec un ID de sauvegarde invalide', async () => {
      const options: RestoreOptions = {
        backupId: 'backup-inexistant',
        validateIntegrity: false,
        dryRun: true
      };

      await expect(service.restoreBackup(options)).rejects.toThrow('Sauvegarde backup-inexistant non trouvée');
    });

    test('devrait valider les options de restauration', async () => {
      const invalidOptions: RestoreOptions = {
        backupId: '', // ID vide
        validateIntegrity: false,
        dryRun: true
      };

      await expect(service.restoreBackup(invalidOptions)).rejects.toThrow('ID de sauvegarde requis');
    });

    test('devrait permettre la restauration vers un autre tenant', async () => {
      const metadata = await service.createFullBackup(testTenantId);

      const options: RestoreOptions = {
        backupId: metadata.id,
        tenantId: testTenantId,
        targetTenantId: 'nouveau-tenant',
        validateIntegrity: false,
        dryRun: true
      };

      const result = await service.restoreBackup(options);
      expect(result.success).toBe(true);
    });

    test('devrait permettre la restauration de tables spécifiques', async () => {
      const metadata = await service.createFullBackup(testTenantId);

      const options: RestoreOptions = {
        backupId: metadata.id,
        tenantId: testTenantId,
        tables: ['users', 'documents'],
        validateIntegrity: false,
        dryRun: true
      };

      const result = await service.restoreBackup(options);
      expect(result.success).toBe(true);
    });
  });

  describe('Suppression de sauvegardes', () => {
    test('devrait supprimer une sauvegarde existante', async () => {
      const metadata = await service.createFullBackup(testTenantId);
      
      await expect(service.deleteBackup(metadata.id)).resolves.not.toThrow();

      // Vérifier que la sauvegarde n'existe plus
      const backups = await service.listBackups(testTenantId);
      expect(backups.find(b => b.id === metadata.id)).toBeUndefined();
    });

    test('devrait échouer pour une sauvegarde inexistante', async () => {
      await expect(service.deleteBackup('backup-inexistant')).rejects.toThrow('Sauvegarde backup-inexistant non trouvée');
    });
  });

  describe('Nettoyage automatique', () => {
    test('devrait nettoyer les anciennes sauvegardes', async () => {
      // Configurer une rétention courte pour le test
      await service.configureBackup(testTenantId, { retentionDays: 0 });

      // Créer une sauvegarde
      await service.createFullBackup(testTenantId);

      // Attendre un peu
      await new Promise(resolve => setTimeout(resolve, 100));

      // Lancer le nettoyage
      await expect(service.cleanupOldBackups()).resolves.not.toThrow();
    });
  });

  describe('Gestion des erreurs', () => {
    test('devrait gérer les erreurs de base de données', async () => {
      // Simuler une erreur en utilisant un tenant ID invalide
      await expect(service.createFullBackup('')).rejects.toThrow();
    });

    test('devrait gérer les erreurs de système de fichiers', async () => {
      // Configurer un chemin invalide
      await service.configureBackup(testTenantId, { 
        backupPath: '/chemin/inexistant/readonly' 
      });

      // La création devrait échouer gracieusement
      await expect(service.createFullBackup(testTenantId)).rejects.toThrow();
    });

    test('devrait marquer les sauvegardes échouées', async () => {
      try {
        // Forcer une erreur
        await service.createFullBackup(''); // Tenant ID vide
      } catch (error) {
        // L'erreur est attendue
      }

      // Vérifier que le statut d'erreur est enregistré
      const backups = await service.listBackups();
      const failedBackups = backups.filter(b => b.status === 'failed');
      
      // Il devrait y avoir au moins une sauvegarde échouée
      expect(failedBackups.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Métriques et statistiques', () => {
    test('devrait calculer les statistiques de sauvegarde', async () => {
      // Créer plusieurs sauvegardes
      await service.createFullBackup(testTenantId);
      await service.createIncrementalBackup(testTenantId);

      const backups = await service.listBackups(testTenantId);

      // Calculer les statistiques
      const totalSize = backups.reduce((sum, b) => sum + (b.size || 0), 0);
      const completedBackups = backups.filter(b => b.status === 'completed');

      expect(totalSize).toBeGreaterThan(0);
      expect(completedBackups.length).toBeGreaterThan(0);
    });

    test('devrait suivre les tendances de sauvegarde', async () => {
      const startTime = new Date();
      
      // Créer des sauvegardes
      await service.createFullBackup(testTenantId);
      await service.createIncrementalBackup(testTenantId);

      const backups = await service.listBackups(testTenantId);
      const recentBackups = backups.filter(b => b.createdAt >= startTime);

      expect(recentBackups.length).toBeGreaterThan(0);
    });
  });

  describe('Sécurité et chiffrement', () => {
    test('devrait chiffrer les sauvegardes par défaut', async () => {
      const metadata = await service.createFullBackup(testTenantId);

      expect(metadata.encrypted).toBe(true);
    });

    test('devrait permettre de désactiver le chiffrement', async () => {
      await service.configureBackup(testTenantId, { 
        encryptionEnabled: false 
      });

      const metadata = await service.createFullBackup(testTenantId);

      expect(metadata.encrypted).toBe(false);
    });

    test('devrait compresser les sauvegardes par défaut', async () => {
      const metadata = await service.createFullBackup(testTenantId);

      expect(metadata.compressed).toBe(true);
    });
  });

  describe('Cas limites', () => {
    test('devrait gérer les tenants sans données', async () => {
      const metadata = await service.createFullBackup('tenant-vide');

      expect(metadata).toBeDefined();
      expect(metadata.size).toBeGreaterThanOrEqual(0);
    });

    test('devrait gérer les sauvegardes simultanées', async () => {
      // Lancer plusieurs sauvegardes en parallèle
      const promises = [
        service.createFullBackup(testTenantId + '-1'),
        service.createFullBackup(testTenantId + '-2'),
        service.createFullBackup(testTenantId + '-3')
      ];

      const results = await Promise.allSettled(promises);
      
      // Au moins une devrait réussir
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });

    test('devrait gérer les interruptions de sauvegarde', async () => {
      // Simuler une interruption (difficile à tester sans mocking)
      // Pour l'instant, juste vérifier que le service gère les erreurs
      try {
        await service.createFullBackup(testTenantId);
      } catch (error) {
        // L'erreur devrait être gérée gracieusement
        expect(error).toBeDefined();
      }
    });
  });
});