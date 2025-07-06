/**
 * 🚀 NoteSphere Grammar Pro - Ultimate Grammar Engine
 * The world's most advanced grammar checking system
 * 
 * Features:
 * - Multi-layer caching system
 * - Incremental checking
 * - AI-powered writing analysis
 * - Context-aware suggestions
 * - Performance optimizations
 * - Advanced error categorization
 */

// Browser-compatible EventEmitter
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);
    return this;
  }

  off(event, listener) {
    if (!this.events.has(event)) return this;
    
    const listeners = this.events.get(event);
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    
    if (listeners.length === 0) {
      this.events.delete(event);
    }
    
    return this;
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return false;
    
    const listeners = this.events.get(event).slice();
    listeners.forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error('EventEmitter error:', error);
      }
    });
    
    return true;
  }

  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }
}

// Constants for optimal performance
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_TIME = 1500; // 1.5 seconds
const MIN_CHECK_LENGTH = 10; // Minimum characters to check
const MAX_CACHE_SIZE = 1000; // Maximum cache entries
const API_TIMEOUT = 10000; // 10 seconds timeout

// Grammar categories with enhanced metadata
const GRAMMAR_CATEGORIES = {
  spelling: {
    id: 'spelling',
    name: 'Spelling',
    icon: '🔤',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    priority: 5,
    description: 'Misspelled words and typos',
    underlineStyle: '2px wavy #ef4444',
    animationClass: 'grammar-pulse-red'
  },
  grammar: {
    id: 'grammar',
    name: 'Grammar',
    icon: '📝',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    priority: 4,
    description: 'Grammar rules and sentence structure',
    underlineStyle: '2px wavy #f59e0b',
    animationClass: 'grammar-pulse-orange'
  },
  punctuation: {
    id: 'punctuation',
    name: 'Punctuation',
    icon: '❗',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.1)',
    priority: 3,
    description: 'Punctuation and formatting issues',
    underlineStyle: '1px wavy #eab308',
    animationClass: 'grammar-pulse-yellow'
  },
  style: {
    id: 'style',
    name: 'Style',
    icon: '✨',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    priority: 2,
    description: 'Writing style improvements',
    underlineStyle: '1px dotted #3b82f6',
    animationClass: 'grammar-fade-blue'
  },
  clarity: {
    id: 'clarity',
    name: 'Clarity',
    icon: '💡',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    priority: 1,
    description: 'Clarity and readability suggestions',
    underlineStyle: '1px dotted #8b5cf6',
    animationClass: 'grammar-fade-purple'
  }
};

// Writing contexts for intelligent checking
const WRITING_CONTEXTS = {
  academic: {
    name: 'Academic',
    rules: {
      preferFormalTone: true,
      avoidContractions: true,
      requireCitations: false,
      complexSentencesOk: true,
      passiveVoiceOk: true
    }
  },
  business: {
    name: 'Business',
    rules: {
      preferActiveTone: true,
      conciseness: true,
      professionalTone: true,
      actionOriented: true,
      avoidJargon: true
    }
  },
  creative: {
    name: 'Creative',
    rules: {
      allowStyleVariations: true,
      encourageMetaphors: true,
      flexiblePunctuation: true,
      emotionalLanguageOk: true,
      fragmentsOk: true
    }
  },
  casual: {
    name: 'Casual',
    rules: {
      contractionsOk: true,
      informalToneOk: true,
      colloquialismsOk: true,
      shortSentencesPreferred: true
    }
  }
};

/**
 * Advanced Cache Manager with intelligent invalidation
 */
class SmartCacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.persistentCache = new Map();
    this.frequencyMap = new Map();
    this.lastCleanup = Date.now();
    this.cleanupInterval = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Generate cache key with context
   */
  generateKey(text, options = {}) {
    const cleanText = text.trim().toLowerCase();
    const optionsKey = JSON.stringify({
      language: options.language || 'en-US',
      context: options.context || 'general',
      strictMode: options.strictMode || false
    });
    return `${cleanText.length}:${this.hashCode(cleanText)}:${this.hashCode(optionsKey)}`;
  }

  /**
   * Simple hash function for cache keys
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get cached result with frequency tracking
   */
  get(text, options = {}) {
    const key = this.generateKey(text, options);
    
    // Check memory cache first (fastest)
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (Date.now() - cached.timestamp < CACHE_TIMEOUT) {
        this.updateFrequency(key);
        return cached.data;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // Check persistent cache
    if (this.persistentCache.has(key)) {
      const cached = this.persistentCache.get(key);
      if (Date.now() - cached.timestamp < CACHE_TIMEOUT) {
        // Promote to memory cache
        this.memoryCache.set(key, cached);
        this.updateFrequency(key);
        return cached.data;
      } else {
        this.persistentCache.delete(key);
      }
    }

    return null;
  }

  /**
   * Set cache with intelligent storage
   */
  set(text, data, options = {}) {
    const key = this.generateKey(text, options);
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      accessCount: 1
    };

    // Always store in memory cache
    this.memoryCache.set(key, cacheEntry);
    
    // Store in persistent cache if frequently accessed
    const frequency = this.frequencyMap.get(key) || 0;
    if (frequency > 2) {
      this.persistentCache.set(key, cacheEntry);
    }

    this.updateFrequency(key);
    this.performCleanupIfNeeded();
  }

  /**
   * Update access frequency
   */
  updateFrequency(key) {
    const current = this.frequencyMap.get(key) || 0;
    this.frequencyMap.set(key, current + 1);
  }

  /**
   * Perform cleanup if needed
   */
  performCleanupIfNeeded() {
    if (Date.now() - this.lastCleanup > this.cleanupInterval) {
      this.cleanup();
      this.lastCleanup = Date.now();
    }
  }

  /**
   * Cleanup old and infrequent entries
   */
  cleanup() {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, value] of this.memoryCache.entries()) {
      if (now - value.timestamp > CACHE_TIMEOUT || this.memoryCache.size > MAX_CACHE_SIZE) {
        this.memoryCache.delete(key);
      }
    }

    // Clean persistent cache
    for (const [key, value] of this.persistentCache.entries()) {
      if (now - value.timestamp > CACHE_TIMEOUT * 2) {
        this.persistentCache.delete(key);
        this.frequencyMap.delete(key);
      }
    }

    console.log(`🧹 Cache cleanup completed. Memory: ${this.memoryCache.size}, Persistent: ${this.persistentCache.size}`);
  }

  /**
   * Clear all caches
   */
  clear() {
    this.memoryCache.clear();
    this.persistentCache.clear();
    this.frequencyMap.clear();
    console.log('🗑️ All caches cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      persistentSize: this.persistentCache.size,
      totalEntries: this.frequencyMap.size,
      lastCleanup: this.lastCleanup
    };
  }
}

