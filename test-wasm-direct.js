/**
 * Direct WASM test to isolate the issue
 */

import { nodeWasmLoader } from './mega-engine/packages/mega-engine/dist/node-wasm-loader.js';
import fs from 'fs';
import path from 'path';

async function testWasmDirect() {
  try {
    console.log('🧪 Testing WASM module directly...');
    
    // Load dictionary
    const dictPath = path.resolve('./mega-engine/packages/mega-engine/dist/nlp/pkg/en.bin');
    console.log('📚 Loading dictionary from:', dictPath);
    const dictBuffer = fs.readFileSync(dictPath);
    console.log('📚 Dictionary loaded:', dictBuffer.length, 'bytes');
    
    // Load WASM module
    console.log('🔧 Loading WASM module...');
    const wasmModule = await nodeWasmLoader.loadWasmModule(
      './nlp/pkg/nlprule_wasm_bg.wasm',
      './nlp/pkg/nlprule_wasm_node.js',
      { dictBuffer }
    );
    
    console.log('✅ WASM module loaded');
    console.log('📋 Available exports:', Object.keys(wasmModule));
    
    // Test creating a checker
    console.log('🔧 Creating checker...');
    const checker = wasmModule.NlpRuleChecker.new();
    console.log('✅ Checker created with ptr:', checker.__wbg_ptr);
    
    // Test with simple text
    const testText = 'The cats is hungry.';
    console.log('🧪 Testing with:', testText);
    
    try {
      const result = checker.check(testText);
      console.log('✅ Check result:', result);
      
      if (Array.isArray(result) && result.length > 0) {
        console.log('🎯 Grammar errors found:', result.map(r => r.message || r));
      } else {
        console.log('⚠️ No grammar errors detected');
      }
    } catch (error) {
      console.error('❌ Check failed:', error.message);
    }
    
    // Clean up
    checker.free();
    console.log('🧹 Checker cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWasmDirect();