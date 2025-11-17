/**
 * Advanced Grammar Service - Browser-Compatible WASM Implementation
 * Uses nlprule WASM directly for comprehensive grammar checking
 * Provides professional-grade grammar detection in the browser
 */

import GrammarFallback from './GrammarFallback.js';
import init, { NlpRuleChecker } from '../wasm/nlprule_wasm.js';

class AdvancedGrammarService {
  constructor() {
    this.checker = null;
    this.fallbackService = new GrammarFallback();
    this.isInitialized = false;
    this.useFallback = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return true;
    }
    
    try {
      console.log('🚀 Initializing AdvancedGrammarService with nlprule WASM...');
      
      // Initialize WASM
      await init();
      
      // Create the checker instance
      this.checker = NlpRuleChecker.new();
      
      console.log('✅ nlprule WASM initialized successfully');
      this.isInitialized = true;
      this.useFallback = false;
      return true;
      
    } catch (error) {
      console.warn('⚠️ WASM initialization failed, using fallback:', error);
      
      // Fall back to basic grammar checking
      await this.fallbackService.initialize();
      this.isInitialized = true;
      this.useFallback = true;
      return true;
    }
  }

  async checkText(text, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (!this.useFallback && this.checker) {
        console.log('🔍 Using nlprule WASM for grammar check...');
        const startTime = Date.now();
        
        // Check grammar using nlprule
        const rawResult = this.checker.check(text);
        
        console.log('📊 Raw WASM result:', rawResult);
        
        // Parse the result (it might be a JSON string or object)
        let suggestions = [];
        try {
          if (typeof rawResult === 'string') {
            suggestions = JSON.parse(rawResult);
          } else if (Array.isArray(rawResult)) {
            suggestions = rawResult;
          } else if (rawResult && typeof rawResult === 'object') {
            suggestions = rawResult.suggestions || rawResult.issues || [];
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse WASM result:', parseError);
          suggestions = [];
        }
        
        // Convert nlprule suggestions to our issue format
        const issues = (suggestions || []).map((suggestion, index) => {
          // Handle different possible formats
          const start = suggestion.start || suggestion.offset || 0;
          const end = suggestion.end || (start + (suggestion.length || 0));
          const length = end - start;
          
          return {
            id: `wasm-${Date.now()}-${index}`,
            message: suggestion.message || suggestion.description || 'Grammar issue detected',
            shortMessage: suggestion.short_message || suggestion.shortMessage || suggestion.message || 'Issue',
            offset: start,
            length: length,
            category: this.categorizeRule(suggestion.rule_id || suggestion.ruleId || suggestion.category),
            severity: suggestion.severity || 'warning',
            priority: 5,
            suggestions: suggestion.replacements || suggestion.suggestions || [],
            context: {
              text: text.substring(
                Math.max(0, start - 20),
                Math.min(text.length, end + 20)
              ),
              offset: Math.min(20, start),
              length: length
            },
            source: 'nlprule-wasm',
            confidence: suggestion.confidence || 0.9
          };
        });
        
        const processingTime = Date.now() - startTime;
        
        console.log(`✅ Found ${issues.length} issues in ${processingTime}ms`);
        
        return {
          issues,
          statistics: {
            engine: 'nlprule-wasm',
            processingTime,
            issuesFound: issues.length,
            textLength: text.length,
            wordsChecked: text.split(/\s+/).length
          }
        };
      } else {
        console.log('🔍 Using fallback for grammar check...');
        return await this.fallbackService.checkText(text);
      }
    } catch (error) {
      console.error('❌ Grammar check error:', error);
      // Fall back to basic checking on error
      return await this.fallbackService.checkText(text);
    }
  }

  /**
   * Categorize nlprule rule by ID
   */
  categorizeRule(ruleId) {
    if (!ruleId) return 'grammar';
    
    const id = ruleId.toLowerCase();
    
    if (id.includes('spell') || id.includes('typo')) return 'spelling';
    if (id.includes('punct') || id.includes('comma')) return 'punctuation';
    if (id.includes('style') || id.includes('clarity')) return 'style';
    if (id.includes('grammar') || id.includes('agreement')) return 'grammar';
    
    return 'grammar';
  }
}

export default AdvancedGrammarService;
