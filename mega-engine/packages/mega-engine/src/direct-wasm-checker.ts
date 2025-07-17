/**
 * Direct WASM Checker - A simplified approach that works directly with the WASM module
 * This bypasses the complex singleton pattern and uses the same approach as the direct test
 */

import { nodeWasmLoader } from '../dist/node-wasm-loader.js';
import fs from 'fs';
import path from 'path';

export class DirectWasmChecker {
  static wasmModule: any = null;
  static isInitialized = false;
  static initPromise: Promise<void> | null = null;
  static initAttempts = 0;

  /**
   * Initialize the WASM module
   */
  static async init(): Promise<void> {
    if (this.isInitialized && this.wasmModule) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this._doInit();
    try {
      await this.initPromise;
    } catch (error) {
      console.error('[DirectWasmChecker] Initialization failed:', error);
      // Reset state on failure
      this.wasmModule = null;
      this.isInitialized = false;
    } finally {
      this.initPromise = null;
    }
  }
  
  static async _doInit(): Promise<void> {
    try {
      this.initAttempts++;
      console.log(`[DirectWasmChecker] Loading WASM module (attempt ${this.initAttempts})...`);
      
      // Force a fresh load every time to avoid memory context issues
      this.wasmModule = null;
      this.isInitialized = false;
      
      // Load WASM module directly
      this.wasmModule = await nodeWasmLoader.loadWasmModule(
        './nlp/pkg/nlprule_wasm_bg.wasm',
        './nlp/pkg/nlprule_wasm_node.js',
        {}
      );
      
      if (!this.wasmModule || !this.wasmModule.NlpRuleChecker) {
        throw new Error('Failed to load WASM module or NlpRuleChecker not available');
      }
      
      console.log('[DirectWasmChecker] WASM module loaded successfully');
      console.log('[DirectWasmChecker] Available exports:', Object.keys(this.wasmModule));
      
      // Test the module
      await this._testModule();
      
      this.isInitialized = true;
      console.log('[DirectWasmChecker] Initialization complete');
      
    } catch (error) {
      console.error('[DirectWasmChecker] Initialization failed:', error);
      throw error;
    }
  }
  
  static async _testModule(): Promise<void> {
    let checker: any = null;
    try {
      console.log('[DirectWasmChecker] Testing module...');
      
      // Create a checker
      checker = this.wasmModule.NlpRuleChecker.new();
      console.log('[DirectWasmChecker] Checker created with ptr:', checker.__wbg_ptr);
      
      // Test with simple text
      const testText = 'The cats is hungry.';
      console.log('[DirectWasmChecker] Testing with:', testText);
      
      const result = checker.check(testText);
      console.log('[DirectWasmChecker] Check result:', result);
      
      if (Array.isArray(result) && result.length > 0) {
        console.log('[DirectWasmChecker] Grammar errors found:', result.map((r: any) => r.message || r));
      } else {
        console.warn('[DirectWasmChecker] No grammar errors detected');
      }
      
    } catch (error) {
      console.error('[DirectWasmChecker] Test failed:', error);
      throw error;
    } finally {
      // Clean up
      if (checker) {
        try {
          checker.free();
          console.log('[DirectWasmChecker] Test checker cleaned up');
        } catch (e) {
          console.error('[DirectWasmChecker] Error cleaning up test checker:', e);
        }
      }
    }
  }
  
  /**
   * Check text for grammar issues
   */
  static async check(text: string): Promise<any[]> {
    // Always ensure we're initialized
    if (!this.isInitialized || !this.wasmModule) {
      await this.init();
    }
    
    let checker: any = null;
    try {
      // Create a fresh checker for each check
      checker = this.wasmModule.NlpRuleChecker.new();
      console.log('[DirectWasmChecker] Created checker with ptr:', checker.__wbg_ptr);
      
      // Check the text
      const result = checker.check(text);
      console.log('[DirectWasmChecker] Check result:', result);
      
      return result || [];
      
    } catch (error: any) {
      console.error('[DirectWasmChecker] Check failed:', error);
      
      // If we get a null pointer error, try to reinitialize
      if (error.message && error.message.includes('null pointer passed to rust')) {
        console.log('[DirectWasmChecker] Null pointer error detected, reinitializing...');
        this.isInitialized = false;
        this.wasmModule = null;
        await this.init();
        return this.check(text); // Retry once
      }
      
      return [];
    } finally {
      // Clean up
      if (checker) {
        try {
          checker.free();
          console.log('[DirectWasmChecker] Checker cleaned up');
        } catch (e) {
          console.error('[DirectWasmChecker] Error cleaning up checker:', e);
        }
      }
    }
  }
}