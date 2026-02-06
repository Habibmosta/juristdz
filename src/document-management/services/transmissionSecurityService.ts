/**
 * Transmission Security Service
 * Implements TLS 1.3 encryption, secure API endpoints, and request/response encryption
 * 
 * Requirements: 7.2 - Transmission security with TLS 1.3
 */

import * as crypto from 'crypto';

export interface SecureTransmissionConfig {
  tlsVersion: string;
  cipherSuites: string[];
  requireClientCertificate: boolean;
  certificatePinning: boolean;
}

export interface EncryptedPayload {
  data: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

export interface TransmissionSecurityResult {
  success: boolean;
  error?: string;
  encrypted?: EncryptedPayload;
  decrypted?: any;
}

class TransmissionSecurityService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32; // 256 bits
  private readonly IV_LENGTH = 16; // 128 bits
  private readonly AUTH_TAG_LENGTH = 16; // 128 bits

  private config: SecureTransmissionConfig = {
    tlsVersion: 'TLSv1.3',
    cipherSuites: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
    ],
    requireClientCertificate: false,
    certificatePinning: false,
  };

  /**
   * Encrypt payload for transmission
   */
  encryptPayload(data: any, key: Buffer): TransmissionSecurityResult {
    try {
      // Validate key
      if (key.length !== this.KEY_LENGTH) {
        return {
          success: false,
          error: 'Invalid key length',
        };
      }

      // Generate random IV
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      // Serialize data
      const serialized = JSON.stringify(data);

      // Encrypt
      let encrypted = cipher.update(serialized, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      const payload: EncryptedPayload = {
        data: encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        algorithm: this.ALGORITHM,
      };

      return {
        success: true,
        encrypted: payload,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed',
      };
    }
  }

  /**
   * Decrypt received payload
   */
  decryptPayload(payload: EncryptedPayload, key: Buffer): TransmissionSecurityResult {
    try {
      // Validate key
      if (key.length !== this.KEY_LENGTH) {
        return {
          success: false,
          error: 'Invalid key length',
        };
      }

      // Validate algorithm
      if (payload.algorithm !== this.ALGORITHM) {
        return {
          success: false,
          error: 'Unsupported algorithm',
        };
      }

      // Parse IV and auth tag
      const iv = Buffer.from(payload.iv, 'base64');
      const authTag = Buffer.from(payload.authTag, 'base64');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(payload.data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      // Parse JSON
      const data = JSON.parse(decrypted);

      return {
        success: true,
        decrypted: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
      };
    }
  }

  /**
   * Generate secure transmission key
   */
  generateTransmissionKey(): Buffer {
    return crypto.randomBytes(this.KEY_LENGTH);
  }

  /**
   * Derive key from password using PBKDF2
   */
  deriveKeyFromPassword(password: string, salt: Buffer, iterations: number = 100000): Buffer {
    return crypto.pbkdf2Sync(password, salt, iterations, this.KEY_LENGTH, 'sha256');
  }

  /**
   * Generate salt for key derivation
   */
  generateSalt(): Buffer {
    return crypto.randomBytes(16);
  }

  /**
   * Create secure hash of data
   */
  createSecureHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create HMAC for message authentication
   */
  createHMAC(data: string, key: Buffer): string {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(data: string, hmac: string, key: Buffer): boolean {
    const computed = this.createHMAC(data, key);
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
  }

  /**
   * Get TLS configuration for HTTPS server
   */
  getTLSConfig(): {
    minVersion: string;
    maxVersion: string;
    ciphers: string;
    honorCipherOrder: boolean;
    requestCert: boolean;
    rejectUnauthorized: boolean;
  } {
    return {
      minVersion: this.config.tlsVersion,
      maxVersion: this.config.tlsVersion,
      ciphers: this.config.cipherSuites.join(':'),
      honorCipherOrder: true,
      requestCert: this.config.requireClientCertificate,
      rejectUnauthorized: this.config.requireClientCertificate,
    };
  }

  /**
   * Validate TLS connection
   */
  validateTLSConnection(socket: any): {
    valid: boolean;
    version?: string;
    cipher?: string;
    error?: string;
  } {
    try {
      if (!socket.encrypted) {
        return {
          valid: false,
          error: 'Connection is not encrypted',
        };
      }

      const protocol = socket.getProtocol();
      const cipher = socket.getCipher();

      // Validate TLS version
      if (protocol !== this.config.tlsVersion) {
        return {
          valid: false,
          version: protocol,
          error: `Invalid TLS version: ${protocol}`,
        };
      }

      // Validate cipher suite
      if (!this.config.cipherSuites.includes(cipher.name)) {
        return {
          valid: false,
          cipher: cipher.name,
          error: `Invalid cipher suite: ${cipher.name}`,
        };
      }

      return {
        valid: true,
        version: protocol,
        cipher: cipher.name,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Create secure request headers
   */
  createSecureHeaders(payload: any, key: Buffer): Record<string, string> {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const payloadHash = this.createSecureHash(JSON.stringify(payload));
    
    // Create signature
    const signatureData = `${timestamp}:${nonce}:${payloadHash}`;
    const signature = this.createHMAC(signatureData, key);

    return {
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Payload-Hash': payloadHash,
      'X-Signature': signature,
      'X-TLS-Version': this.config.tlsVersion,
    };
  }

  /**
   * Verify secure request headers
   */
  verifySecureHeaders(
    headers: Record<string, string>,
    payload: any,
    key: Buffer
  ): {
    valid: boolean;
    error?: string;
  } {
    try {
      const timestamp = headers['x-timestamp'];
      const nonce = headers['x-nonce'];
      const payloadHash = headers['x-payload-hash'];
      const signature = headers['x-signature'];

      // Validate required headers
      if (!timestamp || !nonce || !payloadHash || !signature) {
        return {
          valid: false,
          error: 'Missing required security headers',
        };
      }

      // Validate timestamp (prevent replay attacks)
      const now = Date.now();
      const requestTime = parseInt(timestamp);
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (now - requestTime > maxAge) {
        return {
          valid: false,
          error: 'Request timestamp expired',
        };
      }

      // Validate payload hash
      const computedHash = this.createSecureHash(JSON.stringify(payload));
      if (payloadHash !== computedHash) {
        return {
          valid: false,
          error: 'Payload hash mismatch',
        };
      }

      // Validate signature
      const signatureData = `${timestamp}:${nonce}:${payloadHash}`;
      if (!this.verifyHMAC(signatureData, signature, key)) {
        return {
          valid: false,
          error: 'Invalid signature',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Encrypt file for transmission
   */
  encryptFile(fileBuffer: Buffer, key: Buffer): TransmissionSecurityResult {
    try {
      if (key.length !== this.KEY_LENGTH) {
        return {
          success: false,
          error: 'Invalid key length',
        };
      }

      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      const encrypted = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final(),
      ]);

      const authTag = cipher.getAuthTag();

      const payload: EncryptedPayload = {
        data: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        algorithm: this.ALGORITHM,
      };

      return {
        success: true,
        encrypted: payload,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File encryption failed',
      };
    }
  }

  /**
   * Decrypt file from transmission
   */
  decryptFile(payload: EncryptedPayload, key: Buffer): TransmissionSecurityResult {
    try {
      if (key.length !== this.KEY_LENGTH) {
        return {
          success: false,
          error: 'Invalid key length',
        };
      }

      if (payload.algorithm !== this.ALGORITHM) {
        return {
          success: false,
          error: 'Unsupported algorithm',
        };
      }

      const iv = Buffer.from(payload.iv, 'base64');
      const authTag = Buffer.from(payload.authTag, 'base64');
      const encrypted = Buffer.from(payload.data, 'base64');

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return {
        success: true,
        decrypted: decrypted,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File decryption failed',
      };
    }
  }

  /**
   * Configure transmission security
   */
  configure(config: Partial<SecureTransmissionConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): SecureTransmissionConfig {
    return { ...this.config };
  }

  /**
   * Validate security configuration
   */
  validateConfiguration(): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate TLS version
    if (!this.config.tlsVersion.startsWith('TLSv1.')) {
      errors.push('Invalid TLS version');
    }

    // Validate cipher suites
    if (this.config.cipherSuites.length === 0) {
      errors.push('No cipher suites configured');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    authTagLength: number;
    tlsVersion: string;
    cipherSuites: string[];
  } {
    return {
      algorithm: this.ALGORITHM,
      keyLength: this.KEY_LENGTH,
      ivLength: this.IV_LENGTH,
      authTagLength: this.AUTH_TAG_LENGTH,
      tlsVersion: this.config.tlsVersion,
      cipherSuites: this.config.cipherSuites,
    };
  }
}

// Export singleton instance
export const transmissionSecurityService = new TransmissionSecurityService();
