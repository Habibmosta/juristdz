import crypto from 'crypto';
import { promisify } from 'util';

/**
 * Service de chiffrement pour la sécurisation des données sensibles
 * Implémente le chiffrement bout-en-bout avec isolation multi-tenant
 */

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  saltLength: number;
}

export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  salt?: string;
  algorithm: string;
  keyId: string;
}

export interface TenantKeyInfo {
  tenantId: string;
  keyId: string;
  createdAt: Date;
  rotatedAt?: Date;
  isActive: boolean;
}

export class EncryptionService {
  private readonly config: EncryptionConfig;
  private readonly tenantKeys: Map<string, Buffer> = new Map();
  private readonly keyRotationInterval = 90 * 24 * 60 * 60 * 1000; // 90 jours

  constructor() {
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
      saltLength: 32
    };
  }

  /**
   * Génère une clé de chiffrement spécifique au tenant
   */
  async generateTenantKey(tenantId: string): Promise<TenantKeyInfo> {
    const keyId = crypto.randomUUID();
    const key = crypto.randomBytes(this.config.keyLength);
    
    // Stockage sécurisé de la clé (en production, utiliser un HSM ou Key Vault)
    this.tenantKeys.set(`${tenantId}:${keyId}`, key);
    
    const keyInfo: TenantKeyInfo = {
      tenantId,
      keyId,
      createdAt: new Date(),
      isActive: true
    };

    // Enregistrer les métadonnées de la clé en base
    await this.storeTenantKeyMetadata(keyInfo);
    
    return keyInfo;
  }

  /**
   * Chiffre des données sensibles avec la clé du tenant
   */
  async encryptData(data: string, tenantId: string, keyId?: string): Promise<EncryptedData> {
    if (!data) {
      throw new Error('Données à chiffrer requises');
    }

    const activeKeyId = keyId || await this.getActiveTenantKeyId(tenantId);
    const key = this.tenantKeys.get(`${tenantId}:${activeKeyId}`);
    
    if (!key) {
      throw new Error(`Clé de chiffrement non trouvée pour le tenant ${tenantId}`);
    }

    const iv = crypto.randomBytes(this.config.ivLength);
    const cipher = crypto.createCipher(this.config.algorithm, key);
    cipher.setAAD(Buffer.from(tenantId)); // Données d'authentification additionnelles
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    return {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      algorithm: this.config.algorithm,
      keyId: activeKeyId
    };
  }

  /**
   * Déchiffre des données avec la clé du tenant
   */
  async decryptData(encryptedData: EncryptedData, tenantId: string): Promise<string> {
    const key = this.tenantKeys.get(`${tenantId}:${encryptedData.keyId}`);
    
    if (!key) {
      throw new Error(`Clé de déchiffrement non trouvée pour le tenant ${tenantId}`);
    }

    const decipher = crypto.createDecipher(encryptedData.algorithm, key);
    decipher.setAAD(Buffer.from(tenantId));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Chiffre un fichier avec la clé du tenant
   */
  async encryptFile(filePath: string, tenantId: string): Promise<EncryptedData> {
    const fs = require('fs').promises;
    const fileContent = await fs.readFile(filePath, 'utf8');
    return this.encryptData(fileContent, tenantId);
  }

  /**
   * Déchiffre un fichier avec la clé du tenant
   */
  async decryptFile(encryptedData: EncryptedData, tenantId: string, outputPath: string): Promise<void> {
    const fs = require('fs').promises;
    const decryptedContent = await this.decryptData(encryptedData, tenantId);
    await fs.writeFile(outputPath, decryptedContent, 'utf8');
  }

  /**
   * Rotation automatique des clés de chiffrement
   */
  async rotateTenantKey(tenantId: string): Promise<TenantKeyInfo> {
    const currentKeyInfo = await this.getTenantKeyInfo(tenantId);
    
    if (!currentKeyInfo) {
      throw new Error(`Aucune clé trouvée pour le tenant ${tenantId}`);
    }

    // Marquer l'ancienne clé comme inactive
    await this.deactivateTenantKey(tenantId, currentKeyInfo.keyId);
    
    // Générer une nouvelle clé
    const newKeyInfo = await this.generateTenantKey(tenantId);
    
    return newKeyInfo;
  }

  /**
   * Vérifie si une rotation de clé est nécessaire
   */
  async isKeyRotationNeeded(tenantId: string): Promise<boolean> {
    const keyInfo = await this.getTenantKeyInfo(tenantId);
    
    if (!keyInfo) {
      return true; // Aucune clé = rotation nécessaire
    }

    const now = new Date();
    const keyAge = now.getTime() - keyInfo.createdAt.getTime();
    
    return keyAge > this.keyRotationInterval;
  }

  /**
   * Chiffrement de données en transit (pour les API)
   */
  async encryptTransitData(data: any, tenantId: string): Promise<string> {
    const jsonData = JSON.stringify(data);
    const encrypted = await this.encryptData(jsonData, tenantId);
    return Buffer.from(JSON.stringify(encrypted)).toString('base64');
  }

  /**
   * Déchiffrement de données en transit
   */
  async decryptTransitData(encryptedBase64: string, tenantId: string): Promise<any> {
    const encryptedJson = Buffer.from(encryptedBase64, 'base64').toString('utf8');
    const encryptedData: EncryptedData = JSON.parse(encryptedJson);
    const decryptedJson = await this.decryptData(encryptedData, tenantId);
    return JSON.parse(decryptedJson);
  }

  /**
   * Génère un hash sécurisé pour l'indexation des données chiffrées
   */
  generateSearchableHash(data: string, tenantId: string): string {
    const salt = crypto.createHash('sha256').update(tenantId).digest();
    return crypto.pbkdf2Sync(data.toLowerCase(), salt, 10000, 32, 'sha256').toString('hex');
  }

  /**
   * Validation de l'intégrité des données chiffrées
   */
  async validateDataIntegrity(encryptedData: EncryptedData, tenantId: string): Promise<boolean> {
    try {
      await this.decryptData(encryptedData, tenantId);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Méthodes privées pour la gestion des clés

  private async getActiveTenantKeyId(tenantId: string): Promise<string> {
    // En production, récupérer depuis la base de données
    const keyInfo = await this.getTenantKeyInfo(tenantId);
    
    if (!keyInfo || !keyInfo.isActive) {
      // Générer une nouvelle clé si aucune clé active
      const newKeyInfo = await this.generateTenantKey(tenantId);
      return newKeyInfo.keyId;
    }
    
    return keyInfo.keyId;
  }

  private async getTenantKeyInfo(tenantId: string): Promise<TenantKeyInfo | null> {
    // En production, récupérer depuis la base de données
    // Pour l'instant, simulation avec les clés en mémoire
    for (const [keyRef] of this.tenantKeys) {
      if (keyRef.startsWith(`${tenantId}:`)) {
        const keyId = keyRef.split(':')[1];
        return {
          tenantId,
          keyId,
          createdAt: new Date(),
          isActive: true
        };
      }
    }
    return null;
  }

  private async storeTenantKeyMetadata(keyInfo: TenantKeyInfo): Promise<void> {
    // En production, stocker en base de données sécurisée
    console.log(`Clé générée pour tenant ${keyInfo.tenantId}: ${keyInfo.keyId}`);
  }

  private async deactivateTenantKey(tenantId: string, keyId: string): Promise<void> {
    // En production, marquer comme inactive en base
    console.log(`Clé désactivée pour tenant ${tenantId}: ${keyId}`);
  }
}

export const encryptionService = new EncryptionService();