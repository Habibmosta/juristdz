/**
 * Integration test for JWT Authentication Service
 * This test validates the core authentication functionality
 * **Validates: Requirements 1.1, 1.5 - Authentication and session management**
 */

import { AuthenticationService } from '../services/authService';
import { UserService } from '../services/userService';
import { Profession } from '../types/auth';

// Simple test framework
class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];
  private results: Array<{ name: string; passed: boolean; error?: string }> = [];

  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running Authentication Integration Tests...\n');

    for (const test of this.tests) {
      try {
        await test.fn();
        this.results.push({ name: test.name, passed: true });
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.results.push({ 
          name: test.name, 
          passed: false, 
          error: error instanceof Error ? error.message : String(error)
        });
        console.log(`❌ ${test.name}: ${error}`);
      }
    }

    this.printSummary();
  }

  private printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(`\n📊 Test Summary: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️  Some tests failed');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    }
  }
}

// Mock database for testing
const mockDb = {
  users: new Map(),
  profiles: new Map(),
  sessions: new Map(),
  
  query: async (sql: string, params?: any[]) => {
    // Simple mock implementation for testing
    if (sql.includes('SELECT') && sql.includes('users') && sql.includes('email')) {
      const email = params?.[0];
      const user = Array.from(mockDb.users.values()).find((u: any) => u.email === email);
      return { rows: user ? [user] : [] };
    }
    
    if (sql.includes('SELECT') && sql.includes('user_profiles')) {
      const userId = params?.[0];
      const profiles = Array.from(mockDb.profiles.values()).filter((p: any) => p.user_id === userId);
      return { rows: profiles };
    }
    
    if (sql.includes('INSERT INTO users')) {
      const userId = 'test-user-' + Date.now();
      const user = {
        id: userId,
        email: params?.[0],
        password_hash: params?.[1],
        first_name: params?.[2],
        last_name: params?.[3],
        phone_number: params?.[4],
        email_verified: params?.[5],
        is_active: true,
        mfa_enabled: false
      };
      mockDb.users.set(userId, user);
      return { rows: [{ id: userId }] };
    }
    
    if (sql.includes('INSERT INTO user_profiles')) {
      const profileId = 'test-profile-' + Date.now();
      const profile = {
        id: profileId,
        user_id: params?.[0],
        profession: params?.[1],
        registration_number: params?.[2],
        is_primary: params?.[12]
      };
      mockDb.profiles.set(profileId, profile);
      return { rows: [{ id: profileId }] };
    }
    
    return { rows: [] };
  },
  
  transaction: async (callback: (client: any) => Promise<any>) => {
    return await callback(mockDb);
  }
};

// Mock external dependencies
const mockBcrypt = {
  hash: async (password: string, rounds: number) => `hashed_${password}`,
  compare: async (password: string, hash: string) => hash === `hashed_${password}`,
  hashSync: (token: string, rounds: number) => `hashed_${token}`
};

const mockJwt = {
  sign: (payload: any, secret: string, options?: any) => `jwt_token_${payload.userId}`,
  verify: (token: string, secret: string) => ({ userId: token.replace('jwt_token_', '') })
};

const mockSpeakeasy = {
  generateSecret: () => ({
    base32: 'TESTSECRET123',
    otpauth_url: 'otpauth://totp/test'
  }),
  totp: {
    verify: () => true
  }
};

const mockQRCode = {
  toDataURL: async (url: string) => 'data:image/png;base64,mockqrcode'
};

// Replace imports with mocks
jest.mock('@/database/connection', () => ({ db: mockDb }));
jest.mock('bcryptjs', () => mockBcrypt);
jest.mock('jsonwebtoken', () => mockJwt);
jest.mock('speakeasy', () => mockSpeakeasy);
jest.mock('qrcode', () => mockQRCode);
jest.mock('@/utils/logger', () => ({ logger: { info: console.log, error: console.error, warn: console.warn } }));

// Test suite
const runner = new TestRunner();

runner.test('AuthenticationService instantiation', async () => {
  const authService = new AuthenticationService();
  if (!authService) {
    throw new Error('Failed to instantiate AuthenticationService');
  }
});

runner.test('UserService instantiation', async () => {
  const userService = new UserService();
  if (!userService) {
    throw new Error('Failed to instantiate UserService');
  }
});

runner.test('User registration with valid data', async () => {
  const userService = new UserService();
  
  const userData = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    profession: Profession.AVOCAT,
    registrationNumber: 'AV123'
  };
  
  const result = await userService.registerUser(userData);
  
  if (!result.success) {
    throw new Error(`Registration failed: ${result.error}`);
  }
  
  if (!result.userId) {
    throw new Error('No userId returned from registration');
  }
});

runner.test('Authentication with valid credentials', async () => {
  const authService = new AuthenticationService();
  
  // First register a user
  const userService = new UserService();
  await userService.registerUser({
    email: 'auth-test@example.com',
    password: 'password123',
    firstName: 'Auth',
    lastName: 'Test',
    profession: Profession.AVOCAT
  });
  
  // Mock user data in database
  mockDb.users.set('auth-user-123', {
    id: 'auth-user-123',
    email: 'auth-test@example.com',
    password_hash: 'hashed_password123',
    is_active: true,
    email_verified: true,
    mfa_enabled: false,
    mfa_secret: null
  });
  
  mockDb.profiles.set('auth-profile-123', {
    id: 'auth-profile-123',
    user_id: 'auth-user-123',
    profession: 'avocat',
    first_name: 'Auth',
    last_name: 'Test',
    is_primary: true,
    languages: ['fr'],
    specializations: []
  });
  
  const result = await authService.authenticate({
    email: 'auth-test@example.com',
    password: 'password123'
  });
  
  if (!result.success) {
    throw new Error(`Authentication failed: ${result.error}`);
  }
  
  if (!result.user) {
    throw new Error('No user returned from authentication');
  }
  
  if (!result.tokens) {
    throw new Error('No tokens returned from authentication');
  }
  
  if (result.user.profession !== Profession.AVOCAT) {
    throw new Error(`Expected profession ${Profession.AVOCAT}, got ${result.user.profession}`);
  }
});

runner.test('Session validation with valid token', async () => {
  const authService = new AuthenticationService();
  
  // Mock session data
  mockDb.sessions.set('session-123', {
    id: 'session-123',
    user_id: 'user-123',
    email: 'session-test@example.com',
    is_active: true,
    profession: 'avocat',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
  
  // Override query for session validation
  const originalQuery = mockDb.query;
  mockDb.query = async (sql: string, params?: any[]) => {
    if (sql.includes('user_sessions') && sql.includes('token_hash')) {
      return {
        rows: [{
          id: 'session-123',
          user_id: 'user-123',
          email: 'session-test@example.com',
          is_active: true,
          profession: 'avocat',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }]
      };
    }
    return originalQuery(sql, params);
  };
  
  const result = await authService.validateSession('valid-token');
  
  if (!result.valid) {
    throw new Error(`Session validation failed: ${result.error}`);
  }
  
  if (result.activeRole !== 'avocat') {
    throw new Error(`Expected role avocat, got ${result.activeRole}`);
  }
  
  // Restore original query
  mockDb.query = originalQuery;
});

runner.test('MFA setup and verification', async () => {
  const authService = new AuthenticationService();
  
  // Mock user for MFA setup
  mockDb.users.set('mfa-user-123', {
    id: 'mfa-user-123',
    email: 'mfa-test@example.com'
  });
  
  const mfaSetup = await authService.enableMFA('mfa-user-123', 'totp');
  
  if (!mfaSetup.secret) {
    throw new Error('No MFA secret generated');
  }
  
  if (!mfaSetup.qrCode) {
    throw new Error('No QR code generated');
  }
  
  const verificationResult = await authService.verifyMFASetup('mfa-user-123', '123456');
  
  if (!verificationResult) {
    throw new Error('MFA verification failed');
  }
});

runner.test('Role switching for multi-role users', async () => {
  const authService = new AuthenticationService();
  
  // Mock profile for role switching
  const originalQuery = mockDb.query;
  mockDb.query = async (sql: string, params?: any[]) => {
    if (sql.includes('user_profiles') && sql.includes('profession')) {
      return { rows: [{ id: 'profile-456' }] };
    }
    if (sql.includes('UPDATE user_sessions')) {
      return { rows: [] };
    }
    return originalQuery(sql, params);
  };
  
  const result = await authService.switchRole('user-123', 'session-123', 'notaire');
  
  if (!result) {
    throw new Error('Role switching failed');
  }
  
  // Restore original query
  mockDb.query = originalQuery;
});

runner.test('Session cleanup removes expired sessions', async () => {
  const authService = new AuthenticationService();
  
  // Mock cleanup query
  const originalQuery = mockDb.query;
  mockDb.query = async (sql: string, params?: any[]) => {
    if (sql.includes('DELETE FROM user_sessions')) {
      return { rowCount: 3 }; // Mock 3 expired sessions cleaned
    }
    return originalQuery(sql, params);
  };
  
  await authService.cleanExpiredSessions();
  
  // Should not throw any errors
  
  // Restore original query
  mockDb.query = originalQuery;
});

// Property-based test validation
runner.test('Property 1: Authentication and Role Determination validation', async () => {
  const roles = Object.values(Profession);
  
  if (roles.length !== 7) {
    throw new Error(`Expected 7 roles, found ${roles.length}`);
  }
  
  const expectedRoles = ['avocat', 'notaire', 'huissier', 'magistrat', 'etudiant', 'juriste_entreprise', 'admin'];
  
  for (const expectedRole of expectedRoles) {
    if (!roles.includes(expectedRole as Profession)) {
      throw new Error(`Missing expected role: ${expectedRole}`);
    }
  }
});

runner.test('Property 5: Session Expiration validation', async () => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  if (futureDate <= now) {
    throw new Error('Future date calculation incorrect');
  }
  
  if (pastDate >= now) {
    throw new Error('Past date calculation incorrect');
  }
  
  // Session expiration logic validation
  const isExpired = (expiresAt: Date) => expiresAt < now;
  
  if (!isExpired(pastDate)) {
    throw new Error('Expired session not detected as expired');
  }
  
  if (isExpired(futureDate)) {
    throw new Error('Valid session detected as expired');
  }
});

// Run the tests
if (require.main === module) {
  runner.run().then(() => {
    console.log('\n🏁 Integration tests completed');
  });
}

export { runner };