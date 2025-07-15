/**
 * 🎯 PRECISE GRAMMAR EXTENSION 🎯
 * Fixed for accurate character position mapping and underline-only highlighting
 * With click-to-open Grammar Assistant functionality
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Plugin key for the grammar extension
export const grammarPluginKey = new PluginKey('grammar');

// Premium underline-only styles - Clean & Elegant
const grammarStyles = `
  /* Premium Grammar Error Underlines - Clean & Simple */
  .ProseMirror .grammar-error-spelling,
  .prose .grammar-error-spelling,
  [data-grammar-error="spelling"] {
    text-decoration: none !important;
    border-bottom: 3px solid #ef4444 !important;
    cursor: pointer !important;
    background: none !important;
    outline: none !important;
    box-shadow: none !important;
    position: relative !important;
  }

  .ProseMirror .grammar-error-grammar,
  .prose .grammar-error-grammar,
  [data-grammar-error="grammar"] {
    text-decoration: none !important;
    border-bottom: 3px solid #3b82f6 !important;
    cursor: pointer !important;
    background: none !important;
    outline: none !important;
    box-shadow: none !important;
    position: relative !important;
  }

  .ProseMirror .grammar-error-style,
  .prose .grammar-error-style,
  [data-grammar-error="style"] {
    text-decoration: none !important;
    border-bottom: 3px solid #8b5cf6 !important;
    cursor: pointer !important;
    background: none !important;
    outline: none !important;
    box-shadow: none !important;
    position: relative !important;
  }

  .ProseMirror .grammar-error-punctuation,
  .prose .grammar-error-punctuation,
  [data-grammar-error="punctuation"] {
    text-decoration: none !important;
    border-bottom: 3px solid #f97316 !important;
    cursor: pointer !important;
    background: none !important;
    outline: none !important;
    box-shadow: none !important;
    position: relative !important;
  }

  .ProseMirror .grammar-error-word-choice,
  .prose .grammar-error-word-choice,
  [data-grammar-error="word-choice"] {
    text-decoration: none !important;
    border-bottom: 3px solid #10b981 !important;
    cursor: pointer !important;
    background: none !important;
    outline: none !important;
    box-shadow: none !important;
    position: relative !important;
  }

  .ProseMirror .grammar-error-clarity,
  .prose .grammar-error-clarity,
  [data-grammar-error="clarity"] {
    text-decoration: none !important;
    border-bottom: 3px solid #6366f1 !important;
    cursor: pointer !important;
    background: none !important;
    outline: none !important;
    box-shadow: none !important;
    position: relative !important;
  }

  /* Dark mode adjustments - Clean colors only */
  .dark .ProseMirror .grammar-error-spelling,
  .dark .prose .grammar-error-spelling {
    border-bottom-color: #f87171 !important;
  }

  .dark .ProseMirror .grammar-error-grammar,
  .dark .prose .grammar-error-grammar {
    border-bottom-color: #60a5fa !important;
  }

  .dark .ProseMirror .grammar-error-style,
  .dark .prose .grammar-error-style {
    border-bottom-color: #a78bfa !important;
  }

  .dark .ProseMirror .grammar-error-punctuation,
  .dark .prose .grammar-error-punctuation {
    border-bottom-color: #fb923c !important;
  }

  .dark .ProseMirror .grammar-error-word-choice,
  .dark .prose .grammar-error-word-choice {
    border-bottom-color: #34d399 !important;
  }

  .dark .ProseMirror .grammar-error-clarity,
  .dark .prose .grammar-error-clarity {
    border-bottom-color: #818cf8 !important;
  }
`;

// Inject styles into document
const injectGrammarStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('grammar-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'grammar-styles';
  style.textContent = grammarStyles;
  document.head.appendChild(style);
};

// Global reference to grammar assistant callbacks
let grammarAssistantCallbacks = {
  openGrammarAssistant: null,
  focusOnIssue: null
};

// Export function to register callbacks from Grammar Assistant
export const registerGrammarAssistantCallbacks = (callbacks) => {
  grammarAssistantCallbacks = { ...grammarAssistantCallbacks, ...callbacks };
  console.log('🔗 Grammar Assistant callbacks registered:', Object.keys(callbacks));
};

// Utility function to navigate to a specific grammar issue
export const navigateToGrammarIssue = (issue) => {
  console.log('🚀 Navigating to grammar issue externally:', issue.id);
  
  // First, open Grammar Assistant if not already open
  if (grammarAssistantCallbacks.openGrammarAssistant) {
    console.log('📖 Opening Grammar Assistant via utility');
    grammarAssistantCallbacks.openGrammarAssistant();
  }
  
  // Add a small delay to ensure Grammar Assistant is fully opened
  setTimeout(() => {
    // Focus on this specific issue with enhanced data
    if (grammarAssistantCallbacks.focusOnIssue) {
      console.log('🎯 Focusing on specific issue via utility:', issue.id);
      grammarAssistantCallbacks.focusOnIssue({
        ...issue,
        position: issue.position || { from: issue.from, to: issue.to },
        highlighted: true,
        clickSource: 'external-navigation'
      });
    }
  }, 150);
};

// Enhanced grammar rules with precise pattern matching
const getGrammarRules = () => [
  // Spelling errors
  { pattern: /\bteh\b/gi, suggestion: 'the', message: 'Spelling error: "teh" should be "the"', category: 'spelling' },
  { pattern: /\brecieve\b/gi, suggestion: 'receive', message: 'Spelling error: "i before e except after c"', category: 'spelling' },
  { pattern: /\bseperate\b/gi, suggestion: 'separate', message: 'Spelling error: "seperate" should be "separate"', category: 'spelling' },
  { pattern: /\boccured\b/gi, suggestion: 'occurred', message: 'Spelling error: missing double "r"', category: 'spelling' },
  { pattern: /\btommorow\b/gi, suggestion: 'tomorrow', message: 'Spelling error: only one "m" in tomorrow', category: 'spelling' },
  { pattern: /\bdont\b/gi, suggestion: "don't", message: 'Missing apostrophe in contraction', category: 'spelling' },
  { pattern: /\bcant\b/gi, suggestion: "can't", message: 'Missing apostrophe in contraction', category: 'spelling' },
  { pattern: /\bwont\b/gi, suggestion: "won't", message: 'Missing apostrophe in contraction', category: 'spelling' },
  
  // Grammar errors
  { pattern: /\bthis are\b/gi, suggestion: 'these are', message: 'Subject-verb disagreement: "this are" should be "these are"', category: 'grammar' },
  { pattern: /\ba example\b/gi, suggestion: 'an example', message: 'Use "an" before vowel sounds', category: 'grammar' },
  { pattern: /\bthat have\b/gi, suggestion: 'that has', message: 'Subject-verb disagreement with singular "that"', category: 'grammar' },
  { pattern: /\boff a\b/gi, suggestion: 'of a', message: 'Preposition error: "off" should be "of"', category: 'grammar' },
  { pattern: /\bit jump\b/gi, suggestion: 'it jumps', message: 'Subject-verb disagreement: "it jump" should be "it jumps"', category: 'grammar' },
  { pattern: /\btheir was\b/gi, suggestion: 'there was', message: 'Wrong word: "their" should be "there"', category: 'grammar' },
  { pattern: /\bits raining\b/gi, suggestion: "it's raining", message: 'Missing apostrophe: "its" should be "it\'s" (it is)', category: 'grammar' },
  
  // Word choice errors
  { pattern: /\bno why\b/gi, suggestion: 'know why', message: 'Wrong word: "no" should be "know"', category: 'word_choice' },
  { pattern: /\bwrite very\b/gi, suggestion: 'written very', message: 'Wrong verb form: "write" should be "written"', category: 'word_choice' },
  
  // Style errors
  { pattern: /\bvery good\b/gi, suggestion: 'excellent', message: 'Use stronger adjectives instead of "very good"', category: 'style' },
  
  // Punctuation errors - handle lowercase "i" but NOT at start of sentences
  { pattern: /(?<![.!?]\s*)\bi\b(?!\s*[.!?])/g, suggestion: 'I', message: 'Capitalize personal pronoun "I"', category: 'punctuation' }
];

// Simplified but reliable position mapping
const findTextPositionsInDoc = (doc, text) => {
  const docText = doc.textContent;
  const positions = [];
  
  // For each match in the text, find the corresponding position in the document
  const searchTexts = getGrammarRules().map(rule => ({
    pattern: rule.pattern,
    rule: rule
  }));
  
  searchTexts.forEach(({ pattern, rule }) => {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    
    while ((match = regex.exec(docText)) !== null) {
      const textStart = match.index;
      const textEnd = match.index + match[0].length;
      
      // Convert to document positions (add 1 for TipTap's 1-based indexing)
      const docStart = textStart + 1;
      const docEnd = textEnd + 1;
      
      // Validate positions
      if (docStart >= 1 && docEnd > docStart && docEnd <= doc.content.size + 1) {
        positions.push({
          from: docStart,
          to: docEnd,
          text: match[0],
          rule: rule,
          textStart: textStart,
          textEnd: textEnd
        });
      }
    }
  });
  
  return positions;
};

// Helper function to check grammar with simplified position mapping
const checkGrammarText = (doc, options, storage, editor) => {
  const text = doc.textContent;
  console.log('🔍 SIMPLIFIED Grammar checking text:', JSON.stringify(text.substring(0, 100)) + (text.length > 100 ? '...' : ''));
  
  if (!text || text.trim().length < 10) {
    console.log('📝 Text too short, clearing decorations');
    const tr = editor.state.tr.setMeta(grammarPluginKey, DecorationSet.empty);
    editor.view.dispatch(tr);
    return;
  }
  
  // Find positions using simplified method
  const positions = findTextPositionsInDoc(doc, text);
  console.log(`🎯 Found ${positions.length} potential issues`);
  
  if (positions.length === 0) {
    console.log('📝 No grammar issues found - clearing decorations');
    const tr = editor.state.tr.setMeta(grammarPluginKey, DecorationSet.empty);
    editor.view.dispatch(tr);
    return;
  }
  
  // Create issues with proper data structure
  const issues = positions.map((pos, index) => ({
    id: `issue-${pos.textStart}-${Date.now()}-${index}`,
    from: pos.from,
    to: pos.to,
    text: pos.text,
    message: pos.rule.message,
    suggestion: pos.rule.suggestion,
    category: pos.rule.category || 'default',
    originalText: pos.text,
    textOffset: pos.textStart,
    length: pos.text.length,
    position: { from: pos.from, to: pos.to },
        context: {
      text: text.substring(Math.max(0, pos.textStart - 20), Math.min(text.length, pos.textEnd + 20)),
      offset: Math.max(0, pos.textStart - 20)
        },
        rule: {
      id: `rule-${index}`,
      pattern: pos.rule.pattern.source,
      category: pos.rule.category
    }
  }));
  
  console.log(`🎨 Creating decorations for ${issues.length} issues`);
  
  // Create decorations
  const decorations = issues.map(issue => {
    console.log(`🎨 Creating decoration: "${issue.text}" (${issue.category}) at ${issue.from}-${issue.to}`);
    
    const decoration = Decoration.inline(issue.from, issue.to, {
      class: `grammar-error-${issue.category}`,
      title: `${issue.message}: ${issue.suggestion}`,
      'data-issue-id': issue.id,
      'data-original-text': issue.originalText,
      'data-suggestion': issue.suggestion,
      'data-category': issue.category
    });
    
    // Attach issue data to decoration for tracking
    decoration.spec.issueData = issue;
    
    return decoration;
  });
  
  console.log(`✅ Created ${decorations.length} decorations, applying to editor`);
  
  // Update decorations in the editor
  const decorationSet = DecorationSet.create(doc, decorations);
  const tr = editor.state.tr.setMeta(grammarPluginKey, decorationSet);
  editor.view.dispatch(tr);
  
  console.log('✅ Decorations applied to editor');
  
  // Update storage
  storage.issues = issues;
  
  // Call callbacks
  if (options.onIssuesFound) {
    console.log('📞 Calling onIssuesFound callback');
    options.onIssuesFound(issues);
  }
  if (options.onIssuesUpdated) {
    console.log('📞 Calling onIssuesUpdated callback');
    options.onIssuesUpdated(issues);
  }
  
  console.log(`🎯 Grammar check completed: ${issues.length} issues found and precisely underlined`);
};

export const GrammarExtension = Extension.create({
  name: 'grammar',

  addOptions() {
    return {
      enableRealTimeChecking: true,
      debounceTime: 300, // Faster for testing
      onIssuesFound: null,
      onIssuesUpdated: null,
      onIssueClicked: null,
    };
  },

  addStorage() {
    return {
      isEnabled: true,
      issues: [],
      checkTimeout: null,
      lastIssueCount: 0,
    };
  },

  addCommands() {
    return {
      toggleGrammar:
        () =>
        ({ commands }) => {
          this.storage.isEnabled = !this.storage.isEnabled;
          console.log('🎯 Grammar toggled:', this.storage.isEnabled ? 'ENABLED' : 'DISABLED');
          return commands.focus();
        },
      
      getGrammarIssues:
        () =>
        ({ state }) => {
          const decorations = grammarPluginKey.getState(state);
          if (!decorations) return [];
          
          const issues = [];
          decorations.find().forEach(decoration => {
            if (decoration.spec.issueData) {
              const updatedIssue = {
                ...decoration.spec.issueData,
                from: decoration.from,
                to: decoration.to,
                position: { from: decoration.from, to: decoration.to }
              };
              issues.push(updatedIssue);
            }
          });
          
          return issues;
        },
        
      applySuggestion:
        (issueId) =>
        ({ state, dispatch }) => {
          const decorations = grammarPluginKey.getState(state);
          if (!decorations) return false;
          
          let targetDecoration = null;
          decorations.find().forEach(decoration => {
            if (decoration.spec.issueData && decoration.spec.issueData.id === issueId) {
              targetDecoration = decoration;
            }
          });
          
          if (!targetDecoration) return false;
          
          const { issueData } = targetDecoration.spec;
          const tr = state.tr.replaceWith(
            targetDecoration.from,
            targetDecoration.to,
            state.schema.text(issueData.suggestion)
          );
                
          if (dispatch) dispatch(tr);
              return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: grammarPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, decorationSet) {
            const meta = tr.getMeta(grammarPluginKey);
            if (meta) {
              return meta;
              }
            return decorationSet.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          // Handle clicks on decorations
          handleDOMEvents: {
            click: (view, event) => {
              console.log('🖱️ Click detected on editor');
              
              // Enhanced click detection - check target and parent elements
              let targetElement = event.target;
              let grammarClasses = [];
            
              // Check up to 3 levels up the DOM tree
              for (let i = 0; i < 3 && targetElement; i++) {
                if (targetElement.classList) {
                  grammarClasses = Array.from(targetElement.classList).filter(cls => 
                    cls.startsWith('grammar-error-')
                  );
                  if (grammarClasses.length > 0) {
                    console.log('🎯 Found grammar error class:', grammarClasses, 'on element:', targetElement);
                    break;
                  }
                }
                targetElement = targetElement.parentElement;
              }
              
              if (grammarClasses.length > 0 && targetElement) {
                console.log('🖱️ Clicked on grammar error element');
                
                // Try multiple methods to find the position
                let pos;
                try {
                  // Method 1: Standard position detection
                  pos = view.posAtDOM(targetElement, 0);
                  console.log('📍 Position from posAtDOM:', pos);
                } catch (error) {
                  console.warn('❌ posAtDOM failed:', error);
                  // Method 2: Fallback - try getting position from data attributes
                  const issueId = targetElement.getAttribute('data-issue-id');
                  if (issueId) {
                    console.log('🔍 Trying to find issue by ID:', issueId);
                  }
                  return false;
                }
                
              const decorations = grammarPluginKey.getState(view.state);
                console.log('📋 Available decorations:', decorations ? 'Found' : 'None');
                
                if (decorations && pos !== undefined) {
                  // Search a range around the position
                  const searchRange = 5;
                  decorations.find(Math.max(0, pos - searchRange), pos + searchRange).forEach(decoration => {
                  if (decoration.spec.issueData) {
                      const issue = decoration.spec.issueData;
                      console.log('🎯 Found issue for click:', issue);
                      
                      // Enhanced navigation to Grammar Assistant
                      console.log('🎯 Navigating to issue:', issue.id, issue.text);
                      
                      // First, open Grammar Assistant if not already open
                      if (grammarAssistantCallbacks.openGrammarAssistant) {
                        console.log('📖 Opening Grammar Assistant via callback');
                        grammarAssistantCallbacks.openGrammarAssistant(issue);
                      } else {
                        console.warn('❌ openGrammarAssistant callback not available');
                      }
                      
                      // Add a small delay to ensure Grammar Assistant is fully opened
                      setTimeout(() => {
                        // Focus on this specific issue with enhanced data
                        if (grammarAssistantCallbacks.focusOnIssue) {
                          console.log('🎯 Focusing on specific issue:', issue.id);
                          grammarAssistantCallbacks.focusOnIssue({
                            ...issue,
                            // Ensure we have all the necessary data
                            position: { from: issue.from, to: issue.to },
                            highlighted: true,
                            clickSource: 'editor-underline'
                          });
                        } else {
                          console.warn('❌ focusOnIssue callback not available');
                        }
                        
                        // Also call the onIssueClicked callback if provided
                        if (this.options.onIssueClicked) {
                          console.log('📞 Calling onIssueClicked callback');
                          this.options.onIssueClicked(issue);
              }
                      }, 150);
                      
                      event.preventDefault();
                      event.stopPropagation();
                      return true;
                    }
                  });
                } else {
                  console.warn('❌ No decorations found or invalid position');
              }
            }
              return false;
        }
          }
        },
      }),
    ];
  },

  onCreate() {
    // Inject CSS styles
    injectGrammarStyles();
    console.log('🎨 SIMPLIFIED Grammar Extension created and styles injected');
  },

  onUpdate() {
    if (!this.storage.isEnabled) {
      console.log('🔍 Grammar checking disabled, skipping update');
      return;
    }
    
    console.log('🔍 Grammar extension onUpdate triggered');
    
    // Clear existing timeout
    if (this.storage.checkTimeout) {
      clearTimeout(this.storage.checkTimeout);
    }
    
    // Set new timeout for debounced checking
    this.storage.checkTimeout = setTimeout(() => {
      console.log('🔍 Running debounced grammar check');
      checkGrammarText(this.editor.state.doc, this.options, this.storage, this.editor);
    }, this.options.debounceTime);
  },

  onSelectionUpdate() {
    // Trigger initial check when selection updates (covers first load)
    if (!this.storage.checkTimeout && this.storage.isEnabled) {
      console.log('🔍 Triggering initial grammar check on selection update');
      this.storage.checkTimeout = setTimeout(() => {
        checkGrammarText(this.editor.state.doc, this.options, this.storage, this.editor);
      }, 100);
    }
  }
});

// Export the enhanced check function for external use
export const updateGrammarDecorations = (editor, issues = []) => {
  if (!editor || !editor.view) return;
  
  console.log('🔄 Externally updating grammar decorations with', issues.length, 'issues');
  
  if (issues.length === 0) {
    const tr = editor.state.tr.setMeta(grammarPluginKey, DecorationSet.empty);
    editor.view.dispatch(tr);
    return;
  }
  
  const decorations = issues.map(issue => {
    const decoration = Decoration.inline(issue.from || issue.position?.from || 0, issue.to || issue.position?.to || 0, {
      class: `grammar-error-${issue.category || 'default'}`,
      title: `${issue.message}: ${issue.suggestion || ''}`,
      'data-issue-id': issue.id,
      'data-original-text': issue.originalText || issue.text,
      'data-suggestion': issue.suggestion,
      'data-category': issue.category
    });
    
    decoration.spec.issueData = issue;
    return decoration;
  });
  
  const decorationSet = DecorationSet.create(editor.state.doc, decorations);
  const tr = editor.state.tr.setMeta(grammarPluginKey, decorationSet);
  editor.view.dispatch(tr);
  
  console.log('✅ External decorations applied to editor');
};
