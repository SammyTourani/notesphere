import React from 'react';
import { motion } from 'framer-motion';

const EditorMenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  tooltip = '',
  children,
  className = '',
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.1, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`editor-button relative ${
        isActive ? 'active' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      disabled={disabled}
      title={tooltip}
      aria-pressed={isActive}
    >
      {children}
      {tooltip && !disabled && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          whileHover={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50"
          style={{ boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
        >
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </motion.div>
      )}
    </motion.button>
  );
};

export default EditorMenuButton;