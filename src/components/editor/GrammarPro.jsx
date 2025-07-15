/**
 * 🚀 NoteSphere Grammar Pro - Ultimate UI Component
 * The world's most advanced grammar checking interface
 * 
 * Features:
 * - Right-side sliding panel (Grammarly-style)
 * - Minimalist floating button
 * - Real-time writing analytics
 * - Interactive issue management
 * - Beautiful animations and transitions
 * - Accessibility-first design
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, BarChart3, Sparkles, Zap, X } from 'lucide-react';
// PRIVACY FIX: Replace GrammarEngine (external API) with AdvancedGrammarService (offline)
import AdvancedGrammarService from '../../services/AdvancedGrammarService';

// Create instance of AdvancedGrammarService
const advancedGrammarService = new AdvancedGrammarService();

const GrammarPro = ({ editor, content, isVisible, onToggle }) => {
  const [issues, setIssues] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [writingScore, setWritingScore] = useState(85);
  const [statistics, setStatistics] = useState({
    totalChecks: 0,
    averageScore: 85,
    improvementTrend: 0
  });

  const lastContentRef = useRef('');
  const panelRef = useRef(null);

  // GRAMMAR CATEGORIES for UI consistency
  const GRAMMAR_CATEGORIES = {
    grammar: {
      id: 'grammar',
      name: 'Grammar',
      color: 'red',
      icon: '⚠️',
      description: 'Grammar and syntax errors'
    },
    spelling: {
      id: 'spelling',
      name: 'Spelling',
      color: 'orange',
      icon: '🔤',
      description: 'Spelling mistakes'
    },
    style: {
      id: 'style',
      name: 'Style',
      color: 'blue',
      icon: '✨',
      description: 'Style and clarity improvements'
    },
    punctuation: {
      id: 'punctuation',
      name: 'Punctuation',
      color: 'purple',
      icon: '❗',
      description: 'Punctuation errors'
    }
  };

  // Initialize the advanced grammar service
  useEffect(() => {
    const initializeGrammar = async () => {
      try {
        console.log('🚀 GrammarPro: Initializing AdvancedGrammarService (offline)...');
        const initialized = await advancedGrammarService.initialize();
        if (initialized) {
          console.log('✅ GrammarPro: AdvancedGrammarService ready');
        } else {
          console.warn('⚠️ GrammarPro: AdvancedGrammarService initialization failed');
        }
      } catch (error) {
        console.error('❌ GrammarPro: Error initializing AdvancedGrammarService:', error);
      }
    };
    
    initializeGrammar();
  }, []);

  // PRIVACY-SAFE grammar checking using offline AdvancedGrammarService
  const performGrammarCheck = useCallback(async (text) => {
    if (!text || text.trim().length < 10 || text === lastContentRef.current) {
      return;
    }

    lastContentRef.current = text;

    try {
      setIsChecking(true);
      console.log('🔍 GrammarPro: Checking grammar with offline AdvancedGrammarService...');
      
      // Use OFFLINE AdvancedGrammarService instead of external API
      const result = await advancedGrammarService.checkText(text, {
        categories: ['grammar', 'spelling', 'style', 'punctuation'],
        language: 'en-US'
      });

      // Extract issues from the result
      const grammarIssues = result.issues || result || [];
      
      setIssues(grammarIssues);
      
      // Calculate writing score based on issues
      const totalWords = text.split(/\s+/).length;
      const errorRate = grammarIssues.length / Math.max(totalWords, 1);
      const calculatedScore = Math.max(20, Math.min(100, 100 - (errorRate * 200)));
      setWritingScore(Math.round(calculatedScore));

      // Create analysis object
      const analysisData = {
        writingScore: Math.round(calculatedScore),
        totalIssues: grammarIssues.length,
        categories: grammarIssues.reduce((acc, issue) => {
          acc[issue.category] = (acc[issue.category] || 0) + 1;
          return acc;
        }, {}),
        readability: 'Good', // Simplified for now
        suggestions: grammarIssues.length > 0 ? `Found ${grammarIssues.length} suggestions for improvement` : 'Great writing!'
      };
      
      setAnalysis(analysisData);

      // Update statistics
      setStatistics(prev => ({
        totalChecks: prev.totalChecks + 1,
        averageScore: Math.round((prev.averageScore + calculatedScore) / 2),
        improvementTrend: calculatedScore > prev.averageScore ? 1 : -1
      }));

      console.log(`✅ GrammarPro: Found ${grammarIssues.length} issues, score: ${Math.round(calculatedScore)}`);

    } catch (error) {
      console.error('❌ GrammarPro: Grammar check failed:', error);
      setIssues([]);
      setAnalysis(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Auto-check when content changes and grammar is active
  useEffect(() => {
    if (isActive && content) {
      const timeoutId = setTimeout(() => {
        performGrammarCheck(content);
      }, 1500);

      return () => clearTimeout(timeoutId);
    }
  }, [content, isActive, performGrammarCheck]);

  // Handle grammar toggle
  const handleToggleGrammar = useCallback(() => {
    setIsActive(prev => {
      const newActive = !prev;
      setShowPanel(newActive);
      
      if (newActive && content) {
        performGrammarCheck(content);
      }
      
      return newActive;
    });
  }, [content, performGrammarCheck]);

  // Apply suggestion
  const applySuggestion = useCallback((issue) => {
    if (!editor || !issue.suggestions || issue.suggestions.length === 0) return;

    try {
      const suggestion = issue.suggestions[0];
      const from = issue.offset;
      const to = issue.offset + issue.length;

      // Use TipTap's replace command for proper undo/redo support
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .insertContent(suggestion)
        .run();

      // Remove the fixed issue from the list
      setIssues(prev => prev.filter(i => i.id !== issue.id));
      
      console.log(`✅ GrammarPro: Applied suggestion "${suggestion}" for issue "${issue.message}"`);
    } catch (error) {
      console.error('❌ GrammarPro: Error applying suggestion:', error);
    }
  }, [editor]);

  // Get category info
  const getCategoryInfo = (category) => {
    return GRAMMAR_CATEGORIES[category] || GRAMMAR_CATEGORIES.grammar;
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'red';
      case 'warning': return 'yellow';
      case 'info': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <>
      {/* Floating Grammar Button */}
      <motion.button
        onClick={handleToggleGrammar}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 flex items-center justify-center transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{ zIndex: 1000 }}
      >
        {isChecking ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={20} />
          </motion.div>
        ) : (
          <Zap size={20} />
        )}
        
        {/* Issue count badge */}
        {issues.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
          >
            {issues.length}
          </motion.span>
        )}
      </motion.button>

      {/* Grammar Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed top-0 right-0 w-96 h-full bg-white dark:bg-gray-900 shadow-2xl z-40 overflow-y-auto"
            style={{ zIndex: 999 }}
          >
            {/* Panel Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-blue-500" size={20} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Grammar Pro</h3>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                    Offline
                  </span>
                  </div>
                  <button
                    onClick={() => setShowPanel(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                  <X size={20} />
                  </button>
                </div>

                {/* Writing Score */}
              {analysis && (
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Writing Score</span>
                    <span className={`text-lg font-bold ${writingScore >= 80 ? 'text-green-600' : writingScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {writingScore}/100
                    </span>
                  </div>
                  <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className={`h-full rounded-full ${writingScore >= 80 ? 'bg-green-500' : writingScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${writingScore}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  </div>
                )}
              </div>

            {/* Panel Content */}
                  <div className="p-4">
                    {isChecking ? (
                <div className="flex items-center justify-center py-8">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="text-blue-500"
                  >
                    <Sparkles size={24} />
                  </motion.div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Checking grammar...</span>
                        </div>
              ) : issues.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="mx-auto text-green-500 mb-2" size={32} />
                  <p className="text-gray-600 dark:text-gray-400">No grammar issues found!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Your writing looks great.</p>
                      </div>
                    ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Found {issues.length} issue{issues.length !== 1 ? 's' : ''}
                    </h4>
                  </div>

                  {issues.map((issue, index) => {
                    const categoryInfo = getCategoryInfo(issue.category);
                    const severityColor = getSeverityColor(issue.severity);

                          return (
                            <motion.div 
                        key={issue.id || index}
                        initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                  >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{categoryInfo.icon}</span>
                                      <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-1 rounded bg-${categoryInfo.color}-100 text-${categoryInfo.color}-700 dark:bg-${categoryInfo.color}-900/30 dark:text-${categoryInfo.color}-300`}>
                                {categoryInfo.name}
                                          </span>
                              <span className={`text-xs px-2 py-1 rounded bg-${severityColor}-100 text-${severityColor}-700 dark:bg-${severityColor}-900/30 dark:text-${severityColor}-300`}>
                                {issue.severity || 'error'}
                                          </span>
                                        </div>
                                        
                            <p className="text-sm text-gray-900 dark:text-white mb-2">
                              {issue.message || issue.shortMessage || 'Grammar issue detected'}
                            </p>
                            
                            {issue.suggestions && issue.suggestions.length > 0 && (
                              <div className="space-y-1">
                                {issue.suggestions.slice(0, 3).map((suggestion, idx) => (
                                      <button
                                    key={idx}
                                    onClick={() => applySuggestion(issue)}
                                    className="block w-full text-left text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                      >
                                    "{suggestion}"
                                      </button>
                                ))}
                              </div>
                            )}
                          </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

              {/* Statistics */}
              {statistics.totalChecks > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Session Stats</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{statistics.totalChecks}</div>
                      <div className="text-xs text-gray-500">Checks</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{statistics.averageScore}</div>
                      <div className="text-xs text-gray-500">Avg Score</div>
                        </div>
                  </div>
                  </div>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GrammarPro;
