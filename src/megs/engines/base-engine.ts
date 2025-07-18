/**
 * Base Engine Adapter for MEGS
 * Provides a foundation for implementing grammar engines
 */

import {
  GrammarEngine,
  EngineCapability,
  EngineStatus,
  EngineOptions,
  EngineResult,
  EngineMode,
  EngineIssue
} from '../types/index.js';

import {
  createEngineError,
  createInitializationError,
  withTimeout
} from '../errors/index.js';

/**
 * Abstract base class for grammar engines
 * Implements common functionality and enforces the GrammarEngine interface
 */
export abstract class BaseGrammarEngine implements GrammarEngine {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  public readonly capabilities: EngineCapability[];
  public readonly mode: EngineMode;

  public initialized: boolean = false;
  protected processingCount: number = 0;
  protected totalProcessingTime: number = 0;
  protected lastError?: Error;
  protected healthyState: boolean = true;

  /**
   * Constructor for BaseGrammarEngine
   * 
   * @param id Unique identifier for the engine
   * @param name Human-readable name for the engine
   * @param version Version string for the engine
   * @param capabilities Array of capabilities this engine provides
   * @param mode Whether the engine operates offline or requires online connectivity
   */
  constructor(
    id: string,
    name: string,
    version: string,
    capabilities: EngineCapability[],
    mode: EngineMode = 'offline'
  ) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.capabilities = capabilities;
    this.mode = mode;
  }

  /**
   * Initialize the engine
   * Must be implemented by concrete engine classes
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.initializeInternal();
      this.initialized = true;
      this.healthyState = true;
    } catch (error) {
      this.healthyState = false;
      this.lastError = error as Error;
      throw createInitializationError(
        `Failed to initialize ${this.name}: ${(error as Error).message}`,
        this.id,
        { error }
      );
    }
  }

  /**
   * Internal initialization logic
   * Must be implemented by concrete engine classes
   */
  protected abstract initializeInternal(): Promise<void>;

  /**
   * Process text with this engine
   * Handles timing, error management, and validation
   */
  async process(text: string, options?: EngineOptions): Promise<EngineResult> {
    if (!this.initialized) {
      throw createEngineError(
        `Engine ${this.id} not initialized`,
        this.id
      );
    }

    if (!text) {
      return this.createEmptyResult();
    }

    const startTime = Date.now();
    
    try {
      // Apply timeout if specified
      const timeout = options?.timeout;
      let issues: EngineIssue[];
      
      if (timeout) {
        issues = await withTimeout(
          () => this.processInternal(text, options),
          timeout,
          `Engine ${this.id} processing timed out after ${timeout}ms`
        );
      } else {
        issues = await this.processInternal(text, options);
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      this.processingCount++;
      this.totalProcessingTime += processingTime;
      
      return {
        engineId: this.id,
        issues,
        metadata: {
          processingTime,
          version: this.version,
          language: options?.language || 'en',
          ruleCount: issues.length
        }
      };
    } catch (error) {
      this.lastError = error as Error;
      this.healthyState = false;
      
      throw createEngineError(
        `Engine ${this.id} processing failed: ${(error as Error).message}`,
        this.id,
        { error }
      );
    }
  }

  /**
   * Internal processing logic
   * Must be implemented by concrete engine classes
   */
  protected abstract processInternal(text: string, options?: EngineOptions): Promise<EngineIssue[]>;

  /**
   * Create an empty result when no text is provided
   */
  private createEmptyResult(): EngineResult {
    return {
      engineId: this.id,
      issues: [],
      metadata: {
        processingTime: 0,
        version: this.version,
        language: 'en',
        ruleCount: 0
      }
    };
  }

  /**
   * Shut down the engine and release resources
   * Can be overridden by concrete engine classes
   */
  async shutdown(): Promise<void> {
    this.initialized = false;
    await this.shutdownInternal();
  }

  /**
   * Internal shutdown logic
   * Can be overridden by concrete engine classes
   */
  protected async shutdownInternal(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Get the status of this engine
   */
  getStatus(): EngineStatus {
    return {
      id: this.id,
      name: this.name,
      initialized: this.initialized,
      healthy: this.healthyState,
      lastError: this.lastError?.message,
      processingCount: this.processingCount,
      averageProcessingTime: this.getAverageProcessingTime()
    };
  }

  /**
   * Calculate the average processing time
   */
  private getAverageProcessingTime(): number {
    if (this.processingCount === 0) {
      return 0;
    }
    return this.totalProcessingTime / this.processingCount;
  }

  /**
   * Reset the engine's error state
   */
  protected resetErrorState(): void {
    this.lastError = undefined;
    this.healthyState = true;
  }

  /**
   * Check if the engine supports a specific capability
   */
  hasCapability(capability: EngineCapability): boolean {
    return this.capabilities.includes(capability);
  }
}