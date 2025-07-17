/**
 * Error handling utilities for MEGS
 * Implements comprehensive error management with recovery strategies
 */

import { ErrorType, MegsError, MegsErrorImpl } from '../types/index.js';

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

export function createInitializationError(
  message: string,
  engineId?: string,
  details?: any
): MegsError {
  return new MegsErrorImpl(ErrorType.INITIALIZATION_ERROR, message, {
    engineId,
    recoverable: true,
    details
  });
}

export function createEngineError(
  message: string,
  engineId: string,
  details?: any,
  recoverable: boolean = true
): MegsError {
  return new MegsErrorImpl(ErrorType.ENGINE_ERROR, message, {
    engineId,
    recoverable,
    details
  });
}

export function createTimeoutError(
  message: string,
  engineId?: string,
  timeout?: number
): MegsError {
  return new MegsErrorImpl(ErrorType.TIMEOUT_ERROR, message, {
    engineId,
    recoverable: true,
    details: { timeout }
  });
}

export function createWorkerError(
  message: string,
  workerId?: number,
  details?: any
): MegsError {
  return new MegsErrorImpl(ErrorType.WORKER_ERROR, message, {
    recoverable: true,
    details: { workerId, ...details }
  });
}

export function createResourceError(
  message: string,
  resourceType?: string,
  details?: any
): MegsError {
  return new MegsErrorImpl(ErrorType.RESOURCE_ERROR, message, {
    recoverable: false,
    details: { resourceType, ...details }
  });
}

export function createConfigurationError(
  message: string,
  configSection?: string,
  details?: any
): MegsError {
  return new MegsErrorImpl(ErrorType.CONFIGURATION_ERROR, message, {
    recoverable: true,
    details: { configSection, ...details }
  });
}

export function createUnknownError(
  message: string,
  cause?: Error,
  details?: any
): MegsError {
  return new MegsErrorImpl(ErrorType.UNKNOWN_ERROR, message, {
    recoverable: false,
    cause,
    details
  });
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: number; disabled: boolean }> = new Map();

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with appropriate recovery strategy
   */
  handleError(error: MegsError): { shouldRetry: boolean; delay?: number } {
    const key = error.engineId || 'global';
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);

    // Update circuit breaker state
    if (error.engineId) {
      this.updateCircuitBreaker(error.engineId, error);
    }

    // Determine retry strategy based on error type and count
    switch (error.type) {
      case ErrorType.TIMEOUT_ERROR:
        return { shouldRetry: count < 3, delay: Math.min(1000 * Math.pow(2, count), 5000) };
      
      case ErrorType.ENGINE_ERROR:
        if (!error.recoverable) {
          return { shouldRetry: false };
        }
        return { shouldRetry: count < 2, delay: 500 * (count + 1) };
      
      case ErrorType.WORKER_ERROR:
        return { shouldRetry: count < 3, delay: 200 * (count + 1) };
      
      case ErrorType.RESOURCE_ERROR:
        return { shouldRetry: false };
      
      case ErrorType.CONFIGURATION_ERROR:
        return { shouldRetry: false };
      
      default:
        return { shouldRetry: count < 1, delay: 1000 };
    }
  }

  /**
   * Update circuit breaker state for an engine
   */
  private updateCircuitBreaker(engineId: string, error: MegsError): void {
    const breaker = this.circuitBreakers.get(engineId) || { failures: 0, lastFailure: 0, disabled: false };
    
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    // Disable engine if too many failures in short time
    if (breaker.failures >= 5 && (Date.now() - breaker.lastFailure) < 60000) {
      breaker.disabled = true;
    }
    
    this.circuitBreakers.set(engineId, breaker);
  }

  /**
   * Check if an engine is disabled by circuit breaker
   */
  isEngineDisabled(engineId: string): boolean {
    const breaker = this.circuitBreakers.get(engineId);
    if (!breaker || !breaker.disabled) {
      return false;
    }

    // Re-enable after 5 minutes
    if (Date.now() - breaker.lastFailure > 300000) {
      breaker.disabled = false;
      breaker.failures = 0;
      this.circuitBreakers.set(engineId, breaker);
      return false;
    }

    return true;
  }

  /**
   * Reset error counts for an engine or globally
   */
  resetErrors(engineId?: string): void {
    if (engineId) {
      this.errorCounts.delete(engineId);
      this.circuitBreakers.delete(engineId);
    } else {
      this.errorCounts.clear();
      this.circuitBreakers.clear();
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): { [key: string]: { count: number; circuitBreakerActive: boolean } } {
    const stats: { [key: string]: { count: number; circuitBreakerActive: boolean } } = {};
    
    for (const [key, count] of this.errorCounts) {
      const breaker = this.circuitBreakers.get(key);
      stats[key] = {
        count,
        circuitBreakerActive: breaker?.disabled || false
      };
    }
    
    return stats;
  }
}

// ============================================================================
// RETRY UTILITIES
// ============================================================================

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(createTimeoutError(timeoutMessage, undefined, timeoutMs));
      }, timeoutMs);
    })
  ]);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { MegsErrorImpl as MegsError };
export * from '../types/index.js';