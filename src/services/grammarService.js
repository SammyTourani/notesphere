class GrammarService {
    constructor() {
      this.apiUrl = 'https://api.languagetool.org/v2/check';
      this.cache = new Map();
      this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
  
    /**
     * Check text for grammar, spelling, and style issues
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
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            text: cleanText,
            language: language,
            enabledOnly: 'false'
          })
        });
  
        if (!response.ok) {
          throw new Error(`LanguageTool API error: ${response.status}`);
        }
  
        const data = await response.json();
        const processedMatches = this.processMatches(data.matches, text);
  
        // Cache the results
        this.cache.set(cacheKey, {
          data: processedMatches,
          timestamp: Date.now()
        });
  
        return processedMatches;
      } catch (error) {
        console.warn('Grammar check failed:', error);
        // Return local basic checks as fallback
        return this.basicLocalCheck(cleanText);
      }
    }
  
    /**
     * Process LanguageTool matches and categorize them
     * @param {Array} matches - Raw matches from LanguageTool
     * @param {string} originalText - Original HTML text
     * @returns {Array} Processed grammar issues
     */
    processMatches(matches, originalText) {
      return matches.map(match => ({
        id: `${match.offset}-${match.length}-${Date.now()}`,
        category: this.categorizeIssue(match),
        type: match.rule.category.id,
        message: match.message,
        shortMessage: match.shortMessage || match.message,
        offset: match.offset,
        length: match.length,
        severity: this.getSeverity(match),
        suggestions: match.replacements?.map(r => r.value) || [],
        rule: {
          id: match.rule.id,
          description: match.rule.description,
          issueType: match.rule.issueType
        },
        context: {
          text: match.context.text,
          offset: match.context.offset,
          length: match.context.length
        }
      }));
    }
  
    /**
     * Categorize grammar issues into user-friendly categories
     * @param {Object} match - LanguageTool match
     * @returns {string} Category name
     */
    categorizeIssue(match) {
      const categoryId = match.rule.category.id.toLowerCase();
      const ruleId = match.rule.id.toLowerCase();
  
      // Spelling
      if (categoryId.includes('typo') || categoryId.includes('spelling') || 
          ruleId.includes('spelling') || ruleId.includes('hunspell')) {
        return 'spelling';
      }
  
      // Grammar
      if (categoryId.includes('grammar') || categoryId.includes('agreement') ||
          categoryId.includes('verb') || categoryId.includes('tense')) {
        return 'grammar';
      }
  
      // Punctuation
      if (categoryId.includes('punctuation') || categoryId.includes('comma') ||
          ruleId.includes('comma') || ruleId.includes('apostrophe')) {
        return 'punctuation';
      }
  
      // Style
      if (categoryId.includes('style') || categoryId.includes('redundancy') ||
          categoryId.includes('wordiness') || ruleId.includes('style')) {
        return 'style';
      }
  
      // Clarity
      if (categoryId.includes('clarity') || categoryId.includes('confused') ||
          ruleId.includes('confused') || categoryId.includes('plain')) {
        return 'clarity';
      }
  
      // Default to grammar
      return 'grammar';
    }
  
    /**
     * Get severity level for an issue
     * @param {Object} match - LanguageTool match
     * @returns {string} Severity level
     */
    getSeverity(match) {
      const categoryId = match.rule.category.id.toLowerCase();
      
      if (categoryId.includes('typo') || categoryId.includes('spelling')) {
        return 'error';
      }
      
      if (categoryId.includes('grammar')) {
        return 'error';
      }
      
      if (categoryId.includes('style') || categoryId.includes('clarity')) {
        return 'suggestion';
      }
      
      return 'warning';
    }
  
    /**
     * Basic local grammar checks as fallback
     * @param {string} text - Clean text to check
     * @returns {Array} Basic grammar issues
     */
    basicLocalCheck(text) {
      const issues = [];
      
      // Basic spelling check for common mistakes
      const commonMistakes = {
        'teh': 'the',
        'recieve': 'receive',
        'definately': 'definitely',
        'seperate': 'separate',
        'occured': 'occurred',
        'begining': 'beginning',
        'acheive': 'achieve',
        'beleive': 'believe'
      };
  
      Object.keys(commonMistakes).forEach(mistake => {
        const regex = new RegExp(`\\b${mistake}\\b`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          issues.push({
            id: `local-${match.index}-${mistake}`,
            category: 'spelling',
            type: 'SPELLING',
            message: `Possible spelling mistake found.`,
            shortMessage: 'Spelling',
            offset: match.index,
            length: mistake.length,
            severity: 'error',
            suggestions: [commonMistakes[mistake]],
            rule: {
              id: 'LOCAL_SPELLING',
              description: 'Basic spelling check',
              issueType: 'misspelling'
            },
            context: {
              text: text.substring(Math.max(0, match.index - 10), match.index + mistake.length + 10),
              offset: Math.max(0, 10),
              length: mistake.length
            }
          });
        }
      });
  
      return issues;
    }
  
    /**
     * Strip HTML tags from text
     * @param {string} html - HTML text
     * @returns {string} Plain text
     */
    stripHtml(html) {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent || div.innerText || '';
    }
  
    /**
     * Apply a suggestion to text
     * @param {string} text - Original text
     * @param {Object} issue - Grammar issue object
     * @param {string} suggestion - Suggested replacement
     * @returns {string} Text with suggestion applied
     */
    applySuggestion(text, issue, suggestion) {
      const before = text.substring(0, issue.offset);
      const after = text.substring(issue.offset + issue.length);
      return before + suggestion + after;
    }
  
    /**
     * Get category color for UI
     * @param {string} category - Issue category
     * @returns {string} Tailwind color class
     */
    getCategoryColor(category) {
      const colors = {
        spelling: 'red',
        grammar: 'orange',
        punctuation: 'yellow',
        style: 'blue',
        clarity: 'purple'
      };
      return colors[category] || 'gray';
    }
  
    /**
     * Get category icon for UI
     * @param {string} category - Issue category
     * @returns {string} Icon name or emoji
     */
    getCategoryIcon(category) {
      const icons = {
        spelling: '📝',
        grammar: '📖',
        punctuation: '❗',
        style: '✨',
        clarity: '💡'
      };
      return icons[category] || '📄';
    }
  
    /**
     * Clear the cache
     */
    clearCache() {
      this.cache.clear();
    }
  }
  
  // Create and export a singleton instance
  const grammarService = new GrammarService();
  export default grammarService;