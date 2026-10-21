import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/database/connection';
import { logger } from '@/utils/logger';
import { hashResetToken } from '@/services/emailService';
import { RegisterRequest, UserProfile, Profession } from '@/types/auth';

export class UserService {
  private readonly saltRounds = 12;

  /**
   * Register a new user with profile
   */
  async registerUser(userData: RegisterRequest): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        profession = 'etudiant',
        registrationNumber,
        barreauId,
        organizationName,
        phoneNumber,
        address,
        languages = ['fr'],
        specializations = []
      } = userData;

      // Defense in depth : l'auto-inscription ne peut jamais créer un admin.
      if (profession === 'admin') {
        return {
          success: false,
          error: 'Invalid profession'
        };
      }

      // Check if user already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser && (existingUser as any).rows.length > 0) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, this.saltRounds);

      // Start transaction
      const result = await db.transaction(async (client) => {
        // Create user
        const userResult = await client.query(
`INSERT INTO users (email, password_hash, first_name, last_name, phone_number, created_at, updated_at, is_active)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), true)
            RETURNING id`,
          [email.toLowerCase(), passwordHash, firstName, lastName, phoneNumber]
        );

        const userId = userResult.rows[0].id;

        // Create user profile
        await client.query(
          `INSERT INTO user_profiles (
             user_id, profession, registration_number, barreau_id, organization_name,
             address_line1, address_line2, city, postal_code, country,
             languages, specializations, is_primary
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            userId,
            profession,
            registrationNumber,
            barreauId,
            organizationName,
            address?.line1,
            address?.line2,
            address?.city,
            address?.postalCode,
            address?.country || 'Algeria',
            languages,
            specializations,
            true // First profile is primary
          ]
        );

        return userId;
      });

      logger.info(`User registered successfully: ${email}`);

      return {
        success: true,
        userId: result as string
      };

    } catch (error) {
      logger.error('User registration error:', error);
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Get user basic info
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult || (userResult as any).rows.length === 0) {
        return null;
      }

      const user = (userResult as any).rows[0];

      // Get primary profile
      const profileResult = await db.query(
        'SELECT * FROM user_profiles WHERE user_id = $1 LIMIT 1',
        [userId]
      );

      const profile = (profileResult as any).rows[0] || {};

      // Get all roles for this user
      const rolesResult = await db.query(
        'SELECT profession FROM user_profiles WHERE user_id = $1',
        [userId]
      );

      const roles = (rolesResult as any).rows.map((row: any) => row.profession);

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profession: profile.profession || 'avocat',
        registrationNumber: profile.registration_number,
        barreauId: profile.barreau_id,
        organizationName: profile.organization_name,
        phoneNumber: user.phone_number,
        address: {
          line1: profile.address_line1,
          line2: profile.address_line2,
          city: profile.city,
          postalCode: profile.postal_code,
          country: profile.country || 'Algeria'
        },
        languages: profile.languages || ['fr'],
        specializations: profile.specializations || [],
        roles,
        activeRole: user.profession,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        mfaEnabled: user.mfa_enabled
      };

    } catch (error) {
      logger.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Add additional role/profile to existing user
   */
  async addUserRole(userId: string, roleData: {
    profession: Profession;
    registrationNumber?: string;
    barreauId?: string;
    organizationName?: string;
    specializations?: string[];
  }): Promise<boolean> {
    try {
      // Check if user already has this role
      const existingRole = await db.query(
        'SELECT id FROM user_profiles WHERE user_id = $1 AND profession = $2',
        [userId, roleData.profession]
      );

      if (existingRole && (existingRole as any).rows.length > 0) {
        return false; // Role already exists
      }

      // Add new role
      await db.query(
        `INSERT INTO user_profiles (
           user_id, profession, registration_number, barreau_id, organization_name,
           specializations, is_primary
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          roleData.profession,
          roleData.registrationNumber,
          roleData.barreauId,
          roleData.organizationName,
          roleData.specializations || [],
          false // Additional roles are not primary
        ]
      );

      logger.info(`Role ${roleData.profession} added to user ${userId}`);
      return true;

    } catch (error) {
      logger.error('Add user role error:', error);
      return false;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      await db.transaction(async (client) => {
        // Update user table
        if (updates.firstName || updates.lastName || updates.phoneNumber) {
          await client.query(
            `UPDATE users 
             SET first_name = COALESCE($1, first_name),
                 last_name = COALESCE($2, last_name),
                 phone_number = COALESCE($3, phone_number),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [updates.firstName, updates.lastName, updates.phoneNumber, userId]
          );
        }

        // Update primary profile
        if (updates.registrationNumber || updates.barreauId || updates.organizationName || 
            updates.address || updates.languages || updates.specializations) {
          await client.query(
            `UPDATE user_profiles 
             SET registration_number = COALESCE($1, registration_number),
                 barreau_id = COALESCE($2, barreau_id),
                 organization_name = COALESCE($3, organization_name),
                 address_line1 = COALESCE($4, address_line1),
                 address_line2 = COALESCE($5, address_line2),
                 city = COALESCE($6, city),
                 postal_code = COALESCE($7, postal_code),
                 country = COALESCE($8, country),
                 languages = COALESCE($9, languages),
                 specializations = COALESCE($10, specializations),
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $11 AND is_primary = true`,
            [
              updates.registrationNumber,
              updates.barreauId,
              updates.organizationName,
              updates.address?.line1,
              updates.address?.line2,
              updates.address?.city,
              updates.address?.postalCode,
              updates.address?.country,
              updates.languages,
              updates.specializations,
              userId
            ]
          );
        }
      });

      logger.info(`User profile updated: ${userId}`);
      return true;

    } catch (error) {
      logger.error('Update user profile error:', error);
      return false;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<boolean> {
    try {
      await db.query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );

      // Invalidate all sessions
      await db.query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [userId]
      );

      logger.info(`User deactivated: ${userId}`);
      return true;

    } catch (error) {
      logger.error('Deactivate user error:', error);
      return false;
    }
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string): Promise<boolean> {
    try {
      await db.query(
        'UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );

      logger.info(`Email verified for user: ${userId}`);
      return true;

    } catch (error) {
      logger.error('Email verification error:', error);
      return false;
    }
  }

  /**
   * Create a single-use email verification token (valid 24h) for a user.
   * Returns the raw token to embed in the verification link.
   */
  async createEmailVerificationToken(userId: string): Promise<string> {
    await db.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, hashResetToken(token), expiresAt]
    );

    return token;
  }

  /**
   * Verify an email by its single-use token and mark the account as verified.
   */
  async verifyEmailByToken(token: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const tokenResult = await db.query(
        `SELECT id, user_id FROM email_verification_tokens
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
        [hashResetToken(token)]
      );

      if (!tokenResult || (tokenResult as any).rows.length === 0) {
        return { success: false, error: 'Lien de vérification invalide ou expiré' };
      }

      const row = (tokenResult as any).rows[0];

      await db.query(
        'UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [row.user_id]
      );

      await db.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1', [row.id]);

      logger.info(`Email verified via token for user: ${row.user_id}`);
      return { success: true, userId: row.user_id };

    } catch (error) {
      logger.error('Email verification (token) error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get current password hash
      const userResult = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult || (userResult as any).rows.length === 0) {
        return false;
      }

      const user = (userResult as any).rows[0];

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        return false;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, userId]
      );

      // Invalidate all sessions except current one would be handled by the caller
      logger.info(`Password changed for user: ${userId}`);
      return true;

    } catch (error) {
      logger.error('Change password error:', error);
      return false;
    }
  }
}

export const userService = new UserService();