/**
 * Advanced Text Processor for incremental checking
 */
class TextProcessor {
  constructor() {
    this.previousContent = '';
    this.previousParagraphs = [];
  }

  /**
   * Strip HTML tags while preserving structure
   */
  stripHTML(html) {
    if (!html) return '';
    
    // Check if we're in a browser environment
    if (typeof document === 'undefined') {
      // Fallback for non-browser environments - simple regex strip
      return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    
    try {
      // Create a temporary DOM element
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Get text content while preserving line breaks
      const text = tempDiv.textContent || tempDiv.innerText || '';
      
      // Normalize whitespace but preserve paragraph breaks
      return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.warn('HTML stripping failed, using fallback:', error);
      // Fallback to regex-based stripping
      return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  }

  /**
   * Detect changes and return only modified sections
   */
  getIncrementalChanges(newContent) {
    const newText = this.stripHTML(newContent);
    const oldText = this.previousContent;
    
    // If content is significantly different, check everything
    if (Math.abs(newText.length - oldText.length) > 100) {
      this.previousContent = newText;
      return { fullCheck: true, text: newText };
    }

    // Split into paragraphs for granular checking
    const newParagraphs = newText.split(/\n\s*\n/).filter(p => p.trim());
    const oldParagraphs = this.previousParagraphs;
    
    // Find changed paragraphs
    const changedParagraphs = [];
    const maxLength = Math.max(newParagraphs.length, oldParagraphs.length);
    
    for (let i = 0; i < maxLength; i++) {
      const newPara = newParagraphs[i] || '';
      const oldPara = oldParagraphs[i] || '';
      
      if (newPara !== oldPara) {
        changedParagraphs.push({
          index: i,
          text: newPara,
          offset: this.calculateOffset(newParagraphs, i)
        });
      }
    }

    this.previousContent = newText;
    this.previousParagraphs = newParagraphs;

    return {
      fullCheck: false,
      changedParagraphs,
      fullText: newText
    };
  }

  /**
   * Calculate character offset for a paragraph
   */
  calculateOffset(paragraphs, index) {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += paragraphs[i].length + 2; // +2 for paragraph breaks
    }
    return offset;
  }

  /**
   * Normalize text for processing
   */
  normalizeText(text) {
    return text
      .replace(/[\u2018\u2019]/g, "'") // Smart quotes
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/\u2026/g, '...') // Ellipsis
      .replace(/\u2013/g, '-') // En dash
      .replace(/\u2014/g, '--') // Em dash
      .trim();
  }

  /**
   * Extract sentences for detailed analysis
   */
  extractSentences(text) {
    // Enhanced sentence splitting that handles edge cases
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [];
    return sentences.map((sentence, index) => ({
      text: sentence.trim(),
      index,
      offset: text.indexOf(sentence),
      length: sentence.length
    }));
  }
}

/**
 * Advanced Issue Processor with AI-like categorization
 */
class IssueProcessor {
  constructor() {
    this.customRules = new Map();
    this.userPreferences = new Map();
  }

  /**
   * Process LanguageTool matches with enhanced categorization
   */
  processMatches(matches, originalText, context = 'general') {
    return matches.map((match, index) => {
      const category = this.categorizeIssue(match, context);
      const severity = this.calculateSeverity(match, category);
      const confidence = this.calculateConfidence(match);
      
      return {
        id: `issue-${match.offset}-${match.length}-${Date.now()}-${index}`,
        category: category.id,
        categoryData: category,
        type: match.rule.category.id,
        message: this.enhanceMessage(match.message, category),
        shortMessage: match.shortMessage || this.generateShortMessage(match),
        explanation: this.generateExplanation(match, category),
        offset: match.offset,
        length: match.length,
        severity,
        confidence,
        priority: this.calculatePriority(severity, category, confidence),
        suggestions: this.enhanceSuggestions(match.replacements, match, context),
        originalText: originalText.substring(match.offset, match.offset + match.length),
        rule: {
          id: match.rule.id,
          description: match.rule.description,
          issueType: match.rule.issueType,
          category: match.rule.category
        },
        context: {
          text: match.context.text,
          offset: match.context.offset,
          length: match.context.length,
          beforeText: originalText.substring(Math.max(0, match.offset - 20), match.offset),
          afterText: originalText.substring(match.offset + match.length, match.offset + match.length + 20)
        },
        metadata: {
          timestamp: Date.now(),
          processed: true,
          userDismissed: false,
          autoFixable: this.isAutoFixable(match),
          learningOpportunity: this.isLearningOpportunity(match)
        }
      };
    });
  }

