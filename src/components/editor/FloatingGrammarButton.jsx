/**
 * 🚀 FLOATING GRAMMAR BUTTON - PREMIUM TRIGGER
 * 
 * Elegant floating button that serves as the main interface for grammar checking
 * 
 * ✨ FEATURES:
 * - Live issue count with pulsing animations
 * - Writing score indicator with color coding
 * - Smooth hover effects and micro-interactions
 * - Context-aware status indicators
 * - Professional tooltip with detailed information
 * - Accessibility-first design with keyboard support
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Target,
  TrendingUp,
  Award
} from 'lucide-react';

const FloatingGrammarButton = ({ 
  isActive, 
  onClick, 
  issueCount = 0, 
  writingScore = 100,
  isProcessing = false,
  position = "bottom-right",
  analytics = {}
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  // Position classes for the floating button
  const positionClasses = {
    "bottom-right": "fixed bottom-6 right-6",
    "bottom-left": "fixed bottom-6 left-6", 
    "top-right": "fixed top-6 right-6",
    "top-left": "fixed top-6 left-6"
  };

  // Get writing score status
  const getScoreStatus = (score) => {
    if (score >= 95) return { level: 'exceptional', color: 'text-emerald-600', bgColor: 'bg-emerald-500' };
    if (score >= 85) return { level: 'excellent', color: 'text-green-600', bgColor: 'bg-green-500' };
    if (score >= 75) return { level: 'good', color: 'text-blue-600', bgColor: 'bg-blue-500' };
    if (score >= 65) return { level: 'fair', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    return { level: 'needs work', color: 'text-red-600', bgColor: 'bg-red-500' };
  };

  // Get issue severity breakdown
  const getIssueSeverity = () => {
    const { totalIssues = issueCount } = analytics;
    if (totalIssues === 0) return 'none';
    if (totalIssues <= 2) return 'low';
    if (totalIssues <= 5) return 'medium';
    return 'high';
  };

  const scoreStatus = getScoreStatus(writingScore);
  const issueSeverity = getIssueSeverity();

  // Update tooltip position
  const updateTooltipPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const newPosition = {
        x: rect.left - 200, // Position tooltip to the left of button
        y: rect.top + rect.height / 2 - 100 // Center vertically
      };
      setTooltipPosition(newPosition);
    }
  };

  useEffect(() => {
    if (showTooltip) {
      updateTooltipPosition();
    }
  }, [showTooltip]);

  return (
    <>
      {/* Main Floating Button */}
      <div className={positionClasses[position]}>
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`relative group flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl 
                     backdrop-blur-lg border transition-all duration-300 overflow-hidden
                     ${isActive 
                       ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white border-indigo-400' 
                       : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800'
                     }`}
        >
          {/* Animated Background Gradient */}
          {isActive && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"
              animate={{ 
                background: [
                  'linear-gradient(45deg, #6366f1, #8b5cf6, #3b82f6)',
                  'linear-gradient(45deg, #8b5cf6, #3b82f6, #6366f1)',
                  'linear-gradient(45deg, #3b82f6, #6366f1, #8b5cf6)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* Content */}
          <div className="relative z-10 flex items-center space-x-3">
            {/* Main Icon */}
            <motion.div
              animate={{ 
                rotate: isProcessing ? 360 : 0,
                scale: isActive ? 1.1 : 1
              }}
              transition={{ 
                rotate: { duration: 2, repeat: isProcessing ? Infinity : 0, ease: "linear" },
                scale: { duration: 0.3 }
              }}
              className="relative"
            >
              {isProcessing ? (
                <motion.div
                  className="w-6 h-6 border-2 border-current border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : issueCount === 0 ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </motion.div>

            {/* Text Content */}
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold">
                {isActive ? 'Grammar Pro' : 'Grammar'}
              </span>
              {isActive && (
                <div className="flex items-center space-x-2 text-xs opacity-90">
                  <span>Score: {writingScore}/100</span>
                  {issueCount > 0 && (
                    <span>• {issueCount} issue{issueCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
              )}
            </div>

            {/* Issue Count Badge */}
            <AnimatePresence>
              {issueCount > 0 && !isProcessing && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={`absolute -top-2 -right-2 min-w-[1.5rem] h-6 flex items-center justify-center 
                             rounded-full text-xs font-bold text-white shadow-lg
                             ${issueSeverity === 'high' ? 'bg-red-500' : 
                               issueSeverity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                >
                  <motion.span
                    key={issueCount}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {issueCount > 99 ? '99+' : issueCount}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Indicator */}
            {issueCount === 0 && !isProcessing && isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-xs">✓</span>
              </motion.div>
            )}
          </div>

          {/* Pulsing Effect for Issues */}
          {issueCount > 0 && !isProcessing && (
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-red-400"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
      </div>

      {/* Premium Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            style={{ 
              position: 'fixed',
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              zIndex: 1000
            }}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200 dark:border-gray-700 
                       rounded-xl shadow-2xl p-4 min-w-[240px] max-w-[300px]"
          >
            {/* Tooltip Header */}
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Grammar Pro Status</span>
            </div>

            {/* Writing Score */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Writing Score</span>
                <span className={`text-sm font-semibold ${scoreStatus.color}`}>
                  {writingScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${scoreStatus.bgColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${writingScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {scoreStatus.level}
              </span>
            </div>

            {/* Issue Summary */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Issues Found</span>
                <span className={`text-sm font-semibold ${
                  issueCount === 0 ? 'text-green-600' : 
                  issueCount <= 2 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {issueCount}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {issueCount === 0 ? 'Perfect! No issues detected.' :
                 issueCount === 1 ? '1 issue needs attention' :
                 `${issueCount} issues need attention`}
              </div>
            </div>

            {/* Quick Stats */}
            {analytics.totalWords > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Words:</span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-white">
                      {analytics.totalWords}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Fixed:</span>
                    <span className="ml-1 font-medium text-green-600">
                      {analytics.fixedIssues || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Hint */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {isActive ? 'Click to close panel' : 'Click to open Grammar Pro'}
              </div>
            </div>

            {/* Tooltip Arrow */}
            <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
              <div className="w-0 h-0 border-l-8 border-l-white dark:border-l-gray-800 
                             border-t-8 border-t-transparent border-b-8 border-b-transparent">
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingGrammarButton; 