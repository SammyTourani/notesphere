/**
 * Test the DirectWasmChecker
 */

import { DirectWasmChecker } from './mega-engine/packages/mega-engine/dist/direct-wasm-checker.js';

async function testDirectChecker() {
  try {
    console.log('🧪 Testing DirectWasmChecker...');
    
    // Initialize the DirectWasmChecker
    await DirectWasmChecker.init();
    
    // Test with simple text
    const testText = 'The cats is hungry.';
    console.log('🧪 Testing with:', testText);
    
    const result = await DirectWasmChecker.check(testText);
    console.log('✅ Check result:', result);
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('🎯 Grammar errors found:', result.map(r => r.message || r));
    } else {
      console.log('⚠️ No grammar errors detected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectChecker();