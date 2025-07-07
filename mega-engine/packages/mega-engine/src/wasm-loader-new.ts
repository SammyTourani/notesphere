/**
 * WASM Loader for nlprule
 * Handles proper WASM initialization for both browser and Node.js environments
 */

import type { WasmEngineStatus } from './types.js';

export class WasmLoader {
  private isLoaded = false;
  private isLoading = false;
  private wasmModule: any = null;
  private NlpRuleChecker: any = null;
  private loadPromise: Promise<{ NlpRuleChecker: any }> | null = null;
  private wasmBinaryCache: ArrayBuffer | null = null;

  /**
   * Load and initialize the WASM module
   */
  async load(): Promise<{ NlpRuleChecker: any }> {
    // Return existing promise if already loading
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Return cached result if already loaded
    if (this.isLoaded && this.NlpRuleChecker) {
      return { NlpRuleChecker: this.NlpRuleChecker };
    }

    // Start loading process
    this.isLoading = true;
    this.loadPromise = this._doLoad();
    
    try {
      const result = await this.loadPromise;
      this.isLoaded = true;
      this.isLoading = false;
      return result;
    } catch (error) {
      this.isLoading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  /**
   * Internal load implementation
   */
  private async _doLoad(): Promise<{ NlpRuleChecker: any }> {
    try {
      console.log('🔄 Loading nlprule WASM module...');
      
      // For now, throw an error since WASM loading is complex
      // We'll implement this step by step
      throw new Error('WASM loading not yet implemented - using fallback engines');

    } catch (error) {
      console.error('❌ Failed to load nlprule WASM module:', error);
      throw new Error(`WASM loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the current status of the WASM loader
   */
  getStatus(): WasmEngineStatus {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      hasChecker: this.NlpRuleChecker !== null,
      wasmSize: this.wasmBinaryCache?.byteLength
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.wasmModule = null;
    this.NlpRuleChecker = null;
    this.wasmBinaryCache = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
    console.log('🗑️ WASM Loader disposed');
  }
}

// Export both class and singleton instance
export default WasmLoader;
export const wasmLoader = new WasmLoader();
