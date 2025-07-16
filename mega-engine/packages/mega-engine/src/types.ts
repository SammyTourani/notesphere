/**
 * Type definitions for the Mega Engine system
 * PHASE 1: Enhanced types for reliable WASM loading, health monitoring, and structured logging
 */

export interface Issue {
  id: string;
  category: IssueCategory;
  severity: 'error' | 'warning' | 'info';
  priority: number;
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  suggestions?: string[];
  rule?: {
    id: string;
    description: string;
  };
  context?: {
    text: string;
    offset: number;
    length: number;
  };
  confidence?: number;
  source?: string;
  sourceEngines?: string[]; // PHASE 1: Track which engines found this issue
}

export type IssueCategory = 'grammar' | 'spelling' | 'style' | 'clarity' | 'inclusivity';

export interface CheckOptions {
  categories?: IssueCategory[];
  confidence?: number;
  maxIssues?: number;
  includeSuggestions?: boolean;
  includeContext?: boolean;
}

export interface CheckResult {
  issues: Issue[];
  statistics: CheckStatistics;
}

export interface CheckStatistics {
  engine: string;
  processingTime: number;
  textLength: number;
  wordsChecked: number;
  issuesFound: number;
  fromCache?: boolean;
  fallbackUsed?: boolean;
  // PHASE 1: Enhanced statistics
  enginesUsed?: number;
  engineContributions?: Record<string, number>;
  engineLatencies?: Record<string, number>;
  rawIssuesFound?: number;
  deduplicationEfficiency?: number;
  qualityScore?: number;
  breakdown?: Record<string, number>;
}

export interface InitOptions {
  assetsPath?: string;
  engines?: {
    nlprule?: boolean;
    hunspell?: boolean;
    symspell?: boolean;
    writeGood?: boolean;
    retext?: boolean;
  };
  debug?: boolean;
  cacheSize?: number;
  timeout?: number;
}

export interface EngineStatus {
  isInitialized: boolean;
  // PHASE 1: Enhanced engine status with health monitoring
  engines?: Record<string, {
    name: string;
    status: 'active' | 'inactive' | 'loading' | 'failed';
    health?: EngineHealth;
  }>;
  health?: 'healthy' | 'degraded' | 'critical';
}

export interface StyleAnalysis {
  readabilityScore: number;
  suggestions: StyleSuggestion[];
}

export interface StyleSuggestion {
  type: 'clarity' | 'simplify' | 'style';
  message: string;
  position: {
    start: number;
    end: number;
  };
}

// PHASE 1: New types for reliable WASM loading and health monitoring

export interface WasmLoadStatus {
  isLoaded: boolean;
  isLoading: boolean;
  loadAttempts: number;
  lastLoadTime: number;
  hasChecker: boolean;
  error?: string;
}

export interface EngineHealth {
  successCount: number;
  failureCount: number;
  lastSuccess?: number;
  lastFailure?: number;
  lastError?: string;
  averageResponseTime?: number;
  status: 'healthy' | 'degraded' | 'critical';
}

export interface HealthReport {
  overall: 'healthy' | 'degraded' | 'critical';
  engines: Map<string, EngineHealth>;
  criticalIssues: string[];
  recommendations: string[];
  timestamp: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage?: number;
}

export interface AssetCacheStats {
  memoryCache: CacheStats;
  persistentCache: CacheStats;
  totalAssets: number;
  totalSize: number;
}

export interface SystemHealthStatus {
  engines: {
    nlprule: {
      status: 'loaded' | 'loading' | 'failed' | 'not-loaded';
      loadAttempts?: number;
      lastLoadTime?: number;
      hasChecker?: boolean;
      health?: EngineHealth;
      wasmStatus?: WasmLoadStatus;
    };
    hunspell: {
      status: 'loaded' | 'failed' | 'not-loaded';
      health?: EngineHealth;
    };
    styleChecker: {
      status: 'loaded' | 'failed' | 'not-loaded';
      health?: EngineHealth;
    };
  };
  health: {
    overall: 'healthy' | 'degraded' | 'critical';
    criticalIssues: string[];
    recommendations: string[];
  };
  cache: {
    grammarCache: CacheStats;
    assetCache: AssetCacheStats;
  };
  wasm: {
    loadAttempts: number;
    lastLoadTime: number;
    status?: WasmLoadStatus;
  };
  stats: {
    totalChecks: number;
    averageTime: number;
    engineUsage: Record<string, number>;
  };
  timestamp: number;
}

// PHASE 1: Logger types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

// PHASE 1: Asset loading types
export interface AssetLoadOptions {
  timeout?: number;
  retries?: number;
  useCache?: boolean;
  streaming?: boolean;
}

export interface AssetLoadResult {
  data: any;
  size: number;
  loadTime: number;
  fromCache: boolean;
  url: string;
}

// PHASE 1: WASM loader types
export interface WasmLoadOptions {
  timeout?: number;
  retries?: number;
  fallbackStrategies?: string[];
  validateChecksum?: boolean;
}

export interface WasmLoadResult {
  module: any;
  loadTime: number;
  strategy: string;
  checksum?: string;
}
