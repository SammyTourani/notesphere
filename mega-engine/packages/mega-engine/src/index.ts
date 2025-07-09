/**
 * @notesphere/mega-engine
 * 100% free, offline, production-ready grammar, spelling, and style checking engine
 */

import { megaEngine, MegaEngine } from './mega-engine.js';

// Re-export types
export type {
  Issue,
  CheckOptions,
  CheckResult,
  InitOptions,
  EngineStatus,
  IssueCategory,
  IssueSeverity,
  SpellCheckResult,
  StyleAnalysis,
  WasmEngineStatus,
  CacheEntry,
  CacheStats
} from './types.js';

// Re-export engine classes for advanced usage
export { MegaEngine } from './mega-engine.js';
export { SpellChecker } from './spell-checker.js';
export { StyleChecker } from './style-checker.js';
export { SmartCache } from './cache.js';

/**
 * Initialize the mega grammar engine
 * 
 * @param options - Initialization options
 * @returns Promise that resolves to true if successful
 * 
 * @example
 * ```typescript
 * // Basic initialization
 * await init();
 * 
 * // Custom initialization
 * await init({
 *   engines: {
 *     nlprule: true,
 *     hunspell: true,
 *     writeGood: false
 *   },
 *   debug: true
 * });
 * ```
 */
export async function init(options?: import('./types.js').InitOptions): Promise<boolean> {
  return megaEngine.init(options);
}

/**
 * Check text for grammar, spelling, and style issues
 * 
 * @param text - The text to check
 * @param options - Check options
 * @returns Promise with check results
 * 
 * @example
 * ```typescript
 * // Basic check
 * const result = await check("This are a test.");
 * console.log(result.issues); // Array of issues found
 * 
 * // Check specific categories
 * const result = await check("Hello world", {
 *   categories: ['spelling', 'grammar']
 * });
 * 
 * // Check with custom language
 * const result = await check("Hello world", {
 *   language: 'en-GB'
 * });
 * ```
 */
export async function check(text: string, options?: import('./types.js').CheckOptions): Promise<import('./types.js').CheckResult> {
  return megaEngine.check(text, options);
}

/**
 * Get the current status of the engine
 * 
 * @returns Engine status information
 */
export function getStatus(): import('./types.js').EngineStatus {
  return megaEngine.getStatus();
}

/**
 * Get detailed engine information including statistics
 * 
 * @returns Detailed engine information
 */
export function getInfo() {
  return megaEngine.getInfo();
}

/**
 * Reset all statistics and clear caches
 */
export function reset(): void {
  megaEngine.reset();
}

/**
 * Dispose of all resources and clean up
 */
export function dispose(): void {
  megaEngine.dispose();
}

// Export the default instance for direct use
export { megaEngine as engine };

// Default export for convenience
export default {
  init,
  check,
  getStatus,
  getInfo,
  reset,
  dispose,
  engine: megaEngine,
  MegaEngine
}

// Simple API will be added once grammar integration is complete
