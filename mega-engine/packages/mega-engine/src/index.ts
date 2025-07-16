/**
 * Mega Engine - The Ultimate Grammar Checking System
 * PHASE 1: Main entry point with reliable WASM loading, health monitoring, and structured logging
 * 
 * This is the main export file for the Mega Engine package.
 * It provides a clean API for grammar checking with multiple engines.
 */

// PHASE 1: Export new reliable components
export { ReliableWasmLoader } from './reliable-wasm-loader.js';
export { Logger } from './logger.js';
export { EngineHealthMonitor } from './engine-health-monitor.js';
export { StreamingAssetLoader } from './streaming-asset-loader.js';

// Main engine exports
export { MegaEngine, getMegaEngine } from './mega-engine.js';
export { NlpruleRealEngine } from './mega-engine-nlprule.js';

// Engine components
export { ProfessionalHunspellChecker } from './spell-checker-nspell.js';
export { StyleChecker } from './style-checker.js';

// Utility components
export { SmartCache } from './cache.js';

// PHASE 1: Export all types
export type {
  Issue,
  IssueCategory,
  CheckOptions,
  CheckResult,
  CheckStatistics,
  InitOptions,
  EngineStatus,
  StyleAnalysis,
  StyleSuggestion,
  // PHASE 1: New types
  WasmLoadStatus,
  EngineHealth,
  HealthReport,
  CacheStats,
  AssetCacheStats,
  SystemHealthStatus,
  LogLevel,
  LogEntry,
  AssetLoadOptions,
  AssetLoadResult,
  WasmLoadOptions,
  WasmLoadResult
} from './types.js';

// PHASE 1: Convenience function for quick initialization
export async function createMegaEngine(options: import('./types.js').InitOptions = {}): Promise<import('./mega-engine.js').MegaEngine> {
  const { getMegaEngine } = await import('./mega-engine.js');
  const engine = getMegaEngine();
  await engine.init(options);
  return engine;
}

// PHASE 1: Quick check function for simple use cases
export async function quickCheck(text: string, options: import('./types.js').CheckOptions = {}): Promise<import('./types.js').CheckResult> {
  const { getMegaEngine } = await import('./mega-engine.js');
  const engine = getMegaEngine();
  await engine.init();
  return await engine.check(text, options);
}

// PHASE 1: Health check function
export function getSystemHealth(): import('./types.js').SystemHealthStatus {
  const { getMegaEngine } = require('./mega-engine.js');
  const engine = getMegaEngine();
  return engine.getSystemHealthStatus();
}

// PHASE 1: Default export for backward compatibility
export { MegaEngine as default } from './mega-engine.js';
