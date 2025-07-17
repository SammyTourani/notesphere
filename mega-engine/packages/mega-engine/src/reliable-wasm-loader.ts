/**
 * Reliable WASM Loader for nlprule Grammar Engine
 * PHASE 1: Multi-strategy loading with fallbacks and error handling
 * 
 * This loader provides reliable WASM loading with multiple fallback strategies:
 * 1. Direct import from compiled WASM
 * 2. Dynamic import with error handling
 * 3. CDN fallback (if configured)
 * 4. Graceful degradation with error reporting
 */

import type { WasmLoadStatus, WasmLoadOptions, WasmLoadResult } from './types.js';
import { Logger } from './logger.js';
import { EngineHealthMonitor } from './engine-health-monitor.js';
import { nodeWasmLoader } from '../dist/node-wasm-loader.js';
import fs from 'fs';
import path from 'path';

export class ReliableWasmLoader {
  private static instance: ReliableWasmLoader;
  private logger = new Logger('ReliableWasmLoader');
  private healthMonitor = EngineHealthMonitor.getInstance();
  
  private wasmModule: any = null;
  private isLoading = false;
  private loadAttempts = 0;
  private lastLoadTime = 0;
  private lastError: string | null = null;
  private loadPromise: Promise<any> | null = null;

  // PHASE 1: Enhanced status tracking
  private status: WasmLoadStatus = {
    isLoaded: false,
    isLoading: false,
    loadAttempts: 0,
    lastLoadTime: 0,
    hasChecker: false
  };

  private constructor() {}

  static getInstance(): ReliableWasmLoader {
    if (!ReliableWasmLoader.instance) {
      ReliableWasmLoader.instance = new ReliableWasmLoader();
    }
    return ReliableWasmLoader.instance;
  }

