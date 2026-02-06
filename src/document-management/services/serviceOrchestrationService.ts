/**
 * Service Orchestration Layer
 * Coordinates inter-service communication, error handling, and retry mechanisms
 * Implements service health monitoring and circuit breaker patterns
 * 
 * Requirements: 8.6 - Database architecture integration
 */

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime?: number;
  errorRate?: number;
}

export interface OrchestrationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  retries?: number;
  duration?: number;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

class ServiceOrchestrationService {
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };

  private defaultCircuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
    resetTimeout: 60000,
  };

  /**
   * Execute service call with retry logic and circuit breaker
   */
  async executeWithRetry<T>(
    serviceName: string,
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<OrchestrationResult<T>> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    const startTime = Date.now();
    let lastError: Error | null = null;
    let retries = 0;

    // Check circuit breaker
    if (!this.canExecute(serviceName)) {
      return {
        success: false,
        error: `Circuit breaker open for service: ${serviceName}`,
        retries: 0,
        duration: Date.now() - startTime,
      };
    }

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = await this.executeWithTimeout(
          operation,
          this.defaultCircuitBreakerConfig.timeout
        );

        // Record success
        this.recordSuccess(serviceName);
        this.updateServiceHealth(serviceName, 'healthy', Date.now() - startTime);

        return {
          success: true,
          data: result,
          retries: attempt,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error as Error;
        retries = attempt;

        // Record failure
        this.recordFailure(serviceName);
        this.updateServiceHealth(serviceName, 'degraded');

        // Don't retry on last attempt
        if (attempt < retryConfig.maxRetries) {
          const delay = this.calculateBackoff(attempt, retryConfig);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    this.updateServiceHealth(serviceName, 'unhealthy');

    return {
      success: false,
      error: lastError?.message || 'Operation failed',
      retries,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      ),
    ]);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if service can execute (circuit breaker check)
   */
  private canExecute(serviceName: string): boolean {
    const breaker = this.getCircuitBreaker(serviceName);
    const now = Date.now();

    switch (breaker.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        if (breaker.nextAttemptTime && now >= breaker.nextAttemptTime) {
          // Transition to half-open
          breaker.state = CircuitState.HALF_OPEN;
          breaker.successCount = 0;
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        return true;

      default:
        return true;
    }
  }

  /**
   * Get or create circuit breaker for service
   */
  private getCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0,
      });
    }
    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Record successful operation
   */
  private recordSuccess(serviceName: string): void {
    const breaker = this.getCircuitBreaker(serviceName);

    if (breaker.state === CircuitState.HALF_OPEN) {
      breaker.successCount++;
      
      if (breaker.successCount >= this.defaultCircuitBreakerConfig.successThreshold) {
        // Close circuit
        breaker.state = CircuitState.CLOSED;
        breaker.failureCount = 0;
        breaker.successCount = 0;
      }
    } else if (breaker.state === CircuitState.CLOSED) {
      // Reset failure count on success
      breaker.failureCount = 0;
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(serviceName: string): void {
    const breaker = this.getCircuitBreaker(serviceName);
    const now = Date.now();

    breaker.failureCount++;
    breaker.lastFailureTime = now;

    if (breaker.state === CircuitState.HALF_OPEN) {
      // Open circuit immediately on failure in half-open state
      breaker.state = CircuitState.OPEN;
      breaker.nextAttemptTime = now + this.defaultCircuitBreakerConfig.resetTimeout;
    } else if (
      breaker.state === CircuitState.CLOSED &&
      breaker.failureCount >= this.defaultCircuitBreakerConfig.failureThreshold
    ) {
      // Open circuit after threshold
      breaker.state = CircuitState.OPEN;
      breaker.nextAttemptTime = now + this.defaultCircuitBreakerConfig.resetTimeout;
    }
  }

  /**
   * Update service health status
   */
  private updateServiceHealth(
    serviceName: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    responseTime?: number
  ): void {
    const health: ServiceHealth = {
      name: serviceName,
      status,
      lastCheck: new Date(),
      responseTime,
    };

    this.serviceHealth.set(serviceName, health);
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName: string): ServiceHealth | null {
    return this.serviceHealth.get(serviceName) || null;
  }

  /**
   * Get all service health statuses
   */
  getAllServiceHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealth.values());
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(serviceName: string): CircuitState {
    return this.getCircuitBreaker(serviceName).state;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(serviceName: string): void {
    this.circuitBreakers.set(serviceName, {
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
    });
  }

  /**
   * Orchestrate multi-service operation
   */
  async orchestrateMultiService<T>(
    operations: Array<{
      serviceName: string;
      operation: () => Promise<any>;
      required?: boolean;
    }>
  ): Promise<OrchestrationResult<T>> {
    const results: any[] = [];
    const errors: string[] = [];

    for (const { serviceName, operation, required = true } of operations) {
      const result = await this.executeWithRetry(serviceName, operation);

      if (result.success) {
        results.push(result.data);
      } else {
        errors.push(`${serviceName}: ${result.error}`);
        
        if (required) {
          // Stop if required service fails
          return {
            success: false,
            error: `Required service failed: ${serviceName}`,
          };
        }
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return {
        success: false,
        error: `All services failed: ${errors.join(', ')}`,
      };
    }

    return {
      success: true,
      data: results as T,
    };
  }

  /**
   * Execute operations in parallel with coordination
   */
  async executeParallel<T>(
    operations: Array<{
      serviceName: string;
      operation: () => Promise<T>;
    }>
  ): Promise<OrchestrationResult<T[]>> {
    const startTime = Date.now();

    try {
      const promises = operations.map(({ serviceName, operation }) =>
        this.executeWithRetry(serviceName, operation)
      );

      const results = await Promise.all(promises);

      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        return {
          success: false,
          error: `${failures.length} operations failed`,
          duration: Date.now() - startTime,
        };
      }

      const data = results.map((r) => r.data as T);

      return {
        success: true,
        data,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parallel execution failed',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute operations in sequence with dependency management
   */
  async executeSequence<T>(
    operations: Array<{
      serviceName: string;
      operation: (previousResult?: any) => Promise<T>;
    }>
  ): Promise<OrchestrationResult<T>> {
    const startTime = Date.now();
    let previousResult: any = null;

    for (const { serviceName, operation } of operations) {
      const result = await this.executeWithRetry(serviceName, () =>
        operation(previousResult)
      );

      if (!result.success) {
        return {
          success: false,
          error: `Sequence failed at ${serviceName}: ${result.error}`,
          duration: Date.now() - startTime,
        };
      }

      previousResult = result.data;
    }

    return {
      success: true,
      data: previousResult as T,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Configure retry settings
   */
  configureRetry(config: Partial<RetryConfig>): void {
    this.defaultRetryConfig = {
      ...this.defaultRetryConfig,
      ...config,
    };
  }

  /**
   * Configure circuit breaker settings
   */
  configureCircuitBreaker(config: Partial<CircuitBreakerConfig>): void {
    this.defaultCircuitBreakerConfig = {
      ...this.defaultCircuitBreakerConfig,
      ...config,
    };
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: ServiceHealth[];
    circuitBreakers: Array<{ service: string; state: CircuitState }>;
  } {
    const services = this.getAllServiceHealth();
    const unhealthyCount = services.filter((s) => s.status === 'unhealthy').length;
    const degradedCount = services.filter((s) => s.status === 'degraded').length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      status = 'unhealthy';
    } else if (degradedCount > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    const circuitBreakers = Array.from(this.circuitBreakers.entries()).map(
      ([service, breaker]) => ({
        service,
        state: breaker.state,
      })
    );

    return {
      status,
      services,
      circuitBreakers,
    };
  }

  /**
   * Clear all health data
   */
  clearHealthData(): void {
    this.serviceHealth.clear();
    this.circuitBreakers.clear();
  }
}

// Export singleton instance
export const serviceOrchestrationService = new ServiceOrchestrationService();
