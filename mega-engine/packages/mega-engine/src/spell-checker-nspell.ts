/**
 * Professional Hunspell Spell Checker using nspell
 * PHASE 1 INTEGRATION: Reliable asset loading, health monitoring, structured logging
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
 * - PHASE 1: Reliable asset loading and health monitoring
 */

import nspell from 'nspell';
import type { Issue, InitOptions } from './types.js';
// PHASE 1: Import new reliable components
import { Logger } from './logger.js';
import { EngineHealthMonitor } from './engine-health-monitor.js';
import { StreamingAssetLoader } from './streaming-asset-loader.js';
import { v4 as uuidv4 } from 'uuid';

// Global state for the professional spell checker
let hunspellChecker: any = null;
let symSpell: any = null;
let isInitialized = false;
let totalWords = 0;

// PHASE 1: Add logger and health monitor
const logger = new Logger('ProfessionalSpellChecker');
const healthMonitor = EngineHealthMonitor.getInstance();
const assetLoader = StreamingAssetLoader.getInstance();

/**
 * Initialize the professional Hunspell spell checker with Phase 1 reliability
 */
export async function initProfessionalSpeller(): Promise<boolean> {
  if (isInitialized) {
    logger.debug('Spell checker already initialized');
    return true;
  }
  
  try {
    logger.info('🔄 Initializing Professional Hunspell Spell Checker with nspell (Phase 1)...');
    
    // PHASE 1: Load Hunspell dictionary files using streaming asset loader
    logger.info('Loading Hunspell dictionary files with streaming loader...');
    const [affText, dicText] = await Promise.all([
      assetLoader.loadTextAsset('dict/en_US.aff'),
      assetLoader.loadTextAsset('dict/en_US.dic')
    ]);
    
    logger.info(`✅ Loaded .aff file: ${affText.length} chars`);
    logger.info(`✅ Loaded .dic file: ${dicText.length} chars`);
    
    // Create nspell instance with proper Hunspell files
    hunspellChecker = nspell({
      aff: affText,
      dic: dicText
    });
    
    // Get word count from dictionary
    const dicLines = dicText.split('\n');
    totalWords = parseInt(dicLines[0]) || dicLines.length - 1;
    
    logger.info(`✅ Initialized Hunspell with ${totalWords} base words + morphological rules`);
    
    // Initialize SymSpell for enhanced suggestions (optional)
    try {
      logger.info('Initializing SymSpell for enhanced suggestions...');
      const { SymSpellEx, MemoryStore } = await import('symspell-ex');
      const store = new MemoryStore();
      symSpell = new SymSpellEx(store, undefined, undefined, 2, 5);
      
      await symSpell.initialize();
      
      // PHASE 1: Load frequency data using streaming asset loader
      const freqText = await assetLoader.loadTextAsset('freq/freq_50k.txt');
      const freqLines = freqText.split('\n').slice(0, 10000); // Top 10K most frequent
      
      for (const line of freqLines) {
        const parts = line.split(' ');
        if (parts.length >= 2) {
          const word = parts[0].trim().toLowerCase();
          const freq = parseInt(parts[1].trim(), 10);
          if (word && !isNaN(freq)) {
            await symSpell.add(word, freq);
          }
        }
      }
      
      logger.info('✅ SymSpell initialized with enhanced suggestions');
      healthMonitor.reportSuccess('symspell');
    } catch (error) {
      logger.warn('⚠️ SymSpell failed, using fallback suggestions:', { error });
      healthMonitor.reportFailure('symspell', error instanceof Error ? error : new Error('Unknown error'));
      symSpell = null;
    }
    
    isInitialized = true;
    logger.info('✅ Professional Hunspell Spell Checker initialized successfully (Phase 1)');
    healthMonitor.reportSuccess('hunspell');
    return true;
    
  } catch (error) {
    logger.error('❌ Failed to initialize Professional Hunspell Spell Checker:', { error });
    healthMonitor.reportFailure('hunspell', error instanceof Error ? error : new Error('Unknown error'));
    return false;
  }
}

/**
 * Check if a word is spelled correctly using real Hunspell
 */
export function isWordCorrectHunspell(word: string): boolean {
  if (!isInitialized || !hunspellChecker) {
    logger.warn('Spell checker not initialized, assuming word is correct');
    return true; // If not initialized, assume correct
  }
  
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
  if (!isInitialized || !hunspellChecker) {
    logger.warn('Spell checker not initialized, returning empty suggestions');
    return [];
  }
  
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
      logger.warn('SymSpell lookup failed:', { error });
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
    logger.info('Spell checker not initialized, initializing now...');
    const success = await initProfessionalSpeller();
    if (!success) {
      logger.error('Failed to initialize spell checker');
      healthMonitor.reportFailure('hunspell', new Error('Initialization failed'));
      throw new Error('Spell checker initialization failed');
    }
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
        id: uuidv4(),
        category: 'spelling',
        severity: 'error',
        priority: 1,
        message: `"${word}" is misspelled`,
        shortMessage: 'Spelling',
        offset: position,
        length: word.length,
        suggestions,
        rule: {
          id: 'HUNSPELL_SPELLING',
          description: 'Word not found in dictionary'
        },
        context: {
          text: text.slice(Math.max(0, position - 20), position + word.length + 20),
          offset: Math.max(0, position - 20),
          length: Math.min(text.length, word.length + 40)
        },
        source: 'hunspell'
      });
    }
    
    logger.debug(`Found ${issues.length} spelling issues`);
    healthMonitor.reportSuccess('hunspell');
    return issues;
    
  } catch (error) {
    logger.error('Spelling check failed:', { error });
    healthMonitor.reportFailure('hunspell', error instanceof Error ? error : new Error('Unknown error'));
    throw error; // PHASE 1: No silent fallbacks
  }
}

/**
 * PHASE 1: Professional Hunspell Checker Class with health monitoring
 */
export class ProfessionalHunspellChecker {
  private isInitialized = false;
  private options: InitOptions = {};
  private logger = new Logger('ProfessionalHunspellChecker');
  private healthMonitor = EngineHealthMonitor.getInstance();

  /**
   * Initialize the spell checker with Phase 1 reliability
   */
  async initialize(options: InitOptions = {}): Promise<boolean> {
    if (this.isInitialized) {
      this.logger.debug('Spell checker already initialized');
      return true;
    }

    this.options = options;
    
    try {
      this.logger.info('Initializing Professional Hunspell Checker...');
      const success = await initProfessionalSpeller();
      
      if (success) {
        this.isInitialized = true;
        this.logger.info('✅ Professional Hunspell Checker initialized successfully');
        this.healthMonitor.reportSuccess('hunspell');
        return true;
      } else {
        throw new Error('Spell checker initialization returned false');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Professional Hunspell Checker:', { error });
      this.healthMonitor.reportFailure('hunspell', error instanceof Error ? error : new Error('Unknown error'));
      throw error; // PHASE 1: No silent fallbacks
    }
  }

  /**
   * Check spelling with health monitoring
   */
  async checkSpelling(text: string): Promise<Issue[]> {
    if (!this.isInitialized) {
      this.logger.warn('Spell checker not initialized, initializing now...');
      await this.initialize(this.options);
    }

    try {
      const issues = await professionalSpellingIssues(text);
      this.healthMonitor.reportSuccess('hunspell');
      return issues;
    } catch (error) {
      this.logger.error('Spelling check failed:', { error });
      this.healthMonitor.reportFailure('hunspell', error instanceof Error ? error : new Error('Unknown error'));
      throw error; // PHASE 1: No silent fallbacks
    }
  }

  /**
   * Add word to dictionary
   */
  addWord(word: string): void {
    if (hunspellChecker) {
      hunspellChecker.add(word);
      this.logger.debug(`Added word to dictionary: ${word}`);
    }
  }

  /**
   * Remove word from dictionary
   */
  removeWord(word: string): void {
    if (hunspellChecker) {
      hunspellChecker.remove(word);
      this.logger.debug(`Removed word from dictionary: ${word}`);
    }
  }

  /**
   * Check if word is correct
   */
  isWordCorrect(word: string): boolean {
    return isWordCorrectHunspell(word);
  }

  /**
   * Get suggestions for word
   */
  async getSuggestions(word: string): Promise<string[]> {
    return getHunspellSuggestions(word);
  }

  /**
   * Get spell checker status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      totalWords,
      hasSymSpell: symSpell !== null,
      health: this.healthMonitor.getHealthReport().engines.get('hunspell')
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    hunspellChecker = null;
    symSpell = null;
    isInitialized = false;
    this.logger.info('Spell checker cleaned up');
  }
} 