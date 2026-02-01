import { Request, Response, NextFunction } from 'express';
import { tenantIsolationService, TenantContext } from '../services/tenantIsolationService';
import { encryptionService } from '../services/encryptionService';

/**
 * Middleware de sécurité pour l'application des politiques de chiffrement et d'isolation
 */

// Extension de l'interface Request pour inclure le contexte de sécurité
declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
      securityContext?: SecurityContext;
      encryptedResponse?: boolean;
    }
  }
}

export interface SecurityContext {
  requiresEncryption: boolean;
  auditLevel: 'none' | 'basic' | 'full';
  dataClassification: 'public' | 'internal' | 'confidential' | 'secret';
  accessRestrictions: string[];
}

/**
 * Middleware d'initialisation du contexte tenant
 */
export const initializeTenantContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extraire les informations utilisateur du token JWT
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: 'Utilisateur non authentifié' });
      return;
    }

    // Créer le contexte tenant
    const tenantContext = await tenantIsolationService.createTenantContext(
      user.id,
      user.organizationId,
      user.role
    );

    req.tenantContext = tenantContext;

    // Définir le contexte de sécurité basé sur le rôle
    req.securityContext = {
      requiresEncryption: true,
      auditLevel: 'full',
      dataClassification: getDataClassificationForRole(user.role),
      accessRestrictions: getAccessRestrictionsForRole(user.role)
    };

    next();
  } catch (error) {
    console.error('Erreur d\'initialisation du contexte tenant:', error);
    res.status(500).json({ error: 'Erreur de sécurité interne' });
  }
};

/**
 * Middleware de validation d'accès aux ressources
 */
export const validateResourceAccess = (
  resourceType: string,
  requiredPermission: string
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantContext) {
        res.status(401).json({ error: 'Contexte tenant manquant' });
        return;
      }

      const resourceId = req.params.id || req.body.id || 'unknown';
      
      const hasAccess = await tenantIsolationService.validateResourceAccess(
        resourceType,
        resourceId,
        req.tenantContext,
        requiredPermission
      );

      if (!hasAccess) {
        res.status(403).json({ 
          error: 'Accès refusé',
          details: 'Permissions insuffisantes pour cette ressource'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Erreur de validation d\'accès:', error);
      res.status(500).json({ error: 'Erreur de validation de sécurité' });
    }
  };
};

/**
 * Middleware de chiffrement automatique des données sensibles
 */
export const encryptSensitiveData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantContext || !req.securityContext?.requiresEncryption) {
      next();
      return;
    }

    // Identifier les champs sensibles dans le body
    const sensitiveFields = identifySensitiveFields(req.body);
    
    if (sensitiveFields.length > 0) {
      // Chiffrer les champs sensibles
      for (const field of sensitiveFields) {
        if (req.body[field]) {
          const encryptedData = await tenantIsolationService.encryptTenantData(
            { [field]: req.body[field] },
            req.tenantContext
          );
          req.body[`${field}_encrypted`] = encryptedData;
          delete req.body[field]; // Supprimer la version non chiffrée
        }
      }
    }

    next();
  } catch (error) {
    console.error('Erreur de chiffrement des données:', error);
    res.status(500).json({ error: 'Erreur de chiffrement' });
  }
};

/**
 * Middleware de déchiffrement automatique des réponses
 */
export const decryptResponseData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantContext) {
      next();
      return;
    }

    // Intercepter la méthode json de la réponse
    const originalJson = res.json;
    res.json = function(data: any) {
      if (req.encryptedResponse && data) {
        // Déchiffrer les données avant envoi
        decryptResponseFields(data, req.tenantContext!)
          .then(decryptedData => {
            originalJson.call(this, decryptedData);
          })
          .catch(error => {
            console.error('Erreur de déchiffrement de réponse:', error);
            originalJson.call(this, { error: 'Erreur de déchiffrement' });
          });
      } else {
        originalJson.call(this, data);
      }
      return this;
    };

    next();
  } catch (error) {
    console.error('Erreur de configuration du déchiffrement:', error);
    next();
  }
};

/**
 * Middleware d'audit des accès aux données
 */
export const auditDataAccess = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantContext) {
        next();
        return;
      }

      // Enregistrer l'accès avant traitement
      const startTime = Date.now();
      
      // Intercepter la réponse pour enregistrer le résultat
      const originalSend = res.send;
      res.send = function(data: any) {
        const endTime = Date.now();
        const success = res.statusCode < 400;
        
        // Enregistrement asynchrone de l'audit
        setImmediate(() => {
          recordAuditLog({
            tenantId: req.tenantContext!.tenantId,
            userId: req.tenantContext!.userId,
            action,
            resourceType: extractResourceType(req.path),
            resourceId: req.params.id || 'unknown',
            success,
            duration: endTime - startTime,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            requestPath: req.path,
            method: req.method
          });
        });

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Erreur d\'audit:', error);
      next(); // Continuer même en cas d'erreur d'audit
    }
  };
};

/**
 * Middleware de détection d'intrusions
 */
