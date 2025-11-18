/**
 * 🎨 INTERACTIVE GRAMMAR HIGHLIGHTER - NEXT-GENERATION GRAMMAR UX
 * 
 * Advanced interactive grammar visualization system that surpasses Grammarly
 * with beautiful inline highlighting, animated issue cards, and premium UX.
 * 
 * ✨ FEATURES:
 * - Real-time inline text highlighting
 * - Interactive issue cards with click/hover
 * - Advanced animations and micro-interactions
 * - Smart categorization with visual distinction
 * - One-click fixes with satisfying animations
 * - Writing insights and progress tracking
 * - Premium design language
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Target, 
  BookOpen,
  Sparkles,
  AlertCircle,
  Info,
  X,
  ThumbsUp,
  TrendingUp
} from 'lucide-react';

const InteractiveGrammarHighlighter = ({ 
  editor, 
  issues = [], 
  onFixIssue,
  onDismissIssue,
  isVisible = true 
}) => {
  // === CORE STATE ===
  const [activeIssue, setActiveIssue] = useState(null);
  const [issueCardPosition, setIssueCardPosition] = useState({ x: 0, y: 0 });
  const [highlightedRanges, setHighlightedRanges] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // === REFS ===
  const editorRef = useRef(null);
  const issueCardRef = useRef(null);

  // === ISSUE CATEGORY STYLES ===
  const categoryStyles = {
    spelling: { 
      color: 'rgb(239 68 68)', // red-500
      bg: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      icon: AlertCircle,
      label: 'Spelling',
      priority: 1
    },
    grammar: { 
      color: 'rgb(59 130 246)', // blue-500
      bg: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      icon: BookOpen,
      label: 'Grammar',
      priority: 2
    },
    style: { 
      color: 'rgb(147 51 234)', // purple-500
      bg: 'rgba(147, 51, 234, 0.1)',
      borderColor: 'rgba(147, 51, 234, 0.3)',
      icon: Sparkles,
      label: 'Style',
      priority: 3
    },
    punctuation: { 
      color: 'rgb(245 101 101)', // orange-500
      bg: 'rgba(245, 101, 101, 0.1)',
      borderColor: 'rgba(245, 101, 101, 0.3)',
      icon: Target,
      label: 'Punctuation',
      priority: 2
    },
    word_choice: { 
      color: 'rgb(34 197 94)', // green-500
      bg: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgba(34, 197, 94, 0.3)',
      icon: TrendingUp,
      label: 'Word Choice',
      priority: 3
    },
    default: { 
      color: 'rgb(107 114 128)', // gray-500
      bg: 'rgba(107, 114, 128, 0.1)',
      borderColor: 'rgba(107, 114, 128, 0.3)',
      icon: Info,
      label: 'Other',
      priority: 4
    }
  };

  // === HIGHLIGHT ISSUES IN EDITOR ===
  const highlightIssues = useCallback(() => {
    if (!editor || !isVisible || issues.length === 0) {
      return;
    }

    try {
      const { state, view } = editor;
      const doc = state.doc;
      const ranges = [];

      issues.forEach((issue, issueIndex) => {
        if (!issue.offset || !issue.length) return;

        const from = Math.max(1, issue.offset + 1); // Convert to ProseMirror position
        const to = Math.min(doc.content.size, from + issue.length);
        
        if (from >= to) return;

        const category = categoryStyles[issue.category] || categoryStyles.default;
        
        ranges.push({
          from,
          to,
          issue,
          category,
          issueIndex,
          id: `grammar-highlight-${issueIndex}`
        });
      });

      setHighlightedRanges(ranges);

      // Apply CSS highlighting
      ranges.forEach(range => {
        const { from, to, category, issueIndex } = range;
        
        // Create CSS highlight style
        const style = document.createElement('style');
        style.setAttribute('data-issue-id', `issue-${issueIndex}`);
        style.textContent = `
          .ProseMirror .grammar-highlight-${issueIndex} {
            background: linear-gradient(to bottom, ${category.bg} 0%, ${category.bg} 100%);
            border-bottom: 2px solid ${category.color};
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            animation: grammarPulse 2s infinite;
          }
          
          .ProseMirror .grammar-highlight-${issueIndex}:hover {
            background: ${category.bg};
            transform: translateY(-1px);
            box-shadow: 0 2px 8px ${category.borderColor};
          }
          
          @keyframes grammarPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `;
        
        document.head.appendChild(style);
      });

    } catch (error) {
      console.error('Error highlighting grammar issues:', error);
    }
  }, [editor, issues, isVisible]);

  // === CLICK HANDLER FOR HIGHLIGHTED TEXT ===
  const handleHighlightClick = useCallback((event, issue, position) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.target.getBoundingClientRect();
    const editorRect = editor.view.dom.getBoundingClientRect();
    
    setIssueCardPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    
    setActiveIssue(issue);
    setIsAnimating(true);
  }, [editor]);

  // === SETUP CLICK LISTENERS ===
  useEffect(() => {
    if (!editor || !isVisible) return;

    const editorDom = editor.view.dom;
    
    const handleClick = (event) => {
      // Check if clicked element has a grammar highlight class
      const target = event.target;
      const classList = target.classList;
      
      highlightedRanges.forEach(range => {
        if (classList.contains(`grammar-highlight-${range.issueIndex}`)) {
          handleHighlightClick(event, range.issue, range);
        }
      });
    };

    editorDom.addEventListener('click', handleClick);
    
    return () => {
      editorDom.removeEventListener('click', handleClick);
    };
  }, [editor, highlightedRanges, handleHighlightClick, isVisible]);

  // === UPDATE HIGHLIGHTS WHEN ISSUES CHANGE ===
  useEffect(() => {
    highlightIssues();
    
    return () => {
      // Clean up old highlight styles
      const oldStyles = document.querySelectorAll('style[data-issue-id]');
      oldStyles.forEach(style => style.remove());
    };
  }, [highlightIssues]);

  // === CLOSE ISSUE CARD ===
  const closeIssueCard = useCallback(() => {
    setActiveIssue(null);
    setIsAnimating(false);
  }, []);

  // === HANDLE FIX ISSUE ===
  const handleFixIssue = useCallback(async (issue, suggestion) => {
    setIsAnimating(true);
    
    // Call the fix function
    if (onFixIssue) {
      await onFixIssue(issue, suggestion);
    }
    
    // Satisfying animation
    setTimeout(() => {
      closeIssueCard();
      setIsAnimating(false);
    }, 500);
  }, [onFixIssue, closeIssueCard]);

  // === HANDLE DISMISS ISSUE ===
  const handleDismissIssue = useCallback((issue) => {
    if (onDismissIssue) {
      onDismissIssue(issue);
    }
    closeIssueCard();
  }, [onDismissIssue, closeIssueCard]);

  // === RENDER ISSUE CARD ===
  const renderIssueCard = () => {
    if (!activeIssue) return null;

    const category = categoryStyles[activeIssue.category] || categoryStyles.default;
    const IconComponent = category.icon;
    const suggestion = activeIssue.suggestions?.[0];

    return createPortal(
      <AnimatePresence>
        <motion.div
          ref={issueCardRef}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
          className="fixed z-[9999] pointer-events-auto"
          style={{
            left: issueCardPosition.x - 200, // Center the card
            top: issueCardPosition.y - 20,
            minWidth: '400px',
            maxWidth: '500px'
          }}
        >
          {/* Premium Issue Card */}
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {/* Card Header */}
            <div className={`px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30`} style={{ backgroundColor: category.bg }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl shadow-lg" style={{ backgroundColor: category.color, color: 'white' }}>
                    <IconComponent size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {category.label} Issue
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activeIssue.isAutoFixable ? 'Auto-fixable' : 'Manual review needed'}
                    </p>
                  </div>
                </div>
                
                <motion.button
                  onClick={closeIssueCard}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} className="text-gray-500 dark:text-gray-400" />
                </motion.button>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                {activeIssue.message || activeIssue.description || 'Grammar issue detected'}
              </p>

              {/* Found Text */}
              {activeIssue.displayText && (
                <div className="mb-4 p-4 bg-red-50/80 dark:bg-red-900/20 rounded-xl border border-red-200/50 dark:border-red-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-red-600 dark:text-red-400" />
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">Found:</span>
                  </div>
                  <div className="px-3 py-2 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 rounded-lg font-mono text-sm">
                    "{activeIssue.displayText}"
                  </div>
                </div>
              )}

              {/* Suggestion */}
              {suggestion && (
                <div className="mb-6 p-4 bg-green-50/80 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className="text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">Suggestion:</span>
                  </div>
                  <div className="px-3 py-2 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-lg font-mono text-sm">
                    "{suggestion}"
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {activeIssue.isAutoFixable && suggestion ? (
                  <motion.button
                    onClick={() => handleFixIssue(activeIssue, suggestion)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isAnimating}
                  >
                    <Zap size={16} />
                    {isAnimating ? 'Fixing...' : 'Fix Issue'}
                  </motion.button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-semibold">
                    <Info size={16} />
                    Manual Review
                  </div>
                )}
                
                <motion.button
                  onClick={() => handleDismissIssue(activeIssue)}
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Dismiss
                </motion.button>
              </div>
            </div>
          </div>

          {/* Pointer Arrow */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '10px solid rgba(255, 255, 255, 0.95)',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
            }}
          />
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  };

  // === CLICK OUTSIDE TO CLOSE ===
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeIssue && issueCardRef.current && !issueCardRef.current.contains(event.target)) {
        closeIssueCard();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeIssue, closeIssueCard]);

  return (
    <>
      {/* Issue Card Portal */}
      {renderIssueCard()}
      
      {/* Success Animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed top-4 right-4 z-[9999] bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span className="font-medium">Issue Fixed!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InteractiveGrammarHighlighter; 