import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../context/NotesContext';
import { motion, AnimatePresence } from 'framer-motion';
import DeleteConfirmationModal from './DeleteConfirmationModal';

function TrashView() {
  const { trashedNotes, restoreFromTrash, permanentlyDeleteNote, emptyTrash, refreshNotes } = useNotes();
  const [searchText, setSearchText] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [emptyTrashModalOpen, setEmptyTrashModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const navigate = useNavigate();

  // Filter notes based on search
  const filteredNotes = trashedNotes?.filter(note => 
    !searchText || 
    note.title?.toLowerCase().includes(searchText.toLowerCase()) || 
    note.content?.toLowerCase().includes(searchText.toLowerCase())
  ) || [];
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // If date is today, show time only
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // Otherwise show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Open permanent delete confirmation modal
  const openDeleteModal = (e, note) => {
    e.preventDefault();
    e.stopPropagation();
    setNoteToDelete(note);
    setDeleteModalOpen(true);
  };
  
  // Handle confirmed permanent deletion
  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    
    setDeletingId(noteToDelete.id);
    setDeleteModalOpen(false);
    
    try {
      await permanentlyDeleteNote(noteToDelete.id);
      await refreshNotes();
    } catch (err) {
      console.error('Error permanently deleting note:', err);
    } finally {
      setDeletingId(null);
      setNoteToDelete(null);
    }
  };
  
  // Handle note restoration
  const handleRestoreNote = async (e, noteId) => {
    e.preventDefault();
    e.stopPropagation();
    
    setRestoringId(noteId);
    
    try {
      await restoreFromTrash(noteId);
      await refreshNotes();
    } catch (err) {
      console.error('Error restoring note:', err);
    } finally {
      setRestoringId(null);
    }
  };
  
  // Handle emptying the entire trash
  const handleEmptyTrash = async () => {
    setEmptyTrashModalOpen(false);
    
    try {
      await emptyTrash();
      await refreshNotes();
    } catch (err) {
      console.error('Error emptying trash:', err);
    }
  };
  
  // Get note excerpt for preview
  const getExcerpt = (content, maxLength = 100) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    
    // Find the last complete word within the limit
    return content.substring(0, maxLength).split(' ').slice(0, -1).join(' ') + '...';
  };
  
  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header with status info */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Trash</h1>
          </div>
          
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search trash..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        {/* Empty trash button */}
        {trashedNotes && trashedNotes.length > 0 && (
          <div className="mb-6 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setEmptyTrashModalOpen(true)}
              className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Empty Trash
            </motion.button>
          </div>
        )}
        
        {/* Notes grid */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            {searchText ? (
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">No items in trash match your search</p>
                <button
                  onClick={() => setSearchText('')}
                  className="text-purple-600 dark:text-purple-400 underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Your trash is empty</p>
                <button
                  onClick={() => navigate('/notes')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow"
                >
                  Back to Notes
                </button>
              </div>
            )}
          </div>
        ) : (
          // Grid layout for notes
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredNotes.map(note => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden flex flex-col aspect-[3/4] max-h-[300px]"
              >
                {/* Main content area */}
                <div className="flex-grow p-4 overflow-hidden flex flex-col">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate mb-2">
                    {note.title || 'Untitled Note'}
                  </h2>
                  
                  <div className="text-gray-600 dark:text-gray-300 text-sm flex-grow overflow-hidden">
                    {getExcerpt(note.content)}
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex flex-col">
                    <span>Deleted: {formatDate(note.deletedAt)}</span>
                    <span>Last edited: {formatDate(note.lastUpdated)}</span>
                  </div>
                </div>
                
                {/* Action buttons footer */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center border-t border-gray-100 dark:border-gray-700">
                  {/* Restore Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleRestoreNote(e, note.id)}
                    disabled={restoringId === note.id}
                    className="p-1.5 rounded-full text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative"
                    aria-label="Restore note"
                  >
                    {restoringId === note.id ? (
                      <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-gray-400 animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    )}
                  </motion.button>
                  
                  {/* Permanent Delete Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => openDeleteModal(e, note)}
                    disabled={deletingId === note.id}
                    className="p-1.5 rounded-full text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative"
                    aria-label="Delete note permanently"
                  >
                    {deletingId === note.id ? (
                      <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-gray-400 animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={noteToDelete?.title}
      />
      
      {/* Empty Trash Confirmation Modal */}
      <AnimatePresence>
        {emptyTrashModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setEmptyTrashModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
                  Empty Trash?
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                  All notes in trash will be permanently deleted. This action cannot be undone.
                </p>
                
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEmptyTrashModalOpen(false)}
                    className="px-4 py-2 w-full text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEmptyTrash}
                    className="px-4 py-2 w-full text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Empty Trash
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TrashView;