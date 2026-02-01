import { AuthenticationService } from '@/services/authService';
import { UserService } from '@/services/userService';
import { Profession } from '@/types/auth';
import { db } from '@/database/connection';

// Mock dependencies
jest.mock('@/database/connection');
jest.mock('@/utils/logger');

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let userService: UserService;

  beforeEach(() => {
    authService = new AuthenticationService();
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should successfully authenticate valid credentials', async () => {
      // Mock database responses
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: '$2b$12$hashedpassword',
        is_active: true,
        email_verified: true,
        mfa_enabled: false,
        mfa_secret: null
      };

      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        profession: 'avocat',
        first_name: 'John',
        last_name: 'Doe',
        registration_number: 'AV123',
        barreau_id: 'barreau-123',
        organization_name: 'Test Law Firm',
        address_line1: '123 Test St',
        city: 'Algiers',
        country: 'Algeria',
        languages: ['fr'],
        specializations: ['civil'],
        is_primary: true
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockUser] }) // User lookup
        .mockResolvedValueOnce({ rows: [mockProfile] }) // Profile lookup
        .mockResolvedValueOnce({ rows: [] }); // Session creation

      // Mock bcrypt compare
      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await authService.authenticate({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.user?.email).toBe('test@example.com');
      expect(result.user?.profession).toBe('avocat');
    });

    it('should fail authentication with invalid credentials', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await authService.authenticate({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should require MFA when enabled', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: '$2b$12$hashedpassword',
        is_active: true,
        email_verified: true,
        mfa_enabled: true,
        mfa_secret: 'MFASECRET123'
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await authService.authenticate({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.mfaRequired).toBe(true);
      expect(result.error).toBe('MFA code required');
    });

    it('should fail authentication for inactive users', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: '$2b$12$hashedpassword',
        is_active: false,
        email_verified: true,
        mfa_enabled: false
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.authenticate({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account is deactivated');
    });

    it('should fail authentication for unverified email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: '$2b$12$hashedpassword',
        is_active: true,
        email_verified: false,
        mfa_enabled: false
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

      const result = await authService.authenticate({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email not verified');
    });
  });

  describe('validateSession', () => {
    it('should validate a valid session token', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        email: 'test@example.com',
        is_active: true,
        profession: 'avocat',
        first_name: 'John',
        last_name: 'Doe',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockSession] }) // Session lookup
        .mockResolvedValueOnce({ rows: [] }); // Update last activity

      // Mock JWT verify
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 'user-123' });

      // Mock token hashing
      const bcrypt = require('bcryptjs');
      bcrypt.hashSync = jest.fn().mockReturnValue('hashedtoken');

      const result = await authService.validateSession('valid-token');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.activeRole).toBe('avocat');
    });

    it('should reject invalid session token', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 'user-123' });

      const result = await authService.validateSession('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or expired session');
    });

    it('should reject expired JWT token', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Token expired');
      });

      const result = await authService.validateSession('expired-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh valid refresh token', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        active_profile_id: 'profile-123'
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockSession] }) // Session lookup
        .mockResolvedValueOnce({ rows: [] }); // Session update

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 'user-123' });
      jwt.sign = jest.fn()
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const bcrypt = require('bcryptjs');
      bcrypt.hashSync = jest.fn().mockReturnValue('hashedtoken');

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should fail to refresh invalid refresh token', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 'user-123' });

      await expect(authService.refreshToken('invalid-refresh-token'))
        .rejects.toThrow('Token refresh failed');
    });
  });

  describe('logout', () => {
    it('should successfully logout and invalidate session', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(authService.logout('session-123')).resolves.not.toThrow();
      
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM user_sessions WHERE id = $1',
        ['session-123']
      );
    });
  });

  describe('enableMFA', () => {
    it('should successfully setup MFA for user', async () => {
      const mockUser = {
        email: 'test@example.com'
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockUser] }) // User lookup
        .mockResolvedValueOnce({ rows: [] }); // Update MFA secret

      const speakeasy = require('speakeasy');
      speakeasy.generateSecret = jest.fn().mockReturnValue({
        base32: 'MFASECRET123',
        otpauth_url: 'otpauth://totp/test'
      });

      const QRCode = require('qrcode');
      QRCode.toDataURL = jest.fn().mockResolvedValue('data:image/png;base64,qrcode');

      const result = await authService.enableMFA('user-123', 'totp');

      expect(result.secret).toBe('MFASECRET123');
      expect(result.qrCode).toBe('data:image/png;base64,qrcode');
    });

    it('should fail MFA setup for non-existent user', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(authService.enableMFA('nonexistent-user', 'totp'))
        .rejects.toThrow('MFA setup failed');
    });
  });

  describe('verifyMFASetup', () => {
    it('should successfully verify MFA token and enable MFA', async () => {
      const mockUser = {
        mfa_secret: 'MFASECRET123'
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get MFA secret
        .mockResolvedValueOnce({ rows: [] }); // Enable MFA

      const speakeasy = require('speakeasy');
      speakeasy.totp = {
        verify: jest.fn().mockReturnValue(true)
      };

      const result = await authService.verifyMFASetup('user-123', '123456');

      expect(result).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE users SET mfa_enabled = true WHERE id = $1',
        ['user-123']
      );
    });

    it('should fail verification with invalid MFA token', async () => {
      const mockUser = {
        mfa_secret: 'MFASECRET123'
      };

      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockUser] });

      const speakeasy = require('speakeasy');
      speakeasy.totp = {
        verify: jest.fn().mockReturnValue(false)
      };

      const result = await authService.verifyMFASetup('user-123', '000000');

      expect(result).toBe(false);
    });
  });

  describe('switchRole', () => {
    it('should successfully switch user role', async () => {
      const mockProfile = {
        id: 'profile-456'
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockProfile] }) // Profile lookup
        .mockResolvedValueOnce({ rows: [] }); // Session update

      const result = await authService.switchRole('user-123', 'session-123', 'notaire');

      expect(result).toBe(true);
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE user_sessions SET active_profile_id = $1 WHERE id = $2 AND user_id = $3',
        ['profile-456', 'session-123', 'user-123']
      );
    });

    it('should fail to switch to non-existent role', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await authService.switchRole('user-123', 'session-123', 'invalid-role');

      expect(result).toBe(false);
    });
  });
});

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // Check existing user

      const mockTransaction = jest.fn().mockResolvedValue('user-123');
      (db.transaction as jest.Mock).mockImplementation(mockTransaction);

      const bcrypt = require('bcryptjs');
      bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');

      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
        profession: Profession.AVOCAT,
        registrationNumber: 'AV456',
        languages: ['fr', 'ar']
      };

      const result = await userService.registerUser(userData);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    it('should fail to register user with existing email', async () => {
      const mockExistingUser = { id: 'existing-user' };
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockExistingUser] });

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
        profession: Profession.AVOCAT
      };

      const result = await userService.registerUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this email already exists');
    });
  });

  describe('getUserProfile', () => {
    it('should successfully retrieve user profile', async () => {
      const mockUserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        profession: 'avocat',
        registration_number: 'AV123',
        barreau_id: 'barreau-123',
        organization_name: 'Test Firm',
        phone_number: '+213123456789',
        address_line1: '123 Test St',
        city: 'Algiers',
        country: 'Algeria',
        languages: ['fr'],
        specializations: ['civil'],
        is_active: true,
        email_verified: true,
        mfa_enabled: false
      };

      const mockRoles = [
        { profession: 'avocat' },
        { profession: 'juriste_entreprise' }
      ];

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockUserProfile] }) // User profile lookup
        .mockResolvedValueOnce({ rows: mockRoles }); // Roles lookup

      const result = await userService.getUserProfile('user-123');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.profession).toBe('avocat');
      expect(result?.roles).toEqual(['avocat', 'juriste_entreprise']);
    });

    it('should return null for non-existent user', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await userService.getUserProfile('nonexistent-user');

      expect(result).toBeNull();
    });
  });

  describe('addUserRole', () => {
    it('should successfully add new role to user', async () => {
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // Check existing role
        .mockResolvedValueOnce({ rows: [] }); // Add new role

      const roleData = {
        profession: Profession.NOTAIRE,
        registrationNumber: 'NOT123',
        specializations: ['real_estate']
      };

      const result = await userService.addUserRole('user-123', roleData);

      expect(result).toBe(true);
    });

    it('should fail to add existing role', async () => {
      const mockExistingRole = { id: 'role-123' };
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [mockExistingRole] });

      const roleData = {
        profession: Profession.AVOCAT
      };

      const result = await userService.addUserRole('user-123', roleData);

      expect(result).toBe(false);
    });
  });
});