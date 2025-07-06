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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import grammarEngine, { GRAMMAR_CATEGORIES } from '../../services/GrammarEngine';

const GrammarPro = ({ editor, content, onContentUpdate }) => {
  // Core state
  const [isActive, setIsActive] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [issues, setIssues] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  
  // UI state
  const [writingScore, setWritingScore] = useState(85);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('issues');
  
  // Performance state
  const [statistics, setStatistics] = useState({
    totalChecks: 0,
    averageScore: 85,
    improvementTrend: 0
  });

  // Refs
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const lastContentRef = useRef('');

  // Initialize grammar engine integration
  useEffect(() => {
    // Set up event listeners
    const handleIssuesFound = (data) => {
      console.log('📋 Issues found:', data);
    };

    const handleCheckStarted = () => {
      setIsChecking(true);
    };

    const handleCheckCompleted = () => {
      setIsChecking(false);
    };

    const handleError = (error) => {
      console.error('Grammar error:', error);
      setIsChecking(false);
    };

    // Register event listeners
    grammarEngine.on('issuesFound', handleIssuesFound);
    grammarEngine.on('checkStarted', handleCheckStarted);
    grammarEngine.on('checkCompleted', handleCheckCompleted);
    grammarEngine.on('error', handleError);

    return () => {
      // Cleanup
      grammarEngine.off('issuesFound', handleIssuesFound);
      grammarEngine.off('checkStarted', handleCheckStarted);
      grammarEngine.off('checkCompleted', handleCheckCompleted);
      grammarEngine.off('error', handleError);
    };
  }, []);

  // Debounced grammar checking
  const performGrammarCheck = useCallback(async (text) => {
    if (!text || text.trim().length < 10 || text === lastContentRef.current) {
      return;
    }

    lastContentRef.current = text;

    try {
      setIsChecking(true);
      const result = await grammarEngine.checkText(text, {
        context: 'general',
        enableCache: true,
        enableIncremental: true
      });

      setIssues(result.issues || []);
      setAnalysis(result.analysis || null);
      
      if (result.analysis) {
        setWritingScore(result.analysis.writingScore || 85);
      }

      // Update statistics
      setStatistics(prev => ({
        totalChecks: prev.totalChecks + 1,
        averageScore: Math.round((prev.averageScore + (result.analysis?.writingScore || 85)) / 2),
        improvementTrend: result.analysis?.writingScore > prev.averageScore ? 1 : -1
      }));

    } catch (error) {
      console.error('Grammar check failed:', error);
      setIssues([]);
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
  const applySuggestion = useCallback((issue, suggestion) => {
    if (!editor || !onContentUpdate) return;

    try {
      // Apply suggestion using grammar engine
      const newText = grammarEngine.applySuggestion(content, issue, suggestion);
      
      // Update editor
      editor.commands.setContent(newText);
      onContentUpdate(newText);
      
      // Remove issue from list
      setIssues(prev => prev.filter(i => i.id !== issue.id));
      
      console.log('✅ Applied suggestion:', suggestion.text);
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    }
  }, [editor, content, onContentUpdate]);

  // Dismiss issue
  const dismissIssue = useCallback((issue) => {
    setIssues(prev => prev.filter(i => i.id !== issue.id));
    grammarEngine.dismissIssue(issue.id);
  }, []);

  // Auto-fix issues
  const handleAutoFix = useCallback(() => {
    const autoFixableIssues = grammarEngine.getAutoFixSuggestions(issues);
    
    if (autoFixableIssues.length > 0) {
      const newText = grammarEngine.batchApplySuggestions(
        content, 
        autoFixableIssues
      );
      
      editor.commands.setContent(newText);
      onContentUpdate(newText);
      
      // Remove fixed issues
      const fixedIds = autoFixableIssues.map(fix => fix.issue.id);
      setIssues(prev => prev.filter(issue => !fixedIds.includes(issue.id)));
    }
  }, [issues, content, editor, onContentUpdate]);

  // Get issue statistics
  const getIssueStats = useCallback(() => {
    return issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {});
  }, [issues]);

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get score description
  const getScoreDescription = (score) => {
    if (score >= 95) return 'Exceptional';
    if (score >= 85) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 65) return 'Fair';
    return 'Needs Work';
  };

  const issueStats = getIssueStats();
  const totalIssues = issues.length;
  const autoFixableCount = issues.filter(i => i.metadata?.autoFixable).length;

  return (
    <>
      {/* Minimalist Grammar Button */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggleGrammar}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`relative flex items-center space-x-2 px-4 py-2 rounded-2xl border-2 transition-all duration-300 shadow-lg backdrop-blur-sm ${
          isActive 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-emerald-200 dark:shadow-emerald-800' 
            : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50/90 dark:hover:bg-gray-700/90 hover:border-gray-300 dark:hover:border-gray-500'
        }`}
      >
        {/* Icon */}
        <motion.span 
          className="text-lg"
          animate={{ rotate: isActive ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          {isActive ? '✨' : '📝'}
        </motion.span>
        
        {/* Text and Score */}
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold">
            {isActive ? 'Grammar Pro' : 'Grammar'}
          </span>
          {isActive && (
            <span className="text-xs opacity-90">
              Score: {writingScore}/100
            </span>
          )}
        </div>
        
        {/* Issue Count Badge */}
        <AnimatePresence>
          {isActive && totalIssues > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg"
            >
              {totalIssues}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Checking Indicator */}
        {isChecking && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1 -right-1 w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-50"
          >
            {isActive ? 'Close Grammar Pro' : 'Open Grammar Pro'}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right-Side Panel (Grammarly Style) */}
      <AnimatePresence>
        {showPanel && isActive && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowPanel(false)}
            />
            
            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold flex items-center space-x-2">
                      <span>✨</span>
                      <span>Grammar Pro</span>
                    </h2>
                    <p className="text-sm opacity-90">
                      {isChecking ? 'Analyzing your writing...' : 
                       totalIssues === 0 ? 'Your writing looks great!' :
                       `${totalIssues} suggestion${totalIssues !== 1 ? 's' : ''} found`}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPanel(false)}
                    className="text-white/80 hover:text-white text-xl p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Writing Score */}
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm opacity-90">Writing Score</span>
                    <span className="text-2xl font-bold">{writingScore}/100</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${writingScore}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-white rounded-full h-2"
                    />
                  </div>
                  <div className="flex justify-between text-xs opacity-90">
                    <span>{getScoreDescription(writingScore)}</span>
                    {statistics.improvementTrend > 0 && (
                      <span className="flex items-center space-x-1">
                        <span>↗️</span>
                        <span>Improving</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                {totalIssues > 0 && (
                  <div className="flex space-x-2">
                    {autoFixableCount > 0 && (
                      <button
                        onClick={handleAutoFix}
                        className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition-colors backdrop-blur-sm"
                      >
                        🔧 Auto-fix ({autoFixableCount})
                      </button>
                    )}
                    <button
                      onClick={() => setIssues([])}
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition-colors backdrop-blur-sm"
                    >
                      🗑️ Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                {['issues', 'insights', 'stats'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-800 border-b-2 border-emerald-500'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab === 'issues' && `Issues (${totalIssues})`}
                    {tab === 'insights' && 'Insights'}
                    {tab === 'stats' && 'Stats'}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                {/* Issues Tab */}
                {activeTab === 'issues' && (
                  <div className="p-4">
                    {isChecking ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-current border-t-transparent rounded-full"
                          />
                          <span className="text-lg font-medium">Analyzing...</span>
                        </div>
                      </div>
                    ) : totalIssues === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-6xl mb-4"
                        >
                          🎉
                        </motion.span>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          Perfect Writing!
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          No grammar issues detected in your text.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(GRAMMAR_CATEGORIES).map(([categoryKey, category]) => {
                          const categoryIssues = issues.filter(issue => issue.category === categoryKey);
                          if (categoryIssues.length === 0) return null;

                          return (
                            <motion.div 
                              key={categoryKey}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                                <span className="text-xl">{category.icon}</span>
                                <span>{category.name}</span>
                                <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                  {categoryIssues.length}
                                </span>
                              </h3>
                              
                              <div className="space-y-3">
                                {categoryIssues.map((issue, index) => (
                                  <motion.div
                                    key={issue.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-l-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                    style={{ borderLeftColor: category.color }}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <span className="font-semibold px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-sm">
                                            "{issue.originalText}"
                                          </span>
                                          <span className={`text-xs px-2 py-1 rounded-full ${
                                            issue.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                            issue.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                          }`}>
                                            {issue.severity}
                                          </span>
                                        </div>
                                        
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                          {issue.message.replace(/^[🔤📝❗✨💡]\s*/, '')}
                                        </p>
                                        
                                        {issue.suggestions.length > 0 && (
                                          <div className="flex flex-wrap gap-2">
                                            {issue.suggestions.slice(0, 3).map((suggestion, suggestionIndex) => (
                                              <motion.button
                                                key={suggestionIndex}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => applySuggestion(issue, suggestion)}
                                                className="px-3 py-1 text-sm bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg transition-colors font-medium shadow-sm"
                                              >
                                                "{suggestion.text}"
                                              </motion.button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      
                                      <button
                                        onClick={() => dismissIssue(issue)}
                                        className="ml-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-lg p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Insights Tab */}
                {activeTab === 'insights' && (
                  <div className="p-4 space-y-4">
                    {analysis ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Readability</h4>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                              {analysis.readabilityScore}/100
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Vocabulary</h4>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {analysis.vocabularyDiversity}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Text Statistics</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Words: <span className="font-medium">{analysis.wordCount}</span></div>
                            <div>Sentences: <span className="font-medium">{analysis.sentenceCount}</span></div>
                            <div>Avg Length: <span className="font-medium">{Math.round(analysis.averageSentenceLength)}</span></div>
                            <div>Complexity: <span className="font-medium">{analysis.complexityScore}%</span></div>
                          </div>
                        </div>

                        {analysis.toneAnalysis && (
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tone Analysis</h4>
                            <div className="text-sm space-y-1">
                              <div>Style: <span className="font-medium capitalize">{analysis.toneAnalysis.dominant}</span></div>
                              <div>Formality: <span className="font-medium">{analysis.toneAnalysis.formalityScore}%</span></div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Run grammar check to see insights
                      </div>
                    )}
                  </div>
                )}

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                  <div className="p-4 space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Session Statistics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Checks:</span>
                          <span className="font-medium">{statistics.totalChecks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Score:</span>
                          <span className="font-medium">{statistics.averageScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Issues Found:</span>
                          <span className="font-medium">{totalIssues}</span>
                        </div>
                      </div>
                    </div>

                    {Object.entries(issueStats).map(([category, count]) => {
                      if (category === 'total') return null;
                      const categoryData = GRAMMAR_CATEGORIES[category];
                      return (
                        <div key={category} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span>{categoryData.icon}</span>
                              <span className="font-medium capitalize">{category}</span>
                            </div>
                            <span className="font-bold text-lg">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default GrammarPro;
