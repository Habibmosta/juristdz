/**
 * API Gateway Service
 * Unified API gateway for document management system
 * Provides routing, authentication, authorization, rate limiting, and security controls
 * 
 * Requirements: 7.2, 8.6 - Transmission security and database architecture integration
 */

import { supabaseService } from './supabaseService';

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  userId?: string;
  sessionId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
  headers?: Record<string, string>;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export interface SecurityConfig {
  requireAuth: boolean;
  requireTLS: boolean;
  allowedOrigins: string[];
  maxRequestSize: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class ApiGatewayService {
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private securityConfig: SecurityConfig = {
    requireAuth: true,
    requireTLS: true,
    allowedOrigins: ['*'], // Configure based on environment
    maxRequestSize: 50 * 1024 * 1024, // 50MB
  };

  private defaultRateLimit: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    message: 'Too many requests, please try again later',
  };

  /**
   * Process API request through gateway
   */
  async processRequest<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    try {
      // 1. Security validation
      const securityCheck = await this.validateSecurity(request);
      if (!securityCheck.valid) {
        return {
          success: false,
          error: securityCheck.error,
          statusCode: securityCheck.statusCode || 403,
        };
      }

      // 2. Authentication
      const authCheck = await this.authenticateRequest(request);
      if (!authCheck.valid) {
        return {
          success: false,
          error: authCheck.error || 'Authentication failed',
          statusCode: 401,
        };
      }

      // 3. Rate limiting
      const rateLimitCheck = this.checkRateLimit(request);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: rateLimitCheck.message,
          statusCode: 429,
          headers: {
            'Retry-After': String(rateLimitCheck.retryAfter),
          },
        };
      }

      // 4. Authorization
      const authzCheck = await this.authorizeRequest(request);
      if (!authzCheck.authorized) {
        return {
          success: false,
          error: authzCheck.error || 'Unauthorized',
          statusCode: 403,
        };
      }

      // 5. Route request
      const response = await this.routeRequest<T>(request);

      // 6. Add security headers
      response.headers = {
        ...response.headers,
        ...this.getSecurityHeaders(),
      };

      return response;
    } catch (error) {
      console.error('API Gateway error:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500,
      };
    }
  }

  /**
   * Validate security requirements
   */
  private async validateSecurity(
    request: ApiRequest
  ): Promise<{ valid: boolean; error?: string; statusCode?: number }> {
    // Check TLS requirement
    if (this.securityConfig.requireTLS) {
      const protocol = request.headers['x-forwarded-proto'] || 'http';
      if (protocol !== 'https') {
        return {
          valid: false,
          error: 'HTTPS required',
          statusCode: 403,
        };
      }
    }

    // Check origin
    const origin = request.headers['origin'];
    if (origin && !this.isOriginAllowed(origin)) {
      return {
        valid: false,
        error: 'Origin not allowed',
        statusCode: 403,
      };
    }

    // Check request size
    const contentLength = parseInt(request.headers['content-length'] || '0');
    if (contentLength > this.securityConfig.maxRequestSize) {
      return {
        valid: false,
        error: 'Request too large',
        statusCode: 413,
      };
    }

    return { valid: true };
  }

  /**
   * Authenticate request
   */
  private async authenticateRequest(
    request: ApiRequest
  ): Promise<{ valid: boolean; error?: string; userId?: string }> {
    if (!this.securityConfig.requireAuth) {
      return { valid: true };
    }

    // Extract token from Authorization header
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        valid: false,
        error: 'Missing or invalid authorization header',
      };
    }

    const token = authHeader.substring(7);

    try {
      // Verify token with Supabase
      const client = supabaseService.getClient();
      const { data, error } = await client.auth.getUser(token);

      if (error || !data.user) {
        return {
          valid: false,
          error: 'Invalid token',
        };
      }

      // Add userId to request
      request.userId = data.user.id;

      return {
        valid: true,
        userId: data.user.id,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Authentication failed',
      };
    }
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(
    request: ApiRequest
  ): { allowed: boolean; message?: string; retryAfter?: number } {
    const key = this.getRateLimitKey(request);
    const now = Date.now();
    const entry = this.rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.defaultRateLimit.windowMs,
      });
      return { allowed: true };
    }

    if (entry.count >= this.defaultRateLimit.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return {
        allowed: false,
        message: this.defaultRateLimit.message,
        retryAfter,
      };
    }

    // Increment count
    entry.count++;
    return { allowed: true };
  }

  /**
   * Get rate limit key for request
   */
  private getRateLimitKey(request: ApiRequest): string {
    // Use userId if available, otherwise use IP
    if (request.userId) {
      return `user:${request.userId}`;
    }
    const ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown';
    return `ip:${ip}`;
  }

  /**
   * Authorize request
   */
  private async authorizeRequest(
    request: ApiRequest
  ): Promise<{ authorized: boolean; error?: string }> {
    // Basic authorization - can be extended with more complex rules
    if (!request.userId) {
      return {
        authorized: false,
        error: 'User ID required',
      };
    }

    // Check if user has access to the requested resource
    // This is a simplified version - real implementation would check permissions
    return { authorized: true };
  }

  /**
   * Route request to appropriate service
   */
  private async routeRequest<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    const { path, method } = request;

    // Route based on path
    if (path.startsWith('/api/documents')) {
      return this.handleDocumentRoutes<T>(request);
    } else if (path.startsWith('/api/templates')) {
      return this.handleTemplateRoutes<T>(request);
    } else if (path.startsWith('/api/versions')) {
      return this.handleVersionRoutes<T>(request);
    } else if (path.startsWith('/api/signatures')) {
      return this.handleSignatureRoutes<T>(request);
    } else if (path.startsWith('/api/workflows')) {
      return this.handleWorkflowRoutes<T>(request);
    } else if (path.startsWith('/api/search')) {
      return this.handleSearchRoutes<T>(request);
    } else {
      return {
        success: false,
        error: 'Route not found',
        statusCode: 404,
      };
    }
  }

  /**
   * Handle document routes
   */
  private async handleDocumentRoutes<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    // Placeholder - would integrate with documentService
    return {
      success: true,
      data: { message: 'Document route handler' } as T,
      statusCode: 200,
    };
  }

  /**
   * Handle template routes
   */
  private async handleTemplateRoutes<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    // Placeholder - would integrate with templateService
    return {
      success: true,
      data: { message: 'Template route handler' } as T,
      statusCode: 200,
    };
  }

  /**
   * Handle version routes
   */
  private async handleVersionRoutes<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    // Placeholder - would integrate with versionControlService
    return {
      success: true,
      data: { message: 'Version route handler' } as T,
      statusCode: 200,
    };
  }

  /**
   * Handle signature routes
   */
  private async handleSignatureRoutes<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    // Placeholder - would integrate with signatureService
    return {
      success: true,
      data: { message: 'Signature route handler' } as T,
      statusCode: 200,
    };
  }

  /**
   * Handle workflow routes
   */
  private async handleWorkflowRoutes<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    // Placeholder - would integrate with workflowService
    return {
      success: true,
      data: { message: 'Workflow route handler' } as T,
      statusCode: 200,
    };
  }

  /**
   * Handle search routes
   */
  private async handleSearchRoutes<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    // Placeholder - would integrate with searchService
    return {
      success: true,
      data: { message: 'Search route handler' } as T,
      statusCode: 200,
    };
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin: string): boolean {
    if (this.securityConfig.allowedOrigins.includes('*')) {
      return true;
    }
    return this.securityConfig.allowedOrigins.includes(origin);
  }

  /**
   * Get security headers
   */
  private getSecurityHeaders(): Record<string, string> {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy': "default-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
  }

  /**
   * Configure security settings
   */
  configureSecuritySettings(config: Partial<SecurityConfig>): void {
    this.securityConfig = {
      ...this.securityConfig,
      ...config,
    };
  }

  /**
   * Configure rate limiting
   */
  configureRateLimit(config: Partial<RateLimitConfig>): void {
    this.defaultRateLimit = {
      ...this.defaultRateLimit,
      ...config,
    };
  }

  /**
   * Clear rate limit for a specific key
   */
  clearRateLimit(key: string): void {
    this.rateLimitStore.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAllRateLimits(): void {
    this.rateLimitStore.clear();
  }

  /**
   * Get rate limit status for a key
   */
  getRateLimitStatus(key: string): {
    remaining: number;
    resetTime: number;
  } | null {
    const entry = this.rateLimitStore.get(key);
    if (!entry) {
      return null;
    }

    return {
      remaining: Math.max(0, this.defaultRateLimit.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    services: Record<string, boolean>;
  }> {
    try {
      const supabaseHealth = await supabaseService.testConnection();

      return {
        status: supabaseHealth ? 'healthy' : 'unhealthy',
        services: {
          supabase: supabaseHealth,
          rateLimit: true,
          authentication: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          supabase: false,
          rateLimit: false,
          authentication: false,
        },
      };
    }
  }
}

// Export singleton instance
export const apiGatewayService = new ApiGatewayService();
