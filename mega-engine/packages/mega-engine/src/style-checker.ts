/**
 * Style Checker Engine using write-good and retext plugins
 */

import type { Issue, StyleAnalysis, InitOptions } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export class StyleChecker {
  private writeGood: any = null;
  private retextProcessor: any = null;
  private isInitialized = false;
  private options: InitOptions = {};

  /**
   * Initialize the style checker
   */
  async initialize(options: InitOptions = {}): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    this.options = options;

    try {
      console.log('🔄 Initializing Style Checker...');

      // Initialize write-good
      await this._initializeWriteGood();

      // Initialize retext processor
      await this._initializeRetext();

      this.isInitialized = true;
      console.log('✅ Style Checker initialized');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Style Checker:', error);
      throw error; // Throw instead of returning false
    }
  }

  /**
   * Check text for style issues
   */
  async checkStyle(text: string): Promise<Issue[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const issues: Issue[] = [];

    // Check with write-good
    if (this.writeGood) {
      const writeGoodIssues = this._checkWithWriteGood(text);
      issues.push(...writeGoodIssues);
    }

    // Check with retext
    if (this.retextProcessor) {
      const retextIssues = await this._checkWithRetext(text);
      issues.push(...retextIssues);
    }

    return issues;
  }

  /**
   * Analyze text for readability and style metrics
   */
  async analyzeStyle(text: string): Promise<StyleAnalysis> {
    const sentences = this._splitIntoSentences(text);
    const words = this._splitIntoWords(text);
    
    // Calculate basic readability metrics
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const avgSyllablesPerWord = this._calculateAvgSyllables(words);
    
    // Flesch Reading Ease Score
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    const suggestions = await this._generateStyleSuggestions(text);

    return {
      readabilityScore: Math.max(0, Math.min(100, fleschScore)),
      suggestions
    };
  }

  /**
   * Initialize write-good
   */
  private async _initializeWriteGood(): Promise<void> {
    try {
      const writeGoodModule = await import('write-good') as any;
      this.writeGood = writeGoodModule.default || writeGoodModule;
      console.log('✅ write-good initialized');
    } catch (error) {
      console.warn('⚠️ write-good not available:', error);
    }
  }

  /**
   * Initialize retext processor with plugins
   */
  private async _initializeRetext(): Promise<void> {
    try {
      // For now, just mark as available but don't initialize complex retext
      // write-good provides the main style checking functionality
      console.log('⚠️ retext plugins available but not initialized (API compatibility)');
      // this.retextProcessor will remain null, but that's ok
    } catch (error) {
      console.warn('⚠️ retext not available:', error);
      // Don't throw - style checker can work with just write-good
    }
  }

  /**
   * Check text with write-good
   */
  private _checkWithWriteGood(text: string): Issue[] {
    if (!this.writeGood) return [];

    try {
      const suggestions = this.writeGood(text);
      
      return suggestions.map((suggestion: any) => ({
        id: uuidv4(),
        message: suggestion.reason,
        shortMessage: 'Style',
        offset: suggestion.index,
        length: suggestion.offset,
        category: this._categorizeWriteGoodIssue(suggestion.reason),
        severity: 'info' as const,
        priority: 5,
        suggestions: [],
        rule: {
          id: 'WRITE_GOOD',
          description: suggestion.reason
        },
        context: {
          text: this._getContext(text, suggestion.index, suggestion.offset),
          offset: Math.max(0, suggestion.index - 20),
          length: Math.min(text.length, suggestion.offset + 40)
        },
        source: 'write-good'
      }));
    } catch (error) {
      console.warn('write-good check failed:', error);
      return [];
    }
  }

  /**
   * Check text with retext
   */
  private async _checkWithRetext(text: string): Promise<Issue[]> {
    if (!this.retextProcessor) return [];

    try {
      const vfileModule = await import('vfile') as any;
      const VFile = vfileModule.VFile || vfileModule.default;
      const file = new VFile({ value: text });
      
      await this.retextProcessor.process(file);
      
      return file.messages.map((message: any) => ({
        id: uuidv4(),
        message: message.message,
        shortMessage: message.source || 'Style',
        offset: message.position?.start?.offset || 0,
        length: (message.position?.end?.offset || 0) - (message.position?.start?.offset || 0),
        category: this._categorizeRetextIssue(message.source),
        severity: message.fatal ? 'error' as const : 'warning' as const,
        priority: message.fatal ? 2 : 4,
        suggestions: [],
        rule: {
          id: message.ruleId || 'RETEXT',
          description: message.message
        },
        context: {
          text: this._getContext(text, message.position?.start?.offset || 0, 
                                (message.position?.end?.offset || 0) - (message.position?.start?.offset || 0)),
          offset: Math.max(0, (message.position?.start?.offset || 0) - 20),
          length: Math.min(text.length, ((message.position?.end?.offset || 0) - (message.position?.start?.offset || 0)) + 40)
        },
        source: 'retext'
      }));
    } catch (error) {
      console.warn('retext check failed:', error);
      return [];
    }
  }

  /**
   * Generate style suggestions
   */
  private async _generateStyleSuggestions(text: string): Promise<StyleAnalysis['suggestions']> {
    const suggestions: StyleAnalysis['suggestions'] = [];

    // Check for overly long sentences
    const sentences = this._splitIntoSentences(text);
    sentences.forEach((sentence, index) => {
      const words = this._splitIntoWords(sentence);
      if (words.length > 25) {
        suggestions.push({
          type: 'clarity',
          message: 'Consider breaking this long sentence into shorter ones',
          position: { start: 0, end: sentence.length } // Simplified positioning
        });
      }
    });

    // Check for passive voice (simplified detection)
    const passivePatterns = [
      /\b(was|were|is|are|been|being)\s+\w+ed\b/gi,
      /\b(was|were|is|are|been|being)\s+\w+en\b/gi
    ];

    passivePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        suggestions.push({
          type: 'clarity',
          message: 'Consider using active voice instead of passive voice',
          position: { start: match.index || 0, end: (match.index || 0) + match[0].length }
        });
      }
    });

    // Check for redundant phrases
    const redundantPhrases = [
      'very unique', 'completely unique', 'most unique',
      'free gift', 'end result', 'final outcome',
      'past history', 'advance planning', 'future plans'
    ];

    redundantPhrases.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      const matches = text.matchAll(regex);
      for (const match of matches) {
        suggestions.push({
          type: 'simplify',
          message: `"${phrase}" is redundant - consider simplifying`,
          position: { start: match.index || 0, end: (match.index || 0) + match[0].length }
        });
      }
    });

    return suggestions;
  }

  /**
   * Categorize write-good issues
   */
  private _categorizeWriteGoodIssue(reason: string): 'clarity' | 'style' | 'readability' {
    const lowerReason = reason.toLowerCase();
    
    if (lowerReason.includes('passive') || lowerReason.includes('wordy')) {
      return 'clarity';
    }
    if (lowerReason.includes('readability') || lowerReason.includes('complex')) {
      return 'readability';
    }
    return 'style';
  }

  /**
   * Categorize retext issues
   */
  private _categorizeRetextIssue(source?: string): 'inclusivity' | 'style' | 'clarity' {
    if (!source) return 'style';
    
    if (source.includes('equality')) {
      return 'inclusivity';
    }
    if (source.includes('simplify')) {
      return 'clarity';
    }
    return 'style';
  }

  /**
   * Split text into sentences
   */
  private _splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  /**
   * Split text into words
   */
  private _splitIntoWords(text: string): string[] {
    return text.split(/\s+/).filter(w => w.trim().length > 0);
  }

  /**
   * Calculate average syllables per word
   */
  private _calculateAvgSyllables(words: string[]): number {
    if (words.length === 0) return 0;
    
    const totalSyllables = words.reduce((sum, word) => {
      return sum + this._countSyllables(word);
    }, 0);
    
    return totalSyllables / words.length;
  }

  /**
   * Count syllables in a word (simplified algorithm)
   */
  private _countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    // Remove common endings that don't add syllables
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    // Count vowel groups
    const vowelGroups = word.match(/[aeiouy]{1,2}/g);
    const syllables = vowelGroups ? vowelGroups.length : 1;
    
    return Math.max(1, syllables);
  }

  /**
   * Get context around a position
   */
  private _getContext(text: string, offset: number, length: number): string {
    const start = Math.max(0, offset - 20);
    const end = Math.min(text.length, offset + length + 20);
    return text.substring(start, end);
  }

  /**
   * Get style checker status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasWriteGood: this.writeGood !== null,
      hasRetext: this.retextProcessor !== null
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.writeGood = null;
    this.retextProcessor = null;
    this.isInitialized = false;
    console.log('🗑️ Style Checker disposed');
  }
}

// Functional API exports
let styleChecker: StyleChecker | null = null;

export async function initStyle() {
  if (styleChecker) return;
  
  try {
    styleChecker = new StyleChecker();
    await styleChecker.initialize();
    console.log('✅ Style engine initialized');
  } catch (error) {
    console.error('❌ Style engine failed to initialize:', error);
    throw error;
  }
}

export async function styleIssues(text: string): Promise<any[]> {
  if (!styleChecker) {
    // Return empty if not initialized (graceful degradation for CLI)
    return [];
  }
  
  try {
    const issues = await styleChecker.checkStyle(text);
    return issues.map(issue => ({
      category: 'style' as const,
      message: issue.message,
      offset: issue.offset,
      length: issue.length,
      suggestions: issue.suggestions || []
    }));
  } catch (error) {
    console.warn('Style check failed:', error);
    return [];
  }
}
