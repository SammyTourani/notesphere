/**
 * Core types for the Mega Grammar Engine
 */

export type IssueCategory = 
  | 'spelling' 
  | 'grammar' 
  | 'style' 
  | 'punctuation' 
  | 'clarity' 
  | 'inclusivity'
  | 'readability'
  | 'other';

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface Issue {
  /** Unique identifier for this issue */
  id: string;
  
  /** Human-readable message describing the issue */
  message: string;
  
  /** Short version of the message */
  shortMessage?: string;
  
  /** Start position in the text (0-based) */
  offset: number;
  
  /** Length of the problematic text */
  length: number;
  
  /** Category of the issue */
  category: IssueCategory;
  
  /** Severity level */
  severity: IssueSeverity;
  
  /** Priority for sorting (1 = highest) */
  priority: number;
  
  /** Suggested replacements */
  suggestions: string[];
  
  /** Rule that triggered this issue */
  rule: {
    id: string;
    description: string;
    category?: string;
  };
  
  /** Context around the issue */
  context: {
    text: string;
    offset: number;
    length: number;
  };
  
  /** Engine that detected this issue */
  source: string;
}

export interface CheckOptions {
  /** Language code (default: 'en-US') */
  language?: string;
  
  /** Categories to check (default: all) */
  categories?: IssueCategory[];
  
  /** Enable caching (default: true) */
  enableCache?: boolean;
  
  /** Maximum processing time in ms (default: 30000) */
  timeout?: number;
  
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

export interface CheckResult {
  /** Array of detected issues */
  issues: Issue[];
  
  /** Processing statistics */
  statistics: {
    /** Engine used for checking */
    engine: string;
    
    /** Processing time in milliseconds */
    processingTime: number;
    
    /** Length of text checked */
    textLength: number;
    
    /** Number of words checked */
    wordsChecked: number;
    
    /** Number of issues found */
    issuesFound: number;
    
    /** Whether results came from cache */
    fromCache?: boolean;
    
    /** Whether fallback engine was used */
    fallbackUsed?: boolean;
  };
}

export interface EngineStatus {
  /** Whether engine is initialized */
  isInitialized: boolean;
  
  /** Whether engine is ready to use */
  isReady: boolean;
  
  /** Engine capabilities */
  capabilities: IssueCategory[];
  
  /** Supported languages */
  languages: string[];
  
  /** Performance statistics */
  stats: {
    totalChecks: number;
    averageTime: number;
    cacheHitRate: number;
  };
}

export interface InitOptions {
  /** Base path for assets (default: './public') */
  assetsPath?: string;
  
  /** Enable specific engines */
  engines?: {
    nlprule?: boolean;
    hunspell?: boolean;
    symspell?: boolean;
    writeGood?: boolean;
    retext?: boolean;
  };
  
  /** Custom dictionary files */
  customDictionaries?: string[];
  
  /** Enable debug logging */
  debug?: boolean;
}

// Engine-specific types
export interface WasmEngineStatus {
  isLoaded: boolean;
  isLoading: boolean;
  hasChecker: boolean;
  wasmSize?: number;
}

export interface SpellCheckResult {
  word: string;
  isCorrect: boolean;
  suggestions: string[];
  position: {
    start: number;
    end: number;
  };
}

export interface StyleAnalysis {
  readabilityScore: number;
  suggestions: {
    type: 'simplify' | 'clarity' | 'inclusivity' | 'readability';
    message: string;
    position: {
      start: number;
      end: number;
    };
  }[];
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  memoryUsage?: number;
}
