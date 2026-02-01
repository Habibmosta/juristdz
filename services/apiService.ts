// Service pour communiquer avec l'API JuristDZ Backend
const API_BASE_URL = 'http://localhost:3000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profession: string;
  organization_name?: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profession: string;
    organization?: string;
  };
}

export interface HealthResponse {
  status: string;
  database: string;
  timestamp: string;
  stats: {
    users: number;
    documents: number;
  };
}

export interface AlgerianCode {
  id: string;
  name: string;
  description: string;
  lastUpdate: string;
  articlesCount: number;
  status: string;
}

export interface Court {
  id: string;
  name: string;
  type: string;
  location: string;
  jurisdiction: string;
  address: string;
  phone: string;
}

export interface BillingRates {
  success: boolean;
  rates: Record<string, any>;
  currency: string;
  lastUpdate: string;
  note: string;
}

export interface SearchSuggestion {
  success: boolean;
  suggestions: string[];
  query: string;
}

export interface PlatformStats {
  success: boolean;
  stats: {
    totalUsers: number;
    totalDocuments: number;
    professionBreakdown: Array<{
      profession: string;
      count: number;
    }>;
    platform: {
      version: string;
      uptime: number;
      environment: string;
    };
  };
  timestamp: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Informations serveur
  async getServerInfo() {
    return this.request<{
      message: string;
      version: string;
      status: string;
      features: string[];
      timestamp: string;
    }>('/');
  }

  // Santé du système
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Gestion des utilisateurs
  async getUsers(): Promise<{ success: boolean; users: User[]; count: number }> {
    return this.request<{ success: boolean; users: User[]; count: number }>('/api/users');
  }

  // Authentification
  async login(email: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/simple-login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Codes juridiques algériens
  async getAlgerianCodes(): Promise<{
    success: boolean;
    codes: AlgerianCode[];
    count: number;
    lastSync: string;
  }> {
    return this.request<{
      success: boolean;
      codes: AlgerianCode[];
      count: number;
      lastSync: string;
    }>('/api/algerian-legal/codes');
  }

  // Tribunaux algériens
  async getCourts(): Promise<{
    success: boolean;
    courts: Court[];
    count: number;
    wilayas: string[];
  }> {
    return this.request<{
      success: boolean;
      courts: Court[];
      count: number;
      wilayas: string[];
    }>('/api/algerian-specificities/courts');
  }

  // Barèmes de facturation
  async getBillingRates(): Promise<BillingRates> {
    return this.request<BillingRates>('/api/billing/rates');
  }

  // Recherche juridique
  async getSearchSuggestions(query: string): Promise<SearchSuggestion> {
    return this.request<SearchSuggestion>(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  // Statistiques de la plateforme
  async getPlatformStats(): Promise<PlatformStats> {
    return this.request<PlatformStats>('/api/stats');
  }

  // Test de connectivité
  async testConnection(): Promise<boolean> {
    try {
      await this.getServerInfo();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Service de traduction
  async translateText(text: string, fromLang: string, toLang: string): Promise<{
    success: boolean;
    translatedText: string;
    originalText: string;
    fromLanguage: string;
    toLanguage: string;
  }> {
    return this.request<{
      success: boolean;
      translatedText: string;
      originalText: string;
      fromLanguage: string;
      toLanguage: string;
    }>('/api/translate', {
      method: 'POST',
      body: JSON.stringify({
        text,
        from: fromLang,
        to: toLang
      }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;