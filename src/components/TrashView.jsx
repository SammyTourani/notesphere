import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotes } from '../context/NotesContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';

function TrashView() {
  const { trashedNotes, restoreFromTrash, permanentlyDeleteNote, emptyTrash } = useNotes();
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [confirmEmptyTrashOpen, setConfirmEmptyTrashOpen] = useState(false);
  const navigate = useNavigate();

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
      
      // Otherwise show date and time
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Navigate back to notes list
  const handleBackClick = () => {
    navigate('/notes');
  };
  
  // Open restore confirmation
  const handleRestore = async (noteId) => {
    setDeletingId(noteId);
    
    try {
      await restoreFromTrash(noteId);
    } catch (err) {
      console.error('Error restoring note:', err);
    } finally {
      setDeletingId(null);
    }
  };
  
  // Open delete confirmation modal
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
    } catch (err) {
      console.error('Error permanently deleting note:', err);
    } finally {
      setDeletingId(null);
      setNoteToDelete(null);
    }
  };
  
  // Handle empty trash confirmation
  const handleEmptyTrash = async () => {
    setConfirmEmptyTrashOpen(false);
    
    try {
      await emptyTrash();
    } catch (err) {
      console.error('Error emptying trash:', err);
    }
  };

  const getExcerpt = (content, maxLength = 100) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    
    // Find the last complete word within the limit
    return content.substring(0, maxLength).split(' ').slice(0, -1).join(' ') + '...';
  };
  
  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header with back button */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <button 
              onClick={handleBackClick}
              className="mr-3 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Trash
            </h1>
          </div>
          
          {trashedNotes && trashedNotes.length > 0 && (
            <button
              onClick={() => setConfirmEmptyTrashOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow transition-colors"
            >
              Empty Trash
            </button>
          )}
        </div>
        
        {/* Notes list */}
        {!trashedNotes || trashedNotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 mb-4 text-gray-300 dark:text-gray-600">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">Your trash is empty</p>
            <button
              onClick={handleBackClick}
              className="text-purple-600 dark:text-purple-400 underline"
            >
              Return to notes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {trashedNotes.map(note => (
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
                <div className="flex-grow p-4 overflow-hidden flex flex-col">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate mb-2">
                    {note.title || 'Untitled Note'}
                  </h2>
                  
                  <div className="text-gray-600 dark:text-gray-300 text-sm flex-grow overflow-hidden">
                    {getExcerpt(note.content)}
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <div>Deleted: {formatDate(note.deletedAt)}</div>
                  </div>
                </div>
                
                {/* Action buttons footer */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center border-t border-gray-100 dark:border-gray-700">
                  {/* Restore Button */}
                  <motion.button
                    onClick={() => handleRestore(note.id)}
                    disabled={deletingId === note.id}
                    className="p-1.5 rounded-full text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative"
                    aria-label="Restore note"
                    whileHover="hover"
                    initial="initial"
                  >
                    {deletingId === note.id ? (
                      <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-gray-400 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 relative" style={{ pointerEvents: 'none' }}>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="w-5 h-5" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                          />
                        </svg>
                      </div>
                    )}
                  </motion.button>
                  
                  {/* Delete Permanently Button */}
                  <motion.button
                    onClick={(e) => openDeleteModal(e, note)}
                    disabled={deletingId === note.id}
                    className="p-1.5 rounded-full text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative"
                    aria-label="Delete note permanently"
                    whileHover="hover"
                    initial="initial"
                  >
                    {deletingId === note.id ? (
                      <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-gray-400 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 relative" style={{ pointerEvents: 'none' }}>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className="w-5 h-5"
                        >
                          <path d="M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
                          <line x1="9" y1="10" x2="9" y2="18" />
                          <line x1="12" y1="10" x2="12" y2="18" />
                          <line x1="15" y1="10" x2="15" y2="18" />
                          <path d="M4 6h16" />
                          <path d="M10 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
                        </svg>
                        
                        {/* Red Pulse Effect */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-red-400 dark:bg-red-600"
                          variants={{
                            initial: { scale: 0, opacity: 0 },
                            hover: { 
                              scale: 1.2, 
                              opacity: [0, 0.2, 0],
                              transition: { 
                                repeat: Infinity, 
                                duration: 1.2, 
                                repeatDelay: 0.2
                              }
                            }
                          }}
                          style={{ pointerEvents: 'none' }}
                        />
                      </div>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Permanently Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={noteToDelete?.title}
        isPermanent={true} // This is the key change - we're setting isPermanent to true
      />
      
      {/* Empty Trash Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={confirmEmptyTrashOpen}
        onClose={() => setConfirmEmptyTrashOpen(false)}
        onConfirm={handleEmptyTrash}
        title="all notes in trash"
        isPermanent={true}
      />
    </div>
  );
}

export default TrashView;