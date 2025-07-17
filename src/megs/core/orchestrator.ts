/**
 * Core Orchestrator implementation for MEGS
 * Manages the workflow of text processing through multiple engines
 */

import {
  Orchestrator,
  OrchestratorConfig,
  GrammarEngine,
  EngineStatus,
  ProcessOptions,
  GrammarResult,
  EngineResult,
  ResultMetadata,
  FallbackStrategy,
  EngineMode
} from '../types/index.js';

import {
  createInitializationError,
  createEngineError,
  createTimeoutError,
  ErrorHandler,
  withTimeout
} from '../errors/index.js';

/**
 * Default configuration for the orchestrator
 */
const DEFAULT_CONFIG: OrchestratorConfig = {
  concurrency: 4,
  timeout: 5000,
  engineTimeouts: {
    'nlprule': 200,
    'hunspell': 100,
    'vale': 300
  },
  engineRetries: {
    'nlprule': 2,
    'hunspell': 1,
    'vale': 1
  },
  cacheEnabled: true,
  cacheSize: 100,
  fallbackStrategy: 'continue',
  initSequence: ['nlprule', 'hunspell', 'vale', 'ml']
};

/**
 * Implementation of the Orchestrator interface
 * Manages the workflow of text processing through multiple engines
 */
export class OrchestratorImpl implements Orchestrator {
  private engines: Map<string, GrammarEngine> = new Map();
  private initialized: boolean = false;
  private config: OrchestratorConfig;
  private errorHandler: ErrorHandler;
  private processingCount: number = 0;
  private totalProcessingTime: number = 0;

  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * Initialize the orchestrator and all registered engines
   * Follows the specified initialization sequence
   */
  async initialize(config?: Partial<OrchestratorConfig>): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      // Initialize engines in the specified sequence
      const initSequence = [...this.config.initSequence];
      
      for (const engineId of initSequence) {
        const engine = this.engines.get(engineId);
        if (engine) {
          try {
            await this.initializeEngine(engine);
          } catch (error) {
            console.error(`Failed to initialize engine ${engineId}:`, error);
            // Continue with other engines if fallback strategy is 'continue'
            if (this.config.fallbackStrategy === 'fail') {
              throw error;
            }
          }
        }
      }

      // Initialize any remaining engines not in the sequence
      for (const [engineId, engine] of this.engines.entries()) {
        if (!initSequence.includes(engineId)) {
          try {
            await this.initializeEngine(engine);
          } catch (error) {
            console.error(`Failed to initialize engine ${engineId}:`, error);
            // Continue with other engines if fallback strategy is 'continue'
            if (this.config.fallbackStrategy === 'fail') {
              throw error;
            }
          }
        }
      }

