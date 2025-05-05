// src/components/TrashView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../context/NotesContext';
import { motion } from 'framer-motion';
import DeleteConfirmationModal from './DeleteConfirmationModal';

function TrashView() {
  const { trashedNotes, loading, error, restoreFromTrash, deleteNotePermanently, emptyTrash } = useNotes();
  const [sortedNotes, setSortedNotes] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const navigate = useNavigate();

  // Sort notes by deletion date when trashedNotes changes
  useEffect(() => {
    if (!trashedNotes || trashedNotes.length === 0) {
      setSortedNotes([]);
      return;
    }
    
    // Sort by deletedAt timestamp, most recent first
    const sorted = [...trashedNotes].sort((a, b) => {
      const dateA = a.deletedAt ? new Date(a.deletedAt) : new Date(0);
      const dateB = b.deletedAt ? new Date(b.deletedAt) : new Date(0);
      return dateB - dateA;
    });
    
    setSortedNotes(sorted);
  }, [trashedNotes]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // If date is today, show time only
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // If date is yesterday
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // Otherwise show date and time
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
        ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Handle navigation back to notes
  const handleBackToNotes = () => {
    navigate('/notes');
  };
  
  // Open delete confirmation modal for a single note
  const openDeleteModal = (note) => {
    setNoteToDelete(note);
    setDeleteModalOpen(true);
  };
  
  // Open delete all confirmation modal
  const openDeleteAllModal = () => {
    setDeleteAllModalOpen(true);
  };
  
  // Handle confirmed single note deletion
  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    
    setDeletingId(noteToDelete.id);
    setDeleteModalOpen(false);
    
    try {
      await deleteNotePermanently(noteToDelete.id);
    } catch (err) {
      console.error('Error permanently deleting note:', err);
    } finally {
      setDeletingId(null);
      setNoteToDelete(null);
    }
  };
  
  // Handle confirmed empty trash
  const handleConfirmEmptyTrash = async () => {
    setDeleteAllModalOpen(false);
    
    try {
      await emptyTrash();
    } catch (err) {
      console.error('Error emptying trash:', err);
    }
  };
  
  // Handle note restoration
  const handleRestore = async (noteId) => {
    try {
      setDeletingId(noteId);
      await restoreFromTrash(noteId);
    } catch (err) {
      console.error('Error restoring note:', err);
    } finally {
      setDeletingId(null);
    }
  };
  
  // Helper function to strip HTML tags for preview
  const stripHtml = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };
  
  // Get note excerpt for preview - handles HTML content
  const getExcerpt = (content, maxLength = 120) => {
    if (!content) return '';
    
    // Strip HTML tags
    const textContent = stripHtml(content);
    
    if (textContent.length <= maxLength) return textContent;
    
    // Find the last complete word within the limit
    return textContent.substring(0, maxLength).split(' ').slice(0, -1).join(' ') + '...';
  };
  
  if (loading) {
    return (
      <div className="pt-16 h-screen flex justify-center items-start">
        <div className="mt-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4 text-center">Loading trash...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToNotes}
              className="mr-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:shadow text-gray-600 dark:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </motion.button>
            
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Trash</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Items will be permanently deleted after 30 days</p>
            </div>
          </div>
          
          {/* Empty trash button - only show if there are notes */}
          {sortedNotes.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openDeleteAllModal}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
            >
              Empty Trash
            </motion.button>
          )}
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md">
            {error}
          </div>
        )}
        
        {/* Main content */}
        {sortedNotes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="max-w-md mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Your trash is empty</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Deleted notes will appear here</p>
              <button
                onClick={handleBackToNotes}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm hover:shadow transition-all duration-200"
              >
                Back to Notes
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
            {sortedNotes.map(note => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow pr-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {getExcerpt(note.content)}
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Deleted {formatDate(note.deletedAt)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {/* Restore button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRestore(note.id)}
                      disabled={deletingId === note.id}
                      className="p-2 rounded-full text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      aria-label="Restore note"
                    >
                      {deletingId === note.id ? (
                        <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-blue-600 dark:border-blue-400 animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                    </motion.button>
                    
                    {/* Delete permanently button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openDeleteModal(note)}
                      disabled={deletingId === note.id}
                      className="p-2 rounded-full text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
                      aria-label="Delete permanently"
                    >
                      {deletingId === note.id ? (
                        <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-red-600 dark:border-red-400 animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Single note delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={noteToDelete?.title}
        isPermanent={true}
      />
      
      {/* Empty all trash confirmation modal */}
      <DeleteConfirmationModal
        isOpen={deleteAllModalOpen}
        onClose={() => setDeleteAllModalOpen(false)}
        onConfirm={handleConfirmEmptyTrash}
        title="all items"
        isPermanent={true}
        isEmptyTrash={true}
      />
    </div>
  );
}

export default TrashView;