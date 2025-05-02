// src/components/MergeOptions.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { useNavigate } from 'react-router-dom';

function MergeOptions({ onClose }) {
  const { disableGuestMode } = useAuth();
  const { transferGuestNotesToUser, getMergeOptions } = useNotes();
  const navigate = useNavigate();
  
  const { guestNotesCount } = getMergeOptions();

  // Handler for transferring notes
  const handleTransferNotes = async () => {
    try {
      console.log("User chose to transfer notes");
      const result = await transferGuestNotesToUser();
      if (result.success) {
        console.log(`Successfully transferred ${result.count} of ${result.total} notes`);
        disableGuestMode();
        navigate('/notes');
      } else {
        console.error("Failed to transfer notes:", result.error);
      }
    } catch (err) {
      console.error("Error during note transfer:", err);
    }
  };

  // Handler for keeping notes separate
  const handleKeepSeparate = () => {
    console.log("User chose to keep notes separate");
    disableGuestMode();
    navigate('/notes');
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
            <h2 className="text-xl font-bold">Your Guest Notes</h2>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-1"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg p-4 mb-6">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-medium">
              You have {guestNotesCount} {guestNotesCount === 1 ? 'note' : 'notes'} in guest mode
            </span>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Would you like to transfer these notes to your account, or keep them separate?
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleTransferNotes}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-colors"
            >
              Transfer Notes
            </button>
            <button
              onClick={handleKeepSeparate}
              className="flex-1 bg-white text-gray-800 text-center py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Keep Separate
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MergeOptions;