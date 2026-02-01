import { encryptionService, EncryptionService } from '@/services/encryptionService';

describe('EncryptionService', () => {
  let service: EncryptionService;
  const testTenantId = 'test-tenant-123';
  const testData = 'Données confidentielles du client';

  beforeEach(() => {
    service = new EncryptionService();
  });

  describe('Génération de clés tenant', () => {
    test('devrait générer une clé unique pour un tenant', async () => {
      const keyInfo = await service.generateTenantKey(testTenantId);
      
      expect(keyInfo).toBeDefined();
      expect(keyInfo.tenantId).toBe(testTenantId);
      expect(keyInfo.keyId).toBeDefined();
      expect(keyInfo.isActive).toBe(true);
      expect(keyInfo.createdAt).toBeInstanceOf(Date);
    });

    test('devrait générer des clés différentes pour des tenants différents', async () => {
      const key1 = await service.generateTenantKey('tenant-1');
      const key2 = await service.generateTenantKey('tenant-2');
      
      expect(key1.keyId).not.toBe(key2.keyId);
      expect(key1.tenantId).not.toBe(key2.tenantId);
    });
  });

  describe('Chiffrement et déchiffrement', () => {
    test('devrait chiffrer et déchiffrer des données correctement', async () => {
      // Générer une clé pour le tenant
      await service.generateTenantKey(testTenantId);
      
      // Chiffrer les données
      const encrypted = await service.encryptData(testData, testTenantId);
      
      expect(encrypted).toBeDefined();
      expect(encrypted.data).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.keyId).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      
      // Déchiffrer les données
      const decrypted = await service.decryptData(encrypted, testTenantId);
      
      expect(decrypted).toBe(testData);
    });

    test('devrait échouer lors du déchiffrement avec un mauvais tenant', async () => {
      await service.generateTenantKey(testTenantId);
      await service.generateTenantKey('autre-tenant');
      
      const encrypted = await service.encryptData(testData, testTenantId);
      
      await expect(
        service.decryptData(encrypted, 'autre-tenant')
      ).rejects.toThrow('Clé de déchiffrement non trouvée');
    });

    test('devrait échouer avec des données vides', async () => {
      await expect(
        service.encryptData('', testTenantId)
      ).rejects.toThrow('Données à chiffrer requises');
    });
  });

  describe('Chiffrement de fichiers', () => {
    test('devrait chiffrer et déchiffrer un fichier', async () => {
      const fs = require('fs').promises;
      const testFilePath = '/tmp/test-file.txt';
      const outputPath = '/tmp/decrypted-file.txt';
      
      // Créer un fichier de test
      await fs.writeFile(testFilePath, testData, 'utf8');
      
      await service.generateTenantKey(testTenantId);
      
      // Chiffrer le fichier
      const encrypted = await service.encryptFile(testFilePath, testTenantId);
      
      expect(encrypted).toBeDefined();
      
      // Déchiffrer le fichier
      await service.decryptFile(encrypted, testTenantId, outputPath);
      
      // Vérifier le contenu déchiffré
      const decryptedContent = await fs.readFile(outputPath, 'utf8');
      expect(decryptedContent).toBe(testData);
      
      // Nettoyer
      await fs.unlink(testFilePath);
      await fs.unlink(outputPath);
    });
  });

  describe('Rotation des clés', () => {
    test('devrait effectuer la rotation d\'une clé', async () => {
      const originalKey = await service.generateTenantKey(testTenantId);
      
      // Effectuer la rotation
      const newKey = await service.rotateTenantKey(testTenantId);
      
      expect(newKey.keyId).not.toBe(originalKey.keyId);
      expect(newKey.tenantId).toBe(testTenantId);
      expect(newKey.isActive).toBe(true);
    });

    test('devrait détecter le besoin de rotation', async () => {
      await service.generateTenantKey(testTenantId);
      
      // Pour une nouvelle clé, pas de rotation nécessaire
      const needsRotation = await service.isKeyRotationNeeded(testTenantId);
      expect(needsRotation).toBe(false);
    });
  });

  describe('Chiffrement en transit', () => {
    test('devrait chiffrer et déchiffrer des données en transit', async () => {
      await service.generateTenantKey(testTenantId);
      
      const testObject = {
        clientName: 'Jean Dupont',
        caseNumber: 'CASE-2024-001',
        confidentialInfo: 'Information sensible'
      };
      
      // Chiffrer pour le transit
      const encrypted = await service.encryptTransitData(testObject, testTenantId);
      
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
      
      // Déchiffrer
      const decrypted = await service.decryptTransitData(encrypted, testTenantId);
      
      expect(decrypted).toEqual(testObject);
    });
  });

  describe('Hash pour recherche', () => {
    test('devrait générer un hash cohérent pour la recherche', () => {
      const searchTerm = 'Jean Dupont';
      
      const hash1 = service.generateSearchableHash(searchTerm, testTenantId);
      const hash2 = service.generateSearchableHash(searchTerm, testTenantId);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex
    });

    test('devrait générer des hash différents pour des tenants différents', () => {
      const searchTerm = 'Jean Dupont';
      
      const hash1 = service.generateSearchableHash(searchTerm, 'tenant-1');
      const hash2 = service.generateSearchableHash(searchTerm, 'tenant-2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Validation d\'intégrité', () => {
    test('devrait valider l\'intégrité des données correctes', async () => {
      await service.generateTenantKey(testTenantId);
      
      const encrypted = await service.encryptData(testData, testTenantId);
      const isValid = await service.validateDataIntegrity(encrypted, testTenantId);
      
      expect(isValid).toBe(true);
    });

    test('devrait détecter les données corrompues', async () => {
      await service.generateTenantKey(testTenantId);
      
      const encrypted = await service.encryptData(testData, testTenantId);
      
      // Corrompre les données
      encrypted.data = encrypted.data.substring(0, -10) + '0000000000';
      
      const isValid = await service.validateDataIntegrity(encrypted, testTenantId);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Gestion des erreurs', () => {
    test('devrait gérer les clés manquantes', async () => {
      await expect(
        service.encryptData(testData, 'tenant-inexistant')
      ).rejects.toThrow('Clé de chiffrement non trouvée');
    });

    test('devrait gérer les données de déchiffrement invalides', async () => {
      await service.generateTenantKey(testTenantId);
      
      const invalidEncrypted = {
        data: 'invalid-data',
        iv: 'invalid-iv',
        tag: 'invalid-tag',
        algorithm: 'aes-256-gcm',
        keyId: 'invalid-key'
      };
      
      await expect(
        service.decryptData(invalidEncrypted, testTenantId)
      ).rejects.toThrow();
    });
  });
});