/**
 * Test the Mega Engine directly
 */

import { MegaEngine } from './mega-engine/packages/mega-engine/dist/mega-engine-node.js';

async function testMegaEngine() {
  try {
    console.log('🧪 Testing Mega Engine directly...');
    
    // Initialize the Mega Engine
    const megaEngine = new MegaEngine();
    await megaEngine.init({
      engines: {
        nlprule: true,
        hunspell: true,
        symspell: true,
        writeGood: true,
        retext: true
      },
      debug: true
    });
    
    // Test with simple text
    const testText = 'The cats is hungry.';
    console.log('🧪 Testing with:', testText);
    
    const result = await megaEngine.check(testText);
    console.log('✅ Check result:', result);
    
    if (result.issues && result.issues.length > 0) {
      console.log('🎯 Issues found:', result.issues.map(i => i.message));
    } else {
      console.log('⚠️ No issues detected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMegaEngine();