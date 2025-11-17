/**
 * Grammar Service - Main API for grammar checking
 * Simplified facade pattern for AI grammar integration
 * Currently uses fallback service, will be replaced with AI (Ollama/Claude)
 */

import GrammarFallback from './GrammarFallback.js';

class GrammarService {
  constructor() {
    this.isInitialized = false;
    this.grammarEngine = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      this.grammarEngine = new GrammarFallback();
      await this.grammarEngine.initialize();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Grammar service initialization failed:', error);
      this.isInitialized = true;
      return false;
    }
  }

  async checkText(text, options = {}) {
    if (!text || text.trim().length === 0) {
      return {
        issues: [],
        statistics: {
          processingTime: 0,
          issuesFound: 0
        }
      };
    }

    // Strip HTML for checking
    const cleanText = this.stripHtml(text);
    if (cleanText.trim().length === 0) {
      return { issues: [], statistics: { processingTime: 0, issuesFound: 0 } };
    }

    // Check cache
    const cacheKey = `${cleanText}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Ensure initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check text
    const result = await this.grammarEngine.checkText(cleanText);

    // Cache result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  stripHtml(text) {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  clearCache() {
    this.cache.clear();
  }

  getStatistics() {
    return {
      cacheSize: this.cache.size,
      isInitialized: this.isInitialized
    };
  }
}

// Create and export singleton
const grammarService = new GrammarService();
export default grammarService;
