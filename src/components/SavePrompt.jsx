// src/components/SavePrompt.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';

function SavePrompt() {
  const { notes, transferGuestNotesToUser } = useNotes();
  const { disableGuestMode } = useAuth();
  const navigate = useNavigate();
  const noteCount = notes?.length || 0;

  // Handle closing the prompt to continue as guest
  const handleContinueAsGuest = () => {
    navigate('/notes');
  };

  // Handle transferring notes when a user signs up
  const handleAfterSignup = async () => {
    try {
      const result = await transferGuestNotesToUser();
      if (result.success) {
        console.log(`Successfully transferred ${result.count} notes`);
      } else {
        console.error('Failed to transfer notes:', result.error);
      }
      disableGuestMode();
    } catch (error) {
      console.error('Error during transfer:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-6 px-6 text-white">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold">Ready to save your work?</h2>
            <button 
              onClick={handleContinueAsGuest}
              className="text-white/80 hover:text-white p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Note count and message */}
          <div className="mb-6">
            <div className="flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                {noteCount === 0 ? 'No notes yet' : 
                 noteCount === 1 ? 'You have 1 note' : 
                 `You have ${noteCount} notes`}
              </span>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300">
              Your notes are currently only stored in this browser. Create an account to:
            </p>
          </div>
          
          {/* Benefits list */}
          <ul className="space-y-3 mb-6">
            {[
              "Access your notes from any device",
              "Never lose your important thoughts",
              "Organize with powerful search and tags",
              "Collaborate and share with others"
            ].map((benefit, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                className="flex items-start"
              >
                <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
              </motion.li>
            ))}
          </ul>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/signup"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-colors"
              onClick={handleAfterSignup}
            >
              Sign Up — Free
            </Link>
            <Link
              to="/login"
              className="flex-1 bg-white text-gray-800 text-center py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              onClick={handleAfterSignup}
            >
              Log In
            </Link>
          </div>
          
          {/* Continue as guest link */}
          <div className="mt-4 text-center">
            <button
              onClick={handleContinueAsGuest}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Continue as guest
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default SavePrompt;