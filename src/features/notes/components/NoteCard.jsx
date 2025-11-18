/**
 * NoteCardEnhanced.jsx
 * PERFORMANCE-OPTIMIZED version with ALL original visual features preserved
 * - All 5 gradient glow layers restored
 * - Animated trash can lid with spring animation
 * - Animated download button with path animations
 * - Loading spinner for delete operations
 * - Full color highlighting with dynamic hue extraction
 * - All hover effects and premium animations
 * - React.memo for performance
 */

import React from 'react';
import { motion } from 'framer-motion';
import PinButton from './PinButton';

const NoteCardEnhanced = React.memo(({ 
  note, 
  index, 
  theme, 
  noteIcon, 
  timeSince,
  onNoteClick, 
  onDownload, 
  onDelete,
  deletingId 
}) => {
  const staggerDelay = Math.min(index * 0.03, 0.3); // Optimized stagger
  
  // Extract the hue values for dynamic hover effects
  const gradientMatch = theme.accentStyle.backgroundImage?.match(/hsl\((\d+),/g);
  const hue1 = gradientMatch?.[0]?.match(/\d+/)?.[0] || '200';
  const hue2 = gradientMatch?.[1]?.match(/\d+/)?.[0] || '245';
  
  return (
    <motion.div
      key={note.id}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: staggerDelay,
        ease: [0.25, 0.46, 0.45, 0.94] // Custom cubic-bezier for smooth entry
      }}
      whileHover={{ 
        y: -8,
        scale: 1.015,
        transition: { 
          duration: 0.25,
          ease: [0.23, 1, 0.32, 1] // Premium easing curve
        }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      className={`${theme.bg} rounded-xl overflow-hidden flex flex-col h-[320px] transform-gpu cursor-pointer relative group
        shadow-sm hover:shadow-lg dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40
        transition-all duration-200 ease-out
        border border-gray-200/60 dark:border-gray-600/40
        hover:border-gray-300/80 dark:hover:border-gray-500/60`}
      style={{ 
        backfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d',
        aspectRatio: '1 / 1.25'
      }}
    >
      {/* RESTORED: Enhanced border glow effect with note-specific colors - ALL 5 LAYERS */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 ease-out">
        {/* Light mode glow effects */}
        <div className="dark:hidden">
          {/* Primary glow layer */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: `linear-gradient(135deg, hsl(${hue1}, 70%, 85%) 0%, hsl(${hue2}, 70%, 85%) 100%)`,
              opacity: 0.15,
            }}
          />
          
          {/* Secondary inner glow */}
          <div 
            className="absolute inset-2 rounded-lg"
            style={{
              background: `radial-gradient(ellipse at center, hsl(${hue1}, 60%, 90%) 0%, hsl(${hue2}, 60%, 92%) 30%, transparent 70%)`,
              opacity: 0.2,
            }}
          />
          
          {/* Subtle border highlight */}
          <div 
            className="absolute inset-0 rounded-xl p-[1px]"
            style={{
              background: `linear-gradient(135deg, hsl(${hue1}, 80%, 70%), hsl(${hue2}, 80%, 70%))`,
            }}
          >
            <div className="w-full h-full bg-white rounded-xl" />
          </div>
        </div>

        {/* Dark mode glow effects - ALL LAYERS RESTORED */}
        <div className="hidden dark:block">
          {/* Outer glow ring */}
          <div 
            className="absolute -inset-0.5 rounded-xl blur-sm"
            style={{
              background: `linear-gradient(135deg, hsl(${hue1}, 80%, 60%) 0%, hsl(${hue2}, 80%, 60%) 100%)`,
              opacity: 0.4,
            }}
          />
          
          {/* Inner vibrant glow */}
          <div 
            className="absolute inset-1 rounded-lg"
            style={{
              background: `radial-gradient(ellipse at center, hsl(${hue1}, 90%, 70%) 0%, hsl(${hue2}, 90%, 75%) 25%, transparent 60%)`,
              opacity: 0.15,
            }}
          />
          
          {/* Premium border with gradient */}
          <div 
            className="absolute inset-0 rounded-xl p-[1.5px]"
            style={{
              background: `linear-gradient(135deg, hsl(${hue1}, 85%, 65%) 0%, hsl(${hue2}, 85%, 65%) 50%, hsl(${hue1}, 90%, 70%) 100%)`,
            }}
          >
            <div className="w-full h-full bg-gray-800 rounded-xl" />
          </div>

          {/* Subtle inner rim light */}
          <div 
            className="absolute inset-2 rounded-lg"
            style={{
              background: `linear-gradient(135deg, hsl(${hue1}, 60%, 40%) 0%, transparent 30%, transparent 70%, hsl(${hue2}, 60%, 40%) 100%)`,
              opacity: 0.2,
            }}
          />
        </div>
      </div>

      {/* RESTORED: Dark mode specific glow overlay - ADDITIONAL LAYER */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 ease-out dark:block hidden">
        {/* Dark mode primary glow */}
        <div 
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, hsl(${hue1}, 50%, 25%) 0%, hsl(${hue2}, 50%, 25%) 100%)`,
            opacity: 0.3,
          }}
        />
        
        {/* Dark mode inner highlight */}
        <div 
          className="absolute inset-4 rounded-lg"
          style={{
            background: `radial-gradient(ellipse at center, hsl(${hue1}, 40%, 35%) 0%, hsl(${hue2}, 40%, 35%) 20%, transparent 60%)`,
            opacity: 0.25,
          }}
        />
      </div>

      {/* RESTORED: Accent color top border with shimmer effect */}
      <motion.div 
        className="h-1.5 w-full relative overflow-hidden z-10"
        style={theme.accentStyle}
      >
        {/* Shimmer effect adjusted for dark mode */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {/* RESTORED: Main content area with subtle dynamic hover backgrounds */}
      <motion.div 
        onClick={(e) => onNoteClick(e, note.id)}
        className="flex-grow p-5 overflow-hidden flex flex-col relative z-10"
      >
        {/* Light mode hover background */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-[0.06] dark:opacity-0 transition-opacity duration-300 pointer-events-none rounded-lg"
          style={{
            background: `linear-gradient(135deg, hsl(${hue1}, 60%, 95%) 0%, hsl(${hue2}, 60%, 96%) 50%, hsl(${hue1}, 60%, 94%) 100%)`,
          }}
        />

        {/* Dark mode hover background - redesigned */}
        <div 
          className="absolute inset-0 opacity-0 dark:group-hover:opacity-[0.12] transition-opacity duration-300 pointer-events-none rounded-lg hidden dark:block"
          style={{
            background: `linear-gradient(135deg, hsl(${hue1}, 40%, 25%) 0%, hsl(${hue2}, 40%, 28%) 50%, hsl(${hue1}, 35%, 22%) 100%)`,
          }}
        />

        {/* Dark mode additional inner glow */}
        <div 
          className="absolute inset-4 opacity-0 dark:group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none rounded-lg hidden dark:block"
          style={{
            background: `radial-gradient(ellipse at center, hsl(${hue1}, 50%, 30%) 0%, transparent 60%)`,
          }}
        />
        
        {/* Note header */}
        <div className="flex items-start justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2 flex-grow min-w-0">
            <motion.h2 
              className={`${theme.text} font-semibold text-lg leading-tight truncate flex-grow`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: staggerDelay + 0.1 }}
            >
              {note.title || 'Untitled'}
            </motion.h2>
            <motion.div
              className="flex-shrink-0 text-2xl"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: staggerDelay + 0.2, type: "spring" }}
            >
              {noteIcon}
            </motion.div>
          </div>
          
          <motion.div 
            className="flex-shrink-0 ml-2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: staggerDelay + 0.15 }}
          >
            <PinButton noteId={note.id} isPinned={note.pinned} />
          </motion.div>
        </div>
        
        <motion.div 
          className={`${theme.subtext} text-xs mb-3 flex items-center gap-1.5 relative z-10`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: staggerDelay + 0.2 }}
        >
          {timeSince}
        </motion.div>
        
        {/* RESTORED: Note content with proper truncation */}
        <motion.div 
          className={`${theme.text} text-sm leading-relaxed line-clamp-6 overflow-hidden flex-grow relative z-10`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: staggerDelay + 0.25 }}
          dangerouslySetInnerHTML={{ __html: note.content?.replace(/<[^>]*>/g, '') || 'No content' }}
        />
        
        {/* RESTORED: Action buttons with ALL animations */}
        <motion.div 
          className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-200/60 dark:border-gray-600/40 relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: staggerDelay + 0.3 }}
        >
          {/* RESTORED: Enhanced Download Button with ALL animations */}
          <motion.button
            onClick={(e) => onDownload(e, note)}
            className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 relative cursor-pointer group/btn
              hover:text-blue-600 dark:hover:text-blue-400 
              transition-all duration-150 ease-out hover:scale-110"
            aria-label="Download note"
            whileHover="hover"
            initial="initial"
          >
            {/* Light mode button background */}
            <div 
              className="absolute inset-0 rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 dark:hidden"
              style={{
                background: `hsl(${hue1}, 50%, 95%)`,
              }}
            />
            
            {/* Dark mode button background - premium */}
            <div 
              className="absolute inset-0 rounded-full opacity-0 dark:group-hover/btn:opacity-100 transition-opacity duration-200 hidden dark:block"
              style={{
                background: `radial-gradient(circle, hsl(${hue1}, 60%, 30%) 0%, hsl(${hue1}, 40%, 20%) 70%)`,
                boxShadow: `0 0 0 1px hsl(${hue1}, 70%, 50%, 0.3), inset 0 1px 0 hsl(${hue1}, 80%, 60%, 0.2)`,
              }}
            />
            
            <div className="w-5 h-5 relative z-10" style={{ pointerEvents: 'none' }}>
              {/* RESTORED: Document Icon with smooth animation */}
              <motion.svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0"
                variants={{
                  initial: { y: 0, opacity: 1 },
                  hover: { y: -8, opacity: 0 }
                }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ pointerEvents: 'none' }}
              >
                <path
                  d="M14 2.5H6C5.44772 2.5 5 2.94772 5 3.5V20.5C5 21.0523 5.44772 21.5 6 21.5H18C18.5523 21.5 19 21.0523 19 20.5V7.5L14 2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 2.5V7.5H19"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 12.5H8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 16.5H8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 8.5H9H8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>

              {/* RESTORED: Download Arrow with Circle Animation */}
              <motion.svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0"
                variants={{
                  initial: { y: 8, opacity: 0 },
                  hover: { y: 0, opacity: 1 }
                }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ pointerEvents: 'none' }}
              >
                {/* Circle with premium animation */}
                <motion.circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  variants={{
                    initial: { pathLength: 0, rotate: -90 },
                    hover: { pathLength: 1, rotate: 0 }
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ originX: 0.5, originY: 0.5 }}
                />
                {/* Download arrow */}
                <motion.path
                  d="M12 7v7m0 0l3-3m-3 3l-3-3m6 6H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={{
                    initial: { pathLength: 0 },
                    hover: { pathLength: 1 }
                  }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                />
              </motion.svg>
            </div>
          </motion.button>
          
          {/* RESTORED: Enhanced Trash Button with ANIMATED LID */}
          <motion.button
            onClick={(e) => onDelete(e, note)}
            disabled={deletingId === note.id}
            className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 relative cursor-pointer group/btn
              hover:text-red-600 dark:hover:text-red-400 
              transition-all duration-150 ease-out hover:scale-110"
            aria-label="Delete note"
            whileHover="hover"
            initial="initial"
          >
            {/* Light mode button background */}
            <div 
              className="absolute inset-0 rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 dark:hidden"
              style={{
                background: `hsl(${hue2}, 50%, 95%)`,
              }}
            />
            
            {/* Dark mode button background - premium */}
            <div 
              className="absolute inset-0 rounded-full opacity-0 dark:group-hover/btn:opacity-100 transition-opacity duration-200 hidden dark:block"
              style={{
                background: `radial-gradient(circle, hsl(${hue2}, 60%, 30%) 0%, hsl(${hue2}, 40%, 20%) 70%)`,
                boxShadow: `0 0 0 1px hsl(${hue2}, 70%, 50%, 0.3), inset 0 1px 0 hsl(${hue2}, 80%, 60%, 0.2)`,
              }}
            />
            
            {/* RESTORED: Loading spinner for delete operation */}
            {deletingId === note.id ? (
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-gray-400 dark:border-gray-500 animate-spin" />
            ) : (
              <div className="w-5 h-5 relative z-10" style={{ pointerEvents: 'none' }}>
                {/* Skinnier Trash Can Body */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-5 h-5"
                >
                  {/* Modified path to make trash can skinnier */}
                  <path d="M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
                  {/* Adjusted vertical lines inside trash can */}
                  <line x1="9" y1="10" x2="9" y2="18" />
                  <line x1="12" y1="10" x2="12" y2="18" />
                  <line x1="15" y1="10" x2="15" y2="18" />
                </svg>
                
                {/* RESTORED: Animated Lid with SPRING animation */}
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 absolute top-0 left-0"
                  variants={{
                    initial: { y: 0, rotate: 0 },
                    hover: { y: -6, rotate: -5 }
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 20,
                    duration: 0.2
                  }}
                  style={{ pointerEvents: 'none' }}
                >
                  {/* Trash can lid */}
                  <path d="M4 6h16" />
                  {/* Top arch */}
                  <path d="M10 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
                </motion.svg>
              </div>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo - only re-render if these props change
  return (
    prevProps.note.id === nextProps.note.id &&
    prevProps.note.title === nextProps.note.title &&
    prevProps.note.content === nextProps.note.content &&
    prevProps.note.lastUpdated === nextProps.note.lastUpdated &&
    prevProps.note.pinned === nextProps.note.pinned &&
    prevProps.deletingId === nextProps.deletingId
  );
});

NoteCardEnhanced.displayName = 'NoteCardEnhanced';

export default NoteCardEnhanced;
