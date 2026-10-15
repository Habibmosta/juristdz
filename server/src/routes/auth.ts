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
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/database/connection';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';
import { emailService, hashResetToken } from '@/services/emailService';

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  mfaCode: Joi.string().length(6).optional()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  profession: Joi.any(),
  registrationNumber: Joi.any(),
  barreauId: Joi.any(),
  organizationName: Joi.any(),
  phoneNumber: Joi.any(),
  address: Joi.any(),
  languages: Joi.any(),
  specializations: Joi.any()
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
router.post('/login', asyncHandler(async (req, res) => {
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
router.post('/register', asyncHandler(async (req, res) => {
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

/**
 * POST /api/auth/reset-password
 * Demande de réinitialisation : crée un jeton et envoie l'email avec le lien.
 * Répond toujours succès (anti-énumération d'emails).
 */
const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

// Diagnostic : même import statique `db` que la route reset-password
router.get('/db-test', async (_req, res) => {
  try {
    const r = (await db.query('SELECT count(*) AS n FROM users')) as { rows: Array<{ n: number }> };
    res.json({ ok: true, users: Number(r.rows[0]?.n) });
  } catch (err: any) {
    res.json({ ok: false, error: err?.message || String(err), code: err?.code || null });
  }
});

router.post('/reset-password', authRateLimit(3, 60), asyncHandler(async (req, res) => {
  const { error, value } = resetPasswordSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { email } = value;

  try {
    const userResult = await db.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!userResult || (userResult as any).rows.length === 0) {
      return res.json({
        success: true,
        message: 'If this email exists, a reset link has been sent'
      });
    }

    const user = (userResult as any).rows[0];

    // Invalider les anciens jetons de cet utilisateur
    await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    // Nouveau jeton : UUID aléatoire, stocké sous forme de hash SHA-256
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, hashResetToken(resetToken), expiresAt]
    );

    const resetLink = `${config.frontend.url}/reset-password?token=${resetToken}`;

    try {
      await emailService.sendPasswordResetEmail({
        to: user.email,
        resetLink,
        language: 'fr'
      });
    } catch (mailError) {
      logger.error('Envoi email reset échoué', { email, error: mailError });
    }

    res.json({
      success: true,
      message: 'If this email exists, a reset link has been sent'
    });
  } catch (err: any) {
    logger.error('Reset password error:', err?.message || err);
    res.status(500).json({
      success: false,
      error: 'Failed to process request',
      detail: err?.message || String(err),
      code: err?.code || null
    });
  }
}));

/**
 * POST /api/auth/reset-password/confirm
 * Finalise la réinitialisation : vérifie le jeton et change le mot de passe.
 */
const resetPasswordConfirmSchema = Joi.object({
  token: Joi.string().uuid().required(),
  newPassword: Joi.string().min(8).required()
});

router.post('/reset-password/confirm', authRateLimit(5, 60), asyncHandler(async (req, res) => {
  const { error, value } = resetPasswordConfirmSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { token, newPassword } = value;
  const tokenHash = hashResetToken(token);

  try {
    const tokenResult = await db.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );

    if (!tokenResult || (tokenResult as any).rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lien de réinitialisation invalide ou expiré'
      });
    }

    const resetRow = (tokenResult as any).rows[0];
    const passwordHash = bcrypt.hashSync(newPassword, 12);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      resetRow.user_id
    ]);

    await db.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [
      resetRow.id
    ]);

    // Déconnexion globale : toutes les sessions de l'utilisateur sont révoquées
    await db.query('DELETE FROM user_sessions WHERE user_id = $1', [resetRow.user_id]);

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });
  } catch (err) {
    logger.error('Reset password confirm error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update password'
    });
  }
}));

export { router as authRouter };