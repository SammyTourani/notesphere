/**
 * Simple Grammar Fallback Service
 * Provides basic grammar checking until AI integration is complete
 * Lightweight, fast, and sufficient for temporary use
 */

export class GrammarFallback {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    this.isInitialized = true;
    return true;
  }

  async checkText(text) {
    if (!text || text.length < 3) {
      return {
        issues: [],
        statistics: {
          engine: 'fallback',
          processingTime: 0,
          issuesFound: 0,
          textLength: text?.length || 0,
          wordsChecked: 0
        }
      };
    }

    const startTime = Date.now();
    const issues = [];

    // Basic checks only
    const rules = [
      // Double spaces
      {
        pattern: /\s{2,}/g,
        message: 'Extra whitespace detected',
        category: 'punctuation',
        severity: 'info',
        fix: (match) => ' '
      },
      // Missing space after period
      {
        pattern: /\.[A-Z]/g,
        message: 'Missing space after period',
        category: 'punctuation',
        severity: 'warning',
        fix: (match) => '. ' + match[1]
      },
      // Common misspellings
      {
        pattern: /\b(teh|recieve|occured|seperate|definately|untill)\b/gi,
        message: 'Common spelling error',
        category: 'spelling',
        severity: 'error',
        suggestions: {
          'teh': 'the',
          'recieve': 'receive',
          'occured': 'occurred',
          'seperate': 'separate',
          'definately': 'definitely',
          'untill': 'until'
        }
      },
      // Repeated words
      {
        pattern: /\b(\w+)\s+\1\b/gi,
        message: 'Repeated word',
        category: 'grammar',
        severity: 'warning',
        fix: (match, word) => word
      }
    ];

    rules.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        const issue = {
          id: `fallback-${Date.now()}-${Math.random()}`,
          message: rule.message,
          offset: match.index,
          length: match[0].length,
          category: rule.category,
          severity: rule.severity,
          suggestions: [],
          context: {
            text: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + match[0].length + 20)),
            offset: Math.min(20, match.index),
            length: match[0].length
          },
          source: 'fallback'
        };

        // Add suggestions
        if (rule.fix) {
          issue.suggestions = [rule.fix(match[0], match[1])];
        } else if (rule.suggestions) {
          const word = match[0].toLowerCase();
          issue.suggestions = rule.suggestions[word] ? [rule.suggestions[word]] : [];
        }

        issues.push(issue);
      }
    });

    const processingTime = Date.now() - startTime;

    return {
      issues,
      statistics: {
        engine: 'fallback',
        processingTime,
        issuesFound: issues.length,
        textLength: text.length,
        wordsChecked: text.split(/\s+/).length
      }
    };
  }
}

export default GrammarFallback;
