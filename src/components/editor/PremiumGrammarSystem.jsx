/**
 * 🚀 PREMIUM GRAMMAR SYSTEM - MAIN ORCHESTRATOR
 * 
 * The central component that combines all grammar UI elements into a cohesive system
 * 
 * ✨ FEATURES:
 * - Integrates FloatingGrammarButton + PremiumGrammarPanel
 * - Real-time content analysis with debouncing
 * - Seamless TipTap editor integration
 * - Advanced analytics and performance tracking
 * - State management for the entire grammar system
 * - Keyboard shortcuts and accessibility
 * - Professional-grade user experience
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import FloatingGrammarButton from './FloatingGrammarButton';
import MinimalistGrammarPanel from './MinimalistGrammarPanel';
import AdvancedGrammarService from '../../services/AdvancedGrammarService';

// Create instance of AdvancedGrammarService
const advancedGrammarService = new AdvancedGrammarService();

const PremiumGrammarSystem = ({ 
  editor, 
  content, 
  onContentUpdate,
  position = "bottom-right",
  autoStart = false,
  keyboardShortcut = "Ctrl+G"
}) => {
  // === CORE STATE ===
  const [isActive, setIsActive] = useState(autoStart);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [issues, setIssues] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCheckedContent, setLastCheckedContent] = useState('');
  
  // === ANALYTICS STATE ===
  const [analytics, setAnalytics] = useState({
    totalIssues: 0,
    fixedIssues: 0,
    totalWords: 0,
    writingScore: 100,
    readabilityScore: 85,
    professionalismScore: 90,
    clarityScore: 88,
    sessionStartTime: Date.now(),
    checksPerformed: 0,
    averageProcessingTime: 0
  });

  // === REFS ===
  const debounceTimeoutRef = useRef(null);
  const lastAnalysisRef = useRef(null);
  const sessionStatsRef = useRef({
    totalChecks: 0,
    totalProcessingTime: 0,
    issuesFound: 0,
    issuesFixed: 0
  });

  // === INITIALIZE ADVANCED GRAMMAR SERVICE ===
  useEffect(() => {
    const initializeService = async () => {
      try {
        console.log('🚀 PremiumGrammarSystem: Initializing AdvancedGrammarService...');
        const initialized = await advancedGrammarService.initialize();
        if (initialized) {
          console.log('✅ PremiumGrammarSystem: AdvancedGrammarService ready');
        } else {
          console.warn('⚠️ PremiumGrammarSystem: AdvancedGrammarService initialization failed');
        }
      } catch (error) {
        console.error('❌ PremiumGrammarSystem: Service initialization error:', error);
      }
    };

    initializeService();
  }, []);

  // === PROCESS CONTENT FOR GRAMMAR ISSUES ===
  const processContent = useCallback(async (textContent, force = false) => {
    // Skip if content hasn't changed and not forced
    if (!force && textContent === lastCheckedContent) {
      return;
    }

    // Skip very short content
    if (!textContent || textContent.trim().length < 10) {
      setIssues([]);
      updateAnalytics([], textContent);
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      console.log('🔍 PremiumGrammarSystem: Analyzing content with AdvancedGrammarService...');
      
      // Use our comprehensive AdvancedGrammarService
      const grammarIssues = await advancedGrammarService.checkText(textContent);
      
      const processingTime = Date.now() - startTime;
      
      // Update session statistics
      sessionStatsRef.current.totalChecks++;
      sessionStatsRef.current.totalProcessingTime += processingTime;
      sessionStatsRef.current.issuesFound += grammarIssues.length;
      
      console.log(`✅ PremiumGrammarSystem: Found ${grammarIssues.length} issues in ${processingTime}ms`);
      
      setIssues(grammarIssues);
      setLastCheckedContent(textContent);
      updateAnalytics(grammarIssues, textContent, processingTime);
      
    } catch (error) {
      console.error('❌ PremiumGrammarSystem: Error processing content:', error);
      setIssues([]);
      updateAnalytics([], textContent);
    } finally {
      setIsProcessing(false);
    }
  }, [lastCheckedContent]);

  // === UPDATE ANALYTICS ===
  const updateAnalytics = useCallback((issueList, text, processingTime = 0) => {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate comprehensive scores
    const totalIssues = issueList.length;
    const errorCount = issueList.filter(i => i.severity === 'error').length;
    const warningCount = issueList.filter(i => i.severity === 'warning').length;
    const suggestionCount = issueList.filter(i => i.severity === 'suggestion').length;
    
    // Advanced writing score calculation
    const baseScore = 100;
    const errorPenalty = errorCount * 10;
    const warningPenalty = warningCount * 5;
    const suggestionPenalty = suggestionCount * 2;
    const lengthBonus = Math.min(words.length / 200, 1) * 5; // Bonus for longer, well-written text
    
    const writingScore = Math.max(0, Math.min(100, 
      baseScore - errorPenalty - warningPenalty - suggestionPenalty + lengthBonus
    ));
    
    // Readability score (Flesch-Kincaid inspired)
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const complexSentencePenalty = Math.max(0, (avgWordsPerSentence - 20) * 2);
    const readabilityScore = Math.max(0, Math.min(100, 100 - complexSentencePenalty));
    
    // Professionalism score based on style and word choice issues
    const styleIssues = issueList.filter(i => 
      i.category === 'style' || i.category === 'word_choice'
    ).length;
    const professionalismScore = Math.max(0, Math.min(100, 95 - (styleIssues * 7)));
    
    // Clarity score based on grammar and punctuation
    const clarityIssues = issueList.filter(i => 
      i.category === 'grammar' || i.category === 'punctuation'
    ).length;
    const clarityScore = Math.max(0, Math.min(100, 95 - (clarityIssues * 6)));
    
    // Update analytics state
    setAnalytics(prev => {
      const newAnalytics = {
        ...prev,
        totalIssues,
        totalWords: words.length,
        writingScore: Math.round(writingScore),
        readabilityScore: Math.round(readabilityScore),
        professionalismScore: Math.round(professionalismScore),
        clarityScore: Math.round(clarityScore),
        checksPerformed: prev.checksPerformed + (processingTime > 0 ? 1 : 0),
        averageProcessingTime: processingTime > 0 
          ? Math.round((prev.averageProcessingTime * prev.checksPerformed + processingTime) / (prev.checksPerformed + 1))
          : prev.averageProcessingTime
      };
      
      return newAnalytics;
    });
  }, []);

  // === HANDLE GRAMMAR TOGGLE ===
  const handleToggle = useCallback(() => {
    setIsActive(prev => {
      const newActive = !prev;
      
      if (newActive) {
        // Activate grammar system
        setIsPanelVisible(true);
        if (content) {
          processContent(content, true); // Force analysis
        }
      } else {
        // Deactivate grammar system
        setIsPanelVisible(false);
      }
      
      console.log('🎯 PremiumGrammarSystem: Toggled to', newActive ? 'ACTIVE' : 'INACTIVE');
      return newActive;
    });
  }, [content, processContent]);

  // === DEBOUNCED CONTENT ANALYSIS ===
  useEffect(() => {
    if (!isActive || !content) return;

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced analysis
    debounceTimeoutRef.current = setTimeout(() => {
      processContent(content);
    }, 1500); // 1.5 second debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [content, isActive, processContent]);

  // === KEYBOARD SHORTCUTS ===
  useEffect(() => {
    const handleKeyDown = (event) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      if (isCtrlOrCmd && event.key === 'g') {
        event.preventDefault();
        handleToggle();
      }
      
      // ESC to close panel
      if (event.key === 'Escape' && isPanelVisible) {
        setIsPanelVisible(false);
        setIsActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle, isPanelVisible]);

  // === HANDLE PANEL TOGGLE ===
  const handlePanelToggle = useCallback(() => {
    if (isActive) {
      setIsPanelVisible(prev => !prev);
    } else {
      // If not active, activate and show panel
      setIsActive(true);
      setIsPanelVisible(true);
      if (content) {
        processContent(content, true);
      }
    }
  }, [isActive, content, processContent]);

  // === COMPUTE DERIVED STATE ===
  const derivedState = useMemo(() => {
    const issueCount = issues.length;
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    return {
      issueCount,
      errorCount,
      warningCount,
      hasErrors: errorCount > 0,
      hasWarnings: warningCount > 0,
      isClean: issueCount === 0
    };
  }, [issues]);

  // === AUTO-INITIALIZE IF REQUESTED ===
  useEffect(() => {
    if (autoStart && content && !isActive) {
      console.log('🚀 PremiumGrammarSystem: Auto-starting grammar system');
      setIsActive(true);
      processContent(content, true);
    }
  }, [autoStart, content, isActive, processContent]);

  return (
    <>
      {/* Floating Grammar Button */}
      <FloatingGrammarButton
        isActive={isActive}
        onClick={handlePanelToggle}
        issueCount={derivedState.issueCount}
        writingScore={analytics.writingScore}
        isProcessing={isProcessing}
        position={position}
        analytics={analytics}
      />

      {/* Minimalist Grammar Panel */}
      <AnimatePresence>
        {isPanelVisible && (
          <MinimalistGrammarPanel
            editor={editor}
            isVisible={isPanelVisible}
            onToggle={() => setIsPanelVisible(false)}
            content={content}
          />
        )}
      </AnimatePresence>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && isActive && (
        <div className="fixed bottom-20 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
          <div>Issues: {derivedState.issueCount}</div>
          <div>Score: {analytics.writingScore}/100</div>
          <div>Words: {analytics.totalWords}</div>
          <div>Checks: {analytics.checksPerformed}</div>
          <div>Avg Time: {analytics.averageProcessingTime}ms</div>
        </div>
      )}
    </>
  );
};

export default PremiumGrammarSystem; 