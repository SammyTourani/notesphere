// src/components/DeleteConfirmationModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title, isPermanent = false, isEmptyTrash = false }) {
  if (!isOpen) return null;
  
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };
  
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {isPermanent ? "Permanent Deletion" : "Move to Trash"}
                </h3>
              </div>
              
              {/* Content */}
              <div className="p-5">
                {isEmptyTrash ? (
                  <p className="text-gray-600 dark:text-gray-300">
                    Are you sure you want to permanently delete all items in the trash? This action cannot be undone.
                  </p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">
                    Are you sure you want to {isPermanent ? "permanently delete" : "move to trash"} the note{title ? `: "${title.length > 20 ? title.substring(0, 20) + '...' : title}"` : ''}?
                    {isPermanent && " This action cannot be undone."}
                  </p>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 rounded-md text-white transition-colors duration-150 ${
                    isPermanent 
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {isPermanent ? 'Delete Permanently' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default DeleteConfirmationModal;