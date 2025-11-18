/**
 * 🚀 ADVANCED GRAMMAR INSIGHTS DASHBOARD
 * 
 * Next-generation grammar visualization system that surpasses Grammarly
 * with interactive highlighting, smart analytics, and premium UX design.
 * 
 * ✨ FEATURES:
 * - Interactive inline highlighting with click-to-fix
 * - Advanced writing analytics and insights
 * - Real-time progress tracking
 * - Smart issue categorization and prioritization
 * - Beautiful animated charts and metrics
 * - One-click fixes with satisfying animations
 * - Writing improvement suggestions
 * - Premium design language
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveGrammarHighlighter from './GrammarHighlighter';
import { createCommandBasedReplacer } from '../services/ReplacementService';
import { registerGrammarAssistantCallbacks } from '../../editor/extensions/GrammarExtension';
// import GrammarTierSelector from '../GrammarTierSelector'; // TODO: Create this component
// import IssueCard from '../IssueCard'; // TODO: Create this component
// import AutoFixEngine from '../../services/AutoFixEngine'; // TODO: Create this service
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  CheckCircle2,
  AlertTriangle,
  Zap,
  Eye,
  Clock,
  Award,
  Brain,
  PieChart,
  Activity,
  Sparkles,
  BookOpen,
  AlertCircle,
  Info,
  X,
  ChevronRight,
  Filter,
  SortDesc
} from 'lucide-react';

const AdvancedGrammarInsights = React.forwardRef(({ 
  editor, 
  content, 
  isVisible, 
  onToggle, 
  onOpen,
  onContentUpdate,
  grammarController 
}, ref) => {
  // === CORE STATE ===
  const [issues, setIssues] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textReplacer, setTextReplacer] = useState(null);
  const [autoFixEngine, setAutoFixEngine] = useState(null);
  const [activeView, setActiveView] = useState('issues'); // Changed from 'overview' to 'issues'
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  
  // === ISSUE FOCUS STATE ===
  const [highlightedIssueId, setHighlightedIssueId] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isFocusingIssue, setIsFocusingIssue] = useState(false);
  const highlightTimeoutRef = useRef(null);
  const focusTimeoutRef = useRef(null);
  
  // === ANALYTICS STATE ===
  const [analytics, setAnalytics] = useState({
    totalIssues: 0,
    fixedIssues: 0,
    writingScore: 100,
    totalWords: 0,
    autoFixableCount: 0,
    readabilityScore: 85,
    professionalismScore: 90,
    clarityScore: 88,
    avgWordsPerSentence: 15,
    complexSentences: 0,
    passiveVoice: 0,
    categoryBreakdown: {},
    // 🧠 PHASE 1: Intelligence classification analytics
    intelligenceBreakdown: {
      autoFixable: 0,
      semiFixable: 0,
      manualOnly: 0,
      legacy: 0
    }
  });

  // === REALTIME WRITING STATS ===
  const [writingStats, setWritingStats] = useState({
    charactersTyped: 0,
    wordsPerMinute: 0,
    issuesFixed: 0,
    timeSpent: 0,
    streak: 0,
    sessionStartTime: Date.now()
  });

  // === REFS ===
  const updateTimeoutRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const sessionTimerRef = useRef(null);
  const issuesListRef = useRef(null);
  const focusedIssueRef = useRef(null);

  // === SESSION TIMER ===
  useEffect(() => {
    if (isVisible) {
      sessionTimerRef.current = setInterval(() => {
        setWritingStats(prev => ({
          ...prev,
          timeSpent: Math.floor((Date.now() - prev.sessionStartTime) / 1000)
        }));
      }, 1000);
    } else if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isVisible]);

  // === FORMAT SESSION TIME ===
  const formatSessionTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }, []);

  // === ISSUE CATEGORIES ===
  const categoryStyles = {
    spelling: { 
      color: 'rgb(239 68 68)', 
      bg: 'rgba(239, 68, 68, 0.1)',
      icon: AlertCircle,
      label: 'Spelling',
      priority: 1
    },
    grammar: { 
      color: 'rgb(59 130 246)', 
      bg: 'rgba(59, 130, 246, 0.1)',
      icon: BookOpen,
      label: 'Grammar',
      priority: 2
    },
    style: { 
      color: 'rgb(147 51 234)', 
      bg: 'rgba(147, 51, 234, 0.1)',
      icon: Sparkles,
      label: 'Style',
      priority: 3
    },
    punctuation: { 
      color: 'rgb(245 101 101)', 
      bg: 'rgba(245, 101, 101, 0.1)',
      icon: Target,
      label: 'Punctuation',
      priority: 2
    },
    word_choice: { 
      color: 'rgb(34 197 94)', 
      bg: 'rgba(34, 197, 94, 0.1)',
      icon: TrendingUp,
      label: 'Word Choice',
      priority: 3
    }
  };

  // === INITIALIZE TEXT REPLACER AND AUTO-FIX ENGINE ===
  useEffect(() => {
    if (editor && !textReplacer) {
      const replacer = createCommandBasedReplacer(editor);
      setTextReplacer(replacer);
    }
    
    // AutoFixEngine not available, using simple stub
    if (editor && !autoFixEngine) {
      const engine = {
        applySingleFix: () => false,
        applyFixesSmart: () => 0
      };
      setAutoFixEngine(engine);
    }
  }, [editor, textReplacer, autoFixEngine]);

  // === FOCUS ON SPECIFIC ISSUE ===
  const focusOnIssue = useCallback((targetIssue) => {
    if (!targetIssue || !isVisible) return;

    console.log('🎯 Focusing on issue:', targetIssue);
    
    // Switch to issues tab if not already there
    if (activeView !== 'issues') {
      setActiveView('issues');
    }
    
    // Wait for tab switch to complete, then scroll to issue
    setTimeout(() => {
      const issueElement = document.querySelector(`[data-issue-id="${targetIssue.id}"]`);
      if (issueElement && issuesListRef.current) {
        // Scroll the issue into view within the sidebar
        issueElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Add a highlight animation
        issueElement.style.animation = 'none';
        issueElement.offsetHeight; // Trigger reflow
        issueElement.style.animation = 'grammarErrorPulse 1s ease-out';
        
        // Store reference for potential later use
        focusedIssueRef.current = targetIssue;
      }
    }, activeView !== 'issues' ? 300 : 0);
  }, [isVisible, activeView]);

  // === OPEN GRAMMAR ASSISTANT ===
  const openGrammarAssistant = useCallback((clickedIssue) => {
    console.log('🚀 Opening Grammar Assistant for issue:', clickedIssue);
    
    // Ensure the grammar assistant is visible
    if (!isVisible && onOpen) {
      console.log('📖 Opening Grammar Assistant sidebar');
      onOpen();
    }
    
    // Focus on the specific issue
    if (clickedIssue) {
      // Wait for sidebar to open if it wasn't already open
      setTimeout(() => {
        focusOnIssue(clickedIssue);
      }, isVisible ? 0 : 500);
    }
  }, [isVisible, onOpen, focusOnIssue]);

  // === REGISTER CALLBACKS WITH GRAMMAR EXTENSION ===
  useEffect(() => {
    if (editor) {
      // Register our callback functions with the GrammarExtension
      registerGrammarAssistantCallbacks({
        openGrammarAssistant,
        focusOnIssue
      });
      
      console.log('🔗 Registered Grammar Assistant callbacks with GrammarExtension');
    }
  }, [editor, openGrammarAssistant, focusOnIssue]);

  // === REMOVE ISSUE HELPER ===
  const removeIssue = useCallback((issueId) => {
    setIssues(prev => prev.filter(i => i.id !== issueId));
    setAnalytics(prev => ({
      ...prev,
      fixedIssues: prev.fixedIssues + 1,
      totalIssues: prev.totalIssues - 1
    }));
    setWritingStats(prev => ({
      ...prev,
      issuesFixed: prev.issuesFixed + 1
    }));
  }, []);

  // === AUTO-FIX FUNCTION ===
  const autoFixIssue = useCallback(async (issue, suggestion) => {
    console.log('🔧 AUTO-FIX CALLED:', { issue, suggestion, hasEngine: !!autoFixEngine });
    
    if (!autoFixEngine) {
      console.error('❌ AutoFixEngine not initialized!');
      return false;
    }
    
    if (!suggestion) {
      console.error('❌ No suggestion provided!');
      return false;
    }

    try {
      console.log('🔧 Applying fix:', issue.originalText || issue.text, '→', suggestion);
      
      // Apply the fix using AutoFixEngine
      const success = autoFixEngine.applySingleFix({
        ...issue,
        suggestions: [suggestion] // Ensure the suggestion we want is first
      });
      
      if (success) {
        // Remove the issue from local state
        removeIssue(issue.id);
        
        console.log('✅ Issue fixed successfully');
        return true;
      } else {
        console.warn('❌ Failed to apply fix');
        return false;
      }

    } catch (error) {
      console.error('❌ Error during auto-fix:', error);
      return false;
    }
  }, [autoFixEngine, removeIssue]);
  
  // === AUTO-FIX ALL FUNCTION ===
  const autoFixAllIssues = useCallback(async () => {
    if (!autoFixEngine || issues.length === 0) {
      console.warn('Cannot auto-fix: no engine or no issues');
      return;
    }
    
    try {
      console.log(`🔧 Auto-fixing ${issues.length} issues...`);
      
      // Use smart batch fix with conflict resolution
      const fixedCount = autoFixEngine.applyFixesSmart(issues);
      
      console.log(`✅ Fixed ${fixedCount}/${issues.length} issues`);
      
      // Refresh issues after fixing
      if (grammarController) {
        await grammarController.forceGrammarCheck();
      }
      
      // Update stats
      setWritingStats(prev => ({
        ...prev,
        issuesFixed: prev.issuesFixed + fixedCount
      }));
      
    } catch (error) {
      console.error('❌ Error during batch auto-fix:', error);
    }
  }, [autoFixEngine, issues, grammarController]);

  // === CALCULATE READING TIME ===
  const calculateReadingTime = useCallback((wordCount) => {
    const wordsPerMinute = 225; // Average reading speed
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes === 1 ? '1 min read' : `${minutes} min read`;
  }, []);

  // === GRAMMAR CONTROLLER INTEGRATION ===
  useEffect(() => {
    if (!grammarController) {
      console.log('⚠️ No grammar controller available');
      return;
    }
    
    // Set up listeners for grammar controller events
    const handleCheckStarted = () => {
      setIsProcessing(true);
    };
    
    const handleCheckCompleted = ({ issues: controllerIssues }) => {
      setIsProcessing(false);
      
      console.log('📊 GRAMMAR CHECK COMPLETED - Raw issues from controller:', controllerIssues);
      
      if (controllerIssues && controllerIssues.length > 0) {
        // Process issues for UI with intelligence metadata
        const processedIssues = controllerIssues.map((issue) => {
          console.log('📝 FULL ISSUE OBJECT:', JSON.stringify(issue, null, 2));
          console.log('📝 Has offset?', issue.offset !== undefined);
          console.log('📝 Has length?', issue.length !== undefined);
          console.log('📝 Has context?', !!issue.context);
          console.log('📝 Context details:', issue.context);
          
          return {
            ...issue,
            displayText: issue.originalText || issue.text || '',
            // Use new intelligence classification if available, fallback to legacy logic
            isAutoFixable: issue.intelligence?.classification === 'auto-fixable' || 
                          (issue.isAutoFixable !== undefined ? issue.isAutoFixable : 
                           !!(issue.suggestions && issue.suggestions.length > 0))
          };
        });
        
        console.log('✅ Processed issues:', processedIssues);

        setIssues(processedIssues);
        
        // Calculate analytics from controller issues
        const autoFixableCount = processedIssues.filter(i => i.isAutoFixable).length;
        const totalWords = content.split(/\s+/).filter(word => word.length > 0).length;
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const avgWordsPerSentence = sentences > 0 ? Math.round(totalWords / sentences) : 0;
        
        // 🧠 PHASE 1: Intelligence classification breakdown
        const intelligenceBreakdown = {
          autoFixable: processedIssues.filter(i => i.intelligence?.classification === 'auto-fixable').length,
          semiFixable: processedIssues.filter(i => i.intelligence?.classification === 'semi-fixable').length,
          manualOnly: processedIssues.filter(i => i.intelligence?.classification === 'manual-only').length,
          legacy: processedIssues.filter(i => !i.intelligence?.classification).length
        };
        
        // Category breakdown
        const categoryBreakdown = {};
        processedIssues.forEach(issue => {
          const cat = issue.category || 'other';
          categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
        });

        // Enhanced writing score calculation using intelligence data
        const intelligenceBonus = intelligenceBreakdown.autoFixable * 0.5; // Bonus for having auto-fixable issues
        const writingScore = Math.max(0, Math.min(100, 100 - (processedIssues.length * 2) + intelligenceBonus));
        
        setAnalytics(prev => ({
          ...prev,
          totalIssues: processedIssues.length,
          autoFixableCount,
          totalWords,
          writingScore,
          avgWordsPerSentence,
          categoryBreakdown,
          // 🧠 PHASE 1: Add intelligence breakdown to analytics
          intelligenceBreakdown,
          readabilityScore: Math.max(60, 100 - (processedIssues.length * 1.5)),
          professionalismScore: Math.max(70, 100 - (processedIssues.length * 1.8)),
          clarityScore: Math.max(65, 100 - (processedIssues.length * 1.6))
        }));
      } else {
        // No issues found
        setIssues([]);
        setAnalytics(prev => ({
          ...prev,
          totalIssues: 0,
          autoFixableCount: 0,
          writingScore: 100,
          categoryBreakdown: {}
        }));
      }
    };
    
    const handleCheckFailed = ({ error }) => {
      setIsProcessing(false);
      console.error('❌ Grammar check failed:', error);
      setIssues([]);
    };
    
    // Register listeners
    grammarController.on('checkStarted', handleCheckStarted);
    grammarController.on('checkCompleted', handleCheckCompleted);
    grammarController.on('checkFailed', handleCheckFailed);
    
    // Get current issues if available
    const currentIssues = grammarController.getCurrentIssues();
    if (currentIssues && currentIssues.length > 0) {
      handleCheckCompleted({ issues: currentIssues });
    }
    
    console.log('✅ AdvancedGrammarInsights connected to grammar controller');
    
    return () => {
      // Cleanup listeners
      grammarController.off('checkStarted', handleCheckStarted);
      grammarController.off('checkCompleted', handleCheckCompleted);
      grammarController.off('checkFailed', handleCheckFailed);
    };
  }, [grammarController, content]);

  // === TRIGGER GRAMMAR CHECK WHEN VISIBLE ===
  useEffect(() => {
    if (isVisible && grammarController) {
      // Force a grammar check when the sidebar becomes visible
      console.log('📊 Grammar sidebar opened, forcing check');
      grammarController.forceGrammarCheck();
    }
  }, [isVisible, grammarController]);

  // === SCROLL TO ISSUE METHOD ===
  const scrollToIssue = useCallback((issueId) => {
    if (!issuesListRef.current) {
      console.warn('❌ Issues list ref not available for scrolling');
      return;
    }
    
    console.log('📜 Scrolling to issue:', issueId);
    setIsScrolling(true);
    
    // Find the issue element
    const issueElement = issuesListRef.current.querySelector(`[data-issue-id="${issueId}"]`);
    
    if (issueElement) {
      // Smooth scroll to the issue
      issueElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
      
      // Clear scrolling state after animation
      setTimeout(() => {
        setIsScrolling(false);
      }, 600); // Slightly longer than typical scroll animation
      
      console.log('✅ Scrolled to issue:', issueId);
    } else {
      console.warn('❌ Issue element not found for scrolling:', issueId);
      setIsScrolling(false);
    }
  }, []);

  // === HIGHLIGHT ISSUE METHOD ===
  const highlightIssue = useCallback((issueId) => {
    console.log('✨ Highlighting issue:', issueId);
    
    // Set the highlighted issue
    setHighlightedIssueId(issueId);
    
    // Clear highlight after animation duration
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedIssueId(null);
      console.log('🔄 Highlight cleared for issue:', issueId);
    }, 2000); // 2 seconds highlight duration
  }, []);

  // === ISSUE FOCUS METHODS (exposed via ref) ===
  React.useImperativeHandle(ref, () => ({
    focusOnIssue: (issue) => {
      console.log('🎯 AdvancedGrammarInsights: Focusing on issue', issue.id);
      
      // Clear any existing focus operations
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      
      // Set focusing state for visual feedback
      setIsFocusingIssue(true);
      setHighlightedIssueId(null);
      
      // Step 1: Switch to issues tab if not already active
      if (activeView !== 'issues') {
        console.log('📋 Switching to issues tab');
        setActiveView('issues');
      }
      
      // Step 2: Check if issue exists in current list
      const issueExists = issues.some(i => i.id === issue.id);
      
      if (!issueExists) {
        console.log('⚠️ Issue not found in current list, forcing grammar check');
        
        // Force a grammar check if the issue isn't in the current list
        if (grammarController) {
          grammarController.forceGrammarCheck().then(() => {
            // Retry after forced check
            focusTimeoutRef.current = setTimeout(() => {
              setIsFocusingIssue(false);
              scrollToIssue(issue.id);
              highlightIssue(issue.id);
            }, 200);
          }).catch(() => {
            setIsFocusingIssue(false);
          });
        } else {
          setIsFocusingIssue(false);
        }
        return;
      }
      
      // Step 3: Wait a moment for tab switching, then scroll and highlight
      focusTimeoutRef.current = setTimeout(() => {
        setIsFocusingIssue(false);
        scrollToIssue(issue.id);
        highlightIssue(issue.id);
      }, 150); // Small delay for tab switching animation
    },
    
    switchToIssuesTab: () => {
      setActiveView('issues');
    },
    
    getCurrentView: () => activeView,
    
    getIssueCount: () => issues.length
  }), [activeView, issues, scrollToIssue, highlightIssue, grammarController]);

  // === CLEANUP TIMEOUTS ===
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // === FILTERED AND SORTED ISSUES ===
  const filteredIssues = useMemo(() => {
    console.log('🔍 FILTER DEBUG:', {
      totalIssues: issues.length,
      filterCategory,
      sortBy,
      issuesArray: issues
    });
    
    let filtered = issues;
    
    if (filterCategory !== 'all') {
      filtered = issues.filter(issue => issue.category === filterCategory);
    }
    
    // Sort issues
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const aPriority = categoryStyles[a.category]?.priority || 4;
        const bPriority = categoryStyles[b.category]?.priority || 4;
        return aPriority - bPriority;
      } else if (sortBy === 'type') {
        return (a.category || 'other').localeCompare(b.category || 'other');
      }
      return 0;
    });
    
    console.log('🔍 FILTERED RESULT:', filtered.length, filtered);
    
    return filtered;
  }, [issues, filterCategory, sortBy]);

  // === RENDER ISSUE CARD ===
  const renderIssueCard = (issue, index) => {
    const isHighlighted = highlightedIssueId === issue.id;

    return (
      <motion.div
        key={issue.id}
        data-issue-id={issue.id}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: isHighlighted ? 1.02 : 1,
        }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ 
          delay: index * 0.02,
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        {/* IssueCard component not yet created, using placeholder */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{issue.message}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {issue.context}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => autoFixIssue(issue)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Fix
            </button>
            <button
              onClick={() => removeIssue(issue.id)}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Ignore
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // === RENDER OVERVIEW TAB ===
  const renderOverview = () => (
    <div className="space-y-6 pb-8">
      {/* Writing Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/30 dark:border-blue-800/30 shadow-lg"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                Writing Score
              </h2>
              <p className="text-blue-600 dark:text-blue-300 text-sm">
                Overall quality assessment
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.writingScore}
              </div>
              <div className="text-sm text-blue-500 dark:text-blue-400">
                out of 100
              </div>
            </div>
          </div>
          
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mb-4">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000"
              initial={{ width: 0 }}
              animate={{ width: `${analytics.writingScore}%` }}
            />
          </div>
          
          <div className="text-center">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {analytics.writingScore >= 90 ? '🎉 Excellent' : 
               analytics.writingScore >= 80 ? '✨ Great' : 
               analytics.writingScore >= 70 ? '👍 Good' : 
               analytics.writingScore >= 60 ? '📝 Fair' : '💪 Needs Work'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Quick Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/40 dark:border-gray-700/40 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Words</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.totalWords}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            {calculateReadingTime(analytics.totalWords)}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/40 dark:border-gray-700/40 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={20} className="text-red-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Issues</span>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {analytics.totalIssues}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {analytics.autoFixableCount} auto-fixable
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/40 dark:border-gray-700/40 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 size={20} className="text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fixed</span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {analytics.fixedIssues}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Issues resolved
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/40 dark:border-gray-700/40 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <Target size={20} className="text-purple-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Readability</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {analytics.readabilityScore}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Ease of reading
          </div>
        </motion.div>
      </div>

      {/* Writing Quality Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-6 bg-white/60 dark:bg-gray-800/60 rounded-2xl border border-gray-200/40 dark:border-gray-700/40 backdrop-blur-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award size={20} className="text-indigo-600 dark:text-indigo-400" />
          Writing Quality
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Professionalism</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.professionalismScore}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white w-8">
                {analytics.professionalismScore}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Clarity</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.clarityScore}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white w-8">
                {analytics.clarityScore}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Issue Breakdown */}
      {analytics.categoryBreakdown && Object.keys(analytics.categoryBreakdown).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 bg-white/60 dark:bg-gray-800/60 rounded-2xl border border-gray-200/40 dark:border-gray-700/40 backdrop-blur-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-orange-600 dark:text-orange-400" />
            Issue Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.categoryBreakdown).map(([category, count]) => {
              const categoryInfo = categoryStyles[category] || { color: 'rgb(107 114 128)', bg: 'rgba(107, 114, 128, 0.1)', icon: Info };
              const IconComponent = categoryInfo.icon;
              const percentage = analytics.totalIssues > 0 ? Math.round((count / analytics.totalIssues) * 100) : 0;
              
              return (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: categoryInfo.bg }}
                    >
                      <IconComponent 
                        size={16} 
                        style={{ color: categoryInfo.color }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">{count}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      
      {/* Bottom spacing for better scrolling */}
      <div className="h-6"></div>
    </div>
  );

  // === RENDER ISSUES TAB ===
  const renderIssues = () => (
    <div className="space-y-4 pb-8">
      {/* Quick Fix All Button - Temporarily Disabled */}

      {/* Filters & Focus Indicator */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white/40 dark:bg-gray-800/40 rounded-xl border border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-500 dark:text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 border-none outline-none"
          >
            <option value="all">All Categories</option>
            <option value="spelling">Spelling</option>
            <option value="grammar">Grammar</option>
            <option value="style">Style</option>
            <option value="punctuation">Punctuation</option>
            <option value="word_choice">Word Choice</option>
          </select>
          
          {/* Focus Indicator */}
          {isFocusingIssue && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 ml-3 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full"
              />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Focusing...
              </span>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <SortDesc size={16} className="text-gray-500 dark:text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 border-none outline-none"
          >
            <option value="priority">Priority</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Excellent Writing! 🎉
          </h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
            No grammar issues detected in your text. Your writing looks polished and professional.
          </p>
        </div>
      ) : (
        <div ref={issuesListRef} className="space-y-4">
          <AnimatePresence>
            {filteredIssues.map((issue, index) => renderIssueCard(issue, index))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Bottom spacing for better scrolling */}
      <div className="h-6"></div>
    </div>
  );

  return (
    <>
      {/* Interactive Inline Highlighter */}
      <InteractiveGrammarHighlighter 
        editor={editor}
        issues={issues}
        onFixIssue={autoFixIssue}
        onDismissIssue={(issue) => removeIssue(issue.id)}
        isVisible={isVisible}
      />
      {/* Advanced Insights Dashboard */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: '100%', opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '100%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed right-0 top-0 h-full w-[500px] z-[9999] bg-gradient-to-br from-white/98 via-gray-50/95 to-white/98 dark:from-gray-900/98 dark:via-gray-800/95 dark:to-gray-900/98 backdrop-blur-2xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden pointer-events-auto"
            style={{ touchAction: 'auto' }}
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-white/80 via-gray-50/60 to-white/80 dark:from-gray-800/80 dark:via-gray-900/60 dark:to-gray-800/80 backdrop-blur-sm">
              {/* Title Row with Close Button on Left */}
              <div className="flex items-center gap-4 mb-6">
                {/* Close Button on Left */}
                <motion.button
                  onClick={onToggle}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Close Grammar Insights"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform duration-200" />
                </motion.button>
                {/* Title and Status */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Grammar Insights
                  </h1>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                      <span className="text-gray-600 dark:text-gray-300">
                        {isProcessing ? 'Analyzing...' : 'Real-time analysis'}
                      </span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Score: {analytics.writingScore}/100
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Clock size={14} />
                      <span>{formatSessionTime(writingStats.timeSpent)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Tab Navigation */}
              <div className="flex bg-white/70 dark:bg-gray-800/70 rounded-2xl p-1.5 shadow-inner backdrop-blur-sm border border-gray-200/20 dark:border-gray-700/20">
                <button
                  onClick={() => setActiveView('issues')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeView === 'issues'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <AlertTriangle size={14} />
                    Issues ({analytics.totalIssues})
                  </div>
                </button>
                <button
                  onClick={() => setActiveView('overview')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeView === 'overview'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <BarChart3 size={14} />
                    Overview
                  </div>
                </button>
                <button
                  onClick={() => setActiveView('settings')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeView === 'settings'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Sparkles size={14} />
                    Tier
                  </div>
                </button>
              </div>
            </div>
            {/* Content */}
            <div 
              ref={issuesListRef}
              className="h-[calc(100vh-112px)] overflow-y-auto px-8 py-6 overscroll-contain scroll-smooth" 
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
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
              ) : activeView === 'issues' ? (
                renderIssues()
              ) : activeView === 'settings' ? (
                <div className="space-y-6 pb-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Grammar Checking Settings
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose your grammar checking tier for optimal accuracy and performance.
                    </p>
                  </div>
                  {/* <GrammarTierSelector /> */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Grammar tier selector coming soon...
                    </p>
                  </div>
                  
                  {/* Fix All Button */}
                  {issues.length > 0 && (
                    <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Quick Actions
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Apply all fixable suggestions at once with smart conflict resolution.
                      </p>
                      <button
                        onClick={autoFixAllIssues}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Fix All Issues ({issues.filter(i => i.suggestions?.length > 0).length})
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                renderOverview()
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default AdvancedGrammarInsights;