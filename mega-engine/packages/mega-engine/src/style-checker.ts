/**
 * Style Checker Engine using write-good and retext plugins
 */

import type { Issue, StyleAnalysis, InitOptions } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export class StyleChecker {
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

      // Initialize retext processor (optional)
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

    // Use our own comprehensive style checking instead of broken write-good
    const styleIssues = this._checkComprehensiveStyle(text);
    issues.push(...styleIssues);

    // Check with retext (if available)
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
   * Comprehensive style checking (replaces broken write-good)
   */
  private _checkComprehensiveStyle(text: string): Issue[] {
    const issues: Issue[] = [];

    // 1. Passive voice detection
    const passivePatterns = [
      /\b(was|were|is|are|been|being)\s+\w+ed\b/gi,
      /\b(was|were|is|are|been|being)\s+\w+en\b/gi
    ];

    passivePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        issues.push({
        id: uuidv4(),
          message: 'Consider using active voice instead of passive voice',
          shortMessage: 'Passive Voice',
          offset: match.index || 0,
          length: match[0].length,
          category: 'style',
        severity: 'info' as const,
        priority: 5,
        suggestions: [],
        rule: {
            id: 'PASSIVE_VOICE',
            description: 'Passive voice can make writing less direct and engaging'
          },
          context: {
            text: match[0],
            offset: match.index || 0,
            length: match[0].length
          },
          source: 'style-checker'
        });
      }
    });

    // 2. Redundant phrases
    const redundantPhrases = [
      { phrase: 'very unique', replacement: 'unique' },
      { phrase: 'completely unique', replacement: 'unique' },
      { phrase: 'most unique', replacement: 'unique' },
      { phrase: 'free gift', replacement: 'gift' },
      { phrase: 'end result', replacement: 'result' },
      { phrase: 'final outcome', replacement: 'outcome' },
      { phrase: 'past history', replacement: 'history' },
      { phrase: 'advance planning', replacement: 'planning' },
      { phrase: 'future plans', replacement: 'plans' },
      { phrase: 'in my opinion, I think', replacement: 'I think' },
      { phrase: 'I personally believe', replacement: 'I believe' }
    ];

    redundantPhrases.forEach(({ phrase, replacement }) => {
      const regex = new RegExp(phrase, 'gi');
      const matches = text.matchAll(regex);
      for (const match of matches) {
        issues.push({
          id: uuidv4(),
          message: `"${phrase}" is redundant - consider using "${replacement}"`,
          shortMessage: 'Redundancy',
          offset: match.index || 0,
          length: match[0].length,
          category: 'style',
          severity: 'info' as const,
          priority: 4,
          suggestions: [replacement],
          rule: {
            id: 'REDUNDANT_PHRASE',
            description: 'Avoid redundant phrases for clearer writing'
          },
          context: {
            text: match[0],
            offset: match.index || 0,
            length: match[0].length
          },
          source: 'style-checker'
        });
      }
    });

    // 3. Weak words and phrases
    const weakPhrases = [
      'really', 'very', 'quite', 'rather', 'somewhat', 'pretty much',
      'sort of', 'kind of', 'a bit', 'a little', 'fairly'
    ];

    weakPhrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      const matches = text.matchAll(regex);
      for (const match of matches) {
        issues.push({
          id: uuidv4(),
          message: `"${phrase}" is a weak modifier - consider removing or using a stronger word`,
          shortMessage: 'Weak Word',
          offset: match.index || 0,
          length: match[0].length,
          category: 'style',
          severity: 'info' as const,
          priority: 6,
          suggestions: [],
          rule: {
            id: 'WEAK_WORD',
            description: 'Weak words can make writing less impactful'
          },
          context: {
            text: match[0],
            offset: match.index || 0,
            length: match[0].length
          },
          source: 'style-checker'
        });
      }
    });

    // 4. Long sentences
    const sentences = this._splitIntoSentences(text);
    let currentOffset = 0;
    
    sentences.forEach(sentence => {
      const words = this._splitIntoWords(sentence);
      if (words.length > 25) {
        issues.push({
          id: uuidv4(),
          message: `This sentence is ${words.length} words long - consider breaking it into shorter sentences`,
          shortMessage: 'Long Sentence',
          offset: currentOffset,
          length: sentence.length,
          category: 'clarity',
          severity: 'info' as const,
          priority: 4,
          suggestions: [],
          rule: {
            id: 'LONG_SENTENCE',
            description: 'Long sentences can be difficult to read'
        },
        context: {
            text: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''),
            offset: currentOffset,
            length: sentence.length
        },
          source: 'style-checker'
        });
      }
      currentOffset += sentence.length + 1; // +1 for sentence separator
    });

    return issues;
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
      hasComprehensiveStyleChecker: true,
      hasRetext: this.retextProcessor !== null
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
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
