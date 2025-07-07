/**
 * Mega Grammar Engine - The Ultimate 100% Offline Grammar Checker
 * Orchestrates nlprule WASM, Hunspell, SymSpell, write-good, and retext
 */

import type { 
  Issue, 
  CheckOptions, 
  CheckResult, 
  InitOptions, 
  EngineStatus,
  IssueCategory 
} from './types.js';
import { WasmGrammarEngine } from './wasm-grammar-engine.js';
import { SpellChecker } from './spell-checker.js';
import { StyleChecker } from './style-checker.js';
import { SmartCache } from './cache.js';
import { v4 as uuidv4 } from 'uuid';

export class MegaEngine {
  private wasmEngine = new WasmGrammarEngine();
  private spellChecker = new SpellChecker();
  private styleChecker = new StyleChecker();
  private cache = new SmartCache<CheckResult>(1000);
  private isInitialized = false;
  private options: InitOptions = {};

  private stats = {
    totalChecks: 0,
    engineUsage: {
      wasm: 0,
      spell: 0,
      style: 0,
      cached: 0
    },
    averageTime: 0,
    totalTime: 0
  };

  /**
   * Initialize the mega engine
   */
  async init(options: InitOptions = {}): Promise<boolean> {
    if (this.isInitialized) {
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
      console.log('🚀 Initializing Mega Grammar Engine...');

      const initPromises: Promise<boolean>[] = [];

      // Initialize engines based on options
      if (this.options.engines?.nlprule) {
        initPromises.push(this.wasmEngine.initialize(this.options));
      }

      if (this.options.engines?.hunspell || this.options.engines?.symspell) {
        initPromises.push(this.spellChecker.initialize(this.options));
      }

      if (this.options.engines?.writeGood || this.options.engines?.retext) {
        initPromises.push(this.styleChecker.initialize(this.options));
      }

      // Wait for all engines to initialize
      const results = await Promise.allSettled(initPromises);
      
      // Log initialization results
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Engine ${index} failed to initialize:`, result.reason);
        }
      });

      this.isInitialized = true;
      console.log('✅ Mega Grammar Engine initialized successfully');
      
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Mega Grammar Engine:', error);
      return false;
    }
  }

  /**
   * Check text for all types of issues
   */
  async check(text: string, options: CheckOptions = {}): Promise<CheckResult> {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        issues: [],
        statistics: {
          engine: 'mega-engine',
          processingTime: 0,
          issuesFound: 0,
          textLength: 0,
          wordsChecked: 0
        }
      };
    }

    // Initialize if needed
    if (!this.isInitialized) {
      await this.init();
    }

    const startTime = Date.now();
    const cacheKey = SmartCache.generateKey(text, options);

    // Check cache first
    if (options.enableCache !== false) {
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        this.stats.engineUsage.cached++;
        this._logDebug('📋 Using cached result');
        return {
          ...cachedResult,
          statistics: {
            ...cachedResult.statistics,
            fromCache: true
          }
        };
      }
    }

    try {
      // Run all enabled engines in parallel
      const checkPromises: Promise<Issue[]>[] = [];

      // WASM Grammar Engine (nlprule)
      if (this.options.engines?.nlprule && this._shouldCheckCategory('grammar', options.categories)) {
        checkPromises.push(this._runWasmCheck(text, options));
      }

      // Spell Checker (Hunspell + SymSpell)
      if ((this.options.engines?.hunspell || this.options.engines?.symspell) && 
          this._shouldCheckCategory('spelling', options.categories)) {
        checkPromises.push(this._runSpellCheck(text));
      }

      // Style Checker (write-good + retext)
      if ((this.options.engines?.writeGood || this.options.engines?.retext) && 
          this._shouldCheckCategory('style', options.categories)) {
        checkPromises.push(this._runStyleCheck(text));
      }

      // Wait for all checks to complete
      const results = await Promise.allSettled(checkPromises);
      
      // Combine all issues
      const allIssues: Issue[] = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allIssues.push(...result.value);
        } else {
          console.warn('Engine check failed:', result.reason);
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
          engine: 'mega-engine',
          processingTime,
          issuesFound: finalIssues.length,
          textLength: text.length,
          wordsChecked: text.split(/\s+/).length
        }
      };

      // Update stats
      this._updateStats(processingTime);

      // Cache the result
      if (options.enableCache !== false) {
        this.cache.set(cacheKey, result);
      }

      this._logDebug(`✅ Check completed: ${finalIssues.length} issues found in ${processingTime}ms`);
      
      return result;

    } catch (error) {
      console.error('❌ Mega engine check failed:', error);
      throw new Error(`Grammar check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run WASM grammar check
   */
  private async _runWasmCheck(text: string, options: CheckOptions): Promise<Issue[]> {
    try {
      this.stats.engineUsage.wasm++;
      const result = await this.wasmEngine.checkText(text, options);
      return result.issues;
    } catch (error) {
      this._logDebug('WASM check failed:', error);
      return [];
    }
  }

  /**
   * Run spell check
   */
  private async _runSpellCheck(text: string): Promise<Issue[]> {
    try {
      this.stats.engineUsage.spell++;
      return await this.spellChecker.checkSpelling(text);
    } catch (error) {
      this._logDebug('Spell check failed:', error);
      return [];
    }
  }

  /**
   * Run style check
   */
  private async _runStyleCheck(text: string): Promise<Issue[]> {
    try {
      this.stats.engineUsage.style++;
      return await this.styleChecker.checkStyle(text);
    } catch (error) {
      this._logDebug('Style check failed:', error);
      return [];
    }
  }

  /**
   * Check if a category should be checked
   */
  private _shouldCheckCategory(category: IssueCategory, requestedCategories?: IssueCategory[]): boolean {
    if (!requestedCategories) return true;
    return requestedCategories.includes(category);
  }

  /**
   * Deduplicate similar issues
   */
  private _deduplicateIssues(issues: Issue[]): Issue[] {
    const deduped: Issue[] = [];
    const seen = new Set<string>();

    for (const issue of issues) {
      // Create a signature for deduplication
      const signature = `${issue.offset}-${issue.length}-${issue.category}`;
      
      if (!seen.has(signature)) {
        seen.add(signature);
        deduped.push(issue);
      } else {
        // If we've seen a similar issue, merge suggestions
        const existingIndex = deduped.findIndex(
          existing => existing.offset === issue.offset && 
                     existing.length === issue.length && 
                     existing.category === issue.category
        );
        
        if (existingIndex !== -1) {
          const existing = deduped[existingIndex];
          // Merge unique suggestions
          const allSuggestions = [...existing.suggestions, ...issue.suggestions];
          existing.suggestions = [...new Set(allSuggestions)].slice(0, 5);
          
          // Keep the higher priority issue
          if (issue.priority < existing.priority) {
            deduped[existingIndex] = { ...issue, suggestions: existing.suggestions };
          }
        }
      }
    }

    return deduped;
  }

  /**
   * Update usage statistics
   */
  private _updateStats(processingTime: number): void {
    this.stats.totalChecks++;
    this.stats.totalTime += processingTime;
    this.stats.averageTime = Math.round(this.stats.totalTime / this.stats.totalChecks);
  }

  /**
   * Log debug messages if debug is enabled
   */
  private _logDebug(...args: any[]): void {
    if (this.options.debug) {
      console.log('[MegaEngine]', ...args);
    }
  }

  /**
   * Get engine status and information
   */
  getStatus(): EngineStatus {
    return {
      isInitialized: this.isInitialized,
      isReady: this.isInitialized,
      capabilities: [
        'spelling',
        'grammar',
        'style',
        'punctuation',
        'clarity',
        'inclusivity',
        'readability'
      ],
      languages: ['en-US', 'en-GB'],
      stats: {
        totalChecks: this.stats.totalChecks,
        averageTime: this.stats.averageTime,
        cacheHitRate: this.stats.totalChecks > 0 
          ? Math.round((this.stats.engineUsage.cached / this.stats.totalChecks) * 100)
          : 0
      }
    };
  }

  /**
   * Get detailed engine information
   */
  getInfo() {
    return {
      name: 'Mega Grammar Engine',
      version: '1.0.0',
      type: 'orchestrator',
      engines: {
        wasm: this.wasmEngine.getStatus(),
        spell: this.spellChecker.getStatus(),
        style: this.styleChecker.getStatus()
      },
      statistics: this.stats,
      cacheStats: this.cache.getStats(),
      options: this.options
    };
  }

  /**
   * Reset all statistics and caches
   */
  reset(): void {
    this.cache.clear();
    this.wasmEngine.reset();
    this.stats = {
      totalChecks: 0,
      engineUsage: {
        wasm: 0,
        spell: 0,
        style: 0,
        cached: 0
      },
      averageTime: 0,
      totalTime: 0
    };
    console.log('🧹 Mega Grammar Engine reset');
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.wasmEngine.dispose();
    this.spellChecker.cleanup();
    this.styleChecker.dispose();
    this.cache.clear();
    this.isInitialized = false;
    console.log('🗑️ Mega Grammar Engine disposed');
  }
}

// Export singleton instance for convenience
export const megaEngine = new MegaEngine();

// Also export the class for custom instances
export { MegaEngine as default };
