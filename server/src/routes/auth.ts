import { Router } from 'express';
import Joi from 'joi';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticate, authRateLimit, requireMultiRole } from '@/middleware/auth';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { 
  LoginRequest, 
  RegisterRequest, 
  RefreshTokenRequest, 
  SwitchRoleRequest,
  EnableMFARequest,
  VerifyMFARequest,
  Profession,
  AuthenticatedRequest
} from '@/types/auth';

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  mfaCode: Joi.string().length(6).optional()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  profession: Joi.string().valid(...Object.values(Profession)).required(),
  registrationNumber: Joi.string().max(100).optional(),
  barreauId: Joi.string().max(100).optional(),
  organizationName: Joi.string().max(255).optional(),
  phoneNumber: Joi.string().max(20).optional(),
  address: Joi.object({
    line1: Joi.string().max(255).optional(),
    line2: Joi.string().max(255).optional(),
    city: Joi.string().max(100).optional(),
    postalCode: Joi.string().max(20).optional(),
    country: Joi.string().max(100).optional()
  }).optional(),
  languages: Joi.array().items(Joi.string()).optional(),
  specializations: Joi.array().items(Joi.string()).optional()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const switchRoleSchema = Joi.object({
  newRole: Joi.string().valid(...Object.values(Profession)).required()
});

const enableMFASchema = Joi.object({
  method: Joi.string().valid('totp').required()
});

const verifyMFASchema = Joi.object({
  token: Joi.string().length(6).required()
});

/**
 * POST /api/auth/login
 * Authenticate user with credentials
 * Validates: Requirements 1.1, 1.5 - Authentication and session management
 */
router.post('/login', authRateLimit(5, 15), asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const loginData: LoginRequest = value;
  const result = await authService.authenticate({
    email: loginData.email,
    password: loginData.password,
    mfaCode: loginData.mfaCode
  });

  if (!result.success) {
    return res.status(401).json(result);
  }

  res.json({
    success: true,
    user: result.user,
    tokens: result.tokens
  });
}));

/**
 * POST /api/auth/register
 * Register new user account
 */
router.post('/register', authRateLimit(3, 60), asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const registerData: RegisterRequest = value;
  const result = await userService.registerUser(registerData);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    userId: result.userId
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { error, value } = refreshTokenSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { refreshToken }: RefreshTokenRequest = value;

  try {
    const tokens = await authService.refreshToken(refreshToken);
    
    res.json({
      success: true,
      tokens
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
}));

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const user = (req as AuthenticatedRequest).user!;
  
  await authService.logout(user.sessionId);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = (req as AuthenticatedRequest).user!;
  
  const profile = await userService.getUserProfile(user.userId);
  
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'User profile not found'
    });
  }

  res.json({
    success: true,
    user: profile
  });
}));

/**
 * POST /api/auth/switch-role
 * Switch active role for multi-role users
 * Validates: Requirements 1.4 - Multi-role management
 */
router.post('/switch-role', authenticate, requireMultiRole, asyncHandler(async (req, res) => {
  const { error, value } = switchRoleSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const user = (req as AuthenticatedRequest).user!;
  const { newRole }: SwitchRoleRequest = value;

  const success = await authService.switchRole(user.userId, user.sessionId, newRole);
  
  if (!success) {
    return res.status(400).json({
      success: false,
      error: 'Unable to switch to this role'
    });
  }

  res.json({
    success: true,
    message: `Switched to ${newRole} role`,
    activeRole: newRole
  });
}));

/**
 * POST /api/auth/mfa/enable
 * Enable multi-factor authentication
 */
router.post('/mfa/enable', authenticate, asyncHandler(async (req, res) => {
  const { error, value } = enableMFASchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const user = (req as AuthenticatedRequest).user!;
  const { method }: EnableMFARequest = value;

  try {
    const mfaSetup = await authService.enableMFA(user.userId, method);
    
    res.json({
      success: true,
      mfaSetup: {
        qrCode: mfaSetup.qrCode,
        backupCodes: mfaSetup.backupCodes
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: 'Failed to enable MFA'
    });
  }
}));

/**
 * POST /api/auth/mfa/verify
 * Verify MFA setup and activate it
 */
router.post('/mfa/verify', authenticate, asyncHandler(async (req, res) => {
  const { error, value } = verifyMFASchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const user = (req as AuthenticatedRequest).user!;
  const { token }: VerifyMFARequest = value;

  const isValid = await authService.verifyMFASetup(user.userId, token);
  
  if (!isValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid MFA token'
    });
  }

  res.json({
    success: true,
    message: 'MFA enabled successfully'
  });
}));

/**
 * POST /api/auth/mfa/disable
 * Disable multi-factor authentication
 */
router.post('/mfa/disable', authenticate, asyncHandler(async (req, res) => {
  const user = (req as AuthenticatedRequest).user!;

  try {
    // Disable MFA by updating user record
    const { db } = await import('@/database/connection');
    await db.query(
      'UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = $1',
      [user.userId]
    );

    res.json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to disable MFA'
    });
  }
}));

export { router as authRouter };