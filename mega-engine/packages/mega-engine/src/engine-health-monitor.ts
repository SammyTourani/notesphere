/**
 * Engine Health Monitor
 * Tracks engine failures and provides health reporting
 */

import { Logger } from './logger.js';
import type { EngineHealth, HealthReport } from './types.js';

export interface EngineFailure {
  engine: string;
  timestamp: number;
  error: string;
  context?: any;
}

export class EngineHealthMonitor {
  private static instance: EngineHealthMonitor | null = null;
  private logger = new Logger('EngineHealthMonitor');
  
  private failures: EngineFailure[] = [];
  private engineStats = new Map<string, { requests: number; failures: number; lastSuccess?: number; lastFailure?: number; lastError?: string }>();
  private criticalEngines = new Set(['nlprule-wasm', 'hunspell', 'style-checker']);
  private maxFailures = 100; // Keep last 100 failures
  private failureThreshold = 0.3; // 30% failure rate triggers warning
  private userWarnings = new Set<string>(); // Track shown warnings

  /**
   * Get singleton instance
   */
  static getInstance(): EngineHealthMonitor {
    if (!EngineHealthMonitor.instance) {
      EngineHealthMonitor.instance = new EngineHealthMonitor();
    }
    return EngineHealthMonitor.instance;
  }

  /**
   * Report a successful engine operation
   */
  reportSuccess(engine: string, context?: any): void {
    const stats = this.engineStats.get(engine) || { requests: 0, failures: 0 };
    stats.requests++;
    stats.lastSuccess = Date.now();
    this.engineStats.set(engine, stats);
    
    this.logger.debug(`Engine success: ${engine}`, { context });
  }

  /**
   * Report an engine failure
   */
  reportFailure(engine: string, error: Error, context?: any): void {
    const failure: EngineFailure = {
      engine,
      timestamp: Date.now(),
      error: error.message,
      context
    };

    // Add to failures list
    this.failures.push(failure);
    if (this.failures.length > this.maxFailures) {
      this.failures.shift();
    }

    // Update engine stats
    const stats = this.engineStats.get(engine) || { requests: 0, failures: 0 };
    stats.failures++;
    stats.lastFailure = Date.now();
    stats.lastError = error.message;
    this.engineStats.set(engine, stats);

    this.logger.warn(`Engine failure: ${engine}`, { 
      error: error.message, 
      context,
      failureRate: this.getFailureRate(engine)
    });

    // Check if this is a critical engine failure
    if (this.criticalEngines.has(engine)) {
      this.checkCriticalFailure(engine, failure);
    }
  }

  /**
   * Get failure rate for an engine
   */
  private getFailureRate(engine: string): number {
    const stats = this.engineStats.get(engine);
    if (!stats || stats.requests === 0) return 0;
    return stats.failures / stats.requests;
  }

  /**
   * Check if a critical engine is failing
   */
  private checkCriticalFailure(engine: string, failure: EngineFailure): void {
    const failureRate = this.getFailureRate(engine);
    const warningKey = `${engine}-high-failure-rate`;

    if (failureRate > this.failureThreshold && !this.userWarnings.has(warningKey)) {
      this.userWarnings.add(warningKey);
      this.showUserWarning(engine, failureRate, failure);
    }
  }

