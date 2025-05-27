import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import grammarService from '../../services/grammarService';

const GrammarChecker = ({ editor, content, onSuggestionApply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [grammarIssues, setGrammarIssues] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueStats, setIssueStats] = useState({});
  const panelRef = useRef(null);

  // Calculate issue statistics
  useEffect(() => {
    const stats = grammarIssues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {});
    setIssueStats(stats);
  }, [grammarIssues]);

  // Handle grammar check results
  const handleGrammarCheck = async (text, editorView) => {
    setIsChecking(true);
    try {
      const issues = await grammarService.checkText(text);
      setGrammarIssues(issues);
      
      // Update editor with grammar issues
      if (editor && editor.commands) {
        editor.commands.setGrammarIssues(issues);
        editor.commands.setGrammarChecking(false);
      }
    } catch (error) {
      console.warn('Grammar check failed:', error);
      setGrammarIssues([]);
    } finally {
      setIsChecking(false);
    }
  };

  // Handle suggestion click from editor
  const handleSuggestionClick = (issue, event) => {
    setSelectedIssue(issue);
    setIsOpen(true);
  };

  // Apply a suggestion
  const applySuggestion = (issue, suggestion) => {
    if (editor && editor.commands) {
      editor.commands.applySuggestion(issue, suggestion);
      
      // Remove the applied issue from the list
      setGrammarIssues(prev => prev.filter(i => i.id !== issue.id));
      setSelectedIssue(null);
      
      // Trigger content update callback
      if (onSuggestionApply) {
        const newContent = grammarService.applySuggestion(content, issue, suggestion);
        onSuggestionApply(newContent);
      }
    }
  };

  // Dismiss an issue
  const dismissIssue = (issue) => {
    setGrammarIssues(prev => prev.filter(i => i.id !== issue.id));
    setSelectedIssue(null);
  };

  // Clear all issues
  const clearAllIssues = () => {
    setGrammarIssues([]);
    setSelectedIssue(null);
    if (editor && editor.commands) {
      editor.commands.clearGrammarIssues();
    }
  };

  // Group issues by category
  const groupedIssues = grammarIssues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {});

  // Configure grammar extension when editor is ready
  useEffect(() => {
    if (editor && editor.extensionManager) {
      const grammarExtension = editor.extensionManager.extensions.find(ext => ext.name === 'grammar');
      if (grammarExtension) {
        grammarExtension.options.onGrammarCheck = handleGrammarCheck;
        grammarExtension.options.onSuggestionClick = handleSuggestionClick;
      }
    }
  }, [editor]);

  const issueCount = grammarIssues.length;

  return (
    <>
      {/* Grammar Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
          isOpen 
            ? 'bg-blue-500 text-white border-blue-500' 
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        <span className="text-sm">📝</span>
        <span className="text-sm font-medium">Grammar</span>
        
        {/* Issue Count Badge */}
        <AnimatePresence>
          {issueCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
            >
              {issueCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Checking Indicator */}
        {isChecking && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        )}
      </motion.button>

      {/* Grammar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-full left-0 mb-2 w-80 max-h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl overflow-hidden z-50"
          >
            {/* Panel Header */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Grammar Assistant
                </h3>
                <div className="flex items-center space-x-2">
                  {issueCount > 0 && (
                    <button
                      onClick={clearAllIssues}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Stats Summary */}
              {issueCount > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(issueStats).map(([category, count]) => {
                    if (category === 'total') return null;
                    const color = grammarService.getCategoryColor(category);
                    const icon = grammarService.getCategoryIcon(category);
                    
                    return (
                      <span
                        key={category}
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-${color}-100 text-${color}-800 dark:bg-${color}-900 dark:text-${color}-200`}
                      >
                        <span>{icon}</span>
                        <span className="capitalize">{category}</span>
                        <span>({count})</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Panel Content */}
            <div className="max-h-80 overflow-y-auto">
              {isChecking ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    <span className="text-sm">Checking grammar...</span>
                  </div>
                </div>
              ) : issueCount === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <span className="text-2xl">✨</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      No grammar issues found!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {Object.entries(groupedIssues).map(([category, issues]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 capitalize flex items-center space-x-2">
                        <span>{grammarService.getCategoryIcon(category)}</span>
                        <span>{category}</span>
                        <span className="text-xs text-gray-500">({issues.length})</span>
                      </h4>
                      
                      <div className="space-y-2">
                        {issues.map((issue) => (
                          <motion.div
                            key={issue.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-3 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-700 border-${grammarService.getCategoryColor(issue.category)}-400`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {issue.message}
                                </p>
                                
                                {issue.suggestions.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {issue.suggestions.slice(0, 3).map((suggestion, index) => (
                                      <button
                                        key={index}
                                        onClick={() => applySuggestion(issue, suggestion)}
                                        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded transition-colors"
                                      >
                                        "{suggestion}"
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <button
                                onClick={() => dismissIssue(issue)}
                                className="ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                              >
                                ✕
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GrammarChecker;