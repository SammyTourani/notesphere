/**
 * 🎯 ENHANCED GRAMMAR EXTENSION 🎯
 * Enhanced for better position tracking and CommandBasedReplacer integration
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Plugin key for the grammar extension
export const grammarPluginKey = new PluginKey('grammar');

// Grammar extension styles
const grammarStyles = `
  .grammar-error {
    background: linear-gradient(135deg, #fee2e2, #fecaca);
    border-bottom: 2px solid #ef4444;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .grammar-error:hover {
    background: linear-gradient(135deg, #fecaca, #fca5a5);
    transform: translateY(-1px);
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

// Helper function to check grammar with enhanced position tracking
const checkGrammarText = (doc, options, storage, editor) => {
  const text = doc.textContent;
  console.log('🔍 Grammar checking text:', JSON.stringify(text));
  const issues = [];
  
  // Simple grammar checking - look for common errors
  const grammarRules = [
    { pattern: /\bteh\b/gi, suggestion: 'the', message: 'Spelling error' },
    { pattern: /\brecieve\b/gi, suggestion: 'receive', message: 'Spelling error' },
    { pattern: /\bseperate\b/gi, suggestion: 'separate', message: 'Spelling error' },
    { pattern: /\boccured\b/gi, suggestion: 'occurred', message: 'Spelling error' },
    { pattern: /\btommorow\b/gi, suggestion: 'tomorrow', message: 'Spelling error' },
  ];
  
  console.log('🎯 Applying grammar rules to text length:', text.length);
  
  grammarRules.forEach((rule, ruleIndex) => {
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    console.log(`📝 Testing rule ${ruleIndex + 1}: ${rule.pattern}`);
    
    while ((match = regex.exec(text)) !== null) {
      console.log(`✅ Found match: "${match[0]}" at position ${match.index}`);
      
      // Enhanced issue object with better position tracking
      const issue = {
        id: `issue-${match.index}-${Date.now()}`,
        from: match.index,
        to: match.index + match[0].length,
        text: match[0],
        message: rule.message,
        suggestion: rule.suggestion,
        
        // Enhanced data for CommandBasedReplacer
        originalText: match[0], // The actual text that was matched
        textOffset: match.index, // Plain text offset for reference
        length: match[0].length, // Length of the matched text
        
        // Position object for UI compatibility
        position: { 
          from: match.index, 
          to: match.index + match[0].length 
        },
        
        // Context information
        context: {
          text: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + match[0].length + 20)),
          offset: Math.max(0, match.index - 20)
        },
        
        // Rule information
        rule: {
          id: `rule-${ruleIndex}`,
          pattern: rule.pattern.source,
          category: 'spelling'
        }
      };
      
      issues.push(issue);
    }
  });
  
  console.log(`🎯 Total issues found: ${issues.length}`, issues);
  
  // Update storage
  storage.issues = issues;
  
  // Create decorations with enhanced data
  const decorations = issues.map(issue => {
    const decoration = Decoration.inline(issue.from, issue.to, {
      class: 'grammar-error',
      title: `${issue.message}: ${issue.suggestion}`,
      // Store issue data in decoration for later retrieval
      'data-issue-id': issue.id,
      'data-original-text': issue.originalText,
      'data-suggestion': issue.suggestion
    });
    
    // Attach issue data to decoration for tracking
    decoration.spec.issueData = issue;
    
    return decoration;
  });
  
  // Update decorations in the editor
  const decorationSet = DecorationSet.create(doc, decorations);
  const tr = editor.state.tr.setMeta(grammarPluginKey, decorationSet);
  editor.view.dispatch(tr);
  
  // Call callbacks with enhanced issues
  if (options.onIssuesFound) {
    options.onIssuesFound(issues);
  }
  if (options.onIssuesUpdated) {
    options.onIssuesUpdated(issues);
  }
  
  console.log(`🎯 Grammar check found ${issues.length} issues`);
};

export const GrammarExtension = Extension.create({
  name: 'grammar',

  addOptions() {
    return {
      enableRealTimeChecking: true,
      debounceTime: 1000,
      onIssuesFound: null,
      onIssuesUpdated: null,
      onIssueClicked: null, // New callback for click handling
    };
  },

  addStorage() {
    return {
      isEnabled: true,
      issues: [],
      checkTimeout: null,
      lastIssueCount: 0, // Track issue count changes
    };
  },

  addCommands() {
    return {
      toggleGrammar:
        () =>
        ({ commands }) => {
          this.storage.isEnabled = !this.storage.isEnabled;
          return commands.focus();
        },
      
      // Add command to get current grammar issues with updated positions
      getGrammarIssues:
        () =>
        ({ state }) => {
          const decorations = grammarPluginKey.getState(state);
          if (!decorations) return [];
          
          const issues = [];
          decorations.find().forEach(decoration => {
            if (decoration.spec.issueData) {
              // Update positions based on current decoration positions
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
        
      // Add command to apply suggestion with proper undo integration
      applyGrammarSuggestion:
        (issueId, suggestion) =>
        ({ state, dispatch }) => {
          const decorations = grammarPluginKey.getState(state);
          if (!decorations) return false;
          
          // Find the decoration for this issue
          decorations.find().forEach(decoration => {
            if (decoration.spec.issueData && decoration.spec.issueData.id === issueId) {
              if (dispatch) {
                const tr = state.tr;
                tr.replaceWith(decoration.from, decoration.to, state.schema.text(suggestion));
                
                // Remove the decoration
                const newDecorations = decorations.remove([decoration]);
                tr.setMeta(grammarPluginKey, newDecorations);
                
                dispatch(tr);
              }
              return true;
            }
          });
          
          return false;
        }
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    const { options, storage } = this;
    const { editor } = this;

    return [
      new Plugin({
        key: grammarPluginKey,
        
        state: {
          init() {
            return DecorationSet.empty;
          },
          
          apply(tr, decorationSet) {
            // Map existing decorations through the transaction
            decorationSet = decorationSet.map(tr.mapping, tr.doc);
            
            // Check if we have new decorations from meta
            const newDecorations = tr.getMeta(grammarPluginKey);
            if (newDecorations) {
              decorationSet = newDecorations;
            }
            
            // Only check grammar if enabled and content changed
            if (storage.isEnabled && tr.docChanged && options.enableRealTimeChecking) {
              // Clear existing timeout
              if (storage.checkTimeout) {
                clearTimeout(storage.checkTimeout);
              }
              
              // Set new timeout for grammar checking
              storage.checkTimeout = setTimeout(() => {
                checkGrammarText(tr.doc, options, storage, editor);
              }, options.debounceTime);
            }
            
            return decorationSet;
          },
        },
        
        props: {
          decorations(state) {
            return grammarPluginKey.getState(state);
          },
          
          // Handle clicks on grammar errors for better UX
          handleClick(view, pos, event) {
            const decorations = grammarPluginKey.getState(view.state);
            if (!decorations) return false;
            
            // Check if click is on a grammar error
            const clickedDecorations = decorations.find(pos, pos);
            if (clickedDecorations.length > 0) {
              const decoration = clickedDecorations[0];
              if (decoration.spec.issueData) {
                console.log('🎯 Clicked on grammar issue:', decoration.spec.issueData);
                
                // Trigger issue selection in UI if callback available
                if (options.onIssueClicked) {
                  options.onIssueClicked(decoration.spec.issueData);
                }
                
                return true; // Handled
              }
            }
            
            return false; // Not handled
          }
        },
        
        // Add view update handler for better integration
        view(editorView) {
          return {
            update: (view, prevState) => {
              // Update issue positions when view updates
              const decorations = grammarPluginKey.getState(view.state);
              if (decorations && decorations.find().length > 0) {
                // Update storage with current positions
                const currentIssues = [];
                decorations.find().forEach(decoration => {
                  if (decoration.spec.issueData) {
                    const updatedIssue = {
                      ...decoration.spec.issueData,
                      from: decoration.from,
                      to: decoration.to,
                      position: { from: decoration.from, to: decoration.to }
                    };
                    currentIssues.push(updatedIssue);
                  }
                });
                
                storage.issues = currentIssues;
                
                // Notify UI of updated positions
                if (options.onIssuesUpdated && currentIssues.length !== storage.lastIssueCount) {
                  storage.lastIssueCount = currentIssues.length;
                  options.onIssuesUpdated(currentIssues);
                }
              }
            },
            
            destroy: () => {
              if (storage.checkTimeout) {
                clearTimeout(storage.checkTimeout);
              }
            }
          };
        }
      }),
    ];
  },

  onCreate() {
    // Inject CSS styles
    injectGrammarStyles();
    console.log('🚀 Enhanced Grammar Extension initialized with CommandBasedReplacer support');
  },

  onDestroy() {
    // Clean up timeout
    if (this.storage.checkTimeout) {
      clearTimeout(this.storage.checkTimeout);
    }
    console.log('🧹 Enhanced Grammar Extension destroyed');
  },
});

export default GrammarExtension;
