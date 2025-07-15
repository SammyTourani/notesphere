/**
 * REAL Mega Grammar Engine - Uses the Actual nlprule WASM Engine
 * This is what you wanted - the sophisticated grammar engine with thousands of rules
 */

import type { 
  Issue, 
  CheckOptions, 
  CheckResult, 
  InitOptions, 
  EngineStatus,
  IssueCategory 
} from './types.js';

// Use the REAL nlprule WASM engine
import { ProfessionalHunspellChecker } from './spell-checker-nspell.js';
import { StyleChecker } from './style-checker.js';
import { SmartCache } from './cache.js';
import { v4 as uuidv4 } from 'uuid';

export class NlpruleRealEngine {
  private spellChecker = new ProfessionalHunspellChecker();
  private styleChecker = new StyleChecker();
  private cache = new SmartCache<CheckResult>(1000);
  private isInitialized = false;
  private options: InitOptions = {};
  private grammarWorker: Worker | null = null;
  private workerReady = false;

  private stats = {
    totalChecks: 0,
    engineUsage: {
      grammar: 0,
      spell: 0,
      style: 0,
      cached: 0
    },
    averageTime: 0,
    totalTime: 0
  };

  /**
   * Initialize the real nlprule mega engine
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
      console.log('🚀 Initializing REAL nlprule WASM Grammar Engine...');

      const initPromises: Promise<boolean>[] = [];

      // Initialize REAL nlprule WASM grammar engine
      if (this.options.engines?.nlprule) {
        console.log('   📦 Initializing REAL nlprule WASM Grammar Engine...');
        initPromises.push(this.initNlpruleGrammar());
      }

      if (this.options.engines?.hunspell || this.options.engines?.symspell) {
        console.log('   📚 Initializing Spell Checker...');
        initPromises.push(this.spellChecker.initialize(this.options));
      }

      if (this.options.engines?.writeGood || this.options.engines?.retext) {
        console.log('   ✨ Initializing Style Checker...');
        initPromises.push(this.styleChecker.initialize(this.options));
      }

      // Wait for all engines to initialize
      const results = await Promise.allSettled(initPromises);
      
      // Log initialization results
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Engine ${index} failed to initialize:`, result.reason);
        } else {
          console.log(`✅ Engine ${index} initialized successfully`);
        }
      });

      this.isInitialized = true;
      console.log('✅ REAL nlprule WASM Grammar Engine initialized successfully');
      
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize REAL nlprule Grammar Engine:', error);
      return false;
    }
  }

  /**
   * Initialize the real nlprule WASM grammar engine
   */
  private async initNlpruleGrammar(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        // Node.js - use direct import
        console.log('   🔧 Node.js: Using direct nlprule import...');
        return true;
      }

      // Browser - use worker
      console.log('   🔧 Browser: Initializing nlprule WASM worker...');
      
      this.grammarWorker = new Worker(
        new URL('./grammar-worker.js', import.meta.url), 
        { type: 'module' }
      );

