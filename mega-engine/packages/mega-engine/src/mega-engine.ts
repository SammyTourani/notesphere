/**
 * Mega Engine - The Ultimate Grammar Checking System
 * PHASE 1 INTEGRATION: Reliable WASM loading, health monitoring, structured logging
 * 
 * This is the main entry point for the Mega Engine system.
 * It orchestrates multiple grammar engines and provides a unified API.
 */

import type { 
  Issue, 
  CheckOptions, 
  CheckResult, 
  InitOptions, 
  EngineStatus,
  IssueCategory 
} from './types.js';

// PHASE 1: Import new reliable components
import { ReliableWasmLoader } from './reliable-wasm-loader.js';
import { Logger } from './logger.js';
import { EngineHealthMonitor } from './engine-health-monitor.js';
import { StreamingAssetLoader } from './streaming-asset-loader.js';

// Import the real nlprule engine (Phase 1 integrated)
import { NlpruleRealEngine } from './mega-engine-nlprule.js';

// Legacy engines (will be replaced in Phase 2)
import { ProfessionalHunspellChecker } from './spell-checker-nspell.js';
import { StyleChecker } from './style-checker.js';
import { SmartCache } from './cache.js';
import { v4 as uuidv4 } from 'uuid';

export class MegaEngine {
  // PHASE 1: New reliable components
  private wasmLoader = ReliableWasmLoader.getInstance();
  private logger = new Logger('MegaEngine');
  private healthMonitor = EngineHealthMonitor.getInstance();
  private assetLoader = StreamingAssetLoader.getInstance();
  
  // Engine instances
  private nlpruleEngine: NlpruleRealEngine | null = null;
  private spellChecker: ProfessionalHunspellChecker | null = null;
  private styleChecker: StyleChecker | null = null;
  private cache = new SmartCache<CheckResult>(1000);
  
  // Engine state
  private isInitialized = false;
  private options: InitOptions = {};
  private initializationPromise: Promise<boolean> | null = null;

  // PHASE 1: Enhanced statistics with health tracking
  private stats = {
    totalChecks: 0,
    engineUsage: {
      nlprule: 0,
      hunspell: 0,
      style: 0,
      cached: 0
    },
    averageTime: 0,
    totalTime: 0,
    wasmLoadAttempts: 0,
    lastWasmLoadTime: 0
  };

  /**
   * Initialize the Mega Engine with Phase 1 reliability
   */
  async init(options: InitOptions = {}): Promise<boolean> {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      this.logger.debug('Initialization already in progress, waiting...');
      return await this.initializationPromise;
    }

    if (this.isInitialized) {
      this.logger.debug('Mega Engine already initialized');
      return true;
    }