export const detectIntrusions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.tenantContext) {
      next();
      return;
    }

    // Vérifications de sécurité
    const securityChecks = [
      checkSuspiciousPatterns(req),
      checkRateLimiting(req),
      checkGeolocation(req),
      checkDeviceFingerprint(req)
    ];

    const results = await Promise.all(securityChecks);
    const threats = results.filter(result => result.isThreat);

    if (threats.length > 0) {
      // Enregistrer la tentative d'intrusion
      await recordSecurityViolation({
        tenantId: req.tenantContext.tenantId,
        violationType: 'intrusion_attempt',
        severity: calculateThreatSeverity(threats),
        description: `Tentative d'intrusion détectée: ${threats.map(t => t.reason).join(', ')}`,
        userId: req.tenantContext.userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { threats, requestPath: req.path }
      });

      // Bloquer la requête si la menace est critique
      const criticalThreats = threats.filter(t => t.severity === 'critical');
      if (criticalThreats.length > 0) {
        res.status(403).json({ 
          error: 'Accès bloqué pour des raisons de sécurité',
          requestId: req.get('X-Request-ID')
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('Erreur de détection d\'intrusions:', error);
    next(); // Continuer en cas d'erreur de détection
  }
};

/**
 * Middleware de chiffrement des réponses sensibles
 */
export const encryptResponse = (req: Request, res: Response, next: NextFunction): void => {
  if (req.securityContext?.dataClassification === 'secret' || 
      req.securityContext?.dataClassification === 'confidential') {
    req.encryptedResponse = true;
  }
  next();
};

// Fonctions utilitaires

function getDataClassificationForRole(role: string): 'public' | 'internal' | 'confidential' | 'secret' {
  const classifications: Record<string, 'public' | 'internal' | 'confidential' | 'secret'> = {
    'avocat': 'confidential',
    'notaire': 'secret',
    'huissier': 'confidential',
    'magistrat': 'secret',
    'etudiant': 'public',
    'juriste_entreprise': 'internal',
    'admin': 'secret'
  };
  
  return classifications[role] || 'internal';
}

function getAccessRestrictionsForRole(role: string): string[] {
  const restrictions: Record<string, string[]> = {
    'avocat': ['own_clients_only', 'barreau_jurisdiction'],
    'notaire': ['own_acts_only', 'notarial_jurisdiction'],
    'huissier': ['own_exploits_only', 'territorial_jurisdiction'],
    'magistrat': ['court_jurisdiction', 'case_assignment'],
    'etudiant': ['educational_content_only', 'no_real_cases'],
    'juriste_entreprise': ['company_data_only'],
    'admin': []
  };
  
  return restrictions[role] || ['default_restrictions'];
}

function identifySensitiveFields(data: any): string[] {
  const sensitivePatterns = [
    'password', 'secret', 'token', 'key',
    'client_info', 'personal_data', 'financial_data',
    'medical_info', 'legal_advice', 'case_details'
  ];
  
  const fields: string[] = [];
  
  if (typeof data === 'object' && data !== null) {
    Object.keys(data).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitivePatterns.some(pattern => lowerKey.includes(pattern))) {
        fields.push(key);
      }
    });
  }
  
  return fields;
}

async function decryptResponseFields(data: any, context: TenantContext): Promise<any> {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const decrypted = { ...data };
  
  for (const [key, value] of Object.entries(data)) {
    if (key.endsWith('_encrypted') && value) {
      try {
        const decryptedValue = await tenantIsolationService.decryptTenantData(
          value as any,
          context
        );
        const originalKey = key.replace('_encrypted', '');
        decrypted[originalKey] = decryptedValue;
        delete decrypted[key];
      } catch (error) {
        console.error(`Erreur de déchiffrement pour ${key}:`, error);
      }
    }
  }
  
  return decrypted;
}

function extractResourceType(path: string): string {
  const segments = path.split('/').filter(s => s);
  return segments[1] || 'unknown'; // Généralement /api/resourceType/...
}

async function recordAuditLog(logData: any): Promise<void> {
  // En production, enregistrer en base de données
  console.log('Audit Log:', logData);
}

async function recordSecurityViolation(violation: any): Promise<void> {
  // En production, enregistrer en base de données et alerter
  console.warn('Security Violation:', violation);
}

interface ThreatCheck {
  isThreat: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

async function checkSuspiciousPatterns(req: Request): Promise<ThreatCheck> {
  // Vérifier les patterns suspects dans l'URL et les paramètres
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS
    /union.*select/i,  // SQL injection
    /exec\(/i,  // Code injection
  ];
  
  const fullUrl = req.originalUrl;
  const body = JSON.stringify(req.body || {});
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(body)) {
      return {
        isThreat: true,
        severity: 'high',
        reason: 'Pattern suspect détecté'
      };
    }
  }
  
  return { isThreat: false, severity: 'low', reason: '' };
}

async function checkRateLimiting(req: Request): Promise<ThreatCheck> {
  // Vérification simple du rate limiting
  // En production, utiliser Redis ou une solution dédiée
  return { isThreat: false, severity: 'low', reason: '' };
}

async function checkGeolocation(req: Request): Promise<ThreatCheck> {
  // Vérification de géolocalisation suspecte
  // En production, intégrer avec un service de géolocalisation
  return { isThreat: false, severity: 'low', reason: '' };
}

async function checkDeviceFingerprint(req: Request): Promise<ThreatCheck> {
  // Vérification de l'empreinte de l'appareil
  // En production, analyser les headers et caractéristiques
  return { isThreat: false, severity: 'low', reason: '' };
}

function calculateThreatSeverity(threats: ThreatCheck[]): 'low' | 'medium' | 'high' | 'critical' {
  const maxSeverity = threats.reduce((max, threat) => {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityLevels[threat.severity] > severityLevels[max] ? threat.severity : max;
  }, 'low' as 'low' | 'medium' | 'high' | 'critical');
  
  return maxSeverity;
}