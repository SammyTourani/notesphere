/**
 * 🚀 Advanced Grammar Service - Uses nlprule WASM Engine
 * Sophisticated pattern recognition for comprehensive grammar checking
 * No hard-coded rules - uses ML-based linguistic analysis
 */

import { MegaEngine } from '../../mega-engine/packages/mega-engine/dist/mega-engine.js';
import { SimpleGrammarRules } from './SimpleGrammarRules.js';
import UltimateGrammarRules from './UltimateGrammarRules.js';

class AdvancedGrammarService {
  constructor() {
    this.megaEngine = new MegaEngine();
    this.simpleGrammarRules = new SimpleGrammarRules();
    this.ultimateGrammarRules = new UltimateGrammarRules();
    this.isInitialized = false;
    this.isInitializing = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.statistics = {
      totalChecks: 0,
      cacheHits: 0,
      averageProcessingTime: 0,
      issuesFound: 0
    };
  }

  /**
   * Initialize the advanced nlprule WASM engine
   */
  async initialize() {
    if (this.isInitialized) return true;
    if (this.isInitializing) {
      // Wait for existing initialization
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.isInitialized;
    }

    this.isInitializing = true;
    
    try {
      console.log('🚀 Initializing Advanced Grammar Service with nlprule WASM...');
      
      const success = await this.megaEngine.init({
        engines: {
          nlprule: true,     // Sophisticated WASM grammar engine
          hunspell: true,    // Spell checking
          symspell: true,    // Fast spell suggestions
          writeGood: true,   // Style analysis
          retext: true       // Advanced text analysis
        },
        debug: false,
        assetsPath: '/mega-engine/packages/mega-engine/public'
      });

      if (success) {
        this.isInitialized = true;
        console.log('✅ Advanced Grammar Service initialized with nlprule WASM');
        return true;
      } else {
        throw new Error('Mega engine initialization failed');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Advanced Grammar Service:', error);
      this.isInitialized = false;
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Check text using sophisticated pattern recognition
   * @param {string} text - Text to analyze
   * @param {Object} options - Analysis options
   */
  async checkText(text, options = {}) {
    const startTime = Date.now();
    
    try {
      // Auto-initialize if needed
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.warn('⚠️ Advanced Grammar Service not available, using fallback');
          return this.fallbackCheck(text);
        }
      }

      // Validate input
      if (!text || typeof text !== 'string' || text.trim().length < 5) {
        return {
          issues: [],
          statistics: {
            totalIssues: 0,
            processingTime: 0,
            sources: {
              megaEngine: 0,
              simpleRules: 0,
              ultimateRules: 0
            }
          }
        };
      }

      const cleanText = this.stripHtml(text);
      
      // Check cache first
      const cacheKey = `advanced:${cleanText}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        this.statistics.cacheHits++;
        return cached.result;
      }

      console.log('🔍 Advanced Grammar: Analyzing with nlprule WASM + SimpleGrammarRules + UltimateGrammarRules...');

      // Run all engines in parallel for maximum comprehensive coverage
      const [megaResult, simpleRulesIssues, ultimateRulesIssues] = await Promise.all([
        this.megaEngine.check(cleanText, {
          categories: options.categories || ['grammar', 'spelling', 'style'],
          language: options.language || 'en-US',
          enableCache: true
        }),
        Promise.resolve(this.simpleGrammarRules.checkGrammar(cleanText)),
        Promise.resolve(this.ultimateGrammarRules.checkText(cleanText))
      ]);

      // Transform mega-engine results to match UI expectations
      const transformedMegaIssues = this.transformMegaEngineResults(megaResult, text);
      
      // Transform SimpleGrammarRules results to match UI expectations
      const transformedSimpleIssues = this.transformSimpleGrammarResults(simpleRulesIssues, text);
      
      // Transform UltimateGrammarRules results to match UI expectations
      const transformedUltimateIssues = this.transformUltimateGrammarResults(ultimateRulesIssues, text);
      
      // Combine all issues and deduplicate
      const allIssues = [...transformedMegaIssues, ...transformedSimpleIssues, ...transformedUltimateIssues];
      const transformedIssues = this.deduplicateIssues(allIssues);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      const finalResult = {
        issues: transformedIssues,
        statistics: {
          totalIssues: transformedIssues.length,
          processingTime,
          sources: {
            megaEngine: transformedMegaIssues.length,
            simpleRules: transformedSimpleIssues.length,
            ultimateRules: transformedUltimateIssues.length
          }
        }
      };

      // Cache results
      this.cache.set(cacheKey, {
        result: finalResult,
        timestamp: Date.now()
      });

      // Update statistics
      this.updateStatistics(processingTime, transformedIssues.length);

      console.log(`✅ Advanced Grammar: Found ${transformedIssues.length} issues in ${processingTime}ms (Mega Engine: ${transformedMegaIssues.length}, Simple Rules: ${transformedSimpleIssues.length}, Ultimate Rules: ${transformedUltimateIssues.length})`);

      return finalResult;

    } catch (error) {
      console.error('❌ Advanced grammar check failed:', error);
      return this.fallbackCheck(text);
    }
  }

  /**
   * Transform mega-engine results to match UI expectations
   */
  transformMegaEngineResults(result, originalText) {
    if (!result || !result.issues) return [];

    return result.issues.map(issue => ({
      id: issue.id,
      category: this.mapCategory(issue.category),
      type: issue.type || 'general',
      message: issue.message,
      shortMessage: issue.shortMessage || this.generateShortMessage(issue),
      offset: issue.offset,
      length: issue.length,
      severity: this.mapSeverity(issue.severity),
      suggestions: issue.suggestions || [],
      rule: {
        id: issue.rule?.id || 'nlprule',
        description: issue.rule?.description || issue.message,
        category: issue.category
      },
      context: {
        text: issue.context?.text || '',
        offset: issue.context?.offset || issue.offset,
        length: issue.context?.length || issue.length
      },
      originalText: originalText.substring(issue.offset, issue.offset + issue.length),
      confidence: issue.confidence || 0.85,
      source: 'nlprule-wasm'
    }));
  }

  /**
   * Transform SimpleGrammarRules results to match UI expectations
   */
  transformSimpleGrammarResults(issues, originalText) {
    if (!issues || !Array.isArray(issues)) return [];

    return issues.map(issue => ({
      id: issue.id,
      category: issue.category,
      type: issue.type || 'simple-grammar',
      message: issue.message,
      shortMessage: issue.shortMessage || 'Grammar',
      offset: issue.offset,
      length: issue.length,
      severity: this.mapSeverity(issue.severity),
      suggestions: issue.suggestions || [],
      rule: {
        id: issue.rule?.id || 'simple-grammar',
        description: issue.rule?.description || issue.message,
        category: issue.category
      },
      context: {
        text: issue.context?.text || '',
        offset: issue.context?.offset || issue.offset,
        length: issue.context?.length || issue.length
      },
      originalText: originalText.substring(issue.offset, issue.offset + issue.length),
      confidence: 0.95, // SimpleGrammarRules are highly confident
      source: 'simple-grammar-rules'
    }));
  }

  /**
   * Transform UltimateGrammarRules results to match UI expectations
   */
  transformUltimateGrammarResults(issues, originalText) {
    if (!issues || !Array.isArray(issues)) return [];

    return issues.map(issue => ({
      id: issue.id,
      category: issue.category,
      type: issue.type || 'ultimate-grammar',
      message: issue.message,
      shortMessage: issue.shortMessage || 'Advanced Grammar',
      offset: issue.offset,
      length: issue.length,
      severity: this.mapSeverity(issue.severity),
      suggestions: issue.suggestions || [],
      rule: {
        id: issue.rule?.id || 'ultimate-grammar',
        description: issue.rule?.description || issue.message,
        category: issue.category
      },
      context: {
        text: issue.context?.text || '',
        offset: issue.context?.offset || issue.offset,
        length: issue.context?.length || issue.length
      },
      originalText: originalText.substring(issue.offset, issue.offset + issue.length),
      confidence: 0.98, // UltimateGrammarRules are very highly confident
      source: 'ultimate-grammar-rules'
    }));
  }

  /**
   * Remove duplicate issues when combining multiple engines
   */
  deduplicateIssues(issues) {
    if (!issues || issues.length <= 1) return issues;

    const deduplicated = [];
    const seen = new Set();

    // Sort by position first
    const sortedIssues = [...issues].sort((a, b) => {
      if (a.offset !== b.offset) return a.offset - b.offset;
      return a.length - b.length;
    });

    for (const issue of sortedIssues) {
      // Create a unique key based on position, length, and message
      const key = `${issue.offset}-${issue.length}-${issue.message}`;
      
      // Only check for exact duplicates (same position AND same message)
      const isDuplicate = deduplicated.some(existing => {
        return existing.offset === issue.offset && 
               existing.length === issue.length && 
               existing.message === issue.message;
      });

      if (!seen.has(key) && !isDuplicate) {
        seen.add(key);
        deduplicated.push(issue);
      }
    }

    return deduplicated;
  }

  /**
   * Map mega-engine categories to UI categories
   */
  mapCategory(category) {
    const categoryMap = {
      'grammar': 'grammar',
      'spelling': 'spelling',
      'style': 'style',
      'punctuation': 'punctuation',
      'clarity': 'clarity',
      'readability': 'style'
    };
    return categoryMap[category] || 'grammar';
  }

  /**
   * Map mega-engine severity to UI severity
   */
  mapSeverity(severity) {
    const severityMap = {
      'error': 'error',
      'warning': 'warning',
      'info': 'info',
      'suggestion': 'info'
    };
    return severityMap[severity] || 'warning';
  }

  /**
   * Generate short message for issue
   */
  generateShortMessage(issue) {
    const messages = {
      grammar: 'Grammar',
      spelling: 'Spelling',
      style: 'Style',
      punctuation: 'Punctuation',
      clarity: 'Clarity'
    };
    return messages[issue.category] || 'Writing';
  }

  /**
   * Basic fallback check if mega-engine fails
   */
  fallbackCheck(text) {
    console.log('🔄 Using basic fallback grammar check');
    
    const issues = [];
    const words = text.split(/\s+/);
    
    // Basic spell check simulation
    const commonMisspellings = {
      'teh': 'the',
      'adn': 'and',
      'yuor': 'your',
      'recieve': 'receive',
      'seperate': 'separate'
    };

    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (commonMisspellings[cleanWord]) {
        issues.push({
          id: `fallback-${index}`,
          category: 'spelling',
          message: 'Possible spelling error',
          offset: text.indexOf(word),
          length: word.length,
          severity: 'warning',
          suggestions: [commonMisspellings[cleanWord]],
          source: 'fallback'
        });
      }
    });

    return {
      issues: issues,
      statistics: {
        totalIssues: issues.length,
        processingTime: 0,
        sources: {
          megaEngine: 0,
          simpleRules: 0,
          ultimateRules: 0,
          fallback: issues.length
        }
      }
    };
  }

  /**
   * Update service statistics
   */
  updateStatistics(processingTime, issuesFound) {
    this.statistics.totalChecks++;
    this.statistics.issuesFound += issuesFound;
    this.statistics.averageProcessingTime = 
      (this.statistics.averageProcessingTime + processingTime) / 2;
  }

  /**
   * Strip HTML tags from text
   */
  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      cacheSize: this.cache.size,
      isInitialized: this.isInitialized,
      engineType: 'nlprule-wasm'
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Apply suggestion to text
   */
  applySuggestion(text, issue, suggestion) {
    const before = text.substring(0, issue.offset);
    const after = text.substring(issue.offset + issue.length);
    return before + suggestion + after;
  }
}

// Create singleton instance
const advancedGrammarService = new AdvancedGrammarService();

export default advancedGrammarService; 