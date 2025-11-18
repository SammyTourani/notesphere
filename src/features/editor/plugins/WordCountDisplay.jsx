import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WordCountDisplay = ({ editor, title = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    readingTime: { value: 0, unit: 'min' },
    speakingTime: { value: 0, unit: 'min' }
  });
  
  const containerRef = useRef(null);
  const previousContentRef = useRef({ title: '', editorText: '' });

  const calculateStats = useCallback(() => {
    if (!editor) return;
    const editorText = editor.getText();
    if (previousContentRef.current.title === title && previousContentRef.current.editorText === editorText) {
      return;
    }
    previousContentRef.current.title = title;
    previousContentRef.current.editorText = editorText;
    const combinedText = title + ' ' + editorText;
    const words = combinedText.split(/\s+/).filter(word => word.length > 0).length;
    const characters = combinedText.length;
    const avgWordLength = words > 0 ? combinedText.replace(/\s+/g, '').length / words : 0;
    let readingSpeed = 225;
    if (avgWordLength > 6) readingSpeed = 200;
    if (avgWordLength > 8) readingSpeed = 180;
    let readingTimeValue = (words / readingSpeed);
    let readingTimeUnit = 'min';
    if (words < 50 && words > 0) {
      readingTimeValue = Math.ceil(readingTimeValue * 60);
      readingTimeUnit = 'sec';
    } else {
      readingTimeValue = Math.max(0.5, Math.round(readingTimeValue * 2) / 2);
    }
    let speakingSpeed = 150;
    if (avgWordLength > 6) speakingSpeed = 130;
    if (avgWordLength > 8) speakingSpeed = 120;
    let speakingTimeValue = (words / speakingSpeed);
    let speakingTimeUnit = 'min';
    if (words < 30 && words > 0) {
      speakingTimeValue = Math.ceil(speakingTimeValue * 60);
      speakingTimeUnit = 'sec';
    } else {
      speakingTimeValue = Math.max(0.5, Math.round(speakingTimeValue * 2) / 2);
    }
    setStats({
      words,
      characters,
      readingTime: { value: readingTimeValue, unit: readingTimeUnit },
      speakingTime: { value: speakingTimeValue, unit: speakingTimeUnit }
    });
  }, [editor, title]);

  useEffect(() => {
    if (!editor) return;
    calculateStats();
    editor.on('update', calculateStats);
    return () => {
      editor.off('update', calculateStats);
    };
  }, [editor, calculateStats]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const detailsVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { 
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 20, mass: 1, staggerChildren: 0.05 } // Added staggerChildren
    },
    exit: { 
      opacity: 0, y: 10, scale: 0.95,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] }
    }
  };

  const statItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { // Removed custom prop, will rely on parent stagger
      opacity: 1, x: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  if (!editor) return null;

  return (
    <div className="word-count-container" ref={containerRef}>
      <motion.button
        className="word-count-toggle hover:scale-105 hover:-translate-y-1 active:scale-95 focus:outline-none"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        initial={{ opacity: 0, y: 0 }} // Explicitly set y:0
        animate={{ opacity: 1, y: 0 }} // Explicitly set y:0
        transition={{ 
          duration: 0.3, 
          delay: 0.2 // Slightly increased delay
        }} 
      >
        <motion.span 
          className="word-count-value"
          key={stats.words} 
          initial={{ opacity: 0.8, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {stats.words}
        </motion.span>
        <span className="word-count-label">&nbsp;words</span>
      </motion.button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="word-count-details"
            variants={detailsVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div className="stat-item" variants={statItemVariants} /* custom={0} removed */ >
              <span className="stat-label">Characters</span>
              <motion.span className="stat-value" key={stats.characters} initial={{ opacity: 0.8 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                {stats.characters}
              </motion.span>
            </motion.div>
            <motion.div className="stat-item" variants={statItemVariants} /* custom={1} removed */ >
              <span className="stat-label">Reading Time</span>
              <motion.span className="stat-value" key={`${stats.readingTime.value}-${stats.readingTime.unit}`} initial={{ opacity: 0.8 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                {stats.readingTime.value} {stats.readingTime.unit}
              </motion.span>
            </motion.div>
            <motion.div className="stat-item" variants={statItemVariants} /* custom={2} removed */ >
              <span className="stat-label">Speaking Time</span>
              <motion.span className="stat-value" key={`${stats.speakingTime.value}-${stats.speakingTime.unit}`} initial={{ opacity: 0.8 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
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