      // Wait for worker to be ready
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('nlprule WASM worker initialization timeout'));
        }, 30000); // 30 second timeout

        this.grammarWorker!.onmessage = (e) => {
          if (e.data === '__ready__') {
            clearTimeout(timeout);
            this.workerReady = true;
            console.log('   ✅ nlprule WASM worker ready');
            resolve(true);
          } else if (e.data?.error) {
            clearTimeout(timeout);
            reject(new Error(`nlprule WASM worker error: ${e.data.error}`));
          }
        };

        this.grammarWorker!.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };

        // Initialize the worker
        this.grammarWorker!.postMessage('__init__');
      });

    } catch (error) {
      console.error('❌ Failed to initialize nlprule WASM grammar engine:', error);
      return false;
    }
  }

  /**
   * Check text using the real nlprule WASM engine
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
      return cached;
    }

    const startTime = Date.now();

    try {
      console.log(`🔍 Checking text with REAL nlprule WASM: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      
      // Run all engines in parallel
      const checkPromises: Promise<Issue[]>[] = [];

      // REAL nlprule WASM Grammar Engine
      if (this.options.engines?.nlprule && this._shouldCheckCategory('grammar', options.categories)) {
        checkPromises.push(this._runNlpruleGrammarCheck(text));
      }

      // Spell Checker
      if ((this.options.engines?.hunspell || this.options.engines?.symspell) && 
          this._shouldCheckCategory('spelling', options.categories)) {
        checkPromises.push(this._runSpellCheck(text));
      }

      // Style Checker
      if ((this.options.engines?.writeGood || this.options.engines?.retext) && 
          this._shouldCheckCategory('style', options.categories)) {
        checkPromises.push(this._runStyleCheck(text));
      }

      // Wait for all checks to complete
      console.log(`⚡ Running ${checkPromises.length} engines in parallel...`);
      const results = await Promise.allSettled(checkPromises);
      
      // Combine all issues
      const allIssues: Issue[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allIssues.push(...result.value);
          console.log(`   ✅ Engine ${index + 1}: ${result.value.length} issues`);
        } else {
          console.warn(`   ❌ Engine ${index + 1} failed:`, result.reason);
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
          engine: 'nlprule-real-engine',
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

      console.log(`📊 Found ${finalIssues.length} issues in ${processingTime}ms`);
      
      return result;

    } catch (error) {
      console.error('❌ Error during text checking:', error);
      throw error;
    }
  }

  /**
   * Run the REAL nlprule WASM grammar check
   */
  private async _runNlpruleGrammarCheck(text: string): Promise<Issue[]> {
    this.stats.engineUsage.grammar++;
    
    if (typeof window === 'undefined') {
      // Node.js - use direct import
             try {
         console.log('   🔧 Node.js: Using direct nlprule import...');
         // @ts-ignore - nlprule WASM module has implicit any type
         const nlpModule = await import('./nlp/pkg/nlprule_wasm.js') as any;
         const checker = nlpModule.NlpRuleChecker.new();
         const results = checker.check(text);
        
        // Convert results to our Issue format
        const issues: Issue[] = [];
        
        if (results && Array.isArray(results)) {
          results.forEach((result: any, index: number) => {
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
        
        console.log(`   ✅ nlprule WASM found ${issues.length} grammar issues`);
        return issues;
        
      } catch (error) {
        console.error('❌ nlprule WASM failed in Node.js:', error);
        return [];
      }
    }

    // Browser - use worker
    if (!this.workerReady || !this.grammarWorker) {
      console.warn('   ⚠️ nlprule WASM worker not ready');
      return [];
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('nlprule WASM check timeout'));
      }, 10000);

      this.grammarWorker!.onmessage = (e) => {
        clearTimeout(timeout);
        
        if (e.data?.error) {
          reject(new Error(`nlprule WASM error: ${e.data.error}`));
          return;
        }

        // Convert worker results to our Issue format
        const issues: Issue[] = [];
        const results = e.data;
        
        if (results && Array.isArray(results)) {
          results.forEach((result: any, index: number) => {
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
        
        console.log(`   ✅ nlprule WASM found ${issues.length} grammar issues`);
        resolve(issues);
      };

      this.grammarWorker!.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      // Send text to worker
      this.grammarWorker!.postMessage(text);
    });
  }

  /**
   * Run spell check
   */
  private async _runSpellCheck(text: string): Promise<Issue[]> {
    this.stats.engineUsage.spell++;
    try {
      const issues = await this.spellChecker.checkSpelling(text);
      return issues;
    } catch (error) {
      console.error('❌ Spell checker failed:', error);
      return [];
    }
  }

  /**
   * Run style check
   */
  private async _runStyleCheck(text: string): Promise<Issue[]> {
    this.stats.engineUsage.style++;
    try {
      const issues = await this.styleChecker.checkStyle(text);
      return issues;
    } catch (error) {
      console.error('❌ Style checker failed:', error);
      return [];
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
   * Get engine statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export { NlpruleRealEngine as RealMegaEngine }; 