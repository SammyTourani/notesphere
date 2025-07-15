/**
 * Professional Hunspell Spell Checker using nspell
 * 
 * Replaces the broken hunspell-asm with a working pure JavaScript implementation
 * Provides full morphological analysis and accurate spell checking
 * 
 * Features:
 * - Full Hunspell compatibility (.aff/.dic files)
 * - Proper morphological analysis (running → run + ing)
 * - Accurate word recognition
 * - Fast suggestions using both nspell and SymSpell
 * - No native compilation issues
 */

import nspell from 'nspell';
import type { Issue, InitOptions } from './types.js';
import { loadTextAsset } from './asset-loader.js';
import { v4 as uuidv4 } from 'uuid';

// Global state for the professional spell checker
let hunspellChecker: any = null;
let symSpell: any = null;
let isInitialized = false;
let totalWords = 0;

/**
 * Initialize the professional Hunspell spell checker
 */
export async function initProfessionalSpeller(): Promise<boolean> {
  if (isInitialized) return true;
  
  try {
    console.log('🔄 Initializing Professional Hunspell Spell Checker with nspell...');
    
    // Load Hunspell dictionary files (.aff and .dic)
    console.log('   Loading Hunspell dictionary files...');
    const [affText, dicText] = await Promise.all([
      loadTextAsset('dict/en_US.aff'),
      loadTextAsset('dict/en_US.dic')
    ]);
    
    console.log(`   ✅ Loaded .aff file: ${affText.length} chars`);
    console.log(`   ✅ Loaded .dic file: ${dicText.length} chars`);
    
    // Create nspell instance with proper Hunspell files
    hunspellChecker = nspell({
      aff: affText,
      dic: dicText
    });
    
    // Get word count from dictionary
    const dicLines = dicText.split('\n');
    totalWords = parseInt(dicLines[0]) || dicLines.length - 1;
    
    console.log(`   ✅ Initialized Hunspell with ${totalWords} base words + morphological rules`);
    
    // Initialize SymSpell for enhanced suggestions (optional)
    try {
      console.log('   Initializing SymSpell for enhanced suggestions...');
      const { SymSpellEx, MemoryStore } = await import('symspell-ex');
      const store = new MemoryStore();
      symSpell = new SymSpellEx(store, undefined, undefined, 2, 5);
      
      await symSpell.initialize();
      
      // Load frequency data for better suggestions
      const freqText = await loadTextAsset('freq/freq_50k.txt');
      const freqLines = freqText.split('\n').slice(0, 10000); // Top 10K most frequent
      
      for (const line of freqLines) {
        const parts = line.split(' ');
        if (parts.length >= 2) {
          const word = parts[0].trim().toLowerCase();
          const freq = parseInt(parts[1].trim());
          if (word && !isNaN(freq)) {
            await symSpell.add(word, freq);
          }
        }
      }
      
      console.log('   ✅ SymSpell initialized with enhanced suggestions');
    } catch (error: any) {
      console.warn('   ⚠️ SymSpell failed, using fallback suggestions:', error.message);
      symSpell = null;
    }
    
    isInitialized = true;
    console.log('✅ Professional Hunspell Spell Checker initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Professional Hunspell Spell Checker:', error);
    return false;
  }
}

/**
 * Check if a word is spelled correctly using real Hunspell
 */
export function isWordCorrectHunspell(word: string): boolean {
  if (!isInitialized || !hunspellChecker) return true; // If not initialized, assume correct
  
  const cleanWord = word.trim();
  
  // Skip very short words, numbers, or mixed content
  if (cleanWord.length <= 1 || /\d/.test(cleanWord) || !/^[a-zA-Z''-]+$/i.test(cleanWord)) {
    return true;
  }
  
  // Use nspell's correct method - this handles full morphological analysis
  return hunspellChecker.correct(cleanWord);
}

/**
 * Get spelling suggestions using Hunspell + SymSpell
 */
export async function getHunspellSuggestions(word: string): Promise<string[]> {
  if (!isInitialized || !hunspellChecker) return [];
  
  const cleanWord = word.trim();
  
  // Get primary suggestions from nspell (Hunspell-compatible)
  const hunspellSuggestions = hunspellChecker.suggest(cleanWord) || [];
  
  // If we have good Hunspell suggestions, use them
  if (hunspellSuggestions.length > 0) {
    return hunspellSuggestions.slice(0, 5);
  }
  
  // Fallback to SymSpell for additional suggestions
  if (symSpell && symSpell.lookup) {
    try {
      const symspellResults = await symSpell.lookup(cleanWord.toLowerCase(), 2);
      const symspellSuggestions = symspellResults
        .map((s: any) => s.term || s.word || s)
        .filter((s: string) => s && s !== cleanWord.toLowerCase())
        .slice(0, 5);
      
      if (symspellSuggestions.length > 0) {
        return symspellSuggestions;
      }
    } catch (error) {
      // Fall through to common corrections
    }
  }
  
  // Last resort: common typo corrections
  const commonCorrections: Record<string, string[]> = {
    'mispelled': ['misspelled'],
    'misspeled': ['misspelled'],
    'teh': ['the'],
    'helo': ['hello'],
    'recieve': ['receive'],
    'definately': ['definitely'],
    'seperate': ['separate'],
    'occured': ['occurred'],
    'begining': ['beginning'],
    'accomodate': ['accommodate'],
    'untill': ['until'],
    'alot': ['a lot'],
    'grammer': ['grammar'],
    'sentance': ['sentence']
  };
  
  return commonCorrections[cleanWord.toLowerCase()] || [];
}

/**
 * Check spelling of entire text and return issues (Professional Hunspell)
 */
export async function professionalSpellingIssues(text: string): Promise<any[]> {
  if (!isInitialized) {
    await initProfessionalSpeller();
  }
  
  try {
    // Extract words using a more sophisticated pattern
    const words = text.match(/\b[a-zA-Z''-]+\b/g) || [];
    const issues: any[] = [];
    const processedPositions = new Set<number>();
    
    for (const word of words) {
      // Skip words that are correctly spelled
      if (isWordCorrectHunspell(word)) continue;
      
      // Find the position of this word in the text
      let position = text.indexOf(word);
      let searchStart = 0;
      
      // Handle multiple occurrences of the same word
      while (position !== -1 && processedPositions.has(position)) {
        searchStart = position + 1;
        position = text.indexOf(word, searchStart);
      }
      
      if (position === -1) continue;
      processedPositions.add(position);
      
      const suggestions = await getHunspellSuggestions(word);
      
      issues.push({
        category: 'spelling' as const,
        message: `"${word}" may be misspelled`,
        offset: position,
        length: word.length,
        suggestions,
        confidence: 0.95 // High confidence with real Hunspell
      });
    }
    
    return issues;
    
  } catch (error) {
    console.warn('Professional Hunspell spell check failed:', error);
    return [];
  }
}

/**
 * Professional Hunspell SpellChecker class
 */
export class ProfessionalHunspellChecker {
  private isInitialized = false;
  private options: InitOptions = {};

  async initialize(options: InitOptions = {}): Promise<boolean> {
    if (this.isInitialized) return true;
    
    this.options = options;
    const success = await initProfessionalSpeller();
    this.isInitialized = success;
    return success;
  }

  async checkSpelling(text: string): Promise<Issue[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const rawIssues = await professionalSpellingIssues(text);
    return rawIssues.map((issue: any) => ({
      id: uuidv4(),
      message: issue.message,
      shortMessage: 'Spelling',
      offset: issue.offset,
      length: issue.length,
      category: issue.category,
      severity: 'error' as const,
      priority: 2,
      suggestions: issue.suggestions,
      rule: {
        id: 'HUNSPELL_SPELLING',
        description: 'Hunspell morphological spell check'
      },
      context: {
        text: text.slice(Math.max(0, issue.offset - 20), issue.offset + issue.length + 20),
        offset: Math.max(0, issue.offset - 20),
        length: Math.min(text.length, issue.length + 40)
      },
      confidence: issue.confidence,
      source: 'professional-hunspell'
    }));
  }

  /**
   * Add a word to the personal dictionary
   */
  addWord(word: string): void {
    if (hunspellChecker) {
      hunspellChecker.add(word);
    }
  }

  /**
   * Remove a word from the personal dictionary
   */
  removeWord(word: string): void {
    if (hunspellChecker) {
      hunspellChecker.remove(word);
    }
  }

  /**
   * Check if a single word is correct
   */
  isWordCorrect(word: string): boolean {
    return isWordCorrectHunspell(word);
  }

  /**
   * Get suggestions for a word
   */
  async getSuggestions(word: string): Promise<string[]> {
    return await getHunspellSuggestions(word);
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      engine: 'nspell-hunspell',
      hasHunspell: true,
      hasSymspell: !!symSpell,
      dictionarySize: totalWords,
      morphologicalAnalysis: true,
      features: [
        'Full Hunspell compatibility',
        'Morphological analysis',
        'Accurate word recognition',
        'Professional spell checking',
        'Enhanced suggestions'
      ]
    };
  }

  cleanup(): void {
    this.isInitialized = false;
  }
} 