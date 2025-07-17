/**
 * REAL Mega Grammar Engine - Uses the Actual nlprule WASM Engine
 * PHASE 1 INTEGRATION: Reliable WASM loading, health monitoring, structured logging
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

// Legacy components (will be replaced in Phase 2)
import { ProfessionalHunspellChecker } from './spell-checker-nspell.js';
import { StyleChecker } from './style-checker.js';
import { SmartCache } from './cache.js';
import { v4 as uuidv4 } from 'uuid';
import { nodeWasmLoader } from '../dist/node-wasm-loader.js';
import fs from 'fs';
import path from 'path';

// Singleton for nlprule WASM + dictionary
class GrammarWasm {
  private static instance: GrammarWasm;
  private wasmModule: any = null;
  private isInitialized = false;
  private cachedChecker: any = null; // Cache the checker instance

  private constructor() {}

  static getInstance(): GrammarWasm {
    if (!GrammarWasm.instance) {
      GrammarWasm.instance = new GrammarWasm();
    }
    return GrammarWasm.instance;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    const dictPath = path.resolve(__dirname, '../../dist/nlp/pkg/en.bin');
    const dictBuffer = fs.readFileSync(dictPath);
    this.wasmModule = await nodeWasmLoader.loadWasmModule(
      './nlp/pkg/nlprule_wasm_bg.wasm',
      './nlp/pkg/nlprule_wasm_node.js',
      { dictBuffer }
    );
    this.isInitialized = true;
    
    // Create and cache the checker instance
    this.cachedChecker = this.wasmModule.NlpRuleChecker.new();
    
    // Self-test
    try {
      const testText = 'Between you and I, this are a test.';
      const result = this.cachedChecker.check(testText);
      console.log('[GrammarWasm Self-Test] check("' + testText + '"):', result);
      if (Array.isArray(result) && result.length > 0) {
        console.log('[GrammarWasm Self-Test] ✅ Grammar errors detected:', result.map(r => r.message));
      } else {
        console.warn('[GrammarWasm Self-Test] ❌ No grammar errors detected!');
      }
    } catch (e) {
      console.error('[GrammarWasm Self-Test] ❌ Error:', e);
    }
  }

  getChecker() {
    if (!this.isInitialized || !this.wasmModule || !this.cachedChecker) {
      throw new Error('GrammarWasm not initialized or checker not available');
    }
    return this.cachedChecker; // Return the cached instance
  }
}

export class NlpruleRealEngine {
  // PHASE 1: New reliable components
  private wasmLoader = ReliableWasmLoader.getInstance();
  private logger = new Logger('NlpruleRealEngine');
  private healthMonitor = EngineHealthMonitor.getInstance();
  private assetLoader = StreamingAssetLoader.getInstance();
  
  // Legacy components
  private spellChecker = new ProfessionalHunspellChecker();
  private styleChecker = new StyleChecker();
  private cache = new SmartCache<CheckResult>(1000);
  
  // Engine state
  private isInitialized = false;
  private options: InitOptions = {};
  private grammarWorker: Worker | null = null;
  private workerReady = false;
  private wasmModule: any = null;
  private nlpRuleChecker: any = null;

  // PHASE 1: Enhanced statistics with health tracking
  private stats = {
    totalChecks: 0,
    engineUsage: {
      grammar: 0,
      spell: 0,
      style: 0,
      cached: 0
    },
    averageTime: 0,
    totalTime: 0,
    wasmLoadAttempts: 0,
    lastWasmLoadTime: 0
  };

  /**
   * Initialize the real nlprule mega engine with Phase 1 reliability
   */
  async init(options: InitOptions = {}): Promise<boolean> {
    if (this.isInitialized) {
      this.logger.debug('Engine already initialized');
      return true;
    }

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
      this.logger.info('🚀 Initializing REAL nlprule WASM Grammar Engine (Phase 1)...');

      const initPromises: Promise<boolean>[] = [];

      // PHASE 1: Initialize REAL nlprule WASM grammar engine with reliable loader
      if (this.options.engines?.nlprule) {
        this.logger.info('📦 Initializing REAL nlprule WASM Grammar Engine...');
        initPromises.push(this.initNlpruleGrammar());
      }

      // Initialize spell checker with health monitoring
      if (this.options.engines?.hunspell || this.options.engines?.symspell) {
        this.logger.info('📚 Initializing Spell Checker...');
        initPromises.push(this.initSpellChecker());
      }

      // Initialize style checker with health monitoring
      if (this.options.engines?.writeGood || this.options.engines?.retext) {
        this.logger.info('✨ Initializing Style Checker...');
        initPromises.push(this.initStyleChecker());
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
      this.logger.info('✅ REAL nlprule WASM Grammar Engine initialized successfully (Phase 1)');
      
      return true;

    } catch (error) {
      this.logger.error('❌ Failed to initialize REAL nlprule Grammar Engine:', { error });
      this.healthMonitor.reportFailure('nlprule-engine', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }

  /**
   * PHASE 1: Initialize the real nlprule WASM grammar engine with reliable loader
   */
  private async initNlpruleGrammar(): Promise<boolean> {
    try {
      await GrammarWasm.getInstance().init();
      this.logger.info('✅ GrammarWasm singleton initialized');
      return true;
    } catch (e) {
      this.logger.error('❌ Failed to initialize GrammarWasm:', e);
      return false;
    }
  }

  /**
   * PHASE 1: Initialize spell checker with health monitoring
   */
  private async initSpellChecker(): Promise<boolean> {
    try {
      const success = await this.spellChecker.initialize(this.options);
      if (success) {
        this.healthMonitor.reportSuccess('hunspell');
        return true;
      } else {
        throw new Error('Spell checker initialization returned false');
      }
    } catch (error) {
      this.healthMonitor.reportFailure('hunspell', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * PHASE 1: Initialize style checker with health monitoring
   */
  private async initStyleChecker(): Promise<boolean> {
    try {
      const success = await this.styleChecker.initialize(this.options);
      if (success) {
        this.healthMonitor.reportSuccess('style-checker');
        return true;
      } else {
        throw new Error('Style checker initialization returned false');
      }
    } catch (error) {
      this.healthMonitor.reportFailure('style-checker', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Check text using the real nlprule WASM engine with Phase 1 reliability
   */
  async check(text: string, options: CheckOptions = {}): Promise<CheckResult> {
    if (!this.isInitialized) {
      throw new Error('Engine not initialized. Call init() first.');
    }

    // Check cache first
    const cacheKey = `${text}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.engineUsage.cached++;
      this.logger.debug('Cache hit for text check');
      return cached;
    }

    const startTime = Date.now();

    try {
      this.logger.info(`🔍 Checking text with REAL nlprule WASM: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      
      // Run all engines in parallel
      const checkPromises: Promise<Issue[]>[] = [];

      // PHASE 1: REAL nlprule WASM Grammar Engine with reliable loader
      if (this.options.engines?.nlprule && this._shouldCheckCategory('grammar', options.categories)) {
        checkPromises.push(this._runNlpruleGrammarCheck(text));
      }

      // Spell Checker with health monitoring
      if ((this.options.engines?.hunspell || this.options.engines?.symspell) && 
          this._shouldCheckCategory('spelling', options.categories)) {
        checkPromises.push(this._runSpellCheck(text));
      }

      // Style Checker with health monitoring
      if ((this.options.engines?.writeGood || this.options.engines?.retext) && 
          this._shouldCheckCategory('style', options.categories)) {
        checkPromises.push(this._runStyleCheck(text));
      }

      // Wait for all checks to complete
      this.logger.debug(`⚡ Running ${checkPromises.length} engines in parallel...`);
      const results = await Promise.allSettled(checkPromises);
      
      // Combine all issues
      const allIssues: Issue[] = [];
      results.forEach((result, index) => {
        const engineNames = ['nlprule-wasm', 'hunspell', 'style-checker'];
        const engineName = engineNames[index] || `engine-${index}`;
        
        if (result.status === 'fulfilled') {
          allIssues.push(...result.value);
          this.logger.debug(`✅ Engine ${engineName}: ${result.value.length} issues`);
          this.healthMonitor.reportSuccess(engineName);
        } else {
          this.logger.warn(`❌ Engine ${engineName} failed:`, { error: result.reason });
          this.healthMonitor.reportFailure(engineName, new Error(result.reason));
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
          engine: 'nlprule-real-engine-phase1',
          processingTime,
          issuesFound: finalIssues.length,
          textLength: text.length,
          wordsChecked: text.split(/\s+/).length
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
      this.healthMonitor.reportFailure('nlprule-engine', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Alias for check() method to maintain compatibility with test suite
   */
  async checkText(text: string, options: CheckOptions = {}): Promise<CheckResult> {
    return this.check(text, options);
  }

  /**
   * PHASE 1: Run the REAL nlprule WASM grammar check with reliable loader
   */
  private async _runNlpruleGrammarCheck(text: string): Promise<Issue[]> {
    this.stats.engineUsage.grammar++;
    
    try {
      // Use GrammarWasm singleton for checker
      const checker = GrammarWasm.getInstance().getChecker();
      
      // Before each check:
      console.log('[DEBUG] [MegaEngine] Calling nlprule.check with text:', JSON.stringify(text));
      const ptr = checker.__wbg_ptr;
      const len = text.length;
      console.log('[DEBUG] [MegaEngine] Pointer info:', { ptr, len });
      
      const result = checker.check(text);
      console.log('[DEBUG] [MegaEngine] nlprule.check returned:', result);
      
      // Convert results to our Issue format
      const issues: Issue[] = [];
      
      if (result && Array.isArray(result)) {
        result.forEach((result: any, index: number) => {
          issues.push({
            id: `nlprule-${index}`,
            category: 'grammar',
            severity: 'error',
            priority: 1,
            message: result.message || 'Grammar error',
            shortMessage: 'Grammar',
            offset: result.offset || 0,
            length: result.length || 1,
            suggestions: result.suggestions || [],
            rule: {
              id: result.rule_id || 'NLPRULE',
              description: result.rule_description || 'nlprule grammar rule'
            },
            context: {
              text: text.slice(Math.max(0, result.offset - 20), result.offset + result.length + 20),
              offset: Math.max(0, result.offset - 20),
              length: Math.min(text.length, result.length + 40)
            },
            source: 'nlprule-wasm'
          });
        });
      }
      
      this.logger.debug(`✅ nlprule WASM found ${issues.length} grammar issues`);
      return issues;
      
    } catch (error) {
      this.logger.error('❌ nlprule WASM grammar check failed:', { error });
      this.healthMonitor.reportFailure('nlprule-wasm', error instanceof Error ? error : new Error('Unknown error'));
      throw error; // PHASE 1: No silent fallbacks
    }
  }

  /**
   * Run spell check with health monitoring
   */
  private async _runSpellCheck(text: string): Promise<Issue[]> {
    this.stats.engineUsage.spell++;
    try {
      const issues = await this.spellChecker.checkSpelling(text);
      this.healthMonitor.reportSuccess('hunspell');
      return issues;
    } catch (error) {
      this.logger.error('❌ Spell checker failed:', { error });
      this.healthMonitor.reportFailure('hunspell', error instanceof Error ? error : new Error('Unknown error'));
      throw error; // PHASE 1: No silent fallbacks
    }
  }

  /**
   * Run style check with health monitoring
   */
  private async _runStyleCheck(text: string): Promise<Issue[]> {
    this.stats.engineUsage.style++;
    try {
      const issues = await this.styleChecker.checkStyle(text);
      this.healthMonitor.reportSuccess('style-checker');
      return issues;
    } catch (error) {
      this.logger.error('❌ Style checker failed:', { error });
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
          status: wasmStatus.isLoaded ? 'loaded' : wasmStatus.isLoading ? 'loading' : 'failed',
          loadAttempts: wasmStatus.loadAttempts,
          lastLoadTime: this.stats.lastWasmLoadTime,
          hasChecker: wasmStatus.hasChecker
        },
        hunspell: {
          status: this.spellChecker.getStatus()?.isInitialized ? 'loaded' : 'failed',
          health: healthReport.engines.get('hunspell')
        },
        styleChecker: {
          status: this.styleChecker.getStatus()?.isInitialized ? 'loaded' : 'failed',
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
        moduleLoaded: !!this.wasmModule,
        checkerAvailable: !!this.nlpRuleChecker
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
}

export { NlpruleRealEngine as RealMegaEngine }; 