/**
 * Test script to verify grammar checking is working
 * Run this in the browser console to test
 */

async function testGrammarSystem() {
  console.log('🧪 Testing Grammar System...');
  
  try {
    // Import the service
    const { default: AdvancedGrammarService } = await import('./AdvancedGrammarService.js');
    
    const service = new AdvancedGrammarService();
    
    console.log('📋 Initializing service...');
    await service.initialize();
    
    console.log('✅ Service initialized');
    
    // Test with some problematic text
    const testText = "This are a test. I has many errors that need to be catched.";
    
    console.log('📝 Checking text:', testText);
    const result = await service.checkText(testText);
    
    console.log('📊 Results:', result);
    console.log(`Found ${result.issues.length} issues:`);
    
    result.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.category}] ${issue.message}`);
      console.log(`   Context: "${issue.context?.text}"`);
      console.log(`   Suggestions:`, issue.suggestions);
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Export for use in browser console
window.testGrammarSystem = testGrammarSystem;

export { testGrammarSystem };
