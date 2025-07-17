/**
 * Fixed Spell Checker - Bypasses broken hunspell-asm
 * Uses a combination of word lists and smart algorithms
 */

import type { Issue, CheckResult, InitOptions } from './types.js';
import { loadTextAsset } from './asset-loader.js';
import { v4 as uuidv4 } from 'uuid';

// Simple but effective spell checker state
let wordSet: Set<string> = new Set();
let wordList: string[] = [];
let symSpell: any = null;
let isInitialized = false;

/**
 * Initialize the fixed spell checker
 */
export async function initFixedSpeller(): Promise<boolean> {
  if (isInitialized) return true;
  
  try {
    console.log('🔄 Initializing Fixed Spell Checker...');
    
    // Load dictionary as word list instead of using broken hunspell-asm
    console.log('   Loading dictionary words...');
    const dicText = await loadTextAsset('dict/en_US.dic');
    const lines = dicText.split('\n').slice(1); // Skip first line (count)
    
    // Extract base words and generate common inflections from hunspell format
    const baseWords = lines
      .map(line => {
        const parts = line.split('/');
        const word = parts[0].trim();
        const flags = parts[1] || '';
        return { word, flags };
      })
      .filter(item => item.word.length > 0 && /^[a-zA-Z]+$/.test(item.word)); // Only letters
    
    const allWords = new Set<string>();
    
    // Add base words and generate common inflections
    for (const { word, flags } of baseWords) {
      const lowerWord = word.toLowerCase();
      allWords.add(lowerWord);
      
      // Generate common inflections based on flags
      if (flags.includes('S')) { // Plural
        allWords.add(lowerWord + 's');
        if (lowerWord.endsWith('y') && !lowerWord.endsWith('ey')) {
          allWords.add(lowerWord.slice(0, -1) + 'ies');
        }
        if (lowerWord.endsWith('s') || lowerWord.endsWith('sh') || lowerWord.endsWith('ch') || lowerWord.endsWith('x') || lowerWord.endsWith('z')) {
          allWords.add(lowerWord + 'es');
        }
      }
      
      if (flags.includes('D')) { // Past tense
        if (lowerWord.endsWith('e')) {
          allWords.add(lowerWord + 'd');
        } else if (lowerWord.endsWith('y') && !lowerWord.endsWith('ey')) {
          allWords.add(lowerWord.slice(0, -1) + 'ied');
        } else {
          allWords.add(lowerWord + 'ed');
        }
      }
      
      if (flags.includes('G')) { // Present participle
        if (lowerWord.endsWith('e')) {
          allWords.add(lowerWord.slice(0, -1) + 'ing');
        } else {
          allWords.add(lowerWord + 'ing');
        }
      }
      
      if (flags.includes('R')) { // Comparative
        if (lowerWord.endsWith('e')) {
          allWords.add(lowerWord + 'r');
        } else if (lowerWord.endsWith('y') && !lowerWord.endsWith('ey')) {
          allWords.add(lowerWord.slice(0, -1) + 'ier');
        } else {
          allWords.add(lowerWord + 'er');
        }
      }
      
      if (flags.includes('T')) { // Superlative
        if (lowerWord.endsWith('e')) {
          allWords.add(lowerWord + 'st');
        } else if (lowerWord.endsWith('y') && !lowerWord.endsWith('ey')) {
          allWords.add(lowerWord.slice(0, -1) + 'iest');
        } else {
          allWords.add(lowerWord + 'est');
        }
      }
      
      if (flags.includes('M')) { // Possessive
        allWords.add(lowerWord + "'s");
      }
    }
    
    wordSet = allWords;
    wordList = Array.from(wordSet);
    
    console.log(`   ✅ Loaded ${wordSet.size} dictionary words`);
    
    // Add common words, irregular forms, and contractions that might be missing
    const commonWords = [
      // Common words
      'the', 'and', 'a', 'to', 'of', 'in', 'i', 'you', 'it', 'be', 'have', 'that', 'for', 'not', 'with', 'he', 'as', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
      
      // Irregular verb forms
      'is', 'am', 'are', 'was', 'were', 'been', 'being',
      'has', 'had', 'having', 
      'does', 'did', 'done', 'doing',
      'goes', 'went', 'gone', 'going',
      'gets', 'got', 'gotten', 'getting',
      'comes', 'came', 'coming',
      'takes', 'took', 'taken', 'taking',
      'makes', 'made', 'making',
      'knows', 'knew', 'known', 'knowing',
      'thinks', 'thought', 'thinking',
      'sees', 'saw', 'seen', 'seeing',
      'gives', 'gave', 'given', 'giving',
      
      // Common contractions (without apostrophes for simplicity)
      'dont', 'doesnt', 'didnt', 'wont', 'wouldnt', 'shouldnt', 'couldnt', 'cant', 'isnt', 'arent', 'wasnt', 'werent', 'hasnt', 'havent', 'hadnt',
      'im', 'youre', 'hes', 'shes', 'its', 'were', 'theyre', 'ive', 'youve', 'weve', 'theyve', 'ill', 'youll', 'hell', 'shell', 'well', 'theyll',
      
      // Common misspellings that should be accepted
      'misspelled', 'misspelling', 'definitely', 'separate', 'occurred', 'beginning', 'accommodate', 'receive', 'achieve', 'believe',
      
      // Technical terms and acronyms
      'WASM', 'wasm', 'WebAssembly', 'nlprule', 'API', 'URL', 'HTTP', 'HTTPS', 'JSON', 'XML', 'CSS', 'HTML', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'npm', 'yarn', 'Git', 'GitHub', 'GitLab', 'VS', 'VSCode', 'IDE', 'SDK', 'CLI', 'GUI', 'UI', 'UX', 'SEO', 'AI', 'ML', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'DevOps', 'regex', 'RegExp', 'UTF-8', 'ASCII', 'Unicode', 'IPv4', 'IPv6', 'DNS', 'CDN', 'SSL', 'TLS', 'JWT', 'OAuth', 'REST', 'GraphQL', 'WebSocket', 'gRPC', 'Microservices', 'Serverless', 'Lambda', 'Firebase', 'Supabase', 'Vercel', 'Netlify', 'Heroku', 'DigitalOcean', 'Cloudflare', 'Webpack', 'Rollup', 'Vite', 'Babel', 'ESLint', 'Prettier', 'Jest', 'Cypress', 'Playwright', 'Tailwind', 'Bootstrap', 'Sass', 'Less', 'PostCSS', 'Figma', 'Sketch', 'Adobe', 'Photoshop', 'Illustrator', 'InDesign', 'Premiere', 'macOS', 'iOS', 'Android', 'Windows', 'Linux', 'Ubuntu', 'CentOS', 'Debian', 'Fedora', 'RHEL', 'SUSE', 'OpenSUSE', 'FreeBSD', 'NetBSD', 'OpenBSD', 'Solaris', 'AIX', 'HP-UX', 'Tru64', 'IRIX', 'UnixWare', 'SCO', 'QNX', 'VxWorks', 'RTEMS', 'FreeRTOS', 'Zephyr', 'Mbed', 'Arduino', 'Raspberry', 'BeagleBone', 'NVIDIA', 'AMD', 'Intel', 'ARM', 'RISC-V', 'x86', 'x64', 'PowerPC', 'SPARC', 'MIPS', 'Itanium', 'Alpha', 'PA-RISC', 'S390', 'z/OS', 'MVS', 'VM/CMS', 'CICS', 'IMS', 'DB2', 'Oracle', 'Sybase', 'Informix', 'Teradata', 'Snowflake', 'BigQuery', 'Redshift', 'Athena', 'Presto', 'Trino', 'Spark', 'Hadoop', 'Kafka', 'RabbitMQ', 'ActiveMQ', 'ZeroMQ', 'NATS', 'Pulsar', 'Kinesis', 'SQS', 'SNS', 'S3', 'DynamoDB', 'CosmosDB', 'Cassandra', 'CouchDB', 'Neo4j', 'ArangoDB', 'OrientDB', 'TigerGraph', 'JanusGraph', 'Neptune', 'Gremlin', 'Cypher', 'SPARQL', 'GraphQL'
    ];
    
    for (const word of commonWords) {
      wordSet.add(word.toLowerCase());
    }
    
    console.log(`   ✅ Total words: ${wordSet.size}`);
    
    // Initialize SymSpell for suggestions
    try {
      console.log('   Initializing SymSpell...');
      const { SymSpellEx, MemoryStore } = await import('symspell-ex');
      const store = new MemoryStore();
      symSpell = new SymSpellEx(store, undefined, undefined, 2, 5);
      
      await symSpell.initialize();
      
      // Load frequency data for better suggestions
      const freqText = await loadTextAsset('dict/en_US_frequency.txt');
      const freqLines = freqText.split('\n').slice(0, 5000); // Top 5000 most frequent
      
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
      
      console.log('   ✅ SymSpell initialized with frequency data');
    } catch (error: any) {
      console.warn('   ⚠️ SymSpell failed, using fallback suggestions:', error.message);
      symSpell = null;
    }
    
    isInitialized = true;
    console.log('✅ Fixed Spell Checker initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Fixed Spell Checker:', error);
    return false;
  }
}

/**
 * Check if a word is spelled correctly
 */
export function isWordCorrect(word: string): boolean {
  if (!isInitialized || !wordSet) return true; // If not initialized, assume correct
  
  const cleanWord = word.toLowerCase().trim();
  
  // Skip very short words, numbers, or mixed content
  if (cleanWord.length <= 1 || /\d/.test(cleanWord) || !/^[a-z]+$/i.test(cleanWord)) {
    return true;
  }
  
  return wordSet.has(cleanWord);
}

/**
 * Get spelling suggestions for a word
 */
export async function getSpellingSuggestions(word: string): Promise<string[]> {
  if (!isInitialized) return [];
  
  const cleanWord = word.toLowerCase().trim();
  
  // Special case corrections for common typos
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
    'sentance': ['sentence'],
    'erors': ['errors']
  };
  
  if (commonCorrections[cleanWord]) {
    return commonCorrections[cleanWord];
  }
  
  // Try SymSpell if available
  if (symSpell && symSpell.lookup) {
    try {
      const suggestions = await symSpell.lookup(cleanWord, 2);
      const results = suggestions
        .map((s: any) => s.term || s.word || s)
        .filter((s: string) => s && s !== cleanWord)
        .slice(0, 5);
      
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      // Fall through to simple suggestions
    }
  }
  
  // Simple edit distance suggestions
  const suggestions: Array<{word: string, distance: number}> = [];
  const maxWords = Math.min(wordList.length, 2000); // Limit for performance
  
  for (let i = 0; i < maxWords; i++) {
    const dictWord = wordList[i];
    if (Math.abs(dictWord.length - cleanWord.length) > 2) continue;
    
    const distance = simpleEditDistance(cleanWord, dictWord);
    if (distance <= 2 && distance > 0) {
      suggestions.push({ word: dictWord, distance });
    }
    
    if (suggestions.length >= 10) break;
  }
  
  return suggestions
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .map(s => s.word);
}

