/**
 * 🎯 COMMAND-BASED TEXT REPLACER - TIPTAP NATIVE APPROACH
 * 
 * This system performs precise text replacement using TipTap's native command system,
 * ensuring proper undo/redo integration and smooth user experience.
 * 
 * Key Advantages:
 * - ✅ Full undo/redo support (Cmd+Z/Cmd+Y)
 * - ✅ Works with TipTap's transaction system
 * - ✅ Preserves rich text formatting
 * - ✅ Smooth cursor positioning
 * - ✅ Professional editor behavior
 * 
 * How it works:
 * 1. Uses editor.commands for all text modifications
 * 2. Leverages TipTap's built-in position tracking
 * 3. Integrates seamlessly with editor's undo system
 * 4. Preserves selection state through transactions
 */

export class CommandBasedReplacer {
  constructor(editor) {
    this.editor = editor;
    this.debug = true; // Enable detailed logging
  }

  /**
   * Apply a grammar suggestion using TipTap's command system
   * This method ensures proper undo/redo integration and smooth UX
   * 
   * @param {Object} issue - Grammar issue object with position information
   * @param {string} suggestion - Suggested replacement text
   * @returns {boolean} Success status
   */
  applySuggestion(issue, suggestion) {
    if (!this.editor || !issue || typeof suggestion !== 'string') {
      this._log('❌ Invalid parameters for suggestion application', { issue, suggestion });
      return false;
    }

    this._log('🎯 Applying suggestion with command-based approach', {
      issue: issue.message,
      from: issue.from || issue.position?.from,
      to: issue.to || issue.position?.to,
      suggestion,
      originalText: issue.originalText || issue.text
    });

    try {
      // Method 1: Use direct position information if available
      if (this._hasValidPositions(issue)) {
        return this._applyWithDirectPositions(issue, suggestion);
      }

      // Method 2: Use text-based finding for better accuracy
      if (issue.originalText || issue.text) {
        return this._applyWithTextFinding(issue, suggestion);
      }

      // Method 3: Use grammar extension decorations
      if (issue.id) {
        return this._applyWithDecorationTracking(issue, suggestion);
      }

      this._log('❌ No valid position method available for issue', issue);
      return false;

    } catch (error) {
      this._log('❌ Error applying suggestion', error);
      return false;
    }
  }

  /**
   * Apply suggestion using direct position information
   * This is the most accurate method when positions are reliable
   */
  _applyWithDirectPositions(issue, suggestion) {
    const from = issue.from || issue.position?.from;
    const to = issue.to || issue.position?.to;

    if (!this._validatePositions(from, to)) {
      this._log('❌ Invalid positions', { from, to });
      return false;
    }

    // Verify the text at these positions matches what we expect
    const currentText = this.editor.state.doc.textBetween(from, to);
    const expectedText = issue.originalText || issue.text;

    if (expectedText && currentText !== expectedText) {
      this._log('⚠️ Position text mismatch, falling back to text finding', {
        expected: expectedText,
        found: currentText,
        from,
        to
      });
      return this._applyWithTextFinding(issue, suggestion);
    }

    // Use TipTap's command system for the replacement
    const success = this.editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .insertContent(suggestion)
      .run();

    if (success) {
      this._log('✅ Successfully applied suggestion with direct positions', {
        from,
        to,
        suggestion
      });
      return true;
    } else {
      this._log('❌ Command execution failed for direct positions');
      return false;
    }
  }

  /**
   * Apply suggestion by finding the text content first
   * More reliable when positions might be stale
   */
  _applyWithTextFinding(issue, suggestion) {
    const searchText = issue.originalText || issue.text;
    if (!searchText) {
      this._log('❌ No text to search for');
      return false;
    }

    // Find the text in the current document
    const foundPosition = this._findTextInDocument(searchText);
    if (!foundPosition) {
      this._log('❌ Could not find text in document', { searchText });
      return false;
    }

    // Apply the replacement using the found position
    const success = this.editor
      .chain()
      .focus()
      .setTextSelection({ from: foundPosition.from, to: foundPosition.to })
      .insertContent(suggestion)
      .run();

    if (success) {
      this._log('✅ Successfully applied suggestion with text finding', {
        searchText,
        foundPosition,
        suggestion
      });
      return true;
    } else {
      this._log('❌ Command execution failed for text finding');
      return false;
    }
  }

  /**
   * Apply suggestion using grammar extension's decoration tracking
   * Falls back method when other approaches fail
   */
  _applyWithDecorationTracking(issue, suggestion) {
    // This method would integrate with the grammar extension
    // to get the most current positions from decorations
    this._log('🔄 Attempting decoration-based replacement (not yet implemented)');
    
    // For now, fall back to a simpler approach
    if (issue.text || issue.originalText) {
      return this._applyWithTextFinding(issue, suggestion);
    }
    
    return false;
  }

  /**
   * Find text content in the document and return its position
   * Uses TipTap's document traversal for accuracy
   */
  _findTextInDocument(searchText, startPos = 0) {
    if (!searchText || !this.editor.state.doc) {
      return null;
    }

    const doc = this.editor.state.doc;
    const docText = doc.textContent;
    
    // Find the text in the document content
    const textIndex = docText.indexOf(searchText, startPos);
    if (textIndex === -1) {
      this._log('❌ Text not found in document', { searchText, startPos });
      return null;
    }

    // Convert text position to document position
    // Walk through the document to find the exact position
    let currentPos = 0;
    let docPos = 1; // Start at position 1 (after initial doc node)
    let found = false;

    doc.descendants((node, pos) => {
      if (found) return false;

      if (node.isText) {
        const nodeEnd = currentPos + node.text.length;
        
        if (textIndex >= currentPos && textIndex < nodeEnd) {
          // Found the text within this node
          const offsetInNode = textIndex - currentPos;
          const from = pos + offsetInNode;
          const to = from + searchText.length;
          
          this._log('✅ Found text in document', {
            searchText,
            textIndex,
            from,
            to,
            nodeText: node.text
          });
          
          found = { from, to };
          return false;
        }
        
        currentPos = nodeEnd;
      }
    });

    return found || null;
  }

  /**
   * Check if issue has valid position information
   */
  _hasValidPositions(issue) {
    const from = issue.from || issue.position?.from;
    const to = issue.to || issue.position?.to;
    return this._validatePositions(from, to);
  }

  /**
   * Validate that positions are numbers and within document bounds
   */
  _validatePositions(from, to) {
    if (typeof from !== 'number' || typeof to !== 'number') {
      return false;
    }

    if (from < 0 || to < from) {
      return false;
    }

    const docSize = this.editor.state.doc.content.size;
    if (from > docSize || to > docSize) {
      return false;
    }

    return true;
  }

  /**
   * Replace text at specific range (utility method)
   * Uses TipTap commands for proper integration
   */
  replaceRange(from, to, replacement) {
    if (!this._validatePositions(from, to)) {
      this._log('❌ Invalid range for replacement', { from, to });
      return false;
    }

    const success = this.editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .insertContent(replacement)
      .run();

    if (success) {
      this._log('✅ Successfully replaced range', { from, to, replacement });
    } else {
      this._log('❌ Failed to replace range', { from, to, replacement });
    }

    return success;
  }

  /**
   * Get current cursor position
   */
  getCursorPosition() {
    if (!this.editor?.state?.selection) {
      return 0;
    }
    return this.editor.state.selection.from;
  }

  /**
   * Set cursor position using TipTap commands
   */
  setCursorPosition(position) {
    if (typeof position !== 'number' || position < 0) {
      return false;
    }

    const docSize = this.editor.state.doc.content.size;
    const safePos = Math.min(position, docSize);

    return this.editor
      .chain()
      .focus()
      .setTextSelection({ from: safePos, to: safePos })
      .run();
  }

  /**
   * Get text content between positions
   */
  getTextBetween(from, to) {
    if (!this._validatePositions(from, to)) {
      return '';
    }
    return this.editor.state.doc.textBetween(from, to);
  }

  /**
   * Debug helper: Log document structure
   */
  debugDocumentStructure() {
    if (!this.editor?.state?.doc) {
      this._log('❌ No document available for debugging');
      return;
    }

    const doc = this.editor.state.doc;
    this._log('📋 Document Debug Info:', {
      textContent: doc.textContent,
      contentSize: doc.content.size,
      selection: this.editor.state.selection
    });

    let textOffset = 0;
    doc.descendants((node, pos) => {
      if (node.isText) {
        this._log(`Text node at doc pos ${pos}: "${node.text}" (text offset: ${textOffset}-${textOffset + node.text.length})`);
        textOffset += node.text.length;
      } else {
        this._log(`${node.type.name} node at doc pos ${pos}`);
      }
    });
  }

  /**
   * Private logging method
   */
  _log(message, data = null) {
    if (this.debug) {
      if (data) {
        console.log(`[CommandBasedReplacer] ${message}`, data);
      } else {
        console.log(`[CommandBasedReplacer] ${message}`);
      }
    }
  }
}

/**
 * Create a CommandBasedReplacer instance for an editor
 * @param {Object} editor - TipTap editor instance
 * @returns {CommandBasedReplacer} Replacer instance
 */
export function createCommandBasedReplacer(editor) {
  return new CommandBasedReplacer(editor);
}

export default CommandBasedReplacer;
