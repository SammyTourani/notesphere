import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const GrammarExtension = Extension.create({
  name: 'grammar',

  addOptions() {
    return {
      HTMLAttributes: {},
      onGrammarCheck: () => {},
      onSuggestionClick: () => {},
      debounceTime: 1000, // 1 second debounce for grammar checking
    };
  },

  addStorage() {
    return {
      grammarIssues: [],
      isChecking: false,
      checkTimeout: null,
    };
  },

  addProseMirrorPlugins() {
    const { onGrammarCheck, onSuggestionClick, debounceTime } = this.options;

    return [
      new Plugin({
        key: new PluginKey('grammar'),
        
        state: {
          init() {
            return {
              decorations: DecorationSet.empty,
              issues: [],
              isChecking: false,
            };
          },

          apply(tr, oldState) {
            let { decorations, issues, isChecking } = oldState;

            // Map decorations through document changes
            decorations = decorations.map(tr.mapping, tr.doc);

            // Check if we have grammar data in the transaction
            const grammarMeta = tr.getMeta('grammar');
            if (grammarMeta) {
              if (grammarMeta.type === 'setIssues') {
                issues = grammarMeta.issues;
                decorations = this.createDecorations(tr.doc, issues, onSuggestionClick);
              } else if (grammarMeta.type === 'setChecking') {
                isChecking = grammarMeta.isChecking;
              }
            }

            return {
              decorations,
              issues,
              isChecking,
            };
          },
        },

        props: {
          decorations(state) {
            return this.getState(state).decorations;
          },
        },

        view(editorView) {
          let checkTimeout = null;

          const scheduleGrammarCheck = () => {
            if (checkTimeout) {
              clearTimeout(checkTimeout);
            }

            checkTimeout = setTimeout(async () => {
              const content = editorView.state.doc.textContent;
              
              if (content.trim().length === 0) {
                // Clear issues if content is empty
                editorView.dispatch(
                  editorView.state.tr.setMeta('grammar', {
                    type: 'setIssues',
                    issues: [],
                  })
                );
                return;
              }

              // Set checking state
              editorView.dispatch(
                editorView.state.tr.setMeta('grammar', {
                  type: 'setChecking',
                  isChecking: true,
                })
              );

              try {
                // Call the grammar check function
                await onGrammarCheck(content, editorView);
              } catch (error) {
                console.warn('Grammar check failed:', error);
                // Clear checking state on error
                editorView.dispatch(
                  editorView.state.tr.setMeta('grammar', {
                    type: 'setChecking',
                    isChecking: false,
                  })
                );
              }
            }, debounceTime);
          };

          // Initial grammar check
          scheduleGrammarCheck();

          return {
            update: (view, prevState) => {
              // Check if document content changed
              if (!view.state.doc.eq(prevState.doc)) {
                scheduleGrammarCheck();
              }
            },

            destroy: () => {
              if (checkTimeout) {
                clearTimeout(checkTimeout);
              }
            },
          };
        },

        // Helper method to create decorations
        createDecorations(doc, issues, onSuggestionClick) {
          const decorations = [];

          issues.forEach((issue) => {
            try {
              const from = issue.offset;
              const to = issue.offset + issue.length;

              // Ensure the range is valid
              if (from >= 0 && to <= doc.content.size && from < to) {
                const decoration = Decoration.inline(from, to, {
                  class: `grammar-issue grammar-${issue.category} grammar-${issue.severity}`,
                  'data-grammar-id': issue.id,
                  'data-category': issue.category,
                  'data-severity': issue.severity,
                  'data-message': issue.shortMessage || issue.message,
                  style: this.getIssueStyle(issue),
                }, {
                  issue,
                  onclick: (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onSuggestionClick(issue, event);
                  },
                });

                decorations.push(decoration);
              }
            } catch (error) {
              console.warn('Failed to create decoration for issue:', issue, error);
            }
          });

          return DecorationSet.create(doc, decorations);
        },

        // Helper method to get styling for issues
        getIssueStyle(issue) {
          const baseStyle = 'cursor: pointer; position: relative;';
          
          switch (issue.category) {
            case 'spelling':
              return baseStyle + 'border-bottom: 2px wavy #ef4444; background-color: rgba(239, 68, 68, 0.1);';
            case 'grammar':
              return baseStyle + 'border-bottom: 2px wavy #f59e0b; background-color: rgba(245, 158, 11, 0.1);';
            case 'punctuation':
              return baseStyle + 'border-bottom: 2px wavy #eab308; background-color: rgba(234, 179, 8, 0.1);';
            case 'style':
              return baseStyle + 'border-bottom: 2px wavy #3b82f6; background-color: rgba(59, 130, 246, 0.1);';
            case 'clarity':
              return baseStyle + 'border-bottom: 2px wavy #8b5cf6; background-color: rgba(139, 92, 246, 0.1);';
            default:
              return baseStyle + 'border-bottom: 2px wavy #6b7280; background-color: rgba(107, 114, 128, 0.1);';
          }
        },
      }),
    ];
  },

  addCommands() {
    return {
      setGrammarIssues: (issues) => ({ tr, dispatch }) => {
        if (dispatch) {
          dispatch(tr.setMeta('grammar', {
            type: 'setIssues',
            issues,
          }));
        }
        return true;
      },

      setGrammarChecking: (isChecking) => ({ tr, dispatch }) => {
        if (dispatch) {
          dispatch(tr.setMeta('grammar', {
            type: 'setChecking',
            isChecking,
          }));
        }
        return true;
      },

      clearGrammarIssues: () => ({ tr, dispatch }) => {
        if (dispatch) {
          dispatch(tr.setMeta('grammar', {
            type: 'setIssues',
            issues: [],
          }));
        }
        return true;
      },

      applySuggestion: (issue, suggestion) => ({ tr, dispatch, state }) => {
        if (dispatch) {
          const from = issue.offset;
          const to = issue.offset + issue.length;
          
          // Ensure the range is still valid
          if (from >= 0 && to <= state.doc.content.size && from < to) {
            const newTr = tr.replaceWith(from, to, state.schema.text(suggestion));
            dispatch(newTr);
            return true;
          }
        }
        return false;
      },
    };
  },

  // Method to get current grammar issues
  getGrammarIssues() {
    return this.storage.grammarIssues;
  },

  // Method to check if grammar checking is in progress
  isGrammarChecking() {
    return this.storage.isChecking;
  },
});

export default GrammarExtension;