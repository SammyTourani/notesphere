/**
 * 🎯 MINIMALIST GRAMMAR PANEL - STREAMLINED & FUNCTIONAL
 * 
 * Clean, simple grammar interface focused on productivity
 * 
 * ✨ KEY FEATURES:
 * - Flat list of issues (no expandable categories)
 * - Clear visual indicators for auto-fixable vs manual issues
 * - Working one-click auto-fix functionality
 * - Minimalistic design with essential information only
 * - Fast and intuitive user experience
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createCommandBasedReplacer } from '../../services/CommandBasedReplacer';
import AdvancedGrammarService from '../../services/AdvancedGrammarService';

// Create instance of AdvancedGrammarService
const advancedGrammarService = new AdvancedGrammarService();
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X,
  Zap,
  Eye,
  BarChart3
} from 'lucide-react';

const MinimalistGrammarPanel = ({ editor, isVisible, onToggle, content }) => {
  // === CORE STATE ===
  const [issues, setIssues] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textReplacer, setTextReplacer] = useState(null);
  const [activeTab, setActiveTab] = useState('issues');
  
  // === ANALYTICS STATE ===
  const [analytics, setAnalytics] = useState({
    totalIssues: 0,
    fixedIssues: 0,
    writingScore: 100,
    totalWords: 0,
    autoFixableCount: 0
  });

  // === REFS ===
  const panelRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  // === REMOVE ISSUE ===
  const removeIssue = useCallback((issueId) => {
    setIssues(prev => prev.filter(i => i.id !== issueId));
    setAnalytics(prev => ({
      ...prev,
      fixedIssues: prev.fixedIssues + 1,
      totalIssues: prev.totalIssues - 1
    }));
  }, []);

  // === ISSUE CATEGORIES (for coloring and icons) ===
  const categoryStyles = {
    spelling: { 
      color: 'text-red-600', 
      bg: 'bg-red-50 border-red-200', 
      icon: '🔤' 
    },
    grammar: { 
      color: 'text-orange-600', 
      bg: 'bg-orange-50 border-orange-200', 
      icon: '📝' 
    },
    punctuation: { 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50 border-yellow-200', 
      icon: '❗' 
    },
    word_choice: { 
      color: 'text-purple-600', 
      bg: 'bg-purple-50 border-purple-200', 
      icon: '💭' 
    },
    style: { 
      color: 'text-blue-600', 
      bg: 'bg-blue-50 border-blue-200', 
      icon: '✨' 
    },
    idiom: { 
      color: 'text-green-600', 
      bg: 'bg-green-50 border-green-200', 
      icon: '🎭' 
    }
  };

  // === INITIALIZE COMMAND-BASED REPLACER ===
  useEffect(() => {
    if (editor) {
      const replacer = createCommandBasedReplacer(editor);
      setTextReplacer(replacer);
      console.log('✅ MinimalistGrammarPanel: CommandBasedReplacer initialized');
    }
  }, [editor]);

  // === PROCESS GRAMMAR ISSUES ===
  const processIssues = useCallback(async () => {
    if (!editor || !content) return;

    setIsProcessing(true);
    
    try {
      const textContent = typeof content === 'string' ? content : editor.getText();
      
      if (!textContent || textContent.trim().length < 10) {
        setIssues([]);
        updateAnalytics([], textContent);
        return;
      }

      console.log('🔍 MinimalistGrammarPanel: Analyzing with AdvancedGrammarService...');
      
      const grammarIssues = await advancedGrammarService.checkText(textContent);
      
      // Enhanced issue processing with auto-fix detection
      const processedIssues = grammarIssues.map(issue => ({
        ...issue,
        autoFixable: !!(issue.suggestions && issue.suggestions.length > 0 && issue.suggestions[0]),
        displayText: getDisplayText(issue, textContent)
      }));
      
      console.log('✅ MinimalistGrammarPanel: Found', processedIssues.length, 'issues');
      
      setIssues(processedIssues);
      updateAnalytics(processedIssues, textContent);

    } catch (error) {
      console.error('❌ MinimalistGrammarPanel: Error processing issues:', error);
      setIssues([]);
      updateAnalytics([], '');
    } finally {
      setIsProcessing(false);
    }
  }, [editor, content]);

  // === GET DISPLAY TEXT FOR ISSUE ===
  const getDisplayText = useCallback((issue, textContent) => {
    if (issue.originalText) return issue.originalText;
    if (issue.offset !== undefined && issue.length !== undefined) {
      return textContent.substring(issue.offset, issue.offset + issue.length);
    }
    return 'text';
  }, []);

  // === UPDATE ANALYTICS ===
  const updateAnalytics = useCallback((issueList, text) => {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const totalIssues = issueList.length;
    const autoFixableCount = issueList.filter(i => i.autoFixable).length;
    
    // Simple writing score calculation
    const writingScore = Math.max(0, Math.min(100, 100 - (totalIssues * 5)));

    setAnalytics(prev => ({
      ...prev,
      totalIssues,
      totalWords: words.length,
      writingScore: Math.round(writingScore),
      autoFixableCount
    }));
  }, []);

  // === HANDLE AUTO-FIX ===
  const handleAutoFix = useCallback(async (issue) => {
    if (!editor || !issue.autoFixable || !issue.suggestions?.[0]) {
      console.warn('⚠️ Cannot auto-fix issue:', issue);
      return;
    }

    try {
      const suggestion = issue.suggestions[0];
      console.log('🎯 MinimalistGrammarPanel: Auto-fixing issue:', {
        message: issue.message,
        original: issue.displayText,
        suggestion: suggestion,
        offset: issue.offset,
        length: issue.length
      });

      // Get current content from editor
      const currentContent = editor.getText();
      const targetText = issue.displayText;
      
      if (!targetText) {
        console.warn('⚠️ No target text available for replacement');
        return;
      }

      // Method 1: Simple string replacement (most reliable)
      if (currentContent.includes(targetText)) {
        const newContent = currentContent.replace(targetText, suggestion);
        if (newContent !== currentContent) {
          editor.commands.setContent(newContent, false);
          console.log('✅ Auto-fix successful with string replacement');
          removeIssue(issue.id);
          return;
        }
      }

      // Method 2: Try with offset-based positioning if available
      if (typeof issue.offset === 'number' && typeof issue.length === 'number') {
        const extractedText = currentContent.substring(issue.offset, issue.offset + issue.length);
        if (extractedText === targetText) {
          // Use TipTap's document position system (add 1 for ProseMirror position)
          const success = editor.chain()
            .focus()
            .setTextSelection({ from: issue.offset + 1, to: issue.offset + issue.length + 1 })
            .insertContent(suggestion)
            .run();
          
          if (success) {
            console.log('✅ Auto-fix successful with position-based replacement');
            removeIssue(issue.id);
            return;
          }
        }
      }

      // Method 3: Try CommandBasedReplacer as fallback
      if (textReplacer) {
        // Enhance the issue object for the replacer
        const enhancedIssue = {
          ...issue,
          originalText: targetText,
          text: targetText,
          position: issue.offset !== undefined ? {
            from: issue.offset + 1,
            to: issue.offset + issue.length + 1
          } : undefined
        };
        
        const success = textReplacer.applySuggestion(enhancedIssue, suggestion);
        if (success) {
          console.log('✅ Auto-fix successful with CommandBasedReplacer');
          removeIssue(issue.id);
          return;
        }
      }

      // Method 4: Find and replace using TipTap's text search
      const docText = editor.state.doc.textContent;
      const textIndex = docText.indexOf(targetText);
      if (textIndex !== -1) {
        // Convert to document positions
        let currentPos = 0;
        let docFrom = -1;
        
        editor.state.doc.descendants((node, pos) => {
          if (docFrom !== -1) return false;
          
          if (node.isText) {
            const nodeEnd = currentPos + node.text.length;
            if (textIndex >= currentPos && textIndex < nodeEnd) {
              const offsetInNode = textIndex - currentPos;
              docFrom = pos + offsetInNode;
              return false;
            }
            currentPos = nodeEnd;
          }
        });
        
        if (docFrom !== -1) {
          const docTo = docFrom + targetText.length;
          const success = editor.chain()
            .focus()
            .setTextSelection({ from: docFrom, to: docTo })
            .insertContent(suggestion)
            .run();
          
          if (success) {
            console.log('✅ Auto-fix successful with document search');
            removeIssue(issue.id);
            return;
          }
        }
      }

      console.warn('⚠️ All auto-fix methods failed for issue:', issue);
      
    } catch (error) {
      console.error('❌ Error during auto-fix:', error);
    }
  }, [editor, textReplacer, removeIssue]);

  // === DISMISS ISSUE ===
  const handleDismissIssue = useCallback((issueId) => {
    removeIssue(issueId);
  }, [removeIssue]);

  // === SORTED ISSUES ===
  const sortedIssues = useMemo(() => {
    return issues.sort((a, b) => {
      // Sort by severity first (error > warning > suggestion)
      const severityOrder = { error: 3, warning: 2, suggestion: 1 };
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      
      // Then by auto-fixable (auto-fixable first)
      if (a.autoFixable !== b.autoFixable) {
        return b.autoFixable ? 1 : -1;
      }
      
      // Finally by position
      return (a.offset || 0) - (b.offset || 0);
    });
  }, [issues]);

  // === AUTO-PROCESS WHEN CONTENT CHANGES ===
  useEffect(() => {
    if (isVisible && content) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(processIssues, 1500);
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [content, isVisible, processIssues]);

  // === RENDER ISSUE ITEM ===
  const renderIssueItem = (issue) => {
    const categoryStyle = categoryStyles[issue.category] || categoryStyles.grammar;
    const SeverityIcon = issue.severity === 'error' ? AlertCircle : 
                        issue.severity === 'warning' ? AlertTriangle : Info;
    
    return (
      <motion.div
        key={issue.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${categoryStyle.bg}`}
      >
        <div className="flex items-center justify-between">
          {/* Issue Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Category Icon & Severity */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              <span className="text-lg">{categoryStyle.icon}</span>
              <SeverityIcon className={`w-4 h-4 ${categoryStyle.color}`} />
            </div>
            
            {/* Issue Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {issue.message}
              </p>
              {issue.suggestions?.[0] && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">Fix:</span>
                  <span className="text-xs font-mono bg-red-100 px-1 py-0.5 rounded text-red-700">
                    "{issue.displayText}"
                  </span>
                  <span className="text-xs text-gray-400">→</span>
                  <span className="text-xs font-mono bg-green-100 px-1 py-0.5 rounded text-green-700">
                    "{issue.suggestions[0]}"
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {issue.autoFixable ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAutoFix(issue)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600 transition-colors"
                title="Auto-fix this issue"
              >
                <Zap className="w-3 h-3" />
                <span>Fix</span>
              </motion.button>
            ) : (
              <div className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-md" title="Manual fix required">
                <Eye className="w-3 h-3" />
                <span>Manual</span>
              </div>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDismissIssue(issue.id)}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              title="Dismiss issue"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  // === RENDER ANALYTICS ===
  const renderAnalytics = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-800">{analytics.writingScore}/100</div>
          <div className="text-xs text-blue-600">Writing Score</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-800">{analytics.autoFixableCount}</div>
          <div className="text-xs text-green-600">Auto-fixable</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-800">{analytics.totalWords}</div>
          <div className="text-xs text-gray-600">Words</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-800">{analytics.fixedIssues}</div>
          <div className="text-xs text-purple-600">Fixed</div>
        </div>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <motion.div
      ref={panelRef}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg 
                 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col z-50"
    >
      {/* Simple Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">✨</span>
            <h2 className="text-lg font-semibold">Grammar</h2>
            {analytics.totalIssues > 0 && (
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                {analytics.totalIssues}
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Simple Tab Selector */}
        <div className="flex space-x-1 mt-3">
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeTab === 'issues' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            Issues ({analytics.totalIssues})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeTab === 'analytics' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            Stats
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'issues' && (
            <motion.div
              key="issues"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {isProcessing && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full"></div>
                  <span className="ml-2 text-gray-600">Analyzing...</span>
                </div>
              )}

              {!isProcessing && sortedIssues.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">All good!</h3>
                  <p className="text-sm text-gray-600">No grammar issues found.</p>
                </div>
              )}

              {!isProcessing && sortedIssues.map(renderIssueItem)}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderAnalytics()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MinimalistGrammarPanel; 