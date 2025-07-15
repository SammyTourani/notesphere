/**
 * 🔒 Privacy-Compliant Grammar Service
 * 100% Offline - No External API Calls
 * 
 * Uses AdvancedGrammarService for complete privacy
 */

import { simpleGrammarRules } from './SimpleGrammarRules.js';
import addCustomGrammarIssues from './CustomGrammarRules.js';
import AdvancedGrammarService from './AdvancedGrammarService.js';

// Create instance of AdvancedGrammarService
const advancedGrammarService = new AdvancedGrammarService();

class GrammarService {
  constructor() {
    // REMOVED: External API URL for privacy compliance
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.isInitialized = false;
    
    console.log('🔒 GrammarService: Initialized with 100% offline processing');
    this.initializeService();
  }

  /**
   * Initialize the offline grammar service
   */
  async initializeService() {
    try {
      console.log('🚀 GrammarService: Initializing offline AdvancedGrammarService...');
      const initialized = await advancedGrammarService.initialize();
      if (initialized) {
        this.isInitialized = true;
        console.log('✅ GrammarService: Privacy-compliant offline service ready');
      } else {
        console.warn('⚠️ GrammarService: Offline service initialization failed');
      }
    } catch (error) {
      console.error('❌ GrammarService: Error initializing offline service:', error);
    }
  }

