/**
 * 🌍 Advanced Grammar Service - Real Engine Edition
 * Professional-grade grammar checking using the Real Mega-Engine System
 * Uses actual nlprule WASM, Hunspell, SymSpell, write-good, and retext engines
 */

// Mega-engine will be loaded dynamically
let megaEngine = null;

class AdvancedGrammarService {
  constructor() {
    this.isInitialized = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.statistics = {
      totalChecks: 0,
      cacheHits: 0,
      averageProcessingTime: 0,
      issuesFound: 0,
      averageQualityScore: 0
    };
    
    console.log('🌍 Advanced Grammar Service (Real Engine Edition) initialized');
    
    // Auto-initialize the real engines
    this.initialize().catch(console.error);
  }

  /**
   * Initialize the real mega-engine with all available engines
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      console.log('🚀 Initializing Real Mega-Engine with WASM engines...');
      
      // Try to load mega-engine dynamically
      if (!megaEngine) {
        try {
          // Try the compiled dist version first
          const module1 = await import('../../mega-engine/packages/mega-engine/dist/index.js');
          megaEngine = { init: module1.init, check: module1.check };
          console.log('✅ Loaded mega-engine from dist/');
        } catch {
          try {
            // Fallback to source TypeScript files
            const module2 = await import('../../mega-engine/packages/mega-engine/src/index.ts');
            megaEngine = { init: module2.init, check: module2.check };
            console.log('✅ Loaded mega-engine from src/');
          } catch (error) {
            console.warn('⚠️ Could not import mega-engine, using fallback system:', error.message);
            megaEngine = null;
          }
        }
      }
      
      if (!megaEngine) {
        console.warn('⚠️ Mega-Engine not available, using fallback mode');
        this.isInitialized = true; // Allow fallback operation
        return true;
      }
      
      // Initialize with all real engines enabled
      const success = await megaEngine.init({
        engines: {
          nlprule: true,    // Real WASM grammar engine
          hunspell: true,   // Professional spell checking
          symspell: true,   // Fast spell suggestions
          writeGood: true,  // Style checking
          retext: true      // Readability & inclusivity
        },
        debug: false,
        assetsPath: './public'
      });

      if (success) {
        this.isInitialized = true;
        console.log('✅ Real Mega-Engine initialized successfully with WASM engines');
        return true;
      } else {
        console.warn('⚠️ Mega-Engine initialization returned false');
        this.isInitialized = true; // Allow fallback operation
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize Real Mega-Engine:', error);
      this.isInitialized = true; // Allow fallback operation
      return false;
    }
  }

  /**
   * Check text using the Real Mega-Engine System with actual engines
   * @param {string} text - Text to analyze
   * @param {Object} options - Analysis options
   */
  async checkText(text, options = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure engine is initialized
      if (!this.isInitialized) {
        console.log('🔄 Engine not ready, initializing...');
        await this.initialize();
      }

      // Check cache first for exact matches
      const cacheKey = `megaengine:${text}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        this.statistics.cacheHits++;
        return cached.result;
      }

      console.log(`🔍 Real Mega-Engine checking: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

      let result;
      let transformedIssues = [];

      if (megaEngine && megaEngine.check) {
        // Use the real mega-engine to check text
        result = await megaEngine.check(text, {
          categories: options.categories || ['grammar', 'spelling', 'style', 'clarity'],
          language: options.language || 'en-US',
          enableCache: true
        });

        // Transform mega-engine results to our expected format
        transformedIssues = result.issues.map(issue => ({
          id: issue.id,
          type: issue.category,
          severity: issue.severity,
          message: issue.message,
          shortMessage: issue.shortMessage || this._getShortMessage(issue),
          suggestions: issue.suggestions || [],
          startIndex: issue.offset,
          endIndex: issue.offset + issue.length,
          originalText: text.slice(issue.offset, issue.offset + issue.length),
          context: issue.context,
          rule: issue.rule || { id: 'MEGA_ENGINE', description: 'Real engine detection' },
          source: issue.source || 'mega-engine',
          priority: issue.priority || 5,
          confidence: this._calculateConfidence(issue)
        }));
      } else {
        // Fallback: basic analysis
        console.log('⚠️ Using fallback grammar analysis');
        transformedIssues = this._fallbackAnalysis(text);
      }

      const processingTime = Date.now() - startTime;

      const finalResult = {
        issues: transformedIssues,
        summary: {
          totalIssues: transformedIssues.length,
          byType: this._groupIssuesByType(transformedIssues),
          bySeverity: this._groupIssuesBySeverity(transformedIssues),
          processingTime: processingTime,
          qualityScore: this._calculateQualityScore(transformedIssues, text.length)
        },
        engine: megaEngine ? 'mega-engine-real' : 'fallback',
        statistics: result?.statistics || {
          engine: megaEngine ? 'mega-engine' : 'fallback',
          processingTime,
          issuesFound: transformedIssues.length,
          textLength: text.length,
          wordsChecked: text.split(/\s+/).length
        }
      };

      // Cache the result
      this.cache.set(cacheKey, {
        result: finalResult,
        timestamp: Date.now()
      });

      // Update statistics
      this.statistics.totalChecks++;
      this.statistics.issuesFound += transformedIssues.length;
      this.statistics.averageProcessingTime = 
        (this.statistics.averageProcessingTime * (this.statistics.totalChecks - 1) + processingTime) / this.statistics.totalChecks;
      this.statistics.averageQualityScore = 
        (this.statistics.averageQualityScore * (this.statistics.totalChecks - 1) + finalResult.summary.qualityScore) / this.statistics.totalChecks;

      console.log(`📊 Real Mega-Engine found ${transformedIssues.length} issues in ${processingTime}ms`);
      console.log(`   Quality Score: ${finalResult.summary.qualityScore}/100`);

      return finalResult;

    } catch (error) {
      console.error('❌ Real Mega-Engine check failed:', error);
      
      // Return fallback result
      const fallbackIssues = this._fallbackAnalysis(text);
      return {
        issues: fallbackIssues,
        summary: {
          totalIssues: fallbackIssues.length,
          byType: this._groupIssuesByType(fallbackIssues),
          bySeverity: this._groupIssuesBySeverity(fallbackIssues),
          processingTime: Date.now() - startTime,
          qualityScore: this._calculateQualityScore(fallbackIssues, text.length),
          error: error.message
        },
        engine: 'fallback-error',
        statistics: {
          engine: 'fallback-error',
          processingTime: Date.now() - startTime,
          issuesFound: fallbackIssues.length,
          textLength: text.length,
          wordsChecked: text.split(/\s+/).length,
          error: error.message
        }
      };
    }
  }

  /**
   * Fallback analysis when mega-engine is not available
   */
  _fallbackAnalysis(text) {
    const issues = [];
    
    // Basic spell check patterns
    const commonMisspellings = {
      'teh': 'the',
      'seperate': 'separate',
      'definately': 'definitely',
      'occured': 'occurred',
      'recieve': 'receive'
    };
    
    Object.entries(commonMisspellings).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        issues.push({
          id: `fallback-${issues.length}`,
          type: 'spelling',
          severity: 'error',
          message: `"${wrong}" is misspelled`,
          shortMessage: 'Spelling',
          suggestions: [correct],
          startIndex: match.index,
          endIndex: match.index + wrong.length,
          originalText: wrong,
          source: 'fallback',
          priority: 3,
          confidence: 0.7
        });
      }
    });
    
    return issues;
  }

  /**
   * Generate short message from issue
   */
  _getShortMessage(issue) {
    if (issue.shortMessage) return issue.shortMessage;
    
    const categoryMap = {
      'grammar': 'Grammar',
      'spelling': 'Spelling',
      'style': 'Style',
      'clarity': 'Clarity',
      'punctuation': 'Punctuation',
      'readability': 'Readability'
    };
    
    return categoryMap[issue.category] || 'Issue';
  }

  /**
   * Calculate confidence score based on issue properties
   */
  _calculateConfidence(issue) {
    let confidence = 0.8; // Base confidence for real engines
    
    // Real engines are more reliable
    if (issue.source === 'nlprule-wasm') confidence = 0.95;
    if (issue.source === 'hunspell') confidence = 0.9;
    if (issue.source === 'writeGood') confidence = 0.85;
    
    // Adjust based on severity
    if (issue.severity === 'error') confidence += 0.1;
    if (issue.severity === 'warning') confidence += 0.05;
    
    // Adjust based on suggestions
    if (issue.suggestions && issue.suggestions.length > 0) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  /**
   * Group issues by type
   */
  _groupIssuesByType(issues) {
    return issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Group issues by severity
   */
  _groupIssuesBySeverity(issues) {
    return issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Calculate quality score
   */
  _calculateQualityScore(issues, textLength) {
    if (textLength === 0) return 100;
    
    let score = 100;
    const wordsCount = Math.max(1, textLength / 5); // Rough word count estimate
    
    issues.forEach(issue => {
      const penalty = issue.severity === 'error' ? 3 : 
                     issue.severity === 'warning' ? 2 : 1;
      score -= penalty;
    });
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Update internal statistics
   */
  updateStatistics(result) {
    this.statistics.totalChecks++;
    this.statistics.issuesFound += result.issues.length;
    this.statistics.averageProcessingTime = 
      (this.statistics.averageProcessingTime + result.statistics.processingTime) / 2;
    
    if (result.statistics.qualityScore) {
      this.statistics.averageQualityScore = 
        (this.statistics.averageQualityScore + result.statistics.qualityScore) / 2;
    }
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      cacheSize: this.cache.size,
      // The multiEngineGrammarService is removed, so we'll return a placeholder or remove this line
      // For now, keeping it as is, but it will be empty.
      multiEngineStats: {} 
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Advanced Grammar Service cache cleared');
  }

  /**
   * Fallback check method (deprecated - now using World-Class Multi-Engine Grammar Service)
   */
  fallbackCheck(text) {
    console.warn('⚠️ Fallback check called - this should not happen with World-Class Multi-Engine Grammar Service');
    return {
      issues: [],
      statistics: {
        totalIssues: 0,
        processingTime: 0,
        message: 'Fallback mode - limited functionality'
      }
    };
  }

  /**
   * Utility method to strip HTML tags
   */
  stripHtml(text) {
    return text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
  }

  /**
   * Transform results to legacy format if needed
   */
  transformToLegacyFormat(result) {
    // For backward compatibility with existing UI components
    return {
      ...result,
      // Add any legacy properties if needed
      sources: result.statistics.engines || {}
    };
  }
}

export default AdvancedGrammarService; 