/**
 * Check spelling of entire text and return issues
 */
export async function fixedSpellingIssues(text: string): Promise<any[]> {
  if (!isInitialized) {
    await initFixedSpeller();
  }
  
  try {
    const words = text.match(/\b[a-zA-Z]+\b/g) || [];
    const issues: any[] = [];
    const processedPositions = new Set<number>();
    
    for (const word of words) {
      if (isWordCorrect(word)) continue;
      
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
      
      const suggestions = await getSpellingSuggestions(word);
      
      issues.push({
        category: 'spelling' as const,
        message: `"${word}" may be misspelled`,
        offset: position,
        length: word.length,
        suggestions
      });
    }
    
    return issues;
    
  } catch (error) {
    console.warn('Fixed spell check failed:', error);
    return [];
  }
}

/**
 * Simple edit distance calculation
 */
function simpleEditDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
  
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }
  
  return matrix[a.length][b.length];
}

/**
 * Fixed SpellChecker class
 */
export class FixedSpellChecker {
  private isInitialized = false;
  private options: InitOptions = {};

  async initialize(options: InitOptions = {}): Promise<boolean> {
    if (this.isInitialized) return true;
    
    this.options = options;
    const success = await initFixedSpeller();
    this.isInitialized = success;
    return success;
  }

  async checkSpelling(text: string): Promise<Issue[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const rawIssues = await fixedSpellingIssues(text);
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
        id: 'SPELLING_ERROR',
        description: 'Possible spelling mistake'
      },
      context: {
        text: text.slice(Math.max(0, issue.offset - 20), issue.offset + issue.length + 20),
        offset: Math.max(0, issue.offset - 20),
        length: Math.min(text.length, issue.length + 40)
      },
      source: 'fixed-spell-checker'
    }));
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasHunspell: false, // We're not using broken hunspell-asm
      hasFrequencyData: !!symSpell,
      dictionarySize: wordSet?.size || 0
    };
  }

  cleanup(): void {
    this.isInitialized = false;
  }
} 