/**
 * Optimized Note Card Component
 * Extracted from NotesList for better performance
 * Uses React.memo to prevent unnecessary re-renders
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PinButton from './PinButton';

const NoteCard = memo(({ note, index, theme, noteIcon, timeSince, onDelete }) => {
  const navigate = useNavigate();
  
  // Extract hue values for hover effects (memoized via props)
  const gradientMatch = theme.accentStyle.backgroundImage?.match(/hsl\((\d+),/g);
  const hue1 = gradientMatch?.[0]?.match(/\d+/)?.[0] || '200';
  const hue2 = gradientMatch?.[1]?.match(/\d+/)?.[0] || '245';
  
  // Limit stagger delay to prevent excessive delay on large lists
  const staggerDelay = Math.min(index * 0.03, 0.3);

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('[data-interactive]')) {
      return;
    }
    navigate(`/notes/${note.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3,
        delay: staggerDelay,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -6,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      onClick={handleCardClick}
      className={`${theme.bg} rounded-xl overflow-hidden flex flex-col h-[320px] cursor-pointer relative group
        shadow-sm hover:shadow-lg dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40
        transition-shadow duration-200
        border border-gray-200/60 dark:border-gray-600/40
        hover:border-gray-300/80 dark:hover:border-gray-500/60
        will-change-transform`}
      style={{ 
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)', // GPU acceleration
      }}
    >
      {/* Simplified hover glow - single layer */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
        style={{
          background: `linear-gradient(135deg, hsl(${hue1}, 70%, 85%) 0%, hsl(${hue2}, 70%, 85%) 100%)`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Dark mode glow - simplified */}
      <div 
        className="hidden dark:block absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 pointer-events-none transition-opacity duration-200"
        style={{
          background: `radial-gradient(ellipse at center, hsl(${hue1}, 60%, 50%) 0%, transparent 70%)`,
        }}
      />

      {/* Accent top border */}
      <div 
        className="h-1.5 w-full"
        style={theme.accentStyle}
      />

      {/* Content container */}
      <div className="flex-1 p-5 flex flex-col overflow-hidden">
        {/* Header with pin button */}
        <div className="flex justify-between items-start mb-3 min-h-[2rem]">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{noteIcon}</span>
            {note.pinned && (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0"
              >
                <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
              </svg>
            )}
          </div>
          <div data-interactive="true" onClick={(e) => e.stopPropagation()}>
            <PinButton note={note} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 break-words">
          {note.title || 'Untitled Note'}
        </h3>

        {/* Content preview */}
        <div className="flex-1 overflow-hidden mb-3">
          <p 
            className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4"
            dangerouslySetInnerHTML={{ 
              __html: note.content?.replace(/<[^>]+>/g, ' ').substring(0, 150) || 'No content yet...' 
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {timeSince}
          </span>
          
          <button
            data-interactive="true"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:text-red-600 dark:hover:text-red-400"
            aria-label="Delete note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.note.id === nextProps.note.id &&
    prevProps.note.title === nextProps.note.title &&
    prevProps.note.content === nextProps.note.content &&
    prevProps.note.pinned === nextProps.note.pinned &&
    prevProps.note.lastUpdated === nextProps.note.lastUpdated &&
    prevProps.index === nextProps.index
  );
});

NoteCard.displayName = 'NoteCard';

export default NoteCard;
