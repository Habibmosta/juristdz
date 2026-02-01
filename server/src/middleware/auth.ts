import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/authService';
import { logger } from '@/utils/logger';
import { Profession, AuthenticatedRequest } from '@/types/auth';

/**
 * Authentication middleware to verify JWT tokens
 * Validates: Requirements 1.1, 1.5 - Authentication and session management
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const sessionInfo = await authService.validateSession(token);
    
    if (!sessionInfo.valid) {
      return res.status(401).json({
        success: false,
        error: sessionInfo.error || 'Invalid token'
      });
    }

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      userId: sessionInfo.userId!,
      email: sessionInfo.email!,
      activeRole: sessionInfo.activeRole as Profession,
      sessionId: sessionInfo.sessionId!
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Authorization middleware to check role permissions
 * Validates: Requirements 1.2, 1.3 - Role support and access control
 */
export const authorize = (allowedRoles: Profession[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(user.activeRole)) {
      logger.warn(`Access denied for user ${user.userId} with role ${user.activeRole} to resource requiring roles: ${allowedRoles.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const sessionInfo = await authService.validateSession(token);
    
    if (sessionInfo.valid) {
      (req as AuthenticatedRequest).user = {
        userId: sessionInfo.userId!,
        email: sessionInfo.email!,
        activeRole: sessionInfo.activeRole as Profession,
        sessionId: sessionInfo.sessionId!
      };
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue without authentication on error
  }
};

/**
 * Middleware to check if user has multiple roles and can switch
 * Validates: Requirements 1.4 - Multi-role management
 */
export const requireMultiRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user has multiple profiles/roles
    const { db } = await import('@/database/connection');
    const profilesResult = await db.query(
      'SELECT profession FROM user_profiles WHERE user_id = $1',
      [user.userId]
    );

    const profiles = (profilesResult as any).rows;
    
    if (profiles.length <= 1) {
      return res.status(403).json({
        success: false,
        error: 'User does not have multiple roles'
      });
    }

    next();
  } catch (error) {
    logger.error('Multi-role check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Role verification failed'
    });
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (maxAttempts: number = 5, windowMinutes: number = 15) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    const clientAttempts = attempts.get(clientId);

    if (!clientAttempts || now > clientAttempts.resetTime) {
      attempts.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (clientAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil((clientAttempts.resetTime - now) / 1000)
      });
    }

    clientAttempts.count++;
    next();
  };
};

// Alias for backward compatibility
export const authMiddleware = authenticate;
export const authenticateToken = authenticate;