    this.initializationPromise = this._performInitialization(options);
    try {
      const result = await this.initializationPromise;
      return result;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Perform the actual initialization with Phase 1 reliability
   */
  private async _performInitialization(options: InitOptions): Promise<boolean> {
    this.options = {
      assetsPath: './public',
      engines: {
        nlprule: true,
        hunspell: true,
        symspell: true,
        writeGood: true,
        retext: true,
        ...options.engines
      },
      debug: false,
      ...options
    };

    try {
      this.logger.info('🚀 Initializing Mega Engine (Phase 1)...');

      const initPromises: Promise<boolean>[] = [];

      // PHASE 1: Initialize REAL nlprule WASM engine with reliable loader
      if (this.options.engines?.nlprule) {
        this.logger.info('📦 Initializing REAL nlprule WASM Engine...');
        this.nlpruleEngine = new NlpruleRealEngine();
        initPromises.push(this.nlpruleEngine.init(this.options));
      }

      // Initialize spell checker with health monitoring
      if (this.options.engines?.hunspell || this.options.engines?.symspell) {
        this.logger.info('📚 Initializing Professional Hunspell Spell Checker...');
        this.spellChecker = new ProfessionalHunspellChecker();
        initPromises.push(this.spellChecker.initialize(this.options));
      }

      // Initialize style checker with health monitoring
      if (this.options.engines?.writeGood || this.options.engines?.retext) {
        this.logger.info('✨ Initializing Style Checker...');
        this.styleChecker = new StyleChecker();
        initPromises.push(this.styleChecker.initialize(this.options));
      }

      // Wait for all engines to initialize
      const results = await Promise.allSettled(initPromises);
      
      // PHASE 1: Report initialization results to health monitor
      results.forEach((result, index) => {
        const engineNames = ['nlprule-wasm', 'hunspell', 'style-checker'];
        const engineName = engineNames[index] || `engine-${index}`;
        
        if (result.status === 'rejected') {
          this.logger.warn(`Engine ${engineName} failed to initialize:`, { error: result.reason });
          this.healthMonitor.reportFailure(engineName, new Error(result.reason));
        } else {
          this.logger.info(`✅ Engine ${engineName} initialized successfully`);
          this.healthMonitor.reportSuccess(engineName);
        }
      });

      this.isInitialized = true;
      this.logger.info('✅ Mega Engine initialized successfully (Phase 1)');
      
      return true;

    } catch (error) {
      this.logger.error('❌ Failed to initialize Mega Engine:', { error });
      this.healthMonitor.reportFailure('mega-engine', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }

  /**
   * Check text using all available engines with Phase 1 reliability
   */
  async check(text: string, options: CheckOptions = {}): Promise<CheckResult> {
    if (!this.isInitialized) {
      this.logger.warn('Mega Engine not initialized, initializing now...');
      const success = await this.init(this.options);
      if (!success) {
        throw new Error('Failed to initialize Mega Engine');
      }
    }

    // Performance optimization: Skip very short texts
    if (!text || text.trim().length < 3) {
      return {
        issues: [],
        statistics: {
          engine: 'mega-engine-phase1',
          processingTime: 0,
          issuesFound: 0,
          textLength: text?.length || 0,
          wordsChecked: 0,
          enginesUsed: 0,
          engineContributions: {},
          engineLatencies: {},
          rawIssuesFound: 0,
          deduplicationEfficiency: 0
        }
      };
    }

    // Performance optimization: Text preprocessing
    const preprocessedText = this.preprocessText(text);

    // Check cache first with preprocessed text
    const cacheKey = `${preprocessedText}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.engineUsage.cached++;
      this.logger.debug('Cache hit for text check');
      return cached;
    }

    const startTime = Date.now();

    try {
      this.logger.info(`🔍 Checking text with Mega Engine: "${preprocessedText.substring(0, 50)}${preprocessedText.length > 50 ? '...' : ''}"`);
      
      // Run all engines in parallel with individual timing
      const checkPromises: Promise<{ engine: string; issues: Issue[]; latency: number }>[] = [];

      // PHASE 1: REAL nlprule WASM Grammar Engine
      if (this.nlpruleEngine && this._shouldCheckCategory('grammar', options.categories)) {
        this.stats.engineUsage.nlprule++;
        checkPromises.push(this._runNlpruleCheckWithTiming(preprocessedText));
      }

      // Spell Checker with health monitoring
      if (this.spellChecker && this._shouldCheckCategory('spelling', options.categories)) {
        this.stats.engineUsage.hunspell++;
        checkPromises.push(this._runSpellCheckWithTiming(preprocessedText));
      }

      // Style Checker with health monitoring
      if (this.styleChecker && this._shouldCheckCategory('style', options.categories)) {
        this.stats.engineUsage.style++;
        checkPromises.push(this._runStyleCheckWithTiming(preprocessedText));
      }

      // Wait for all checks to complete
      this.logger.debug(`⚡ Running ${checkPromises.length} engines in parallel...`);
      const results = await Promise.allSettled(checkPromises);
      
      // Combine all issues with engine attribution
      const allIssues: Issue[] = [];
      const engineContributions: Record<string, number> = {};
      const engineLatencies: Record<string, number> = {};
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { engine, issues, latency } = result.value;
          allIssues.push(...issues);
          engineContributions[engine] = issues.length;
          engineLatencies[engine] = latency;
          this.logger.debug(`✅ Engine ${engine}: ${issues.length} issues in ${latency}ms`);
          this.healthMonitor.reportSuccess(engine);
        } else {
          this.logger.warn(`❌ Engine failed:`, { error: result.reason });
          this.healthMonitor.reportFailure('unknown', new Error(result.reason));
        }
      });

      // Deduplicate and prioritize issues
      const finalIssues = this._deduplicateIssues(allIssues);
      
      // Sort by priority and position
      finalIssues.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.offset - b.offset;
      });

      const processingTime = Date.now() - startTime;

      const result: CheckResult = {
        issues: finalIssues,
        statistics: {
          engine: 'mega-engine-phase1',
          processingTime,
          issuesFound: finalIssues.length,
          textLength: preprocessedText.length,
          wordsChecked: preprocessedText.split(/\s+/).length,
          enginesUsed: checkPromises.length,
          engineContributions,
          engineLatencies,
          rawIssuesFound: allIssues.length,
          deduplicationEfficiency: allIssues.length > 0 ? 
            Math.round(((allIssues.length - finalIssues.length) / allIssues.length) * 100) : 0
        }
      };

      // Cache the result
      this.cache.set(cacheKey, result);
      
      // Update stats
      this.stats.totalChecks++;
      this.stats.totalTime += processingTime;
      this.stats.averageTime = this.stats.totalTime / this.stats.totalChecks;

      this.logger.info(`📊 Found ${finalIssues.length} issues in ${processingTime}ms`);
      
      return result;

    } catch (error) {
      this.logger.error('❌ Error during text checking:', { error });
      this.healthMonitor.reportFailure('mega-engine', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Text preprocessing for performance optimization
   */
  private preprocessText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()[\]{}"'`~@#$%^&*+=|\\<>/]/g, ''); // Remove special chars
  }

  /**
   * PHASE 1: Run nlprule check with reliable loader and timing
   */
  private async _runNlpruleCheckWithTiming(text: string): Promise<{ engine: string; issues: Issue[]; latency: number }> {
    const startTime = Date.now();
    try {
      if (!this.nlpruleEngine) {
        throw new Error('nlprule engine not initialized');
      }
      
      const result = await this.nlpruleEngine.check(text);
      const latency = Date.now() - startTime;
      return { engine: 'nlprule-wasm', issues: result.issues, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.logger.error('nlprule check failed:', { error });
      this.healthMonitor.reportFailure('nlprule-wasm', error instanceof Error ? error : new Error('Unknown error'));
      throw error; // PHASE 1: No silent fallbacks
    }
  }

  /**
   * Run spell check with health monitoring and timing
   */
  private async _runSpellCheckWithTiming(text: string): Promise<{ engine: string; issues: Issue[]; latency: number }> {
    const startTime = Date.now();
    try {
      if (!this.spellChecker) {
        throw new Error('Spell checker not initialized');
      }
      
      const issues = await this.spellChecker.checkSpelling(text);
      const latency = Date.now() - startTime;
      this.healthMonitor.reportSuccess('hunspell');
      return { engine: 'hunspell', issues, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.logger.error('Spell check failed:', { error });
      this.healthMonitor.reportFailure('hunspell', error instanceof Error ? error : new Error('Unknown error'));
      throw error; // PHASE 1: No silent fallbacks
    }
  }

  /**
   * Run style check with health monitoring and timing
   */
  private async _runStyleCheckWithTiming(text: string): Promise<{ engine: string; issues: Issue[]; latency: number }> {
    const startTime = Date.now();
    try {
      if (!this.styleChecker) {
        throw new Error('Style checker not initialized');
      }
      
      const issues = await this.styleChecker.checkStyle(text);
      const latency = Date.now() - startTime;
      this.healthMonitor.reportSuccess('style-checker');
      return { engine: 'style-checker', issues, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.logger.error('Style check failed:', { error });
      this.healthMonitor.reportFailure('style-checker', error instanceof Error ? error : new Error('Unknown error'));
      throw error; // PHASE 1: No silent fallbacks
    }
  }

  /**
   * PHASE 1: Run nlprule check with reliable loader
   */
  private async _runNlpruleCheck(text: string): Promise<Issue[]> {
    try {
      if (!this.nlpruleEngine) {
        throw new Error('nlprule engine not initialized');
      }
      
      const result = await this.nlpruleEngine.check(text);
      return result.issues;
    } catch (error) {
      this.logger.error('nlprule check failed:', { error });
      this.healthMonitor.reportFailure('nlprule-wasm', error instanceof Error ? error : new Error('Unknown error'));
      throw error; // PHASE 1: No silent fallbacks
    }
  }

  /**
   * Run spell check with health monitoring
   */
  private async _runSpellCheck(text: string): Promise<Issue[]> {
    try {
      if (!this.spellChecker) {
        throw new Error('Spell checker not initialized');
      }
      
      const issues = await this.spellChecker.checkSpelling(text);
      this.healthMonitor.reportSuccess('hunspell');
      return issues;
    } catch (error) {
      this.logger.error('Spell check failed:', { error });
      this.healthMonitor.reportFailure('hunspell', error instanceof Error ? error : new Error('Unknown error'));
      throw error; // PHASE 1: No silent fallbacks
    }
  }

  /**
   * Run style check with health monitoring
   */
  private async _runStyleCheck(text: string): Promise<Issue[]> {
    try {
      if (!this.styleChecker) {
        throw new Error('Style checker not initialized');
      }
      
      const issues = await this.styleChecker.checkStyle(text);
      this.healthMonitor.reportSuccess('style-checker');
      return issues;
    } catch (error) {
      this.logger.error('Style check failed:', { error });
      this.healthMonitor.reportFailure('style-checker', error instanceof Error ? error : new Error('Unknown error'));
      throw error; // PHASE 1: No silent fallbacks
    }
  }

  /**
   * Check if category should be checked
   */
  private _shouldCheckCategory(category: string, categories?: string[]): boolean {
    if (!categories || categories.length === 0) return true;
    return categories.includes(category);
  }

  /**
   * Deduplicate issues
   */
  private _deduplicateIssues(issues: Issue[]): Issue[] {
    const seen = new Map<string, Issue>();
    
    issues.forEach(issue => {
      const key = `${issue.offset}:${issue.length}:${issue.message}`;
      if (!seen.has(key) || seen.get(key)!.priority > issue.priority) {
        seen.set(key, issue);
      }
    });
    
    return Array.from(seen.values());
  }

  /**
   * Get engine contributions from results
   */
  private _getEngineContributions(results: PromiseSettledResult<Issue[]>[]): Record<string, number> {
    const contributions: Record<string, number> = {};
    const engineNames = ['nlprule-wasm', 'hunspell', 'style-checker'];
    
    results.forEach((result, index) => {
      const engineName = engineNames[index] || `engine-${index}`;
      if (result.status === 'fulfilled') {
        contributions[engineName] = result.value.length;
      } else {
        contributions[engineName] = 0;
      }
    });
    
    return contributions;
  }

  /**
   * PHASE 1: Get comprehensive system health status
   */
  getSystemHealthStatus() {
    const wasmStatus = this.wasmLoader.getStatus();
    const healthReport = this.healthMonitor.getHealthReport();
    const cacheStats = this.cache.getStats();
    const assetCacheStats = this.assetLoader.getCacheStats();

    return {
      // Engine status
      engines: {
        nlprule: {
          status: this.nlpruleEngine ? 'loaded' : 'not-loaded',
          health: healthReport.engines.get('nlprule-wasm'),
          wasmStatus: wasmStatus
        },
        hunspell: {
          status: this.spellChecker ? 'loaded' : 'not-loaded',
          health: healthReport.engines.get('hunspell')
        },
        styleChecker: {
          status: this.styleChecker ? 'loaded' : 'not-loaded',
          health: healthReport.engines.get('style-checker')
        }
      },
      
      // Health monitoring
      health: {
        overall: healthReport.overall,
        criticalIssues: healthReport.criticalIssues,
        recommendations: healthReport.recommendations
      },
      
      // Cache information
      cache: {
        grammarCache: cacheStats,
        assetCache: assetCacheStats
      },
      
      // WASM specific info
      wasm: {
        loadAttempts: this.stats.wasmLoadAttempts,
        lastLoadTime: this.stats.lastWasmLoadTime,
        status: wasmStatus
      },
      
      // System statistics
      stats: {
        totalChecks: this.stats.totalChecks,
        averageTime: this.stats.averageTime,
        engineUsage: this.stats.engineUsage
      },
      
      // Timestamp
      timestamp: Date.now()
    };
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return { 
      ...this.stats,
      healthStatus: this.getSystemHealthStatus()
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.assetLoader.clearMemoryCache();
    this.logger.info('All caches cleared');
  }

  /**
   * PHASE 1: Get health report
   */
  getHealthReport() {
    return this.healthMonitor.getHealthReport();
  }

  /**
   * PHASE 1: Reset health monitoring
   */
  resetHealthMonitoring() {
    this.healthMonitor.resetStats();
    this.logger.info('Health monitoring reset');
  }

  /**
   * Get engine status
   */
  getEngineStatus(): EngineStatus {
    return {
      isInitialized: this.isInitialized,
      engines: {
        nlprule: {
          name: 'nlprule-wasm',
          status: this.nlpruleEngine ? 'active' : 'inactive',
          health: this.healthMonitor.getHealthReport().engines.get('nlprule-wasm')
        },
        hunspell: {
          name: 'hunspell',
          status: this.spellChecker ? 'active' : 'inactive',
          health: this.healthMonitor.getHealthReport().engines.get('hunspell')
        },
        style: {
          name: 'style-checker',
          status: this.styleChecker ? 'active' : 'inactive',
          health: this.healthMonitor.getHealthReport().engines.get('style-checker')
        }
      },
      health: this.healthMonitor.getHealthReport().overall
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.nlpruleEngine = null;
    this.spellChecker = null;
    this.styleChecker = null;
    this.isInitialized = false;
    this.logger.info('Mega Engine cleaned up');
  }
}

// PHASE 1: Export singleton instance
let megaEngineInstance: MegaEngine | null = null;

export function getMegaEngine(): MegaEngine {
  if (!megaEngineInstance) {
    megaEngineInstance = new MegaEngine();
  }
  return megaEngineInstance;
}

// PHASE 1: Export for backward compatibility
export { MegaEngine as default }; 