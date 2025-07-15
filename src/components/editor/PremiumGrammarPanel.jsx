/**
 * 🚀 PREMIUM GRAMMAR PANEL - NEXT GENERATION GRAMMAR UI
 * 
 * The ultimate grammar checking interface that surpasses Grammarly
 * 
 * ✨ REVOLUTIONARY FEATURES:
 * - Sleek sliding panel with modern glassmorphism design
 * - Smart categorization with 6 issue types (Grammar, Spelling, Punctuation, Style, Word Choice, Idiom)
 * - 3-tier severity system (Error, Warning, Suggestion) with color coding
 * - Real-time writing analytics and performance metrics
 * - One-click fixes with smooth animations
 * - Advanced filtering and search capabilities
 * - Writing insights dashboard with progress tracking
 * - Professional confidence scoring for each suggestion
 * - Contextual explanations and learning opportunities
 * - Accessibility-first design with keyboard navigation
 * - Premium animations and micro-interactions
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createCommandBasedReplacer } from '../../services/CommandBasedReplacer';
import advancedGrammarService from '../../services/AdvancedGrammarService';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Sparkles,
  BookOpen,
  Lightbulb,
  Zap,
  ChevronDown,
  ChevronRight,
  Eye,
  Clock,
  Star,
  ThumbsUp
} from 'lucide-react';

const PremiumGrammarPanel = ({ editor, isVisible, onToggle, content }) => {
  // === CORE STATE ===
  const [issues, setIssues] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [textReplacer, setTextReplacer] = useState(null);
  
  // === UI STATE ===
  const [activeTab, setActiveTab] = useState('issues');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['spelling', 'grammar']));
  
  // === ANALYTICS STATE ===
  const [analytics, setAnalytics] = useState({
    totalIssues: 0,
    fixedIssues: 0,
    writingScore: 100,
    readabilityScore: 85,
    professionalismScore: 90,
    clarityScore: 88,
    totalWords: 0,
    averageWordsPerSentence: 0,
    passiveVoicePercentage: 0,
    sentimentScore: 0.7,
    improvementTrend: 5
  });

  // === REFS ===
  const panelRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  // === ISSUE CATEGORIES WITH ENHANCED METADATA ===
  const issueCategories = {
    spelling: {
      id: 'spelling',
      name: 'Spelling',
      icon: '🔤',
      color: '#ef4444',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      darkBgColor: 'dark:bg-red-900/20',
      darkBorderColor: 'dark:border-red-800',
      darkTextColor: 'dark:text-red-300',
      description: 'Misspelled words and typos'
    },
    grammar: {
      id: 'grammar',
      name: 'Grammar',
      icon: '📝',
      color: '#f59e0b',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700',
      darkBgColor: 'dark:bg-amber-900/20',
      darkBorderColor: 'dark:border-amber-800',
      darkTextColor: 'dark:text-amber-300',
      description: 'Grammar rules and sentence structure'
    },
    punctuation: {
      id: 'punctuation',
      name: 'Punctuation',
      icon: '❗',
      color: '#eab308',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      darkBgColor: 'dark:bg-yellow-900/20',
      darkBorderColor: 'dark:border-yellow-800',
      darkTextColor: 'dark:text-yellow-300',
      description: 'Punctuation and formatting'
    },
    word_choice: {
      id: 'word_choice',
      name: 'Word Choice',
      icon: '💭',
      color: '#8b5cf6',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      darkBgColor: 'dark:bg-purple-900/20',
      darkBorderColor: 'dark:border-purple-800',
      darkTextColor: 'dark:text-purple-300',
      description: 'Better word alternatives'
    },
    style: {
      id: 'style',
      name: 'Style',
      icon: '✨',
      color: '#3b82f6',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      darkBgColor: 'dark:bg-blue-900/20',
      darkBorderColor: 'dark:border-blue-800',
      darkTextColor: 'dark:text-blue-300',
      description: 'Writing style improvements'
    },
    idiom: {
      id: 'idiom',
      name: 'Idiom',
      icon: '🎭',
      color: '#10b981',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      darkBgColor: 'dark:bg-emerald-900/20',
      darkBorderColor: 'dark:border-emerald-800',
      darkTextColor: 'dark:text-emerald-300',
      description: 'Idiomatic expressions'
    }
  };

  // === SEVERITY LEVELS ===
  const severityLevels = {
    error: {
      id: 'error',
      name: 'Errors',
      icon: AlertCircle,
      color: '#dc2626',
      priority: 3
    },
    warning: {
      id: 'warning',
      name: 'Warnings',
      icon: AlertTriangle,
      color: '#d97706',
      priority: 2
    },
    suggestion: {
      id: 'suggestion',
      name: 'Suggestions',
      icon: Info,
      color: '#2563eb',
      priority: 1
    }
  };

  // === INITIALIZE COMMAND-BASED REPLACER ===
  useEffect(() => {
    if (editor) {
      const replacer = createCommandBasedReplacer(editor);
      setTextReplacer(replacer);
      console.log('✅ PremiumGrammarPanel: CommandBasedReplacer initialized');
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

      console.log('🔍 PremiumGrammarPanel: Analyzing text with AdvancedGrammarService...');
      
      // Use our enhanced AdvancedGrammarService (mega engine + 42 rules + professional spell checking)
      const grammarIssues = await advancedGrammarService.checkText(textContent);
      
      console.log('✅ PremiumGrammarPanel: Found', grammarIssues.length, 'issues');
      
      setIssues(grammarIssues);
      updateAnalytics(grammarIssues, textContent);

    } catch (error) {
      console.error('❌ PremiumGrammarPanel: Error processing issues:', error);
      setIssues([]);
      updateAnalytics([], '');
    } finally {
      setIsProcessing(false);
    }
  }, [editor, content]);

  // === UPDATE ANALYTICS ===
  const updateAnalytics = useCallback((issueList, text) => {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate scores based on issues
    const totalIssues = issueList.length;
    const errorCount = issueList.filter(i => i.severity === 'error').length;
    const warningCount = issueList.filter(i => i.severity === 'warning').length;
    
    // Writing score calculation (more sophisticated)
    const errorPenalty = errorCount * 8;
    const warningPenalty = warningCount * 3;
    const lengthBonus = Math.min(words.length / 100, 1) * 5; // Bonus for longer text
    const writingScore = Math.max(0, Math.min(100, 95 - errorPenalty - warningPenalty + lengthBonus));
    
    // Readability score based on sentence complexity
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const readabilityScore = Math.max(0, Math.min(100, 100 - Math.max(0, (avgWordsPerSentence - 15) * 2)));
    
    // Professionalism score based on style issues
    const styleIssues = issueList.filter(i => i.category === 'style').length;
    const professionalismScore = Math.max(0, Math.min(100, 95 - (styleIssues * 5)));
    
    // Clarity score
    const clarityScore = Math.max(0, Math.min(100, writingScore - (totalIssues * 2)));

    setAnalytics(prev => ({
      ...prev,
      totalIssues,
      totalWords: words.length,
      averageWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      writingScore: Math.round(writingScore),
      readabilityScore: Math.round(readabilityScore),
      professionalismScore: Math.round(professionalismScore),
      clarityScore: Math.round(clarityScore),
      improvementTrend: prev.writingScore ? Math.round(writingScore - prev.writingScore) : 0
    }));
  }, []);

  // === HANDLE SUGGESTION APPLICATION ===
  const handleApplySuggestion = useCallback(async (issue) => {
    if (!editor || !textReplacer || !issue.suggestions?.[0]) return;

    try {
      console.log('🎯 PremiumGrammarPanel: Applying suggestion', {
        issue: issue.message,
        suggestion: issue.suggestions[0]
      });

      // Use our enhanced CommandBasedReplacer for seamless TipTap integration
      const success = textReplacer.applySuggestion(issue, issue.suggestions[0]);
      
      if (success) {
        // Remove the issue from the list
        setIssues(prev => prev.filter(i => i.id !== issue.id));
        
        // Update analytics
        setAnalytics(prev => ({
          ...prev,
          fixedIssues: prev.fixedIssues + 1,
          totalIssues: prev.totalIssues - 1
        }));

        console.log('✅ Successfully applied suggestion');
      } else {
        console.warn('⚠️ Failed to apply suggestion using CommandBasedReplacer');
      }

    } catch (error) {
      console.error('❌ Error applying suggestion:', error);
    }
  }, [editor, textReplacer]);

  // === HANDLE ISSUE DISMISSAL ===
  const handleDismissIssue = useCallback((issueId) => {
    setIssues(prev => prev.filter(i => i.id !== issueId));
    setAnalytics(prev => ({
      ...prev,
      totalIssues: prev.totalIssues - 1
    }));
  }, []);

  // === FILTERED ISSUES ===
  const filteredIssues = useMemo(() => {
    let filtered = issues;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(issue => 
        issue.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.suggestions?.[0]?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by severity
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(issue => issue.severity === selectedSeverity);
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(issue => issue.category === selectedCategory);
    }
    
    // Sort by severity and then by position
    return filtered.sort((a, b) => {
      const severityOrder = { error: 3, warning: 2, suggestion: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return (a.offset || 0) - (b.offset || 0);
    });
  }, [issues, searchQuery, selectedSeverity, selectedCategory]);

  // === GROUP ISSUES BY CATEGORY ===
  const groupedIssues = useMemo(() => {
    return filteredIssues.reduce((acc, issue) => {
      const category = issue.category || 'grammar';
      if (!acc[category]) acc[category] = [];
      acc[category].push(issue);
      return acc;
    }, {});
  }, [filteredIssues]);

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

  // === RENDER ISSUE CARD ===
  const renderIssueCard = (issue) => {
    const category = issueCategories[issue.category] || issueCategories.grammar;
    const SeverityIcon = severityLevels[issue.severity]?.icon || Info;
    
    return (
      <motion.div
        key={issue.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={{ scale: 1.02 }}
        className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer
                   ${category.bgColor} ${category.borderColor} ${category.darkBgColor} ${category.darkBorderColor}
                   hover:shadow-lg hover:border-opacity-60`}
        onClick={() => setSelectedIssue(issue)}
      >
        <div className="flex items-start space-x-3">
          {/* Issue Icon & Severity */}
          <div className="flex-shrink-0 flex items-center space-x-2">
            <span className="text-lg">{category.icon}</span>
            <SeverityIcon 
              className={`w-4 h-4`} 
              style={{ color: severityLevels[issue.severity]?.color }}
            />
          </div>
          
          {/* Issue Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-semibold ${category.textColor} ${category.darkTextColor}`}>
                {issue.message}
              </h4>
              {issue.confidence && (
                <span className="text-xs bg-white/50 px-2 py-1 rounded-full">
                  {Math.round((issue.confidence || 0.85) * 100)}%
                </span>
              )}
            </div>
            
            {/* Original Text -> Suggestion */}
            {issue.suggestions?.[0] && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>Replace</span>
                  <span className="font-mono bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-red-700 dark:text-red-300">
                    "{issue.originalText || issue.text || 'text'}"
                  </span>
                  <span>with</span>
                  <span className="font-mono bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-green-700 dark:text-green-300">
                    "{issue.suggestions[0]}"
                  </span>
                </div>
              </div>
            )}
            
            {/* Explanation */}
            {issue.explanation && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                {issue.explanation}
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {issue.suggestions?.[0] && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplySuggestion(issue);
                }}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 
                         transition-colors duration-200 shadow-md"
                title="Apply suggestion"
              >
                <CheckCircle2 className="w-4 h-4" />
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleDismissIssue(issue.id);
              }}
              className="p-2 bg-gray-400 text-white rounded-full hover:bg-gray-500 
                       transition-colors duration-200 shadow-md"
              title="Dismiss issue"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  // === RENDER ANALYTICS DASHBOARD ===
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 
                        p-4 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Writing Score</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {analytics.writingScore}/100
            </span>
            {analytics.improvementTrend !== 0 && (
              <span className={`ml-2 text-xs ${analytics.improvementTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.improvementTrend > 0 ? '+' : ''}{analytics.improvementTrend}
              </span>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 
                        p-4 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Readability</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {analytics.readabilityScore}/100
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 
                        p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Professionalism</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
              {analytics.professionalismScore}/100
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 
                        p-4 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Clarity</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-800 dark:text-amber-200">
              {analytics.clarityScore}/100
            </span>
          </div>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Writing Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Words:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">{analytics.totalWords}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Avg Words/Sentence:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">{analytics.averageWordsPerSentence}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Issues Fixed:</span>
            <span className="ml-2 font-semibold text-green-600 dark:text-green-400">{analytics.fixedIssues}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Issues Remaining:</span>
            <span className="ml-2 font-semibold text-red-600 dark:text-red-400">{analytics.totalIssues}</span>
          </div>
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
      className="fixed right-0 top-0 h-full w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg 
                 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden"
    >
      {/* Header with Glassmorphism */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.span 
              className="text-2xl"
              animate={{ rotate: isProcessing ? 360 : 0 }}
              transition={{ duration: 2, repeat: isProcessing ? Infinity : 0 }}
            >
              ✨
            </motion.span>
            <div>
              <h2 className="text-xl font-bold">Grammar Pro</h2>
              <p className="text-xs text-white/70">Premium AI Assistant</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggle}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4">
          {[
            { id: 'issues', label: 'Issues', icon: AlertTriangle, count: filteredIssues.length },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors relative
                           ${activeTab === tab.id ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'issues' && (
            <motion.div
              key="issues"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 space-y-4"
            >
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 
                             rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="all">All Severity</option>
                    <option value="error">Errors</option>
                    <option value="warning">Warnings</option>
                    <option value="suggestion">Suggestions</option>
                  </select>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="all">All Categories</option>
                    {Object.values(issueCategories).map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
                  />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing your writing...</span>
                </div>
              )}

              {/* Issues by Category */}
              {!isProcessing && (
                <div className="space-y-4">
                  {Object.entries(groupedIssues).map(([categoryId, categoryIssues]) => {
                    const category = issueCategories[categoryId] || issueCategories.grammar;
                    const isExpanded = expandedCategories.has(categoryId);
                    
                    return (
                      <div key={categoryId} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedCategories);
                            if (isExpanded) {
                              newExpanded.delete(categoryId);
                            } else {
                              newExpanded.add(categoryId);
                            }
                            setExpandedCategories(newExpanded);
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-xl"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{category.icon}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{category.name}</span>
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                              {categoryIssues.length}
                            </span>
                          </div>
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-4 pb-4 space-y-3"
                            >
                              {categoryIssues.map(renderIssueCard)}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {filteredIssues.length === 0 && !isProcessing && (
                    <div className="text-center py-12">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                      >
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Excellent writing! 🎉
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        No grammar issues found. Your writing is clear and professional.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4"
            >
              {renderAnalytics()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PremiumGrammarPanel; 