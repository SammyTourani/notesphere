/**
 * useGrammarIntegration Hook
 * Manages grammar controller and sidebar integration
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { getUnifiedGrammarController } from '../services/UnifiedGrammarController';
import { createLogger } from '../utils/logger';

const logger = createLogger('useGrammarIntegration');

export function useGrammarIntegration(editor) {
  const [isGrammarSidebarVisible, setIsGrammarSidebarVisible] = useState(false);
  
  const grammarControllerRef = useRef(null);
  const grammarInsightsRef = useRef(null);
  const issueFocusTimeoutRef = useRef(null);
  const lastClickTimeRef = useRef(0);

  // Initialize grammar controller when editor is ready
  useEffect(() => {
    if (!editor) return;

    // Get singleton grammar controller
    grammarControllerRef.current = getUnifiedGrammarController();
    
    // Register editor
    grammarControllerRef.current.registerEditor(editor);

    return () => {
      // Cleanup
      if (grammarControllerRef.current) {
        grammarControllerRef.current.unregisterEditor();
      }
    };
  }, [editor]);

  // Handle issue click from grammar decorations
  const handleIssueClick = useCallback((issue) => {
    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      return;
    }
    lastClickTimeRef.current = now;

    // Clear pending focus operations
    if (issueFocusTimeoutRef.current) {
      clearTimeout(issueFocusTimeoutRef.current);
    }

    // Open sidebar if not visible
    const wasVisible = isGrammarSidebarVisible;
    if (!wasVisible) {
      setIsGrammarSidebarVisible(true);
    }

    // Calculate delay for animation
    const sidebarAnimationTime = wasVisible ? 0 : 350;
    const tabSwitchTime = 100;
    const extraBuffer = 50;
    const totalWaitTime = sidebarAnimationTime + tabSwitchTime + extraBuffer;

    // Schedule focus after animations
    issueFocusTimeoutRef.current = setTimeout(() => {
      if (grammarInsightsRef.current?.focusOnIssue) {
        grammarInsightsRef.current.focusOnIssue(issue);
      } else {
        // Retry after short delay
        setTimeout(() => {
          grammarInsightsRef.current?.focusOnIssue?.(issue);
        }, 100);
      }
    }, totalWaitTime);
  }, [isGrammarSidebarVisible]);

  // Register callbacks with grammar extension
  useEffect(() => {
    if (!editor) return;

    import('../extensions/GrammarExtension')
      .then(({ registerGrammarAssistantCallbacks }) => {
        const callbacks = {
          openGrammarAssistant: handleIssueClick,
          focusOnIssue: handleIssueClick
        };
        registerGrammarAssistantCallbacks(callbacks);
      })
      .catch(error => {
        logger.error('Failed to register grammar callbacks:', error);
      });
  }, [editor, handleIssueClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (issueFocusTimeoutRef.current) {
        clearTimeout(issueFocusTimeoutRef.current);
      }
    };
  }, []);

  const toggleGrammarSidebar = useCallback(() => {
    setIsGrammarSidebarVisible(prev => !prev);
  }, []);

  const closeGrammarSidebar = useCallback(() => {
    setIsGrammarSidebarVisible(false);
  }, []);

  return {
    isGrammarSidebarVisible,
    toggleGrammarSidebar,
    closeGrammarSidebar,
    grammarControllerRef,
    grammarInsightsRef,
    handleIssueClick
  };
}

export default useGrammarIntegration;