  /**
   * Check text for grammar, spelling, and style issues - 100% OFFLINE
   * @param {string} text - The text to check
   * @param {string} language - Language code (default: 'en-US')
   * @returns {Promise<Array>} Array of grammar issues
   */
  async checkText(text, language = 'en-US') {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Remove HTML tags for grammar checking
    const cleanText = this.stripHtml(text);
    
    if (cleanText.trim().length === 0) {
      return [];
    }

    // Check cache first
    const cacheKey = `${language}:${cleanText}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Ensure offline service is initialized
      if (!this.isInitialized) {
        await this.initializeService();
      }

      let allIssues = [];

      if (this.isInitialized) {
        console.log('🔍 GrammarService: Using offline AdvancedGrammarService...');
        
        // Use AdvancedGrammarService (100% offline)
        const result = await advancedGrammarService.checkText(cleanText, {
          categories: ['grammar', 'spelling', 'style', 'punctuation'],
          language: language
        });
        
        // Extract issues from result
        allIssues = result.issues || result || [];
        
        console.log(`✅ GrammarService: Found ${allIssues.length} issues offline`);
      } else {
        console.warn('⚠️ GrammarService: Falling back to basic rules only');
        allIssues = [];
      }

      // Add simple grammar rules to catch what might be missed
      const simpleGrammarIssues = simpleGrammarRules.checkGrammar(cleanText);
      allIssues = [...allIssues, ...simpleGrammarIssues];

      // Add custom rules (capitalization, punctuation, contractions, confusion)
      allIssues = addCustomGrammarIssues(cleanText, allIssues);

      // Remove duplicates based on position and message
      allIssues = this.removeDuplicateIssues(allIssues);

      // Cache the results
      this.cache.set(cacheKey, {
        data: allIssues,
        timestamp: Date.now()
      });

      return allIssues;

    } catch (error) {
      console.error('❌ GrammarService: Offline grammar check failed:', error);
      
      // Fallback to basic rules only
      const basicIssues = simpleGrammarRules.checkGrammar(cleanText);
      const enhancedBasicIssues = addCustomGrammarIssues(cleanText, basicIssues);
      
      // Cache the fallback results
      this.cache.set(cacheKey, {
        data: enhancedBasicIssues,
        timestamp: Date.now()
      });

      return enhancedBasicIssues;
    }
  }

  /**
   * Remove duplicate issues based on position and similarity
   */
  removeDuplicateIssues(issues) {
    const seen = new Map();
    const deduped = [];

    issues.forEach(issue => {
      // Create a key based on position and message similarity
      const key = `${issue.offset || 0}-${issue.length || 1}-${(issue.message || '').substring(0, 20)}`;
      
      if (!seen.has(key)) {
        seen.set(key, true);
        deduped.push(issue);
      }
    });

    return deduped;
  }

  /**
   * Process LanguageTool matches (kept for compatibility, but now processes offline results)
   */
  processMatches(matches, originalText) {
    if (!Array.isArray(matches)) return [];

    return matches.map((match, index) => {
      const category = this.getCategory(match);
      const severity = this.getSeverity(match, category);
      
      return {
        id: `offline-${Date.now()}-${index}`,
        message: match.message || 'Grammar issue detected',
        shortMessage: match.shortMessage || this.getCategoryName(category),
        offset: match.offset || 0,
        length: match.length || 1,
        category: category,
        severity: severity,
        suggestions: this.processSuggestions(match.replacements || match.suggestions || []),
        rule: {
          id: match.rule?.id || 'OFFLINE_RULE',
          description: match.rule?.description || 'Offline grammar rule',
          category: match.rule?.category || { id: category.toUpperCase(), name: this.getCategoryName(category) }
        },
        context: {
          text: this.getContextText(originalText, match.offset, match.length),
          offset: Math.max(0, (match.offset || 0) - 20),
          length: match.length || 1
        },
        metadata: {
          confidence: match.confidence || 0.8,
          autoFixable: (match.replacements || match.suggestions || []).length > 0,
          source: 'offline'
        }
      };
    });
  }

  /**
   * Get grammar category from match
   */
  getCategory(match) {
    const ruleCategory = match.rule?.category?.id?.toLowerCase() || '';
    const ruleId = match.rule?.id?.toLowerCase() || '';
    const category = match.category?.toLowerCase() || '';
    
    if (ruleCategory.includes('typo') || ruleCategory.includes('spell') || category.includes('spell')) {
      return 'spelling';
    }
    if (ruleCategory.includes('punct') || category.includes('punct')) {
      return 'punctuation';
    }
    if (ruleCategory.includes('style') || category.includes('style')) {
      return 'style';
    }
    
    return 'grammar';
  }

  /**
   * Get severity level
   */
  getSeverity(match, category) {
    if (category === 'spelling') return 'error';
    if (category === 'grammar') return 'error';
    if (category === 'punctuation') return 'warning';
    if (category === 'style') return 'info';
    
    return 'warning';
  }

  /**
   * Get category display name
   */
  getCategoryName(category) {
    const names = {
      spelling: 'Spelling',
      grammar: 'Grammar',
      punctuation: 'Punctuation',
      style: 'Style'
    };
    return names[category] || 'Grammar';
  }

  /**
   * Process suggestions/replacements
   */
  processSuggestions(suggestions) {
    if (!Array.isArray(suggestions)) return [];
    
    return suggestions.slice(0, 5).map((suggestion, index) => ({
      text: typeof suggestion === 'string' ? suggestion : suggestion.value || '',
      confidence: suggestion.confidence || 0.8,
      priority: index
    }));
  }

  /**
   * Get context text around an issue
   */
  getContextText(originalText, offset, length) {
    const start = Math.max(0, (offset || 0) - 20);
    const end = Math.min(originalText.length, (offset || 0) + (length || 1) + 20);
    return originalText.substring(start, end);
  }

  /**
   * Strip HTML tags from text
   */
  stripHtml(text) {
    if (!text) return '';
    
    // Simple HTML stripping
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ GrammarService: Cache cleared');
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      cacheSize: this.cache.size,
      isInitialized: this.isInitialized,
      isOffline: true,
      privacyCompliant: true
    };
  }

  /**
   * Get category color for UI
   */
  getCategoryColor(category) {
    const colors = {
      spelling: 'red',
      grammar: 'orange',
      punctuation: 'yellow',
      style: 'blue'
    };
    return colors[category] || 'gray';
  }

  /**
   * Get category icon for UI
   */
  getCategoryIcon(category) {
    const icons = {
      spelling: '🔤',
      grammar: '📝',
      punctuation: '❗',
      style: '✨'
    };
    return icons[category] || '📝';
  }
}

// Create and export singleton instance
const grammarService = new GrammarService();

export default grammarService;