  /**
   * Load the nlprule WASM module with reliable fallback strategies
   */
  async load(options: WasmLoadOptions = {}): Promise<any> {
    // Return cached module if already loaded
    if (this.wasmModule) {
      this.logger.debug('WASM module already loaded, returning cached instance');
      return this.wasmModule;
    }

    // Prevent multiple simultaneous loads
    if (this.isLoading && this.loadPromise) {
      this.logger.debug('WASM loading already in progress, waiting...');
      return await this.loadPromise;
    }

    this.isLoading = true;
    this.loadAttempts++;
    this.lastLoadTime = Date.now();
    this.status.isLoading = true;
    this.status.loadAttempts = this.loadAttempts;
    this.status.lastLoadTime = this.lastLoadTime;

    this.logger.info(`🔄 Loading nlprule WASM (attempt ${this.loadAttempts})...`);

    // Create load promise
    this.loadPromise = this._performLoad(options);

    try {
      const result = await this.loadPromise;
      this.logger.info('✅ nlprule WASM loaded successfully');
      this.healthMonitor.reportSuccess('nlprule-wasm');
      return result;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.status.error = this.lastError;
      this.logger.error('❌ nlprule WASM loading failed:', { error });
      this.healthMonitor.reportFailure('nlprule-wasm', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    } finally {
      this.isLoading = false;
      this.status.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * Perform the actual loading with multiple strategies
   */
  private async _performLoad(options: WasmLoadOptions): Promise<any> {
    const strategies = options.fallbackStrategies || [
      'direct-import',
      'dynamic-import',
      'public-path'
    ];

    for (const strategy of strategies) {
      try {
        this.logger.debug(`Trying strategy: ${strategy}`);
        
        switch (strategy) {
          case 'direct-import':
            return await this.loadFromDirectImport();
          case 'dynamic-import':
            return await this.loadFromDynamicImport();
          case 'public-path':
            return await this.loadFromPublicPath();
          default:
            this.logger.warn(`Unknown strategy: ${strategy}`);
        }
      } catch (error) {
        this.logger.warn(`Strategy ${strategy} failed:`, { error });
        // Continue to next strategy
      }
    }

    throw new Error(`All loading strategies failed. Last error: ${this.lastError}`);
  }

  /**
   * Strategy 1: Direct import from compiled WASM with Node.js compatibility
   */
  private async loadFromDirectImport(): Promise<any> {
    try {
      this.logger.debug('Trying Node.js WASM loader with dictionary loading...');
      // Load the dictionary data
      const dictPath = path.resolve(__dirname, '../dist/nlp/pkg/en.bin');
      this.logger.debug('Loading dictionary from: ' + dictPath);
      const dictBuffer = fs.readFileSync(dictPath);
      this.logger.debug('Dictionary loaded: ' + dictBuffer.length + ' bytes');
      // Load the WASM module with dictionary data
      const wasmModule = await nodeWasmLoader.loadWasmModule(
        './nlp/pkg/nlprule_wasm_bg.wasm',
        './nlp/pkg/nlprule_wasm_node.js',
        { dictBuffer }
      );
      // Self-test: run a grammar check
      try {
        this.logger.debug('Running ReliableWasmLoader self-test...');
        const checker = wasmModule.NlpRuleChecker.new();
        const testText = 'Between you and I, this are a test.';
        const result = checker.check(testText);
        this.logger.info('[Self-Test] NlpRuleChecker.check("' + testText + '") returned:', result);
        if (Array.isArray(result) && result.length > 0) {
          this.logger.info('[Self-Test] ✅ Grammar errors detected:', result.map(r => r.message));
        } else {
          this.logger.warn('[Self-Test] ❌ No grammar errors detected!');
        }
      } catch (selfTestError) {
        this.logger.error('[Self-Test] ❌ Error running NlpRuleChecker self-test:', selfTestError);
      }
      if (wasmModule.NlpRuleChecker) {
        this.wasmModule = wasmModule;
        this.status.isLoaded = true;
        this.status.hasChecker = true;
        this.logger.info('✅ Node.js WASM loader with dictionary successful');
        return wasmModule;
      } else {
        throw new Error('NlpRuleChecker not found in Node.js WASM module');
      }
    } catch (error) {
      this.logger.warn('Node.js WASM loader failed:', { error });
      throw error;
    }
  }

  /**
   * Strategy 2: Dynamic import with error handling
   */
  private async loadFromDynamicImport(): Promise<any> {
    try {
      this.logger.debug('Trying dynamic import...');
      
      // Try different possible paths
      const possiblePaths = [
        './nlp/pkg/nlprule_wasm.js',
        '../nlp/pkg/nlprule_wasm.js',
        '/nlp/pkg/nlprule_wasm.js',
        './public/nlp/pkg/nlprule_wasm.js'
      ];

      for (const path of possiblePaths) {
        try {
          const wasmModule = await import(/* @vite-ignore */ path);
          if (wasmModule.NlpRuleChecker) {
            this.wasmModule = wasmModule;
            this.status.isLoaded = true;
            this.status.hasChecker = true;
            this.logger.info(`✅ Dynamic import successful from ${path}`);
            return wasmModule;
          }
        } catch (pathError) {
          this.logger.debug(`Path ${path} failed:`, { error: pathError });
          // Continue to next path
        }
      }

      throw new Error('No valid WASM module found in any path');
    } catch (error) {
      this.logger.warn('Dynamic import failed:', { error });
      throw error;
    }
  }

  /**
   * Strategy 3: Load from public path using fetch
   */
  private async loadFromPublicPath(): Promise<any> {
    try {
      this.logger.debug('Trying public path loading...');
      
      // This would require a more complex setup with WASM instantiation
      // For now, we'll throw an error to move to the next strategy
      throw new Error('Public path loading not implemented yet');
    } catch (error) {
      this.logger.warn('Public path loading failed:', { error });
      throw error;
    }
  }

  /**
   * Get current loading status
   */
  getStatus(): WasmLoadStatus {
    return { ...this.status };
  }

  /**
   * Check if WASM is loaded
   */
  isLoaded(): boolean {
    return this.status.isLoaded && this.wasmModule !== null;
  }

  /**
   * Get the loaded WASM module
   */
  getModule(): any {
    if (!this.isLoaded()) {
      throw new Error('WASM module not loaded. Call load() first.');
    }
    return this.wasmModule;
  }

  /**
   * Reset the loader state
   */
  reset(): void {
    this.wasmModule = null;
    this.isLoading = false;
    this.loadPromise = null;
    this.lastError = null;
    this.status = {
      isLoaded: false,
      isLoading: false,
      loadAttempts: 0,
      lastLoadTime: 0,
      hasChecker: false
    };
    this.logger.info('WASM loader reset');
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      loadAttempts: this.loadAttempts,
      lastLoadTime: this.lastLoadTime,
      lastError: this.lastError,
      isLoaded: this.isLoaded(),
      isLoading: this.isLoading
    };
  }
} 