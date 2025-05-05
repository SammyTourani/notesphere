// src/components/ThemeToggle.jsx
import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '', size = 'md', showBackground = true }) => {
  const { darkMode, toggleTheme } = useTheme();
  const circleRef = useRef(null);

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  // Add ripple effect on click
  const createRipple = (e) => {
    if (!circleRef.current) return;
    
    const button = circleRef.current;
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    const ripple = document.createElement('span');
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
    ripple.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
    ripple.classList.add('ripple');
    
    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const handleClick = (e) => {
    createRipple(e);
    toggleTheme();
  };

  // Enhanced SVG path variants for morphing animation
  const sunPath = "M12 7a5 5 0 100 10 5 5 0 000-10zM12 4V2M12 22v-2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42";
  const moonPath = "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z";

  return (
    <motion.button
      ref={circleRef}
      onClick={handleClick}
      className={`relative overflow-hidden flex items-center justify-center rounded-full focus:outline-none ${
        showBackground 
          ? darkMode 
            ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' 
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          : ''
      } ${sizeClasses[size]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5">
        <AnimatePresence initial={false} mode="wait">
          {darkMode ? (
            // Moon icon with particles
            <motion.div
              key="moon"
              initial={{ opacity: 0, rotate: -20, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 20, scale: 0.5 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <motion.path
                  d={moonPath}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </svg>
              
              {/* Moon particles */}
              <motion.div 
                className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-current"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.6], scale: [0, 1, 0.8] }}
                transition={{ duration: 1, delay: 0.2 }}
              />
              <motion.div 
                className="absolute top-3 -right-2 w-1 h-1 rounded-full bg-current"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.4], scale: [0, 1, 0.6] }}
                transition={{ duration: 1, delay: 0.3 }}
              />
              <motion.div 
                className="absolute bottom-0 right-1 w-1 h-1 rounded-full bg-current"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.7], scale: [0, 1, 0.7] }}
                transition={{ duration: 1, delay: 0.4 }}
              />
            </motion.div>
          ) : (
            // Sun icon with rays animation
            <motion.div
              key="sun"
              initial={{ opacity: 0, rotate: 20, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -20, scale: 0.5 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <motion.circle 
                  cx="12" 
                  cy="12" 
                  r="5" 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                />
                <motion.path 
                  d="M12 4V2M12 22v-2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              
              {/* Sun rays burst */}
              <motion.div 
                className="absolute inset-0 rounded-full"
                initial={{ boxShadow: "0 0 0 0 rgba(255, 255, 255, 0)" }}
                animate={{ boxShadow: "0 0 0 10px rgba(255, 255, 255, 0)" }}
                transition={{ repeat: 1, duration: 1, repeatType: "reverse" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

export default ThemeToggle;