/**
 * Spell Checker Engine using Hunspell and SymSpell
 */

import type { Issue, SpellCheckResult, InitOptions } from './types.js';
import { v4 as uuidv4 } from 'uuid';

let hun: any, sym: any;

export async function initSpeller() {
  if (hun) return;
  
  try {
    const { loadModule } = await import('hunspell-asm');
    const factory = await loadModule();
    
    // Load dictionary files
    const affResponse = await fetch('/dict/en_US.aff');
    const dicResponse = await fetch('/dict/en_US.dic');
    const affText = await affResponse.text();
    const dicText = await dicResponse.text();
    
    hun = factory.create(affText, dicText);
    
    // Simple SymSpell-like implementation for suggestions
    const freqResponse = await fetch('/freq/freq_50k.txt');
    const freqText = await freqResponse.text();
    const words = freqText.split('\n').filter(w => w.trim());
    sym = { words };
    
    console.log('✅ Spell checker initialized');
  } catch (error) {
    console.warn('⚠️ Spell checker initialization failed:', error);
  }
}

export function spellingIssues(text: string): any[] {
  if (!hun) return [];
  
  try {
    const words = text.match(/\b\w+\b/g) || [];
    const typos: any[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!hun.spell(word)) {
        const wordStart = text.indexOf(word);
        typos.push({
          category: 'spelling' as const,
          message: 'Possible spelling mistake',
          offset: wordStart,
          length: word.length,
          suggestions: sym?.words?.filter((w: string) => 
            w.toLowerCase().startsWith(word.toLowerCase().slice(0, 2))
          ).slice(0, 5) || []
        });
      }
    }
    
    return typos;
  } catch (error) {
    console.warn('Spell check failed:', error);
    return [];
  }
}

export class SpellChecker {
  private isInitialized = false;
  private options: InitOptions = {};

  /**
   * Initialize the spell checker
   */
  async initialize(options: InitOptions = {}): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    this.options = options;

    try {
      console.log('🔄 Initializing Spell Checker...');
      await initSpeller();
      this.isInitialized = true;
      console.log('✅ Spell Checker initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Spell Checker:', error);
      return false;
    }
  }

  /**
   * Check spelling of text and return issues
   */
  async checkSpelling(text: string): Promise<Issue[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return spellingIssues(text).map((issue: any) => ({
      id: uuidv4(),
      message: issue.message,
      shortMessage: 'Spelling',
      offset: issue.offset,
      length: issue.length,
      category: issue.category,
      severity: 'error' as const,
      priority: 1,
      suggestions: issue.suggestions,
      rule: {
        id: 'SPELLING_ERROR',
        description: 'Misspelled word detected'
      },
      context: {
        text: text.slice(Math.max(0, issue.offset - 20), issue.offset + issue.length + 20),
        offset: Math.max(0, issue.offset - 20),
        length: Math.min(text.length, issue.length + 40)
      },
      source: 'spell-checker'
    }));
  }

  /**
   * Get spell checker status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasHunspell: !!hun,
      hasFrequencyData: !!sym,
      dictionarySize: sym?.words?.length || 0
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.isInitialized = false;
  }
}