  /**
   * Show user warning for critical engine failures
   */
  private showUserWarning(engine: string, failureRate: number, failure: EngineFailure): void {
    const message = `Critical grammar engine "${engine}" is experiencing issues (${Math.round(failureRate * 100)}% failure rate). Grammar checking may be limited.`;
    
    this.logger.error(`User warning triggered: ${message}`, {
      engine,
      failureRate,
      lastError: failure.error
    });

    // Dispatch custom event for UI to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('grammar-engine-warning', {
        detail: {
          engine,
          failureRate,
          message,
          timestamp: Date.now()
        }
      }));
    }
  }

  /**
   * Get comprehensive health report
   */
  getHealthReport(): HealthReport {
    const engines = new Map<string, EngineHealth>();
    let totalRequests = 0;
    let totalFailures = 0;
    let healthyEngines = 0;
    let criticalFailures = 0;

    // Build engine health data
    for (const [engine, stats] of this.engineStats.entries()) {
      const failureRate = this.getFailureRate(engine);
      const lastFailure = this.failures
        .filter(f => f.engine === engine)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      const isHealthy = failureRate < this.failureThreshold;
      if (isHealthy) healthyEngines++;
      if (this.criticalEngines.has(engine) && failureRate > this.failureThreshold) {
        criticalFailures++;
      }

      totalRequests += stats.requests;
      totalFailures += stats.failures;

      // Convert to the correct EngineHealth type
      const engineHealth: EngineHealth = {
        successCount: stats.requests - stats.failures,
        failureCount: stats.failures,
        lastSuccess: stats.lastSuccess,
        lastFailure: stats.lastFailure,
        lastError: stats.lastError,
        averageResponseTime: undefined, // Not tracked yet
        status: isHealthy ? 'healthy' : failureRate > 0.5 ? 'critical' : 'degraded'
      };

      engines.set(engine, engineHealth);
    }

    const overallFailureRate = totalRequests > 0 ? totalFailures / totalRequests : 0;
    const overallStatus = overallFailureRate < 0.1 ? 'healthy' : 
                         overallFailureRate < 0.3 ? 'degraded' : 'critical';

    return {
      overall: overallStatus,
      engines,
      criticalIssues: this.identifyCriticalIssues(),
      recommendations: this.generateOverallRecommendations(),
      timestamp: Date.now()
    };
  }

  /**
   * Generate recommendations for a specific engine
   */
  private generateEngineRecommendations(engine: string, failureRate: number, lastFailure?: EngineFailure): string[] {
    const recommendations: string[] = [];

    if (failureRate > 0.5) {
      recommendations.push(`Engine ${engine} has high failure rate (${Math.round(failureRate * 100)}%). Consider restarting or checking configuration.`);
    } else if (failureRate > 0.2) {
      recommendations.push(`Engine ${engine} showing elevated failure rate. Monitor performance.`);
    }

    if (lastFailure) {
      recommendations.push(`Last error: ${lastFailure.error}`);
    }

    return recommendations;
  }

  /**
   * Identify critical issues across all engines
   */
  private identifyCriticalIssues(): string[] {
    const issues: string[] = [];

    for (const [engine, stats] of this.engineStats.entries()) {
      const failureRate = this.getFailureRate(engine);
      
      if (this.criticalEngines.has(engine) && failureRate > 0.5) {
        issues.push(`Critical engine ${engine} has ${Math.round(failureRate * 100)}% failure rate`);
      }
      
      if (stats.failures > 10 && stats.requests > 0) {
        issues.push(`Engine ${engine} has experienced ${stats.failures} failures`);
      }
    }

    return issues;
  }

  /**
   * Generate overall system recommendations
   */
  private generateOverallRecommendations(): string[] {
    const recommendations: string[] = [];
    let totalFailures = 0;
    let totalRequests = 0;

    for (const [_, stats] of this.engineStats.entries()) {
      totalFailures += stats.failures;
      totalRequests += stats.requests;
    }

    const overallFailureRate = totalRequests > 0 ? totalFailures / totalRequests : 0;

    if (overallFailureRate > 0.3) {
      recommendations.push('System experiencing high failure rate. Consider restarting grammar engines.');
    } else if (overallFailureRate > 0.1) {
      recommendations.push('Monitor system performance. Some engines showing elevated failure rates.');
    }

    if (totalRequests === 0) {
      recommendations.push('No engine activity detected. Check if engines are properly initialized.');
    }

    return recommendations;
  }

  /**
   * Get recent failures for an engine
   */
  getRecentFailures(engine: string, count: number = 10): EngineFailure[] {
    return this.failures
      .filter(f => f.engine === engine)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  /**
   * Clear all failure records
   */
  clearFailures(): void {
    this.failures = [];
    this.userWarnings.clear();
    this.logger.info('All failure records cleared');
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.engineStats.clear();
    this.failures = [];
    this.userWarnings.clear();
    this.logger.info('All health statistics reset');
  }

  /**
   * Add an engine to critical monitoring
   */
  addCriticalEngine(engine: string): void {
    this.criticalEngines.add(engine);
    this.logger.debug(`Added ${engine} to critical monitoring`);
  }

  /**
   * Remove an engine from critical monitoring
   */
  removeCriticalEngine(engine: string): void {
    this.criticalEngines.delete(engine);
    this.logger.debug(`Removed ${engine} from critical monitoring`);
  }
}

// Export singleton instance
export const engineHealthMonitor = EngineHealthMonitor.getInstance(); 