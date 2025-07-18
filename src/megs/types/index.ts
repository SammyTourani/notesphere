/**
 * Core type definitions for the Multi-Engine Grammar System (MEGS)
 * Based on the AUTHORITATIVE_BLUEPRINT.md specifications
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum IssueType {
  GRAMMAR = 'grammar',
  SPELLING = 'spelling',
  STYLE = 'style',
  PUNCTUATION = 'punctuation',
  CONTEXT = 'context'
}

export enum IssueSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  SUGGESTION = 'suggestion',
  INFO = 'info'
}

export enum EngineCapability {
  GRAMMAR = 'grammar',
  SPELLING = 'spelling',
  STYLE = 'style',
  PUNCTUATION = 'punctuation',
  ADVANCED_CONTEXT = 'advanced_context',
  MULTILINGUAL = 'multilingual'
}

export enum ErrorType {
  INITIALIZATION_ERROR = 'initialization_error',
  ENGINE_ERROR = 'engine_error',
  TIMEOUT_ERROR = 'timeout_error',
  WORKER_ERROR = 'worker_error',
  RESOURCE_ERROR = 'resource_error',
  CONFIGURATION_ERROR = 'configuration_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export type DeduplicationStrategy = 'strict' | 'overlap' | 'semantic';
export type FallbackStrategy = 'continue' | 'degrade' | 'fail';
export type ProcessPriority = 'speed' | 'accuracy' | 'balanced';
export type EngineMode = 'offline' | 'online';

// ============================================================================
// CORE DATA MODELS
// ============================================================================

export interface TextRange {
  start: number;
  end: number;
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
}

export interface Suggestion {
  text: string;
  confidence: number;
  explanation?: string;
}

export interface GrammarIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  category: string;
  message: string;
  explanation?: string;
  suggestions: Suggestion[];
  range: TextRange;
  source: string; // Engine ID
  confidence: number;
  ignored: boolean;
}

export interface ResultMetadata {
  processingTime: number;
  enginesUsed: string[];
  timestamp: number;
  cacheHit: boolean;
  version: string;
}

export interface GrammarResult {
  issues: GrammarIssue[];
  metadata: ResultMetadata;
  text: string;
  language: string;
}

// ============================================================================
// ENGINE INTERFACES
// ============================================================================

export interface EngineTextRange {
  start: number;
  end: number;
  context?: string;
}

export interface EngineSuggestion {
  text: string;
  confidence?: number;
}

export interface EngineIssue {
  id: string;
  type: string;
  category: string;
  message: string;
  explanation?: string;
  suggestions: EngineSuggestion[];
  range: EngineTextRange;
  confidence?: number;
  ruleId?: string;
}

export interface EngineMetadata {
  processingTime: number;
  version: string;
  ruleCount?: number;
  language: string;
}

export interface EngineResult {
  engineId: string;
  issues: EngineIssue[];
  metadata: EngineMetadata;
}

export interface EngineOptions {
  language?: string;
  domain?: string;
  timeout?: number;
  rules?: RuleConfig[];
}

export interface EngineStatus {
  id: string;
  name: string;
  initialized: boolean;
  healthy: boolean;
  lastError?: string;
  processingCount: number;
  averageProcessingTime: number;
}

export interface GrammarEngine {
  id: string;
  name: string;
  version: string;
  capabilities: EngineCapability[];
  mode: EngineMode; // Engine mode tag for graceful offline behavior
  initialize(): Promise<void>;
  process(text: string, options?: EngineOptions): Promise<EngineResult>;
  shutdown(): Promise<void>;
  getStatus(): EngineStatus;
}

// ============================================================================
// CONFIGURATION MODELS
// ============================================================================

export interface RuleConfig {
  id: string;
  enabled: boolean;
  category: string;
  severity?: IssueSeverity;
}

export interface EngineConfig {
  id: string;
  enabled: boolean;
  priority: number;
  options?: Record<string, any>;
}

export interface GlobalConfig {
  concurrency: number;
  timeout: number;
  defaultLanguage: string;
  fallbackStrategy: FallbackStrategy;
}

export interface CacheConfig {
  enabled: boolean;
  maxSize: number;
  ttl: number;
}

export interface MegsConfig {
  engines: EngineConfig[];
  global: GlobalConfig;
  rules: RuleConfig[];
  cache: CacheConfig;
}

// ============================================================================
// ORCHESTRATOR INTERFACES
// ============================================================================

export interface ProcessOptions {
  engines?: string[];
  priority?: ProcessPriority;
  timeout?: number;
  language?: string;
  domain?: string;
}

export interface OrchestratorConfig {
  concurrency: number;
  timeout: number;
  engineTimeouts: { [engineId: string]: number }; // Per-engine defaults (nlprule:200ms, hunspell:100ms, vale:300ms)
  engineRetries: { [engineId: string]: number }; // Per-engine retry counts
  cacheEnabled: boolean;
  cacheSize: number;
  priorityEngines?: string[];
  fallbackStrategy: FallbackStrategy;
  initSequence: string[]; // Defines the initialization order (WASM → Hunspell → Style → ML)
}

export interface Orchestrator {
  initialize(config: OrchestratorConfig): Promise<void>;
  process(text: string, options?: ProcessOptions): Promise<GrammarResult>;
  registerEngine(engine: GrammarEngine): void;
  unregisterEngine(engineId: string): void;
  getStatus(): EngineStatus[];
}

// ============================================================================
// RESULTS CONSOLIDATION INTERFACES
// ============================================================================

export interface PriorityRule {
  engineId: string;
  category: string;
  priority: number;
}

export interface ResultsConsolidator {
  consolidate(results: EngineResult[]): GrammarResult;
  setDeduplicationStrategy(strategy: DeduplicationStrategy): void;
  setPriorityRules(rules: PriorityRule[]): void;
}

// ============================================================================
// CACHE INTERFACES
// ============================================================================

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  efficiency: number;
}

export interface CacheManager {
  get(key: string): Promise<GrammarResult | null>;
  set(key: string, result: GrammarResult): Promise<void>;
  invalidate(key: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): CacheStats;
}

// ============================================================================
// WORKER POOL INTERFACES
// ============================================================================

export interface WorkerTask {
  type: string;
  priority: number;
  timeout?: number;
}

export interface WorkerStatus {
  id: number;
  busy: boolean;
  taskCount: number;
  lastTaskDuration: number;
}

export interface WorkerPool {
  initialize(count: number): Promise<void>;
  execute<T>(task: WorkerTask, data: any): Promise<T>;
  terminate(): void;
  getStatus(): WorkerStatus[];
}

// ============================================================================
// INTEGRATION API INTERFACES
// ============================================================================

export interface CheckOptions {
  language?: string;
  domain?: string;
  priority?: ProcessPriority;
  categories?: string[];
  customRules?: RuleConfig[];
}

export interface Correction {
  issueId: string;
  suggestionIndex: number;
  originalText: string;
  correctedText: string;
  range: TextRange;
}

export interface EngineInfo {
  id: string;
  name: string;
  version: string;
  capabilities: EngineCapability[];
  mode: EngineMode;
  enabled: boolean;
}

export interface MegsStatus {
  initialized: boolean;
  engines: EngineInfo[];
  performance: {
    averageProcessingTime: number;
    cacheHitRate: number;
    totalProcessed: number;
  };
  health: {
    healthy: boolean;
    issues: string[];
  };
}

export interface MegsApi {
  check(text: string, options?: CheckOptions): Promise<GrammarResult>;
  applyCorrection(correction: Correction): string;
  getEngines(): EngineInfo[];
  configure(config: MegsConfig): void; // Must apply new rules/dicts at runtime (hot-reload support)
  getStatus(): MegsStatus;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface MegsError extends Error {
  type: ErrorType;
  message: string;
  engineId?: string;
  recoverable: boolean;
  details?: any;
}

export class MegsErrorImpl extends Error implements MegsError {
  public readonly type: ErrorType;
  public readonly engineId?: string;
  public readonly recoverable: boolean;
  public readonly details?: any;
  public cause?: Error;

  constructor(
    type: ErrorType,
    message: string,
    options: {
      engineId?: string;
      recoverable?: boolean;
      details?: any;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'MegsError';
    this.type = type;
    this.engineId = options.engineId;
    this.recoverable = options.recoverable ?? true;
    this.details = options.details;
    
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}