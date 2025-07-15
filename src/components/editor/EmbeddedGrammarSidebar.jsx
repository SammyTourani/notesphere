/**
 * 🎨 EMBEDDED GRAMMAR SIDEBAR - PREMIUM IN-EDITOR DESIGN
 * 
 * A beautiful sidebar that slides into the note editor from the right,
 * pushing content to the left for a seamless editing experience.
 * 
 * ✨ FEATURES:
 * - Embedded within SingleNoteEditor (not floating)
 * - Smooth slide animations with content adjustment
 * - Premium glassmorphism design
 * - Real-time grammar analysis
 * - One-click auto-fix functionality
 * - Writing analytics dashboard
 * - Elegant visual indicators
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  BarChart3,
  Sparkles,
  TrendingUp,
  Target,
  BookOpen
} from 'lucide-react';

const EmbeddedGrammarSidebar = ({ 
  editor, 
  isVisible, 
  onToggle, 
  content,
  onContentUpdate 
}) => {
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
    autoFixableCount: 0,
    readabilityScore: 85,
    professionalismScore: 90,
    clarityScore: 88
  });

  // === REFS ===
  const sidebarRef = useRef(null);
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

  // === ISSUE CATEGORIES ===
  const categoryStyles = {
    spelling: { 
      color: 'text-red-600 dark:text-red-400', 
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: AlertCircle 
    },
    grammar: { 
      color: 'text-blue-600 dark:text-blue-400', 
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: BookOpen 
    },
    style: { 
      color: 'text-purple-600 dark:text-purple-400', 
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: Sparkles 
    },
    punctuation: { 
      color: 'text-orange-600 dark:text-orange-400', 
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: Target 
    },
    word_choice: { 
      color: 'text-green-600 dark:text-green-400', 
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: TrendingUp 
    },
    default: { 
      color: 'text-gray-600 dark:text-gray-400', 
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      icon: Info 
    }
  };

  // === INITIALIZE TEXT REPLACER ===
  useEffect(() => {
    if (editor && !textReplacer) {
      const replacer = createCommandBasedReplacer(editor);
      setTextReplacer(replacer);
    }
  }, [editor, textReplacer]);

  // === AUTO-FIX FUNCTION ===
  const autoFixIssue = useCallback(async (issue, suggestion) => {
    if (!editor || !suggestion) return;

    try {
      console.log('🔧 Auto-fixing issue:', issue.text, '→', suggestion);
      
      // Get current content from editor
      const currentContent = editor.getText();
      const targetText = issue.displayText || issue.text;
      
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

      console.warn('⚠️ All auto-fix methods failed for issue:', issue);
      
    } catch (error) {
      console.error('❌ Error during auto-fix:', error);
    }
  }, [editor, textReplacer, removeIssue]);

  // === CONTENT ANALYSIS ===
  const analyzeContent = useCallback(async () => {
    if (!content || !content.trim()) {
      setIssues([]);
      setAnalytics(prev => ({ ...prev, totalIssues: 0, autoFixableCount: 0 }));
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🔍 EmbeddedGrammarSidebar: Analyzing content...');
      const result = await advancedGrammarService.checkText(content);
      
      if (result && result.issues) {
        const processedIssues = result.issues.map((issue, index) => ({
          ...issue,
          id: issue.id || `issue-${index}-${Date.now()}`,
          displayText: issue.text || issue.match,
          isAutoFixable: !!(issue.suggestions && issue.suggestions.length > 0)
        }));

        setIssues(processedIssues);
        
        const autoFixableCount = processedIssues.filter(i => i.isAutoFixable).length;
        const totalWords = content.split(/\s+/).filter(word => word.length > 0).length;
        const writingScore = Math.max(0, Math.min(100, 100 - (processedIssues.length * 2)));
        
        setAnalytics(prev => ({
          ...prev,
          totalIssues: processedIssues.length,
          autoFixableCount,
          totalWords,
          writingScore,
          readabilityScore: Math.max(60, 100 - (processedIssues.length * 1.5)),
          professionalismScore: Math.max(70, 100 - (processedIssues.length * 1.8)),
          clarityScore: Math.max(65, 100 - (processedIssues.length * 1.6))
        }));

        console.log(`✅ Found ${processedIssues.length} issues (${autoFixableCount} auto-fixable)`);
      }
    } catch (error) {
      console.error('❌ Error analyzing content:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [content]);

  // === DEBOUNCED CONTENT ANALYSIS ===
  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      if (isVisible) {
        analyzeContent();
      }
    }, 1500);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [content, isVisible, analyzeContent]);

  // === RENDER ISSUE ITEM ===
  const renderIssueItem = (issue, index) => {
    const category = categoryStyles[issue.category] || categoryStyles.default;
    const IconComponent = category.icon;
    const suggestion = issue.suggestions?.[0];

    return (
      <motion.div
        key={issue.id}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ delay: index * 0.03, type: "spring", damping: 25 }}
        className="group relative p-5 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/40 hover:shadow-xl hover:shadow-gray-200/20 dark:hover:shadow-gray-900/20 transition-all duration-300 hover:scale-[1.01]"
      >
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl ${category.bg} ${category.color} shadow-sm`}>
            <IconComponent size={18} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h4 className={`font-semibold text-sm ${category.color} tracking-wide`}>
                {issue.category?.replace('_', ' ').toUpperCase() || 'STYLE'}
              </h4>
              {issue.isAutoFixable && (
                <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-semibold shadow-sm">
                  Auto-fixable
                </span>
              )}
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">
              {issue.message || issue.description || 'Grammar issue detected'}
            </p>
            
            {issue.displayText && (
              <div className="mb-4 p-3 bg-red-50/80 dark:bg-red-900/20 rounded-xl border border-red-200/50 dark:border-red-800/30">
                <span className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wide">Found:</span>
                <div className="mt-1 px-3 py-2 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 text-sm rounded-lg font-mono">
                  "{issue.displayText}"
                </div>
              </div>
            )}
            
            {suggestion && (
              <div className="mb-4 p-3 bg-green-50/80 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-800/30">
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wide">Suggestion:</span>
                <div className="mt-1 px-3 py-2 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-sm rounded-lg font-mono">
                  "{suggestion}"
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              {issue.isAutoFixable && suggestion ? (
                <motion.button
                  onClick={() => autoFixIssue(issue, suggestion)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm rounded-xl font-semibold shadow-lg shadow-green-500/25 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Zap size={14} />
                  Fix
                </motion.button>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2.5 bg-gray-400/70 text-white text-sm rounded-xl font-semibold">
                  <Eye size={14} />
                  Manual
                </span>
              )}
              
              <motion.button
                onClick={() => removeIssue(issue.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm rounded-xl font-semibold transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X size={14} />
                Dismiss
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // === RENDER ANALYTICS TAB ===
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Writing Score */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <BarChart3 className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Writing Score</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {analytics.writingScore}
          </div>
          <div className="flex-1">
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${analytics.writingScore}%` }}
              />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {analytics.writingScore >= 90 ? 'Excellent' : 
               analytics.writingScore >= 80 ? 'Good' : 
               analytics.writingScore >= 70 ? 'Fair' : 'Needs Work'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.totalWords}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Words</div>
        </div>
        
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {analytics.totalIssues}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Issues</div>
        </div>
        
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {analytics.fixedIssues}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Fixed</div>
        </div>
        
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {analytics.autoFixableCount}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Auto-fixable</div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 dark:text-white">Quality Metrics</h4>
        
        {[
          { label: 'Readability', score: analytics.readabilityScore, color: 'green' },
          { label: 'Professionalism', score: analytics.professionalismScore, color: 'purple' },
          { label: 'Clarity', score: analytics.clarityScore, color: 'orange' }
        ].map(metric => (
          <div key={metric.label} className="flex items-center gap-3">
            <span className="w-24 text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`bg-${metric.color}-500 h-2 rounded-full transition-all duration-500`}
                style={{ width: `${metric.score}%` }}
              />
            </div>
            <span className="w-8 text-sm font-medium text-gray-900 dark:text-white">{metric.score}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={sidebarRef}
          initial={{ x: '100%', opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: '100%', opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
          className="h-full w-[450px] bg-gradient-to-br from-white/98 via-gray-50/95 to-white/98 dark:from-gray-900/98 dark:via-gray-800/95 dark:to-gray-900/98 backdrop-blur-2xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden"
        >
          {/* Minimalistic Premium Header */}
          <div className="px-8 py-6 border-b border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-white/80 via-gray-50/60 to-white/80 dark:from-gray-800/80 dark:via-gray-900/60 dark:to-gray-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                    Grammar Assistant
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    AI-Powered Writing Enhancement
                  </p>
                </div>
              </div>
              <motion.button
                onClick={onToggle}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={16} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </motion.button>
            </div>
            
            {/* Premium Tab Navigation */}
            <div className="flex bg-white/70 dark:bg-gray-800/70 rounded-2xl p-1.5 shadow-inner backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/20">
              <button
                onClick={() => setActiveTab('issues')}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'issues'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <AlertCircle size={14} />
                  Issues ({analytics.totalIssues})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === 'analytics'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <BarChart3 size={14} />
                  Analytics
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="h-full overflow-y-auto px-8 py-6 pb-24">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-6">
                  <div className="w-12 h-12 border-3 border-blue-200 dark:border-blue-800 rounded-full animate-spin" />
                  <div className="absolute top-0 left-0 w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Analyzing your writing</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Using advanced AI to detect grammar issues...</p>
                </div>
              </div>
            ) : activeTab === 'issues' ? (
              <div className="space-y-5">
                {issues.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-3">
                      Excellent Writing! 🎉
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                      No grammar issues detected in your text. Your writing looks polished and professional.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {issues.map((issue, index) => renderIssueItem(issue, index))}
                  </AnimatePresence>
                )}
              </div>
            ) : (
              renderAnalytics()
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmbeddedGrammarSidebar; 