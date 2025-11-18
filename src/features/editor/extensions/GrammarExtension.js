/**
 * 🎯 UNIFIED GRAMMAR EXTENSION - DECORATION ONLY 🎯
 * 
 * This extension ONLY handles:
 * 1. Rendering grammar decorations/underlines
 * 2. Handling clicks on decorations
 * 3. Managing decoration state
 * 
 * Grammar detection is handled by external services via UnifiedGrammarController
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

// Helper function to convert issue positions to TipTap format
const convertPositionsToTipTap = (issues, doc) => {
  return issues.map(issue => {
    let from, to;
    
    // Handle different position formats from grammar services
    if (issue.from !== undefined && issue.to !== undefined) {
      // Already in TipTap format
      from = issue.from;
      to = issue.to;
    } else if (issue.offset !== undefined && issue.length !== undefined) {
      // Convert from offset/length format (0-based) to TipTap positions (1-based)
      from = issue.offset + 1;
      to = issue.offset + issue.length + 1;
    } else if (issue.position && issue.position.from !== undefined && issue.position.to !== undefined) {
      from = issue.position.from;
      to = issue.position.to;
    } else {
      console.warn('Issue has no valid position data:', issue);
      return null;
    }
    
    // Validate positions against document
    const maxPos = doc.content.size + 1;
    if (from < 1 || to > maxPos || from >= to) {
      console.warn('Invalid position for issue:', { from, to, maxPos, issue });
      return null;
    }
    
    return {
      ...issue,
      from,
      to,
      position: { from, to }
    };
  }).filter(issue => issue !== null);
};

export const GrammarExtension = Extension.create({
  name: 'grammar',

  addOptions() {
    return {
      onIssueClicked: null,
    };
  },

  addStorage() {
    return {
      issues: [],
      isEnabled: true,
    };
  },

  addCommands() {
    return {
      // Command to update grammar decorations from external controller
      updateGrammarDecorations:
        (issues = []) =>
        ({ tr, dispatch, state }) => {
          if (!this.storage.isEnabled) {
            return false;
          }
          
          console.log('🎨 Updating grammar decorations with', issues.length, 'issues');
          
          if (issues.length === 0) {
            // Clear all decorations
            const newTr = tr.setMeta(grammarPluginKey, DecorationSet.empty);
            if (dispatch) dispatch(newTr);
            this.storage.issues = [];
            return true;
          }
          
          // Convert issue positions to TipTap format
          const convertedIssues = convertPositionsToTipTap(issues, state.doc);
          
          // Create decorations
          const decorations = convertedIssues.map(issue => {
            const decoration = Decoration.inline(issue.from, issue.to, {
              class: `grammar-error-${issue.category || 'grammar'}`,
              title: `${issue.message}${issue.suggestions?.[0] ? ': ' + issue.suggestions[0] : ''}`,
              'data-issue-id': issue.id,
              'data-original-text': issue.originalText || issue.text,
              'data-suggestion': issue.suggestions?.[0] || '',
              'data-category': issue.category || 'grammar'
            });
            
            // Attach issue data to decoration for click handling
            decoration.spec.issueData = issue;
            
            return decoration;
          });
          
          const decorationSet = DecorationSet.create(state.doc, decorations);
          const newTr = tr.setMeta(grammarPluginKey, decorationSet);
          
          if (dispatch) dispatch(newTr);
          
          // Store issues for reference
          this.storage.issues = convertedIssues;
          
          console.log('✅ Applied', decorations.length, 'grammar decorations');
          return true;
        },
      
      // Command to get current grammar issues
      getGrammarIssues:
        () =>
        ({ state }) => {
          return this.storage.issues || [];
        },
        
      // Command to apply a suggestion
      applySuggestion:
        (issueId, suggestion) =>
        ({ state, dispatch }) => {
          const issue = this.storage.issues.find(i => i.id === issueId);
          if (!issue || !suggestion) return false;
          
          const tr = state.tr.replaceWith(
            issue.from,
            issue.to,
            state.schema.text(suggestion)
          );
                
          if (dispatch) dispatch(tr);
              return true;
        },
        
      // Command to enable/disable grammar checking
      setGrammarEnabled:
        (enabled) =>
        ({ commands }) => {
          this.storage.isEnabled = enabled;
          if (!enabled) {
            commands.updateGrammarDecorations([]);
          }
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
                
                // Try to find the position
                let pos;
                try {
                  pos = view.posAtDOM(targetElement, 0);
                  console.log('📍 Position from posAtDOM:', pos);
                } catch (error) {
                  console.warn('❌ posAtDOM failed:', error);
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
                      
                      // Navigate to Grammar Assistant
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
    console.log('🎨 UNIFIED Grammar Extension created (decoration-only mode)');
  },

  // NOTE: Removed onUpdate and onSelectionUpdate - no more automatic grammar checking
  // Grammar checking is now handled by external UnifiedGrammarController
});

// Export utility function to update decorations from external controller
export const updateGrammarDecorations = (editor, issues = []) => {
  if (!editor || !editor.commands) {
    console.warn('❌ Editor not available for decoration update');
    return;
  }
  
  console.log('🔄 Externally updating grammar decorations with', issues.length, 'issues');
  return editor.commands.updateGrammarDecorations(issues);
};