  /**
   * Enhanced issue categorization with context awareness
   */
  categorizeIssue(match, context) {
    const categoryId = match.rule.category.id.toLowerCase();
    const ruleId = match.rule.id.toLowerCase();
    const issueType = match.rule.issueType || '';

    // Spelling and typos
    if (categoryId.includes('typo') || 
        categoryId.includes('spelling') || 
        ruleId.includes('spelling') || 
        ruleId.includes('hunspell') ||
        issueType.includes('misspelling')) {
      return GRAMMAR_CATEGORIES.spelling;
    }

    // Grammar rules
    if (categoryId.includes('grammar') || 
        categoryId.includes('agreement') ||
        categoryId.includes('verb') || 
        categoryId.includes('tense') ||
        ruleId.includes('agreement') ||
        issueType.includes('grammar')) {
      return GRAMMAR_CATEGORIES.grammar;
    }

    // Punctuation
    if (categoryId.includes('punctuation') || 
        categoryId.includes('comma') ||
        ruleId.includes('comma') || 
        ruleId.includes('apostrophe') ||
        ruleId.includes('period') ||
        issueType.includes('punctuation')) {
      return GRAMMAR_CATEGORIES.punctuation;
    }

    // Style improvements
    if (categoryId.includes('style') || 
        categoryId.includes('redundancy') ||
        categoryId.includes('wordiness') || 
        ruleId.includes('style') ||
        ruleId.includes('redundant') ||
        issueType.includes('style')) {
      return GRAMMAR_CATEGORIES.style;
    }

    // Clarity and readability
    if (categoryId.includes('clarity') || 
        categoryId.includes('confused') ||
        ruleId.includes('confused') || 
        categoryId.includes('plain') ||
        ruleId.includes('readability') ||
        issueType.includes('clarity')) {
      return GRAMMAR_CATEGORIES.clarity;
    }

    // Default to grammar if unclear
    return GRAMMAR_CATEGORIES.grammar;
  }

  /**
   * Calculate issue severity
   */
  calculateSeverity(match, category) {
    const baseScore = category.priority;
    const ruleId = match.rule.id.toLowerCase();
    
    // Critical errors (always fix these)
    if (category.id === 'spelling' || ruleId.includes('agreement')) {
      return 'critical';
    }
    
    // High priority errors
    if (category.id === 'grammar' || ruleId.includes('syntax')) {
      return 'high';
    }
    
    // Medium priority
    if (category.id === 'punctuation') {
      return 'medium';
    }
    
    // Low priority suggestions
    return 'low';
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(match) {
    let confidence = 0.8; // Base confidence
    
    // Higher confidence for certain rule types
    if (match.rule.id.includes('HUNSPELL') || match.rule.id.includes('SPELLING')) {
      confidence = 0.95;
    }
    
    // Lower confidence for style suggestions
    if (match.rule.category.id.toLowerCase().includes('style')) {
      confidence = 0.6;
    }
    
    // Adjust based on context length
    if (match.context.text.length > 50) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, confidence);
  }

  /**
   * Calculate overall priority
   */
  calculatePriority(severity, category, confidence) {
    const severityWeights = {
      critical: 10,
      high: 7,
      medium: 5,
      low: 2
    };
    
    const baseScore = severityWeights[severity] || 2;
    const categoryWeight = category.priority;
    const confidenceWeight = confidence * 3;
    
    return Math.round(baseScore + categoryWeight + confidenceWeight);
  }

  /**
   * Enhance suggestions with context
   */
  enhanceSuggestions(replacements, match, context) {
    if (!replacements || replacements.length === 0) {
      return [];
    }

    return replacements.slice(0, 5).map((replacement, index) => ({
      text: replacement.value,
      confidence: this.calculateSuggestionConfidence(replacement, match),
      explanation: this.generateSuggestionExplanation(replacement, match),
      priority: index,
      contextAppropriate: this.isContextAppropriate(replacement.value, context)
    }));
  }

  /**
   * Calculate suggestion confidence
   */
  calculateSuggestionConfidence(replacement, match) {
    // Higher confidence for exact matches
    if (replacement.value.toLowerCase() === match.rule.id.toLowerCase()) {
      return 0.95;
    }
    
    // Medium confidence for most suggestions
    return 0.75;
  }

  /**
   * Generate suggestion explanation
   */
  generateSuggestionExplanation(replacement, match) {
    const category = match.rule.category.id.toLowerCase();
    
    if (category.includes('spelling')) {
      return `Corrects spelling to "${replacement.value}"`;
    }
    
    if (category.includes('grammar')) {
      return `Improves grammar by using "${replacement.value}"`;
    }
    
    if (category.includes('style')) {
      return `Enhances style with "${replacement.value}"`;
    }
    
    return `Suggested improvement: "${replacement.value}"`;
  }

  /**
   * Check if suggestion is appropriate for context
   */
  isContextAppropriate(suggestion, context) {
    const contextRules = WRITING_CONTEXTS[context]?.rules || {};
    
    // Check contractions
    if (contextRules.avoidContractions && suggestion.includes("'")) {
      return false;
    }
    
    // Check formality
    if (contextRules.preferFormalTone && this.isInformal(suggestion)) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if text is informal
   */
  isInformal(text) {
    const informalWords = ['gonna', 'wanna', 'kinda', 'sorta', 'yeah', 'ok', 'btw'];
    return informalWords.some(word => text.toLowerCase().includes(word));
  }

  /**
   * Enhance issue message
   */
  enhanceMessage(message, category) {
    return `${category.icon} ${message}`;
  }

  /**
   * Generate short message
   */
  generateShortMessage(match) {
    const category = match.rule.category.id.toLowerCase();
    
    if (category.includes('spelling')) return 'Spelling';
    if (category.includes('grammar')) return 'Grammar';
    if (category.includes('punctuation')) return 'Punctuation';
    if (category.includes('style')) return 'Style';
    
    return 'Grammar';
  }

  /**
   * Generate detailed explanation
   */
  generateExplanation(match, category) {
    const ruleDescription = match.rule.description || 'Grammar rule violation';
    return `${category.description}: ${ruleDescription}`;
  }

  /**
   * Check if issue is auto-fixable
   */
  isAutoFixable(match) {
    const ruleId = match.rule.id.toLowerCase();
    const autoFixableRules = [
      'spelling', 'hunspell', 'comma_compound', 'apostrophe',
      'uppercase_sentence_start', 'double_punctuation'
    ];
    
    return autoFixableRules.some(rule => ruleId.includes(rule));
  }

  /**
   * Check if issue presents learning opportunity
   */
  isLearningOpportunity(match) {
    const category = match.rule.category.id.toLowerCase();
    return category.includes('grammar') || category.includes('style');
  }
}

/**
 * Main Grammar Engine Class
 */
class GrammarEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.config = {
      apiUrl: 'https://api.languagetool.org/v2/check',
      language: options.language || 'en-US',
      debounceTime: options.debounceTime || DEBOUNCE_TIME,
      enableCache: options.enableCache !== false,
      enableIncremental: options.enableIncremental !== false,
      context: options.context || 'general',
      strictMode: options.strictMode || false,
      ...options
    };

    // Initialize components
    this.cacheManager = new SmartCacheManager();
    this.textProcessor = new TextProcessor();
    this.issueProcessor = new IssueProcessor();
    
    // State management
    this.isChecking = false;
    this.checkQueue = [];
    this.activeRequests = new Map();
    this.statistics = {
      totalChecks: 0,
      cacheHits: 0,
      apiCalls: 0,
      averageResponseTime: 0,
      totalIssuesFound: 0
    };

    // Debouncing
    this.debounceTimers = new Map();
    
    console.log('🚀 GrammarEngine initialized with advanced features');
    this.emit('initialized', { config: this.config });
  }

  /**
   * Main grammar checking method with intelligent processing
   */
  async checkText(text, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input');
      }

      const cleanText = this.textProcessor.stripHTML(text);
      
      // Skip very short texts
      if (cleanText.trim().length < MIN_CHECK_LENGTH) {
        return {
          issues: [],
          statistics: { skipped: true, reason: 'Text too short' },
          performance: { duration: Date.now() - startTime }
        };
      }

      // Merge options with defaults
      const checkOptions = {
        ...this.config,
        ...options
      };

      // Check cache first
      if (this.config.enableCache) {
        const cachedResult = this.cacheManager.get(cleanText, checkOptions);
        if (cachedResult) {
          this.statistics.cacheHits++;
          this.emit('cacheHit', { text: cleanText.substring(0, 50) + '...' });
          
          return {
            ...cachedResult,
            fromCache: true,
            performance: { duration: Date.now() - startTime }
          };
        }
      }

      // Increment checking statistics
      this.statistics.totalChecks++;
      this.isChecking = true;
      this.emit('checkStarted', { text: cleanText.substring(0, 50) + '...' });

      // Perform the actual grammar check
      const result = await this.performGrammarCheck(cleanText, checkOptions);
      
      // Cache the result
      if (this.config.enableCache && result.issues) {
        this.cacheManager.set(cleanText, result, checkOptions);
      }

      // Update statistics
      this.updateStatistics(startTime, result);
      
      return {
        ...result,
        fromCache: false,
        performance: { duration: Date.now() - startTime }
      };

    } catch (error) {
      this.handleError(error, text, options);
      throw error;
    } finally {
      this.isChecking = false;
      this.emit('checkCompleted');
    }
  }

  /**
   * Perform the actual grammar check with API call
   */
  async performGrammarCheck(text, options) {
    const requestId = this.generateRequestId();
    
    try {
      // Prepare API request
      const requestBody = new URLSearchParams({
        text: text,
        language: options.language || 'en-US',
        enabledOnly: 'false',
        level: options.strictMode ? 'picky' : 'default'
      });

      // Add context-specific rules if available
      if (options.context && options.context !== 'general') {
        requestBody.append('enabledCategories', this.getContextCategories(options.context));
      }

      this.activeRequests.set(requestId, { startTime: Date.now(), text: text.substring(0, 50) });
      this.statistics.apiCalls++;

      // Make API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'NoteSphere-GrammarPro/1.0'
        },
        body: requestBody,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.activeRequests.delete(requestId);

      if (!response.ok) {
        throw new Error(`LanguageTool API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process the results
      const processedIssues = this.issueProcessor.processMatches(
        data.matches || [], 
        text, 
        options.context
      );

      // Sort issues by priority
      const sortedIssues = this.sortIssuesByPriority(processedIssues);

      // Generate analysis
      const analysis = this.generateTextAnalysis(text, sortedIssues, options);

      this.emit('issuesFound', { 
        count: sortedIssues.length, 
        categories: this.categorizeIssues(sortedIssues) 
      });

      return {
        issues: sortedIssues,
        analysis,
        statistics: {
          totalIssues: sortedIssues.length,
          byCategory: this.categorizeIssues(sortedIssues),
          processingTime: Date.now() - this.activeRequests.get(requestId)?.startTime
        }
      };

    } catch (error) {
      this.activeRequests.delete(requestId);
      
      if (error.name === 'AbortError') {
        throw new Error('Grammar check timed out');
      }
      
      // Fallback to local checking
      console.warn('❌ API check failed, falling back to local checks:', error.message);
      return await this.performLocalFallbackCheck(text, options);
    }
  }

  /**
   * Fallback local grammar checking
   */
  async performLocalFallbackCheck(text, options) {
    const localIssues = this.performBasicLocalChecks(text);
    
    return {
      issues: localIssues,
      analysis: this.generateBasicAnalysis(text),
      statistics: {
        totalIssues: localIssues.length,
        byCategory: this.categorizeIssues(localIssues),
        fallbackMode: true
      }
    };
  }

  /**
   * Basic local grammar and spelling checks
   */
  performBasicLocalChecks(text) {
    const issues = [];
    
    // Common spelling mistakes
    const commonMistakes = {
      'teh': 'the',
      'recieve': 'receive',
      'definately': 'definitely',
      'seperate': 'separate',
      'occured': 'occurred',
      'begining': 'beginning',
      'acheive': 'achieve',
      'beleive': 'believe',
      'neccessary': 'necessary',
      'accomodate': 'accommodate',
      'existance': 'existence',
      'independant': 'independent',
      'maintainance': 'maintenance',
      'perseverence': 'perseverance',
      'restaraunt': 'restaurant',
      'tommorrow': 'tomorrow'
    };

    // Check for common mistakes
    Object.entries(commonMistakes).forEach(([mistake, correction]) => {
      const regex = new RegExp(`\\b${mistake}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        issues.push({
          id: `local-${match.index}-${mistake}-${Date.now()}`,
          category: 'spelling',
          categoryData: GRAMMAR_CATEGORIES.spelling,
          type: 'LOCAL_SPELLING',
          message: `🔤 Possible spelling mistake: "${mistake}" should be "${correction}"`,
          shortMessage: 'Spelling',
          explanation: `The word "${mistake}" is commonly misspelled. The correct spelling is "${correction}".`,
          offset: match.index,
          length: mistake.length,
          severity: 'high',
          confidence: 0.9,
          priority: 8,
          suggestions: [{
            text: correction,
            confidence: 0.95,
            explanation: `Corrects spelling to "${correction}"`,
            priority: 0,
            contextAppropriate: true
          }],
          originalText: mistake,
          rule: {
            id: 'LOCAL_SPELLING_CHECK',
            description: 'Basic local spelling verification',
            issueType: 'misspelling',
            category: { id: 'TYPOS', name: 'Spelling' }
          },
          context: {
            text: text.substring(Math.max(0, match.index - 20), match.index + mistake.length + 20),
            offset: Math.min(20, match.index),
            length: mistake.length,
            beforeText: text.substring(Math.max(0, match.index - 20), match.index),
            afterText: text.substring(match.index + mistake.length, match.index + mistake.length + 20)
          },
          metadata: {
            timestamp: Date.now(),
            processed: true,
            userDismissed: false,
            autoFixable: true,
            learningOpportunity: false,
            localCheck: true
          }
        });
      }
    });

    // Basic punctuation checks
    this.performBasicPunctuationChecks(text, issues);
    
    // Basic capitalization checks
    this.performBasicCapitalizationChecks(text, issues);

    return issues;
  }

  /**
   * Basic punctuation checking
   */
  performBasicPunctuationChecks(text, issues) {
    // Double spaces
    const doubleSpaceRegex = /  +/g;
    let match;
    
    while ((match = doubleSpaceRegex.exec(text)) !== null) {
      issues.push({
        id: `local-spacing-${match.index}-${Date.now()}`,
        category: 'punctuation',
        categoryData: GRAMMAR_CATEGORIES.punctuation,
        type: 'WHITESPACE',
        message: '❗ Extra spaces detected',
        shortMessage: 'Spacing',
        explanation: 'Multiple consecutive spaces should typically be replaced with a single space.',
        offset: match.index,
        length: match[0].length,
        severity: 'low',
        confidence: 0.8,
        priority: 3,
        suggestions: [{
          text: ' ',
          confidence: 0.9,
          explanation: 'Replace with single space',
          priority: 0,
          contextAppropriate: true
        }],
        originalText: match[0],
        rule: {
          id: 'LOCAL_DOUBLE_SPACE',
          description: 'Multiple consecutive spaces',
          issueType: 'whitespace'
        },
        context: {
          text: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
          offset: Math.min(10, match.index),
          length: match[0].length,
          beforeText: text.substring(Math.max(0, match.index - 10), match.index),
          afterText: text.substring(match.index + match[0].length, match.index + match[0].length + 10)
        },
        metadata: {
          timestamp: Date.now(),
          processed: true,
          userDismissed: false,
          autoFixable: true,
          learningOpportunity: false,
          localCheck: true
        }
      });
    }
  }

  /**
   * Basic capitalization checking
   */
  performBasicCapitalizationChecks(text, issues) {
    // Check for sentences not starting with capital letters
    const sentenceRegex = /[.!?]\s+[a-z]/g;
    let match;
    
    while ((match = sentenceRegex.exec(text)) !== null) {
      const letterIndex = match.index + match[0].length - 1;
      const letter = text[letterIndex];
      
      issues.push({
        id: `local-capitalization-${letterIndex}-${Date.now()}`,
        category: 'grammar',
        categoryData: GRAMMAR_CATEGORIES.grammar,
        type: 'CAPITALIZATION',
        message: '📝 Sentence should start with capital letter',
        shortMessage: 'Capitalization',
        explanation: 'Sentences should begin with a capital letter.',
        offset: letterIndex,
        length: 1,
        severity: 'medium',
        confidence: 0.85,
        priority: 6,
        suggestions: [{
          text: letter.toUpperCase(),
          confidence: 0.95,
          explanation: `Capitalize "${letter}" to "${letter.toUpperCase()}"`,
          priority: 0,
          contextAppropriate: true
        }],
        originalText: letter,
        rule: {
          id: 'LOCAL_SENTENCE_START',
          description: 'Sentences should start with capital letters',
          issueType: 'capitalization'
        },
        context: {
          text: text.substring(Math.max(0, letterIndex - 15), letterIndex + 16),
          offset: Math.min(15, letterIndex),
          length: 1,
          beforeText: text.substring(Math.max(0, letterIndex - 15), letterIndex),
          afterText: text.substring(letterIndex + 1, letterIndex + 16)
        },
        metadata: {
          timestamp: Date.now(),
          processed: true,
          userDismissed: false,
          autoFixable: true,
          learningOpportunity: false,
          localCheck: true
        }
      });
    }
  }

  /**
   * Generate comprehensive text analysis
   */
  generateTextAnalysis(text, issues, options) {
    const sentences = this.textProcessor.extractSentences(text);
    const words = text.split(/\s+/).filter(word => word.length > 0);
    
    return {
      readabilityScore: this.calculateReadabilityScore(text, sentences),
      writingScore: this.calculateWritingScore(issues, words.length),
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageSentenceLength: words.length / sentences.length || 0,
      complexityScore: this.calculateComplexityScore(text, words),
      issueDistribution: this.getIssueDistribution(issues),
      suggestions: this.generateWritingSuggestions(text, issues, options),
      toneAnalysis: this.analyzeTone(text, words),
      vocabularyDiversity: this.calculateVocabularyDiversity(words)
    };
  }

  /**
   * Calculate readability score (Flesch Reading Ease approximation)
   */
  calculateReadabilityScore(text, sentences) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Count syllables in a word (approximation)
   */
  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  /**
   * Calculate overall writing score
   */
  calculateWritingScore(issues, wordCount) {
    let baseScore = 100;
    
    // Penalty system based on issue severity and frequency
    const penaltyMap = {
      critical: -8,
      high: -5,
      medium: -3,
      low: -1
    };
    
    const totalPenalty = issues.reduce((penalty, issue) => {
      return penalty + (penaltyMap[issue.severity] || -1);
    }, 0);
    
    // Adjust for text length (longer texts are more forgiving)
    const lengthAdjustment = Math.min(10, wordCount / 100);
    
    const finalScore = baseScore + totalPenalty + lengthAdjustment;
    return Math.max(0, Math.min(100, Math.round(finalScore)));
  }

  /**
   * Calculate text complexity score
   */
  calculateComplexityScore(text, words) {
    const longWords = words.filter(word => word.length > 6).length;
    const complexityRatio = longWords / words.length;
    
    return Math.round(complexityRatio * 100);
  }

  /**
   * Analyze tone of the text
   */
  analyzeTone(text, words) {
    const formalWords = ['therefore', 'furthermore', 'however', 'consequently', 'nevertheless'];
    const informalWords = ['gonna', 'wanna', 'yeah', 'ok', 'cool', 'awesome'];
    const emotionalWords = ['love', 'hate', 'amazing', 'terrible', 'wonderful', 'awful'];
    
    const formalCount = formalWords.filter(word => text.toLowerCase().includes(word)).length;
    const informalCount = informalWords.filter(word => text.toLowerCase().includes(word)).length;
    const emotionalCount = emotionalWords.filter(word => text.toLowerCase().includes(word)).length;
    
    let dominantTone = 'neutral';
    if (formalCount > informalCount) dominantTone = 'formal';
    else if (informalCount > formalCount) dominantTone = 'informal';
    if (emotionalCount > 2) dominantTone = 'emotional';
    
    return {
      dominant: dominantTone,
      formalityScore: Math.round((formalCount / (formalCount + informalCount + 1)) * 100),
      emotionalIntensity: Math.min(100, emotionalCount * 20)
    };
  }

  /**
   * Calculate vocabulary diversity
   */
  calculateVocabularyDiversity(words) {
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));
    return Math.round((uniqueWords.size / words.length) * 100);
  }

  /**
   * Get issue distribution by category
   */
  getIssueDistribution(issues) {
    const distribution = {};
    
    Object.keys(GRAMMAR_CATEGORIES).forEach(category => {
      distribution[category] = {
        count: 0,
        percentage: 0,
        severity: { critical: 0, high: 0, medium: 0, low: 0 }
      };
    });

    issues.forEach(issue => {
      if (distribution[issue.category]) {
        distribution[issue.category].count++;
        distribution[issue.category].severity[issue.severity]++;
      }
    });

    // Calculate percentages
    const totalIssues = issues.length;
    Object.keys(distribution).forEach(category => {
      distribution[category].percentage = totalIssues > 0 
        ? Math.round((distribution[category].count / totalIssues) * 100)
        : 0;
    });

    return distribution;
  }

  /**
   * Generate writing suggestions based on analysis
   */
  generateWritingSuggestions(text, issues, options) {
    const suggestions = [];
    const sentences = this.textProcessor.extractSentences(text);
    const words = text.split(/\s+/).filter(word => word.length > 0);

    // Readability suggestions
    if (sentences.length > 0) {
      const avgSentenceLength = words.length / sentences.length;
      if (avgSentenceLength > 25) {
        suggestions.push({
          type: 'readability',
          priority: 'medium',
          message: 'Consider breaking up long sentences for better readability',
          explanation: 'Sentences averaging more than 25 words can be hard to follow',
          actionable: true
        });
      }
    }

    // Style suggestions based on context
    if (options.context === 'academic' && issues.some(i => i.category === 'style')) {
      suggestions.push({
        type: 'style',
        priority: 'low',
        message: 'Consider using more formal language for academic writing',
        explanation: 'Academic writing benefits from formal tone and precise vocabulary',
        actionable: false
      });
    }

    // Vocabulary diversity
    const diversity = this.calculateVocabularyDiversity(words);
    if (diversity < 40 && words.length > 100) {
      suggestions.push({
        type: 'vocabulary',
        priority: 'medium',
        message: 'Try using more varied vocabulary to enhance your writing',
        explanation: 'Vocabulary diversity makes writing more engaging',
        actionable: false
      });
    }

    return suggestions;
  }

  /**
   * Sort issues by priority and category
   */
  sortIssuesByPriority(issues) {
    return issues.sort((a, b) => {
      // First sort by priority (higher is more important)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Then by position in text (earlier issues first)
      return a.offset - b.offset;
    });
  }

  /**
   * Categorize issues for statistics
   */
  categorizeIssues(issues) {
    const categories = {};
    
    issues.forEach(issue => {
      if (!categories[issue.category]) {
        categories[issue.category] = 0;
      }
      categories[issue.category]++;
    });
    
    return categories;
  }

  /**
   * Get context-specific categories for API
   */
  getContextCategories(context) {
    const contextMappings = {
      academic: 'STYLE,GRAMMAR,TYPOS',
      business: 'STYLE,GRAMMAR,TYPOS,REDUNDANCY',
      creative: 'TYPOS,GRAMMAR',
      casual: 'TYPOS,GRAMMAR'
    };
    
    return contextMappings[context] || 'TYPOS,GRAMMAR,STYLE';
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update performance statistics
   */
  updateStatistics(startTime, result) {
    const duration = Date.now() - startTime;
    this.statistics.averageResponseTime = 
      (this.statistics.averageResponseTime + duration) / 2;
    
    if (result.issues) {
      this.statistics.totalIssuesFound += result.issues.length;
    }
  }

  /**
   * Handle errors with proper logging
   */
  handleError(error, text, options) {
    console.error('❌ GrammarEngine error:', error);
    this.emit('error', { 
      error: error.message, 
      text: text?.substring(0, 50) + '...',
      options 
    });
  }

  /**
   * Generate basic analysis for fallback mode
   */
  generateBasicAnalysis(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = this.textProcessor.extractSentences(text);
    
    return {
      readabilityScore: this.calculateReadabilityScore(text, sentences),
      writingScore: 85, // Default good score for basic mode
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageSentenceLength: words.length / sentences.length || 0,
      complexityScore: this.calculateComplexityScore(text, words),
      issueDistribution: {},
      suggestions: [],
      toneAnalysis: this.analyzeTone(text, words),
      vocabularyDiversity: this.calculateVocabularyDiversity(words),
      fallbackMode: true
    };
  }

  /**
   * Apply suggestion to text
   */
  applySuggestion(text, issue, suggestion) {
    if (!text || !issue || !suggestion) {
      throw new Error('Invalid parameters for suggestion application');
    }

    const before = text.substring(0, issue.offset);
    const after = text.substring(issue.offset + issue.length);
    const newText = before + suggestion.text + after;

    // Emit event for tracking
    this.emit('suggestionApplied', {
      issueId: issue.id,
      category: issue.category,
      originalText: issue.originalText,
      suggestion: suggestion.text,
      confidence: suggestion.confidence
    });

    return newText;
  }

  /**
   * Batch apply multiple suggestions
   */
  batchApplySuggestions(text, appliedSuggestions) {
    // Sort by offset in reverse order to maintain correct positions
    const sortedSuggestions = appliedSuggestions
      .sort((a, b) => b.issue.offset - a.issue.offset);

    let modifiedText = text;
    
    sortedSuggestions.forEach(({ issue, suggestion }) => {
      modifiedText = this.applySuggestion(modifiedText, issue, suggestion);
    });

    this.emit('batchSuggestionsApplied', {
      count: appliedSuggestions.length,
      categories: appliedSuggestions.map(a => a.issue.category)
    });

    return modifiedText;
  }

  /**
   * Dismiss an issue (for learning purposes)
   */
  dismissIssue(issueId, reason = 'user_dismissed') {
    this.emit('issueDismissed', { issueId, reason });
    
    // Could implement user learning here
    // this.userPreferences.addDismissedRule(issue.rule.id);
  }

  /**
   * Get suggestions for auto-fix
   */
  getAutoFixSuggestions(issues) {
    return issues
      .filter(issue => issue.metadata.autoFixable && issue.confidence > 0.8)
      .map(issue => ({
        issue,
        suggestion: issue.suggestions[0] // Take the highest confidence suggestion
      }));
  }

  /**
   * Check if text has changed significantly
   */
  hasSignificantChanges(oldText, newText) {
    const threshold = 0.1; // 10% change threshold
    const lengthDiff = Math.abs(oldText.length - newText.length);
    const lengthThreshold = Math.max(oldText.length, newText.length) * threshold;
    
    return lengthDiff > lengthThreshold;
  }

  /**
   * Get real-time statistics
   */
  getStatistics() {
    const cacheStats = this.cacheManager.getStats();
    
    return {
      ...this.statistics,
      cache: cacheStats,
      isChecking: this.isChecking,
      activeRequests: this.activeRequests.size,
      uptime: Date.now() - (this.startTime || Date.now())
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      totalChecks: 0,
      cacheHits: 0,
      apiCalls: 0,
      averageResponseTime: 0,
      totalIssuesFound: 0
    };
    
    this.emit('statisticsReset');
  }

  /**
   * Configure writing context
   */
  setWritingContext(context) {
    if (WRITING_CONTEXTS[context]) {
      this.config.context = context;
      this.emit('contextChanged', { context });
      return true;
    }
    return false;
  }

  /**
   * Get available writing contexts
   */
  getAvailableContexts() {
    return Object.keys(WRITING_CONTEXTS).map(key => ({
      id: key,
      name: WRITING_CONTEXTS[key].name,
      description: `Optimized for ${WRITING_CONTEXTS[key].name.toLowerCase()} writing`
    }));
  }

  /**
   * Enable/disable features
   */
  toggleFeature(feature, enabled) {
    const validFeatures = ['enableCache', 'enableIncremental', 'strictMode'];
    
    if (validFeatures.includes(feature)) {
      this.config[feature] = enabled;
      this.emit('featureToggled', { feature, enabled });
      return true;
    }
    return false;
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cacheManager.clear();
    this.emit('cacheCleared');
  }

  /**
   * Export configuration
   */
  exportConfig() {
    return {
      ...this.config,
      statistics: this.getStatistics(),
      timestamp: Date.now()
    };
  }

  /**
   * Import configuration
   */
  importConfig(config) {
    const allowedKeys = [
      'language', 'debounceTime', 'enableCache', 
      'enableIncremental', 'context', 'strictMode'
    ];
    
    allowedKeys.forEach(key => {
      if (config[key] !== undefined) {
        this.config[key] = config[key];
      }
    });
    
    this.emit('configImported', { config: this.config });
  }

  /**
   * Debounced check method for real-time checking
   */
  checkTextDebounced(text, options = {}) {
    const key = options.editorId || 'default';
    
    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.checkText(text, options)
        .then(result => {
          this.emit('debouncedCheckComplete', { key, result });
        })
        .catch(error => {
          this.emit('debouncedCheckError', { key, error });
        });
      
      this.debounceTimers.delete(key);
    }, this.config.debounceTime);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Cancel pending checks
   */
  cancelPendingChecks(editorId = null) {
    if (editorId) {
      if (this.debounceTimers.has(editorId)) {
        clearTimeout(this.debounceTimers.get(editorId));
        this.debounceTimers.delete(editorId);
      }
    } else {
      // Cancel all pending checks
      this.debounceTimers.forEach(timer => clearTimeout(timer));
      this.debounceTimers.clear();
    }
    
    this.emit('pendingChecksCancelled', { editorId });
  }

  /**
   * Get issue by ID
   */
  getIssueById(issues, issueId) {
    return issues.find(issue => issue.id === issueId);
  }

  /**
   * Filter issues by category
   */
  filterIssuesByCategory(issues, categories) {
    const categoryArray = Array.isArray(categories) ? categories : [categories];
    return issues.filter(issue => categoryArray.includes(issue.category));
  }

  /**
   * Filter issues by severity
   */
  filterIssuesBySeverity(issues, severities) {
    const severityArray = Array.isArray(severities) ? severities : [severities];
    return issues.filter(issue => severityArray.includes(issue.severity));
  }

  /**
   * Get issues in text range
   */
  getIssuesInRange(issues, startOffset, endOffset) {
    return issues.filter(issue => {
      const issueStart = issue.offset;
      const issueEnd = issue.offset + issue.length;
      
      return (issueStart >= startOffset && issueStart <= endOffset) ||
             (issueEnd >= startOffset && issueEnd <= endOffset) ||
             (issueStart <= startOffset && issueEnd >= endOffset);
    });
  }

  /**
   * Calculate text quality score
   */
  calculateTextQuality(analysis, issues) {
    let score = 100;
    
    // Deduct points for issues
    const severityPenalties = {
      critical: -10,
      high: -6,
      medium: -3,
      low: -1
    };
    
    issues.forEach(issue => {
      score += severityPenalties[issue.severity] || -1;
    });
    
    // Bonus for good readability
    if (analysis.readabilityScore > 60) {
      score += 5;
    }
    
    // Bonus for vocabulary diversity
    if (analysis.vocabularyDiversity > 50) {
      score += 3;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate writing insights
   */
  generateWritingInsights(text, issues, analysis) {
    const insights = [];
    
    // Issue distribution insights
    const distribution = this.getIssueDistribution(issues);
    const topCategory = Object.entries(distribution)
      .sort(([,a], [,b]) => b.count - a.count)[0];
    
    if (topCategory && topCategory[1].count > 0) {
      insights.push({
        type: 'issue_pattern',
        severity: 'info',
        message: `Most common issue type: ${GRAMMAR_CATEGORIES[topCategory[0]].name}`,
        suggestion: `Focus on improving ${topCategory[0]} to enhance your writing`,
        actionable: true
      });
    }
    
    // Readability insights
    if (analysis.readabilityScore < 30) {
      insights.push({
        type: 'readability',
        severity: 'warning',
        message: 'Text may be difficult to read',
        suggestion: 'Consider shorter sentences and simpler vocabulary',
        actionable: true
      });
    } else if (analysis.readabilityScore > 80) {
      insights.push({
        type: 'readability',
        severity: 'success',
        message: 'Excellent readability score!',
        suggestion: 'Your text is very easy to read and understand',
        actionable: false
      });
    }
    
    // Sentence length insights
    if (analysis.averageSentenceLength > 30) {
      insights.push({
        type: 'sentence_length',
        severity: 'warning',
        message: 'Average sentence length is quite long',
        suggestion: 'Break up some sentences for better flow',
        actionable: true
      });
    }
    
    return insights;
  }

  /**
   * Export issues for external processing
   */
  exportIssues(issues, format = 'json') {
    const exportData = {
      timestamp: Date.now(),
      totalIssues: issues.length,
      categories: this.categorizeIssues(issues),
      issues: issues.map(issue => ({
        id: issue.id,
        category: issue.category,
        message: issue.message,
        offset: issue.offset,
        length: issue.length,
        severity: issue.severity,
        confidence: issue.confidence,
        suggestions: issue.suggestions.map(s => s.text),
        originalText: issue.originalText
      }))
    };

    switch (format) {
      case 'csv':
        return this.convertToCSV(exportData.issues);
      case 'xml':
        return this.convertToXML(exportData);
      default:
        return JSON.stringify(exportData, null, 2);
    }
  }

  /**
   * Convert issues to CSV format
   */
  convertToCSV(issues) {
    const headers = ['ID', 'Category', 'Message', 'Offset', 'Length', 'Severity', 'Original Text'];
    const rows = issues.map(issue => [
      issue.id,
      issue.category,
      `"${issue.message.replace(/"/g, '""')}"`,
      issue.offset,
      issue.length,
      issue.severity,
      `"${issue.originalText.replace(/"/g, '""')}"`
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert data to XML format
   */
  convertToXML(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<grammarCheck>\n';
    xml += `  <timestamp>${data.timestamp}</timestamp>\n`;
    xml += `  <totalIssues>${data.totalIssues}</totalIssues>\n`;
    xml += '  <issues>\n';
    
    data.issues.forEach(issue => {
      xml += '    <issue>\n';
      xml += `      <id>${issue.id}</id>\n`;
      xml += `      <category>${issue.category}</category>\n`;
      xml += `      <message><![CDATA[${issue.message}]]></message>\n`;
      xml += `      <offset>${issue.offset}</offset>\n`;
      xml += `      <length>${issue.length}</length>\n`;
      xml += `      <severity>${issue.severity}</severity>\n`;
      xml += `      <originalText><![CDATA[${issue.originalText}]]></originalText>\n`;
      xml += '    </issue>\n';
    });
    
    xml += '  </issues>\n';
    xml += '</grammarCheck>';
    
    return xml;
  }

  /**
   * Cleanup method
   */
  destroy() {
    // Cancel all pending operations
    this.cancelPendingChecks();
    
    // Clear caches
    this.clearCache();
    
    // Cancel active requests
    this.activeRequests.forEach((request, id) => {
      console.log(`🛑 Cancelling active request: ${id}`);
    });
    this.activeRequests.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
    
    console.log('🗑️ GrammarEngine destroyed');
  }
}

// Export the grammar categories for external use
export { GRAMMAR_CATEGORIES, WRITING_CONTEXTS };

// Create and export singleton instance
const grammarEngine = new GrammarEngine();

// Add initialization timestamp
grammarEngine.startTime = Date.now();

export default grammarEngine;
