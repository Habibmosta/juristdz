import { API_URL } from '../config/apiConfig';

// Storage keys
const ACCESS_TOKEN_KEY = 'juristdz_access_token';
const REFRESH_TOKEN_KEY = 'juristdz_refresh_token';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profession: string;
  registrationNumber?: string;
  barreauId?: string;
  organizationName?: string;
  phoneNumber?: string;
  languages?: string[];
  specializations?: string[];
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  tokens?: TokenPair;
  error?: string;
  mfaRequired?: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profession: string;
  registrationNumber?: string;
  barreauId?: string;
  organizationName?: string;
  phoneNumber?: string;
  languages: string[];
  specializations: string[];
  roles: string[];
  activeRole: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  account_status?: string;
  subscriptionPlan?: string;
  trial_ends_at?: string;
  payment_status?: string;
  created_at?: string;
}

// Token management
export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(tokens: TokenPair): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }
};

// API calls
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Erreur de connexion'
        };
      }

      // Store tokens
      if (data.tokens) {
        tokenStorage.setTokens(data.tokens);
      }

      return {
        success: true,
        user: data.user,
        tokens: data.tokens
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur réseau. Veuillez réessayer.'
      };
    }
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Erreur lors de l\'inscription'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur réseau. Veuillez réessayer.'
      };
    }
  },

  async logout(): Promise<void> {
    try {
      const token = tokenStorage.getAccessToken();
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenStorage.clearTokens();
    }
  },

async getProfile(): Promise<UserProfile | null> {
    try {
      const token = tokenStorage.getAccessToken();
      if (!token) return null;

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.getProfile();
          }
        }
        return null;
      }

      const data = await response.json();
      return data.user ? data.user : data;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  },

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        tokenStorage.clearTokens();
        return false;
      }

      const data = await response.json();
      if (data.tokens) {
        tokenStorage.setTokens(data.tokens);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const token = tokenStorage.getAccessToken();
      if (!token) return false;

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      return response.ok;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = await response.json();
        return {
          success: false,
          error: data.error || 'Erreur lors de l\'envoi'
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur réseau'
      };
    }
  },

  isAuthenticated(): boolean {
    return tokenStorage.hasTokens();
  }
};
