import React, { useState, useRef, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function PinButton({ noteId, isPinned, className = '', onPinChange }) {
  // Track both the loading state and internal pin state
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  // Use internal state to track pin status independently
  const [internalPinState, setInternalPinState] = useState(isPinned);
  const { togglePinStatus } = useNotes();
  const animationTimeoutRef = useRef(null);

  // Keep internal state synchronized with parent's isPinned prop
  useEffect(() => {
    setInternalPinState(isPinned);
  }, [isPinned]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  const handleTogglePin = async (e) => {
    e.stopPropagation();
    if (loading || isAnimating) return;

    setIsAnimating(true);
    setLoading(true);

    // Update internal state immediately for responsive UI
    const newPinState = !internalPinState;
    setInternalPinState(newPinState);

    try {
      const result = await togglePinStatus(noteId);
      setLoading(false);

      if (!result.success) {
        console.error("Failed to toggle pin status:", result.error);
        // Revert on failure
        setInternalPinState(!newPinState);
        setIsAnimating(false);
        return;
      }
      
      // Notify parent component about the pin state change
      if (onPinChange) {
        onPinChange(newPinState);
      }

      // Allow animation to complete
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 350);
    } catch (err) {
      console.error("Error toggling pin status:", err);
      // Revert on error
      setInternalPinState(!newPinState);
      setLoading(false);
      setIsAnimating(false);
    }
  };

  // Use internal state for all UI rendering decisions
  const iconColor = internalPinState 
    ? 'text-amber-500 dark:text-amber-400' 
    : 'text-gray-500 dark:text-gray-400';
  
  const hoverColor = 'hover:text-amber-500 dark:hover:text-amber-400';
  
  const transition = { 
    duration: 0.2, 
    ease: [0.4, 0.0, 0.2, 1]
  };

  return (
    <motion.button
      onClick={handleTogglePin}
      disabled={loading || isAnimating}
      aria-label={internalPinState ? 'Unpin note' : 'Pin note'}
      title={internalPinState ? 'Unpin note' : 'Pin note'}
      className={`relative p-2 rounded-full outline-none ${
        internalPinState 
          ? 'bg-amber-50/40 dark:bg-amber-900/15' 
          : 'bg-transparent hover:bg-gray-100/80 dark:hover:bg-gray-800/30'
      } ${(loading || isAnimating) ? 'cursor-not-allowed' : 'cursor-pointer'}
      transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-amber-500/50 
      focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900
      ${className} ${iconColor} ${!internalPinState ? hoverColor : ''}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={transition}
    >
      <div className="w-5 h-5 relative flex items-center justify-center">
        {loading ? (
          // Loading spinner
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <svg className="animate-spin w-full h-full" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" cy="12" r="10" 
                stroke="currentColor" 
                strokeWidth="2" 
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </motion.div>
        ) : (
          // Pin icon with animation based on internal state
          <AnimatePresence mode="wait">
            <motion.div 
              key={`pin-state-${internalPinState ? 'pinned' : 'unpinned'}`}
              initial={{ opacity: 0, y: internalPinState ? 2 : -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: internalPinState ? -2 : 2 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full h-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={internalPinState ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={internalPinState ? "1.75" : "1.5"}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-full h-full"
              >
                <path d="M9 4v6l-2 4v2h10v-2l-2-4V4" />
                <path d="M12 16v5" />
                <path d="M8 4h8" />
                {internalPinState && <path d="M9 7h6" />}
              </svg>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      
      {/* Glow effect when pinned */}
      {internalPinState && !loading && (
        <motion.div 
          className="absolute inset-0 rounded-full pointer-events-none bg-amber-500/0"
          initial={{ boxShadow: "0 0 0 0 rgba(251, 191, 36, 0)" }}
          animate={{ 
            boxShadow: "0 0 0 1px rgba(251, 191, 36, 0.15)"
          }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Hover highlight */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gray-500/0 pointer-events-none"
        initial={false}
        whileHover={{ 
          backgroundColor: internalPinState 
            ? "rgba(251, 191, 36, 0.05)" 
            : "rgba(0, 0, 0, 0.02)" 
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}