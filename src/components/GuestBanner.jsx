// src/components/GuestBanner.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';

function GuestBanner() {
  const { currentUser, isGuestMode } = useAuth();
  const { getMergeOptions } = useNotes();
  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  // Determine if the banner should be shown
  const shouldShowBanner =
    isGuestMode &&
    !currentUser &&
    location.pathname !== '/login' &&
    location.pathname !== '/signup' &&
    location.pathname !== '/'; // Added condition to hide on home view

  if (!shouldShowBanner) {
    return null;
  }

  // Get info about guest notes (though not directly used for visibility here, it's good practice to keep)
  const { hasGuestNotes, guestNotesCount } = getMergeOptions();
  
  // Function to navigate to signup safely
  const handleSignUp = () => {
    // Store the current path in session storage so we can redirect back to notes list
    sessionStorage.setItem('guestSignInRedirect', 'true');
    navigate('/signup');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 right-4 z-30"
    >
      <div className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 text-white px-3 py-2 rounded-full shadow-md flex items-center space-x-2">
        <span className="text-xs font-medium">Guest Mode</span>
        <button
          onClick={handleSignUp}
          className="text-xs bg-white text-purple-700 hover:bg-purple-50 px-2 py-0.5 rounded-full font-medium transition-colors"
        >
          Sign Up
        </button>
      </div>
    </motion.div>
  );
}

export default GuestBanner; 