/**
 * 🔍 GRAMMAR DEBUG TESTER
 * Simple test to verify Ultimate Grammar System is working
 */

import UltimateGrammarService from './UltimateGrammarService.js';

// Test the Ultimate Grammar System
export async function testUltimateGrammar() {
    console.log('🔍 Testing Ultimate Grammar System...');
    
    const ultimateGrammar = new UltimateGrammarService();
    
    const testText = "Between you and I, each of the students have finished there homework incorrectly. The data clearly shows that none of the participants was prepared for they're final exam. I could of helped them, but their going to have to learn this themself. Me and my colleague thinks that this are a serious problem that effects everyone.";
    
    try {
        const result = await ultimateGrammar.checkText(testText);
        console.log('✅ Ultimate Grammar Test Results:', result);
        console.log(`📊 Found ${result.issues.length} issues`);
        
        result.issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue.message} (${issue.category})`);
        });
        
        return result;
    } catch (error) {
        console.error('❌ Ultimate Grammar Test Failed:', error);
        return null;
    }
}

// Test just AdvancedGrammarService 
export async function testAdvancedGrammar() {
    console.log('🔍 Testing AdvancedGrammarService...');
    
    const AdvancedGrammarService = (await import('./AdvancedGrammarService.js')).default;
    const advancedGrammarService = new AdvancedGrammarService();
    
    const testText = "Between you and I, each of the students have finished there homework incorrectly.";
    
    try {
        const result = await advancedGrammarService.checkText(testText);
        console.log('✅ AdvancedGrammarService Test Results:', result);
        console.log(`📊 Found ${result.issues ? result.issues.length : 0} issues`);
        
        return result;
    } catch (error) {
        console.error('❌ AdvancedGrammarService Test Failed:', error);
        return null;
    }
}

// Run both tests
export async function runAllGrammarTests() {
    console.log('🚀 Running All Grammar Tests...');
    
    await testUltimateGrammar();
    await testAdvancedGrammar();
    
    console.log('✅ All tests completed');
} 