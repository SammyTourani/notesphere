import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WordCountDisplay = ({ editor, title = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    readingTime: { value: 0, unit: 'min' },
    speakingTime: { value: 0, unit: 'min' }
  });
  
  const containerRef = useRef(null);
  const previousContentRef = useRef({ title: '', editorText: '' });

  // Animation check - only perform entrance animation once per session
  useEffect(() => {
    // Check if we've already animated this component this session
    const hasAnimated = sessionStorage.getItem('wordCountAnimated') === 'true';
    
    if (hasAnimated) {
      // Skip animation if we've already done it
      setAnimationComplete(true);
    } else {
      // Mark that we've animated this component
      sessionStorage.setItem('wordCountAnimated', 'true');
    }
    
    // No cleanup needed as we want to maintain state across remounts
  }, []);

  // Calculate stats from editor content
  const calculateStats = useCallback(() => {
    if (!editor) return;
    
    // Get plain text content from editor
    const editorText = editor.getText();
    
    // Skip recalculation if content hasn't changed
    if (
      previousContentRef.current.title === title && 
      previousContentRef.current.editorText === editorText
    ) {
      return;
    }
    
    // Update previous content refs
    previousContentRef.current.title = title;
    previousContentRef.current.editorText = editorText;
    
    // Combine editor text with title
    const combinedText = title + ' ' + editorText;
    
    // Word count - split by whitespace and filter empty strings
    const words = combinedText.split(/\s+/).filter(word => word.length > 0).length;
    
    // Character count (including spaces)
    const characters = combinedText.length;
    
    // More accurate reading time calculation
    // Average reading speed: 225-250 words per minute
    // Factor in word length: longer words take longer to read
    const avgWordLength = words > 0 ? 
      combinedText.replace(/\s+/g, '').length / words : 0;
      
    // Adjust reading speed based on average word length
    // Longer words = slower reading
    let readingSpeed = 225; // Base words per minute
    if (avgWordLength > 6) readingSpeed = 200;
    if (avgWordLength > 8) readingSpeed = 180;
    
    // Calculate reading time
    let readingTimeValue = (words / readingSpeed);
    let readingTimeUnit = 'min';
    
    // For very short texts, use seconds
    if (words < 50 && words > 0) {
      readingTimeValue = Math.ceil(readingTimeValue * 60);
      readingTimeUnit = 'sec';
    } else {
      // Round to nearest 0.5 for minutes
      readingTimeValue = Math.max(0.5, Math.round(readingTimeValue * 2) / 2);
    }
    
    // Speaking time calculation (slower than reading)
    // Average speaking: 150 words per minute, adjusted for word complexity
    let speakingSpeed = 150;
    if (avgWordLength > 6) speakingSpeed = 130;
    if (avgWordLength > 8) speakingSpeed = 120;
    
    let speakingTimeValue = (words / speakingSpeed);
    let speakingTimeUnit = 'min';
    
    // For very short texts, use seconds
    if (words < 30 && words > 0) {
      speakingTimeValue = Math.ceil(speakingTimeValue * 60);
      speakingTimeUnit = 'sec';
    } else {
      // Round to nearest 0.5 for minutes
      speakingTimeValue = Math.max(0.5, Math.round(speakingTimeValue * 2) / 2);
    }
    
    // Update stats
    setStats({
      words,
      characters,
      readingTime: { 
        value: readingTimeValue, 
        unit: readingTimeUnit 
      },
      speakingTime: { 
        value: speakingTimeValue, 
        unit: speakingTimeUnit 
      }
    });
  }, [editor, title]);

  // Update stats when editor content changes
  useEffect(() => {
    if (!editor) return;
    
    // Initial calculation
    calculateStats();
    
    // Subscribe to editor changes
    editor.on('update', calculateStats);
    
    // Cleanup
    return () => {
      editor.off('update', calculateStats);
    };
  }, [editor, calculateStats]);

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Enhanced word count animation variants
  const countVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: 0.1, // Slight delay after toolbar appears
        ease: [0.2, 0.65, 0.3, 0.9] // Custom easing
      }
    },
    hover: {
      scale: 1.05,
      y: -3,
      boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.1)",
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

  // Stats detail panel animation variants
  const detailsVariants = {
    hidden: { 
      opacity: 0, 
      y: 10, 
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 20,
        mass: 1
      }
    },
    exit: { 
      opacity: 0, 
      y: 10, 
      scale: 0.95,
      transition: { 
        duration: 0.2, 
        ease: [0.4, 0, 1, 1] 
      }
    }
  };

  // Stat item animation variants (for staggered animation)
  const statItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: custom => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: custom * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  if (!editor) return null;

  return (
    <div className="word-count-container" ref={containerRef}>
      {/* Animated word count button with hover effects */}
      <motion.button
        className="word-count-toggle"
        onClick={toggleExpanded}
        initial={animationComplete ? "visible" : "hidden"}
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        variants={countVariants}
        onAnimationComplete={() => setAnimationComplete(true)}
      >
        <motion.span 
          className="word-count-value"
          // Subtle number change animation
          key={stats.words}
          initial={{ opacity: 0.8, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {stats.words}
        </motion.span>
        <span className="word-count-label">&nbsp;words</span>
      </motion.button>
      
      {/* Expanded stats panel with staggered animations */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="word-count-details"
            variants={detailsVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="stat-item"
              variants={statItemVariants}
              custom={0}
              initial="hidden"
              animate="visible"
            >
              <span className="stat-label">Characters</span>
              <motion.span 
                className="stat-value"
                key={stats.characters}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {stats.characters}
              </motion.span>
            </motion.div>
            
            <motion.div 
              className="stat-item"
              variants={statItemVariants}
              custom={1}
              initial="hidden"
              animate="visible"
            >
              <span className="stat-label">Reading Time</span>
              <motion.span 
                className="stat-value"
                key={`${stats.readingTime.value}-${stats.readingTime.unit}`}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {stats.readingTime.value} {stats.readingTime.unit}
              </motion.span>
            </motion.div>
            
            <motion.div 
              className="stat-item"
              variants={statItemVariants}
              custom={2}
              initial="hidden"
              animate="visible"
            >
              <span className="stat-label">Speaking Time</span>
              <motion.span 
                className="stat-value"
                key={`${stats.speakingTime.value}-${stats.speakingTime.unit}`}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {stats.speakingTime.value} {stats.speakingTime.unit}
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WordCountDisplay;