      this.initialized = true;
    } catch (error) {
      throw createInitializationError(
        `Failed to initialize orchestrator: ${(error as Error).message}`,
        undefined,
        { error }
      );
    }
  }

  /**
   * Initialize a single engine with timeout and error handling
   */
  private async initializeEngine(engine: GrammarEngine): Promise<void> {
    const timeout = this.config.engineTimeouts[engine.id] || 1000;
    
    try {
      await withTimeout(
        () => engine.initialize(),
        timeout,
        `Engine ${engine.id} initialization timed out after ${timeout}ms`
      );
    } catch (error) {
      throw createInitializationError(
        `Failed to initialize engine ${engine.id}: ${(error as Error).message}`,
        engine.id,
        { error }
      );
    }
  }

  /**
   * Process text through all appropriate engines
   */
  async process(text: string, options?: ProcessOptions): Promise<GrammarResult> {
    if (!this.initialized) {
      throw createInitializationError('Orchestrator not initialized');
    }

    const startTime = Date.now();
    const opts = { ...options };
    const timeout = opts.timeout || this.config.timeout;
    
    try {
      // Determine which engines to use
      const engineIds = opts.engines || Array.from(this.engines.keys());
      const availableEngines = engineIds
        .map(id => this.engines.get(id))
        .filter((engine): engine is GrammarEngine => {
          if (!engine) return false;
          
          // Skip disabled engines
          if (this.errorHandler.isEngineDisabled(engine.id)) {
            return false;
          }
          
          // Skip online engines if offline mode is required
          if (opts.priority === 'speed' && engine.mode === 'online') {
            return false;
          }
          
          return true;
        });

      if (availableEngines.length === 0) {
        return this.createEmptyResult(text, opts.language || 'en', startTime);
      }

      // Process text through all engines in parallel
      const enginePromises = availableEngines.map(engine => {
        const engineTimeout = this.config.engineTimeouts[engine.id] || timeout;
        return this.processWithEngine(engine, text, engineTimeout, opts);
      });

      // Wait for all engines to complete or timeout
      const results = await Promise.allSettled(enginePromises);
      
      // Filter successful results
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<EngineResult> => result.status === 'fulfilled')
        .map(result => result.value);

      // Log errors for failed engines
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const engine = availableEngines[index];
          console.error(`Engine ${engine.id} failed:`, result.reason);
        }
      });

      // Create the final result
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      this.processingCount++;
      this.totalProcessingTime += processingTime;

      return {
        issues: [], // Will be populated by the ResultsConsolidator
        metadata: {
          processingTime,
          enginesUsed: successfulResults.map(result => result.engineId),
          timestamp: endTime,
          cacheHit: false,
          version: '1.0.0'
        },
        text,
        language: opts.language || 'en'
      };
    } catch (error) {
      throw createEngineError(
        `Failed to process text: ${(error as Error).message}`,
        'orchestrator',
        { error }
      );
    }
  }

  /**
   * Process text with a single engine with timeout and error handling
   */
  private async processWithEngine(
    engine: GrammarEngine,
    text: string,
    timeout: number,
    options?: ProcessOptions
  ): Promise<EngineResult> {
    try {
      return await withTimeout(
        () => engine.process(text, {
          language: options?.language,
          domain: options?.domain,
          timeout
        }),
        timeout,
        `Engine ${engine.id} processing timed out after ${timeout}ms`
      );
    } catch (error) {
      throw createEngineError(
        `Engine ${engine.id} processing failed: ${(error as Error).message}`,
        engine.id,
        { error }
      );
    }
  }

  /**
   * Create an empty result when no engines are available
   */
  private createEmptyResult(text: string, language: string, startTime: number): GrammarResult {
    const endTime = Date.now();
    return {
      issues: [],
      metadata: {
        processingTime: endTime - startTime,
        enginesUsed: [],
        timestamp: endTime,
        cacheHit: false,
        version: '1.0.0'
      },
      text,
      language
    };
  }

  /**
   * Register a new engine with the orchestrator
   */
  registerEngine(engine: GrammarEngine): void {
    this.engines.set(engine.id, engine);
    
    // Initialize the engine if orchestrator is already initialized
    if (this.initialized) {
      this.initializeEngine(engine).catch(error => {
        console.error(`Failed to initialize engine ${engine.id}:`, error);
      });
    }
  }

  /**
   * Unregister an engine from the orchestrator
   */
  unregisterEngine(engineId: string): void {
    const engine = this.engines.get(engineId);
    if (engine) {
      // Attempt to shut down the engine gracefully
      engine.shutdown().catch(error => {
        console.error(`Failed to shut down engine ${engineId}:`, error);
      });
      
      this.engines.delete(engineId);
      this.errorHandler.resetErrors(engineId);
    }
  }

  /**
   * Get the status of all registered engines
   */
  getStatus(): EngineStatus[] {
    return Array.from(this.engines.values()).map(engine => {
      try {
        return engine.getStatus();
      } catch (error) {
        return {
          id: engine.id,
          name: engine.name,
          initialized: false,
          healthy: false,
          lastError: (error as Error).message,
          processingCount: 0,
          averageProcessingTime: 0
        };
      }
    });
  }

  /**
   * Get the average processing time across all engines
   */
  getAverageProcessingTime(): number {
    if (this.processingCount === 0) {
      return 0;
    }
    return this.totalProcessingTime / this.processingCount;
  }

  /**
   * Shut down the orchestrator and all engines
   */
  async shutdown(): Promise<void> {
    const shutdownPromises = Array.from(this.engines.values()).map(engine => {
      return engine.shutdown().catch(error => {
        console.error(`Failed to shut down engine ${engine.id}:`, error);
      });
    });
    
    await Promise.allSettled(shutdownPromises);
    this.engines.clear();
    this.initialized = false;
  }
}