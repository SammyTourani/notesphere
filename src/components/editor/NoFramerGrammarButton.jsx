/**
 * 🎯 NO-FRAMER GRAMMAR BUTTON
 * A simple, elegant grammar toggle button without Framer Motion dependencies
 * Designed to be lightweight and performant
 */

import React from 'react';

const NoFramerGrammarButton = ({ 
  isActive = false, 
  onClick, 
  issueCount = 0, 
  position = "bottom-right",
  size = "medium"
}) => {
  // Position classes
  const positionClasses = {
    "bottom-right": "fixed bottom-6 right-6",
    "bottom-left": "fixed bottom-6 left-6", 
    "top-right": "fixed top-6 right-6",
    "top-left": "fixed top-6 left-6"
  };

  // Size classes
  const sizeClasses = {
    small: "w-12 h-12 text-sm",
    medium: "w-14 h-14 text-base", 
    large: "w-16 h-16 text-lg"
  };

  const handleClick = () => {
    console.log('🎯 NoFramerGrammarButton clicked, current state:', isActive);
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${positionClasses[position]}
        ${sizeClasses[size]}
        bg-blue-600 hover:bg-blue-700 active:bg-blue-800
        text-white font-semibold
        rounded-full shadow-lg hover:shadow-xl
        transition-all duration-200 ease-in-out
        transform hover:scale-105 active:scale-95
        z-50 flex items-center justify-center
        ${isActive ? 'ring-4 ring-blue-300 bg-blue-700' : ''}
        focus:outline-none focus:ring-4 focus:ring-blue-300
      `}
      title={isActive ? 'Hide Grammar Checker' : 'Show Grammar Checker'}
      aria-label={`Grammar checker ${isActive ? 'active' : 'inactive'}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Grammar icon */}
        <span className="text-lg">✓</span>
        
        {/* Issue count badge */}
        {issueCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
            {issueCount > 99 ? '99+' : issueCount}
          </span>
        )}
      </div>
    </button>
  );
};

export default NoFramerGrammarButton;
