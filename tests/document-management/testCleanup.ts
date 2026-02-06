/**
 * Document Management System - Test Cleanup Utilities
 * 
 * Provides comprehensive cleanup utilities for test data and resources.
 * Ensures tests run in isolation and don't interfere with each other.
 * 
 * Requirements: All (testing foundation)
 */

import { testDataTracker } from './testDatabase';

// Global cleanup state tracking
const cleanupState = {
  isCleanupInProgress: false,
  cleanupErrors: [] as string[],
  lastCleanupTime: null as Date | null,
  totalCleanupsPerformed: 0
};

/**
 * Perform comprehensive test cleanup
 */
export const performTestCleanup = async (options: {
  force?: boolean;
  timeout?: number;
  verbose?: boolean;
} = {}): Promise<{ success: boolean; errors: string[] }> => {
  const { force = false, timeout = 30000, verbose = false } = options;
  
  if (cleanupState.isCleanupInProgress && !force) {
    return {
      success: false,
      errors: ['Cleanup already in progress']
    };
  }
  
  cleanupState.isCleanupInProgress = true;
  cleanupState.cleanupErrors = [];
  
  const startTime = Date.now();
  
  try {
    if (verbose) {
      console.log('🧹 Starting test cleanup...');
    }
    
    // Clear test data trackers
    await clearTestDataTrackers(verbose);
    
    // Clear any global test state
    await clearGlobalTestState(verbose);
    
    // Clear temporary files and resources
    await clearTemporaryResources(verbose);
    
    // Reset test counters
    resetTestCounters();
    
    cleanupState.lastCleanupTime = new Date();
    cleanupState.totalCleanupsPerformed++;
    
    if (verbose) {
      const duration = Date.now() - startTime;
      console.log(`✅ Test cleanup completed in ${duration}ms`);
    }
    
    return {
      success: true,
      errors: cleanupState.cleanupErrors
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    cleanupState.cleanupErrors.push(`Cleanup failed: ${errorMessage}`);
    
    if (verbose) {
      console.error('❌ Test cleanup failed:', error);
    }
    
    return {
      success: false,
      errors: cleanupState.cleanupErrors
    };
    
  } finally {
    cleanupState.isCleanupInProgress = false;
    
    // Timeout check
    const duration = Date.now() - startTime;
    if (duration > timeout) {
      cleanupState.cleanupErrors.push(`Cleanup exceeded timeout of ${timeout}ms (took ${duration}ms)`);
    }
  }
};

/**
 * Clear test data trackers
 */
const clearTestDataTrackers = async (verbose: boolean = false): Promise<void> => {
  try {
    if (verbose) {
      console.log('🗑️ Clearing test data trackers...');
    }
    
    // Clear all tracked data sets
    Object.keys(testDataTracker).forEach(key => {
      const tracker = (testDataTracker as any)[key];
      if (tracker && typeof tracker.clear === 'function') {
        tracker.clear();
      }
    });
    
    if (verbose) {
      console.log('✅ Test data trackers cleared');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    cleanupState.cleanupErrors.push(`Failed to clear test data trackers: ${errorMessage}`);
    
    if (verbose) {
      console.warn('⚠️ Warning: Failed to clear test data trackers:', error);
    }
  }
};

/**
 * Clear global test state
 */
const clearGlobalTestState = async (verbose: boolean = false): Promise<void> => {
  try {
    if (verbose) {
      console.log('🌐 Clearing global test state...');
    }
    
    // Clear any global variables or state
    if (typeof global !== 'undefined') {
      // Clear test-specific global variables
      const testGlobals = Object.keys(global).filter(key => 
        key.startsWith('test') || key.startsWith('mock') || key.startsWith('__test')
      );
      
      testGlobals.forEach(key => {
        try {
          delete (global as any)[key];
        } catch (error) {
          // Some globals might not be deletable
          if (verbose) {
            console.warn(`Could not delete global: ${key}`);
          }
        }
      });
    }
    
    // Clear any cached modules or singletons
    if (typeof jest !== 'undefined' && jest.clearAllMocks) {
      jest.clearAllMocks();
    }
    
    if (verbose) {
      console.log('✅ Global test state cleared');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    cleanupState.cleanupErrors.push(`Failed to clear global test state: ${errorMessage}`);
    
    if (verbose) {
      console.warn('⚠️ Warning: Failed to clear global test state:', error);
    }
  }
};

/**
 * Clear temporary resources
 */
const clearTemporaryResources = async (verbose: boolean = false): Promise<void> => {
  try {
    if (verbose) {
      console.log('📁 Clearing temporary resources...');
    }
    
    // Clear any temporary files, connections, or resources
    // This would include things like:
    // - Temporary file uploads
    // - Open database connections
    // - Cached data
    // - Event listeners
    
    // For now, we'll just clear any test-related timeouts or intervals
    if (typeof global !== 'undefined') {
      // Clear any test timeouts or intervals
      const maxId = 1000; // Reasonable upper bound
      for (let i = 1; i <= maxId; i++) {
        try {
          clearTimeout(i);
          clearInterval(i);
        } catch (error) {
          // Ignore errors for non-existent timers
        }
      }
    }
    
    if (verbose) {
      console.log('✅ Temporary resources cleared');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    cleanupState.cleanupErrors.push(`Failed to clear temporary resources: ${errorMessage}`);
    
    if (verbose) {
      console.warn('⚠️ Warning: Failed to clear temporary resources:', error);
    }
  }
};

/**
 * Reset test counters and metrics
 */
const resetTestCounters = (): void => {
  // Reset any test-specific counters or metrics
  // This could include performance counters, error counts, etc.
  
  // For now, we'll just reset our internal cleanup state
  cleanupState.cleanupErrors = [];
};

/**
 * Get cleanup statistics
 */
export const getCleanupStats = (): {
  isInProgress: boolean;
  lastCleanupTime: Date | null;
  totalCleanups: number;
  recentErrors: string[];
} => {
  return {
    isInProgress: cleanupState.isCleanupInProgress,
    lastCleanupTime: cleanupState.lastCleanupTime,
    totalCleanups: cleanupState.totalCleanupsPerformed,
    recentErrors: [...cleanupState.cleanupErrors]
  };
};

/**
 * Force cleanup (ignores in-progress state)
 */
export const forceCleanup = async (verbose: boolean = false): Promise<{ success: boolean; errors: string[] }> => {
  return performTestCleanup({ force: true, verbose });
};

/**
 * Quick cleanup for between tests
 */
export const quickCleanup = async (): Promise<void> => {
  try {
    // Clear test data trackers only
    Object.keys(testDataTracker).forEach(key => {
      const tracker = (testDataTracker as any)[key];
      if (tracker && typeof tracker.clear === 'function') {
        tracker.clear();
      }
    });
    
    // Clear Jest mocks
    if (typeof jest !== 'undefined' && jest.clearAllMocks) {
      jest.clearAllMocks();
    }
    
  } catch (error) {
    console.warn('Warning: Quick cleanup failed:', error);
  }
};

/**
 * Cleanup with timeout
 */
export const cleanupWithTimeout = async (timeoutMs: number = 10000): Promise<{ success: boolean; timedOut: boolean; errors: string[] }> => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        timedOut: true,
        errors: ['Cleanup timed out']
      });
    }, timeoutMs);
    
    performTestCleanup({ timeout: timeoutMs })
      .then((result) => {
        clearTimeout(timeoutId);
        resolve({
          ...result,
          timedOut: false
        });
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          timedOut: false,
          errors: [error instanceof Error ? error.message : String(error)]
        });
      });
  });
};

/**
 * Validate cleanup was successful
 */
export const validateCleanup = (): { isClean: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check if test data trackers are empty
  Object.entries(testDataTracker).forEach(([key, tracker]) => {
    if (tracker && typeof tracker.size === 'number' && tracker.size > 0) {
      issues.push(`Test data tracker '${key}' still has ${tracker.size} items`);
    }
  });
  
  // Check for any remaining global test variables
  if (typeof global !== 'undefined') {
    const testGlobals = Object.keys(global).filter(key => 
      key.startsWith('test') || key.startsWith('mock') || key.startsWith('__test')
    );
    
    if (testGlobals.length > 0) {
      issues.push(`Found ${testGlobals.length} remaining test globals: ${testGlobals.join(', ')}`);
    }
  }
  
  return {
    isClean: issues.length === 0,
    issues
  };
};

/**
 * Auto-cleanup utility for Jest hooks
 */
export const setupAutoCleanup = (options: {
  afterEach?: boolean;
  afterAll?: boolean;
  verbose?: boolean;
} = {}): void => {
  const { afterEach = true, afterAll = true, verbose = false } = options;
  
  if (typeof afterEach !== 'undefined' && afterEach) {
    if (typeof global !== 'undefined' && (global as any).afterEach) {
      (global as any).afterEach(async () => {
        await quickCleanup();
      });
    }
  }
  
  if (typeof afterAll !== 'undefined' && afterAll) {
    if (typeof global !== 'undefined' && (global as any).afterAll) {
      (global as any).afterAll(async () => {
        await performTestCleanup({ verbose });
      });
    }
  }
};

/**
 * Emergency cleanup - for when tests are stuck or hanging
 */
export const emergencyCleanup = async (): Promise<void> => {
  console.warn('🚨 Performing emergency cleanup...');
  
  try {
    // Force cleanup with minimal timeout
    await forceCleanup(true);
    
    // Additional emergency measures
    if (typeof process !== 'undefined' && process.exit) {
      // Give a moment for cleanup to complete
      setTimeout(() => {
        console.warn('🚨 Emergency exit after cleanup timeout');
        process.exit(1);
      }, 5000);
    }
    
  } catch (error) {
    console.error('❌ Emergency cleanup failed:', error);
    
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
  }
};

// Export all cleanup utilities
export const testCleanup = {
  perform: performTestCleanup,
  quick: quickCleanup,
  force: forceCleanup,
  withTimeout: cleanupWithTimeout,
  validate: validateCleanup,
  setupAuto: setupAutoCleanup,
  emergency: emergencyCleanup,
  getStats: getCleanupStats
};