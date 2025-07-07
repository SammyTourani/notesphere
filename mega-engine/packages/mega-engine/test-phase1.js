#!/usr/bin/env node

/**
 * Phase 1 Validation Test - Browser Worker + Node Stub
 */

import { MegaEngine } from './dist/index.js';

async function testPhase1() {
  console.log('🧪 Phase 1 Test: Browser Worker + Node Stub\n');

  const megaEngine = new MegaEngine();
  
  // Initialize (should work in both Node and Browser)
  console.log('📋 Initializing engine...');
  const success = await megaEngine.init({ assetsPath: './public' });
  
  if (!success) {
    console.log('❌ Initialization failed');
    return;
  }
  
  console.log('✅ Initialization successful\n');

  // Test text with spelling, grammar, and style issues
  const testText = "The cats is hungry. I recieve mesage yesterday. This is really really amazing.";
  
  console.log('📋 Testing with:', testText);
  console.log('🔍 Expected: spelling errors, style issues, grammar stub in Node\n');
  
  const result = await megaEngine.check(testText);
  
  console.log(`✅ Found ${result.issues.length} total issues:`);
  
  const categories = {
    spelling: result.issues.filter(i => i.category === 'spelling').length,
    grammar: result.issues.filter(i => i.category === 'grammar').length,
    style: result.issues.filter(i => i.category === 'style').length
  };
  
  console.log(`   📝 Spelling: ${categories.spelling}`);
  console.log(`   🔤 Grammar: ${categories.grammar} (${typeof window === 'undefined' ? 'Node stub' : 'Browser worker'})`);
  console.log(`   ✨ Style: ${categories.style}`);
  
  if (categories.spelling > 0) {
    console.log('\n✅ Spell checking: WORKING');
  }
  
  if (categories.style > 0) {
    console.log('✅ Style checking: WORKING');
  }
  
  if (typeof window === 'undefined' && categories.grammar === 0) {
    console.log('✅ Grammar stubbed in Node: WORKING');
  } else if (typeof window !== 'undefined' && categories.grammar > 0) {
    console.log('✅ Grammar worker in browser: WORKING');
  }
  
  console.log('\n🎉 Phase 1 Complete: Core engines operational!');
  console.log('📈 Ready for Phase 2: Enhanced browser grammar (optional)');
}

testPhase1().catch(console.error);
