/**
 * Direct WASM Checker - A simplified approach that works directly with the WASM module
 * This bypasses the complex singleton pattern and uses the same approach as the direct test
 */

import { nodeWasmLoader } from '../dist/node-wasm-loader.js';

export class DirectWasmChecker {
  static wasmModule = null;
  static isInitialized = false;
  static initPromise = null;

  /**
   * Initialize the WASM module
   */
  static async init() {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this._doInit();
    await this.initPromise;
    this.initPromise = null;
  }
  
  static async _doInit() {
    try {
      console.log('[DirectWasmChecker] Loading WASM module...');
      
      // Load WASM module directly
      this.wasmModule = await nodeWasmLoader.loadWasmModule(
        './nlp/pkg/nlprule_wasm_bg.wasm',
        './nlp/pkg/nlprule_wasm_node.js',
        {}
      );
      
      console.log('[DirectWasmChecker] WASM module loaded successfully');
      
      // Test the module
      await this._testModule();
      
      this.isInitialized = true;
      console.log('[DirectWasmChecker] Initialization complete');
      
    } catch (error) {
      console.error('[DirectWasmChecker] Initialization failed:', error);
      throw error;
    }
  }
  
  static async _testModule() {
    try {
      console.log('[DirectWasmChecker] Testing module...');
      
      // Create a checker
      const checker = this.wasmModule.NlpRuleChecker.new();
      console.log('[DirectWasmChecker] Checker created with ptr:', checker.__wbg_ptr);
      
      // Test with simple text
      const testText = 'The cats is hungry.';
      console.log('[DirectWasmChecker] Testing with:', testText);
      
      const result = checker.check(testText);
      console.log('[DirectWasmChecker] Check result:', result);
      
      if (Array.isArray(result) && result.length > 0) {
        console.log('[DirectWasmChecker] Grammar errors found:', result.map(r => r.message || r));
      } else {
        console.warn('[DirectWasmChecker] No grammar errors detected');
      }
      
      // Clean up
      checker.free();
      console.log('[DirectWasmChecker] Test checker cleaned up');
      
    } catch (error) {
      console.error('[DirectWasmChecker] Test failed:', error);
      throw error;
    }
  }
  
  /**
   * Check text for grammar issues
   */
  static async check(text) {
    if (!this.isInitialized) {
      await this.init();
    }
    
    try {
      // Create a fresh checker for each check
      const checker = this.wasmModule.NlpRuleChecker.new();
      console.log('[DirectWasmChecker] Created checker with ptr:', checker.__wbg_ptr);
      
      // Check the text
      const result = checker.check(text);
      console.log('[DirectWasmChecker] Check result:', result);
      
      // Clean up
      checker.free();
      console.log('[DirectWasmChecker] Checker cleaned up');
      
      return result || [];
      
    } catch (error) {
      console.error('[DirectWasmChecker] Check failed:', error);
      return [];
    }
  }
}