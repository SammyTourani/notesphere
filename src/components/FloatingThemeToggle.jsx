// src/components/FloatingThemeToggle.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const FloatingThemeToggle = () => {
  const { showFloatingToggle } = useTheme();
  const { currentUser, isGuestMode } = useAuth();

  // Don't render if:
  // 1. User has disabled the floating toggle in settings, OR
  // 2. User is in guest mode, OR
  // 3. User is not authenticated
  if (!showFloatingToggle || isGuestMode || !currentUser) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed top-4 right-4 z-50"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <ThemeToggle 
          size="md" 
          showBackground={true}
          className="shadow-lg"
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingThemeToggle;