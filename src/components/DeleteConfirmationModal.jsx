import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, isPermanent = false }) => {
  if (!isOpen) return null;
  
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };
  
  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden w-full max-w-md relative z-10"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="p-5">
              <div className="flex items-start mb-4">
                <div className={`p-2 rounded-full ${isPermanent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-6 w-6 ${isPermanent ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {isPermanent ? 'Permanently delete note?' : 'Move to trash?'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isPermanent 
                      ? 'This note will be permanently deleted and cannot be recovered.'
                      : 'This note will be moved to the trash. You can restore it later if needed.'
                    }
                  </p>
                  {title && (
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700/50 rounded text-sm font-medium text-gray-800 dark:text-gray-300 truncate">
                      "{title || 'Untitled Note'}"
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    isPermanent 
                      ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' 
                      : 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800'
                  }`}
                  onClick={onConfirm}
                >
                  {isPermanent ? 'Yes, Delete Permanently' : 'Yes, Move to Trash'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal;