/**
 * Browser-specific tests for the mega grammar engine
 * These tests run only in browser environment to verify WASM worker functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { init, check } from './index.js';
import { initGrammar, grammarIssues } from './wasm-grammar-engine.js';

describe('Browser Grammar Engine Tests', () => {
  beforeAll(async () => {
    // Skip if running in Node.js
    if (typeof window === 'undefined') {
      console.log('⏭️ Skipping browser tests in Node.js environment');
      return;
    }

    console.log('🌐 Running browser-specific tests');
    
    // Initialize the full engine
    await init({
      engines: {
        nlprule: true,
        hunspell: true,
        symspell: true,
        writeGood: true,
        retext: true
      }
    });
  });

  it('browser worker returns real nlprule issues', async () => {
    if (typeof window === 'undefined') {
      console.log('⏭️ Skipping browser-only test in Node');
      return;
    }

    console.log('🧪 Testing browser grammar worker...');
    
    // Initialize grammar worker directly (with timing)
    const initStartTime = performance.now();
    await initGrammar();
    const initTime = performance.now() - initStartTime;
    console.log(`✅ Grammar worker initialized in ${initTime.toFixed(1)}ms`);
    
    // Test with a sentence that should trigger grammar issues
    const testText = 'The cats is hungry.';
    console.log(`🔍 Checking: "${testText}"`);
    
    const checkStartTime = performance.now();
    const issues = await grammarIssues(testText);
    const checkTime = performance.now() - checkStartTime;
    console.log(`📊 Grammar issues found (${checkTime.toFixed(1)}ms):`, issues);
    
    expect(issues).toBeDefined();
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBeGreaterThan(0);
    
    // Check for real nlprule-style messages
    const hasGrammarIssue = issues.some(issue => 
      /agreement|plural noun|subject.*verb|singular.*plural/i.test(issue.message || '')
    );
    
    expect(hasGrammarIssue).toBeTruthy();
    console.log('✅ Real nlprule grammar issues detected!');
    
    // Test a few more examples for timing analysis
    const moreTests = [
      'I are going to the store.',
      'She have many books on her shelf.',
      'They was very happy yesterday.'
    ];
    
    for (const text of moreTests) {
      const start = performance.now();
      const result = await grammarIssues(text);
      const time = performance.now() - start;
      console.log(`⚡ "${text}" -> ${result.length} issues in ${time.toFixed(1)}ms`);
    }
  });

  it('integrated engine returns grammar issues in browser', async () => {
    if (typeof window === 'undefined') {
      console.log('⏭️ Skipping browser-only test in Node');
      return;
    }

    console.log('🧪 Testing integrated engine in browser...');
    
    const result = await check('The cats is hungry.');
    console.log('📊 Full engine result:', result);
    
    const grammarIssues = result.issues.filter(issue => issue.category === 'grammar');
    console.log('📝 Grammar issues:', grammarIssues);
    
    expect(grammarIssues.length).toBeGreaterThan(0);
    expect(grammarIssues.some(i => /agreement|plural noun/i.test(i.message))).toBeTruthy();
    
    console.log('✅ Integrated engine working in browser!');
  });

  afterAll(() => {
    if (typeof window === 'undefined') return;
    console.log('🧹 Browser tests completed');
  });
});
