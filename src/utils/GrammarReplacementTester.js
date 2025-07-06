/**
 * 🧪 GRAMMAR REPLACEMENT TESTING UTILITY
 * 
 * This utility helps test and validate the new CommandBasedReplacer system
 * to ensure it works correctly with undo/redo and text replacement.
 * 
 * Test scenarios:
 * 1. Basic word replacement (e.g., "teh" → "the")
 * 2. Multiple replacements in sequence
 * 3. Undo/Redo functionality (Cmd+Z/Cmd+Y)
 * 4. Complex text with formatting
 * 5. Edge cases (empty content, special characters)
 */

export class GrammarReplacementTester {
  constructor(editor) {
    this.editor = editor;
    this.testResults = [];
  }

  /**
   * Run all test scenarios
   */
  async runAllTests() {
    console.log('🧪 Starting Grammar Replacement Tests');
    
    const tests = [
      this.testBasicReplacement,
      this.testMultipleReplacements,
      this.testUndoRedo,
      this.testFormattedText,
      this.testEdgeCases
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        console.error(`❌ Test failed: ${test.name}`, error);
      }
    }

    this.printResults();
  }

  /**
   * Test 1: Basic word replacement
   */
  async testBasicReplacement() {
    console.log('🧪 Test 1: Basic word replacement');
    
    // Set test content
    this.editor.commands.setContent('This is a teh test document.');
    
    // Wait for grammar checking
    await this.wait(1500);
    
    // Check if grammar error was detected
    const hasGrammarError = this.hasGrammarDecorations();
    this.recordResult('Basic Error Detection', hasGrammarError, 'Should detect "teh" as an error');
    
    if (hasGrammarError) {
      // Try to apply a correction
      this.simulateGrammarCorrection('teh', 'the');
      await this.wait(500);
      
      const content = this.editor.getHTML();
      const corrected = content.includes('the') && !content.includes('teh');
      this.recordResult('Basic Replacement', corrected, 'Should replace "teh" with "the"');
    }
  }

  /**
   * Test 2: Multiple replacements
   */
  async testMultipleReplacements() {
    console.log('🧪 Test 2: Multiple replacements');
    
    // Set content with multiple errors
    this.editor.commands.setContent('I recieve seperate emails tommorow.');
    await this.wait(1500);
    
    const initialErrors = this.countGrammarErrors();
    this.recordResult('Multiple Error Detection', initialErrors >= 3, `Should detect 3+ errors, found ${initialErrors}`);
    
    // Apply multiple corrections
    this.simulateGrammarCorrection('recieve', 'receive');
    await this.wait(200);
    this.simulateGrammarCorrection('seperate', 'separate');
    await this.wait(200);
    this.simulateGrammarCorrection('tommorow', 'tomorrow');
    await this.wait(500);
    
    const content = this.editor.getHTML();
    const allCorrected = content.includes('receive') && 
                        content.includes('separate') && 
                        content.includes('tomorrow');
    this.recordResult('Multiple Replacements', allCorrected, 'Should correct all spelling errors');
  }

  /**
   * Test 3: Undo/Redo functionality
   */
  async testUndoRedo() {
    console.log('🧪 Test 3: Undo/Redo functionality');
    
    // Set content
    this.editor.commands.setContent('This is teh original text.');
    await this.wait(1500);
    
    // Apply correction
    this.simulateGrammarCorrection('teh', 'the');
    await this.wait(500);
    
    // Test undo
    const beforeUndo = this.editor.getHTML();
    this.editor.commands.undo();
    await this.wait(300);
    
    const afterUndo = this.editor.getHTML();
    const undoWorked = afterUndo.includes('teh') && !afterUndo.includes('the');
    this.recordResult('Undo Functionality', undoWorked, 'Undo should revert the correction');
    
    // Test redo
    this.editor.commands.redo();
    await this.wait(300);
    
    const afterRedo = this.editor.getHTML();
    const redoWorked = afterRedo.includes('the') && !afterRedo.includes('teh');
    this.recordResult('Redo Functionality', redoWorked, 'Redo should reapply the correction');
  }

  /**
   * Test 4: Formatted text
   */
  async testFormattedText() {
    console.log('🧪 Test 4: Formatted text preservation');
    
    // Set content with formatting
    this.editor.commands.setContent('<p><strong>This is teh</strong> <em>formatted</em> text.</p>');
    await this.wait(1500);
    
    // Apply correction
    this.simulateGrammarCorrection('teh', 'the');
    await this.wait(500);
    
    const content = this.editor.getHTML();
    const hasCorrection = content.includes('the') && !content.includes('teh');
    const preservedFormatting = content.includes('<strong>') && content.includes('<em>');
    
    this.recordResult('Formatted Text Correction', hasCorrection, 'Should correct error in formatted text');
    this.recordResult('Format Preservation', preservedFormatting, 'Should preserve text formatting');
  }

  /**
   * Test 5: Edge cases
   */
  async testEdgeCases() {
    console.log('🧪 Test 5: Edge cases');
    
    // Test empty content
    this.editor.commands.setContent('');
    await this.wait(500);
    
    const noErrorsInEmpty = this.countGrammarErrors() === 0;
    this.recordResult('Empty Content Handling', noErrorsInEmpty, 'Should handle empty content gracefully');
    
    // Test single character
    this.editor.commands.setContent('a');
    await this.wait(500);
    
    const noErrorsInSingle = this.countGrammarErrors() === 0;
    this.recordResult('Single Character Handling', noErrorsInSingle, 'Should handle single character gracefully');
    
    // Test special characters
    this.editor.commands.setContent('Symbols @#$% and teh word.');
    await this.wait(1500);
    
    const detectsWithSymbols = this.countGrammarErrors() >= 1;
    this.recordResult('Special Characters Handling', detectsWithSymbols, 'Should detect errors with special characters');
  }

  /**
   * Helper: Simulate grammar correction
   */
  simulateGrammarCorrection(originalText, correction) {
    // This simulates what the UI would do
    const content = this.editor.getHTML();
    const index = content.indexOf(originalText);
    
    if (index !== -1) {
      // Use the editor's command system for replacement
      this.editor.commands.focus();
      
      // Try to find and replace the text
      const docText = this.editor.state.doc.textContent;
      const textIndex = docText.indexOf(originalText);
      
      if (textIndex !== -1) {
        // Convert to document positions
        let currentPos = 0;
        let found = false;
        
        this.editor.state.doc.descendants((node, pos) => {
          if (found) return false;
          
          if (node.isText) {
            const nodeEnd = currentPos + node.text.length;
            if (textIndex >= currentPos && textIndex < nodeEnd) {
              const offsetInNode = textIndex - currentPos;
              const from = pos + offsetInNode;
              const to = from + originalText.length;
              
              // Use TipTap's command system
              this.editor.chain()
                .focus()
                .setTextSelection({ from, to })
                .insertContent(correction)
                .run();
              
              found = true;
              return false;
            }
            currentPos = nodeEnd;
          }
        });
      }
    }
  }

  /**
   * Helper: Check for grammar decorations
   */
  hasGrammarDecorations() {
    const decorations = this.editor.view.state.doc.content;
    const hasErrors = this.editor.getHTML().includes('grammar-error') || 
                     this.countGrammarErrors() > 0;
    return hasErrors;
  }

  /**
   * Helper: Count grammar errors
   */
  countGrammarErrors() {
    try {
      const grammarPluginKey = this.editor.extensionManager.extensions
        .find(ext => ext.name === 'grammar')?.options?.pluginKey;
      
      if (grammarPluginKey) {
        const decorations = grammarPluginKey.getState(this.editor.state);
        return decorations ? decorations.find().length : 0;
      }
      
      // Fallback: count by DOM elements
      const grammarElements = document.querySelectorAll('.grammar-error');
      return grammarElements.length;
    } catch (error) {
      console.warn('Could not count grammar errors:', error);
      return 0;
    }
  }

  /**
   * Helper: Wait for specified time
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper: Record test result
   */
  recordResult(testName, passed, description) {
    const result = {
      test: testName,
      passed,
      description,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${description}`);
  }

  /**
   * Print final test results
   */
  printResults() {
    console.log('\n🧪 Test Results Summary:');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log(`Tests Passed: ${passed}/${total}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.description}`);
    });
    
    if (passed === total) {
      console.log('\n🎉 All tests passed! Grammar replacement system is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the implementation.');
    }
  }
}

/**
 * Quick test function to run from browser console
 */
export function testGrammarReplacement(editor) {
  if (!editor) {
    console.error('❌ Please provide a TipTap editor instance');
    return;
  }
  
  const tester = new GrammarReplacementTester(editor);
  return tester.runAllTests();
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.testGrammarReplacement = testGrammarReplacement;
  window.GrammarReplacementTester = GrammarReplacementTester;
}
