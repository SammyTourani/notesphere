/**
 * Test the nlprule WASM module directly
 */

import fs from 'fs';
import path from 'path';

async function testNlpruleWasm() {
  try {
    console.log('🧪 Testing nlprule WASM directly...');
    
    // Load the WASM module
    const wasmPath = path.resolve('./mega-engine/packages/mega-engine/dist/nlp/pkg/nlprule_wasm_bg.wasm');
    const jsPath = path.resolve('./mega-engine/packages/mega-engine/dist/nlp/pkg/nlprule_wasm_node.js');
    
    console.log('📦 Loading WASM module from:', wasmPath);
    console.log('📦 Loading JS module from:', jsPath);
    
    // Load the JS module
    const jsModule = await import(jsPath);
    console.log('📦 JS module loaded:', Object.keys(jsModule));
    
    // Load the WASM binary
    const wasmBinary = fs.readFileSync(wasmPath);
    console.log('📦 WASM binary loaded:', wasmBinary.length, 'bytes');
    
    // Instantiate the WASM module
    const { instance } = await WebAssembly.instantiate(wasmBinary, {
      './nlprule_wasm_bg.js': jsModule
    });
    
    console.log('📦 WASM instance created:', Object.keys(instance.exports));
    
    // Set up the WASM instance in the JS module
    if (jsModule.__wbg_set_wasm) {
      jsModule.__wbg_set_wasm(instance.exports);
      console.log('📦 WASM instance set in JS module');
    }
    
    // Initialize any required functions
    if (jsModule.__wbindgen_init_externref_table) {
      jsModule.__wbindgen_init_externref_table();
      console.log('📦 WASM externref table initialized');
    }
    
    // Create a checker
    const checker = jsModule.NlpRuleChecker.new();
    console.log('📦 Checker created with ptr:', checker.__wbg_ptr);
    
    // Test with simple text
    const testText = 'The cats is hungry.';
    console.log('🧪 Testing with:', testText);
    
    const result = checker.check(testText);
    console.log('✅ Check result:', result);
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('🎯 Grammar errors found:', result.map(r => r.message || r));
    } else {
      console.log('⚠️ No grammar errors detected');
    }
    
    // Clean up
    checker.free();
    console.log('🧹 Checker cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNlpruleWasm();