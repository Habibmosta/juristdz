import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { authService } from '@/services/authService';
import { db } from '@/database/connection';
import { AuthenticatedRequest } from '@/types/auth';

const router = Router();

// Get current user profile
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const { userId } = req as AuthenticatedRequest;

  try {
    const userResult = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number, u.email_verified, u.mfa_enabled,
              up.profession, up.registration_number, up.barreau_id, up.organization_name,
              up.languages, up.specializations
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true
       WHERE u.id = $1`,
      [userId]
    );

    if (!userResult || (userResult as any).rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = (userResult as any).rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        profession: user.profession || 'etudiant',
        registrationNumber: user.registration_number,
        barreauId: user.barreau_id,
        organizationName: user.organization_name,
        phoneNumber: user.phone_number,
        languages: user.languages || ['fr'],
        specializations: user.specializations || [],
        emailVerified: user.email_verified,
        mfaEnabled: user.mfa_enabled
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
}));

// Update user profile
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const updates = req.body;

  console.log('[PUT /profile] userId:', userId, 'updates:', JSON.stringify(updates));

  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.firstName !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      values.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      values.push(updates.lastName);
    }
    if (updates.phoneNumber !== undefined) {
      updateFields.push(`phone_number = $${paramCount++}`);
      values.push(updates.phoneNumber);
    }

    if (updateFields.length > 0) {
      values.push(userId);
      const paramIndex = values.length;
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
      console.log('[PUT /profile] exec users query:', query, 'values:', JSON.stringify(values));
      await db.query(query, values);
      console.log('[PUT /profile] users updated');
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
}));

// Update user by ID (admin)
router.put('/:userId/update', authenticate, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  console.log('[PUT /:userId/update] userId:', userId, 'updates:', JSON.stringify(updates));

  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.first_name !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      values.push(updates.first_name);
    }
    if (updates.last_name !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      values.push(updates.last_name);
    }
    if (updates.profession !== undefined) {
      updateFields.push(`profession = $${paramCount++}`);
      values.push(updates.profession);
    }
    if (updates.is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`);
      values.push(updates.is_active);
    }

    if (updateFields.length > 0) {
      values.push(userId);
      const paramIndex = values.length;
      await db.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
}));

export { router as userRouter };