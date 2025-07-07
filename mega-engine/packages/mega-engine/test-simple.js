#!/usr/bin/env node

/**
 * Simple test script for the Mega Grammar Engine
 */

import { MegaEngine } from './dist/index.js';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
  console.log('🚀 Testing Mega Grammar Engine...\n');

  // Test 1: Initialization
  console.log('📋 Test 1: Initializing engine...');
  const megaEngine = new MegaEngine();
  
  const assetsPath = resolve(__dirname, 'public');
  const initSuccess = await megaEngine.init({ assetsPath });

  if (initSuccess) {
    console.log('✅ Initialization: SUCCESS\n');
  } else {
    console.log('❌ Initialization: FAILED\n');
    return;
  }

  // Test 2: Engine Status
  console.log('📋 Test 2: Checking engine status...');
  const status = megaEngine.getStatus();
  console.log('✅ Status:', JSON.stringify(status, null, 2), '\n');

  // Test 3: Basic Grammar Check
  console.log('📋 Test 3: Testing basic grammar check...');
  const result1 = await megaEngine.check("This are a test sentence with error.");
  console.log(`✅ Found ${result1.issues.length} issues:`);
  result1.issues.forEach(issue => {
    console.log(`   - ${issue.category}: ${issue.message}`);
    console.log(`     Position: ${issue.offset}-${issue.offset + issue.length}`);
    console.log(`     Suggestions: ${issue.suggestions.join(', ')}`);
  });
  console.log();

  // Test 4: Spelling Check
  console.log('📋 Test 4: Testing spelling check...');
  const result2 = await megaEngine.check("This is a mispeled word test.");
  console.log(`✅ Found ${result2.issues.length} issues:`);
  result2.issues.forEach(issue => {
    console.log(`   - ${issue.category}: ${issue.message}`);
    console.log(`     Suggestions: ${issue.suggestions.join(', ')}`);
  });
  console.log();

  // Test 5: Style Check
  console.log('📋 Test 5: Testing style check...');
  const result3 = await megaEngine.check("The document was prepared by me and it was very, very complex and difficult to understand.");
  console.log(`✅ Found ${result3.issues.length} issues:`);
  result3.issues.forEach(issue => {
    console.log(`   - ${issue.category}: ${issue.message}`);
  });
  console.log();

  // Test 6: Category Filtering
  console.log('📋 Test 6: Testing category filtering...');
  const result4 = await megaEngine.check("This are a mispeled sentence.", {
    categories: ['spelling']
  });
  console.log(`✅ Spelling-only check found ${result4.issues.length} issues:`);
  result4.issues.forEach(issue => {
    console.log(`   - ${issue.category}: ${issue.message}`);
  });
  console.log();

  // Test 7: Performance Test
  console.log('📋 Test 7: Testing performance...');
  const longText = "This is a performance test. ".repeat(100);
  const startTime = Date.now();
  const result5 = await megaEngine.check(longText);
  const endTime = Date.now();
  console.log(`✅ Processed ${longText.length} characters in ${endTime - startTime}ms`);
  console.log(`   Found ${result5.issues.length} issues`);
  console.log();

  // Test 8: Engine Info
  console.log('📋 Test 8: Engine detailed information...');
  const info = megaEngine.getInfo();
  console.log('✅ Engine Info:', JSON.stringify(info, null, 2));
  console.log();

  console.log('🎉 All tests completed successfully!');
}

runTests();
