// src/components/NotesList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import DeleteConfirmationModal from './DeleteConfirmationModal';

function NotesList() {
  const { notes, loading, error, isOffline, moveToTrash, refreshNotes } = useNotes();
  const { currentUser, isGuestMode } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const navigate = useNavigate();

  // Load data on mount
  useEffect(() => {
    console.log("Notes from context:", notes);
    refreshNotes();
  }, [refreshNotes]);

  // Filter notes when search text or notes change
  useEffect(() => {
    console.log("Filtering notes:", notes);
    
    if (!notes || notes.length === 0) {
      setFilteredNotes([]);
      return;
    }
    
    if (!searchText) {
      // Sort notes by last updated, most recent first
      const sortedNotes = [...notes].sort((a, b) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
        const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
        return dateB - dateA;
      });
      
      console.log("Sorted notes:", sortedNotes);
      setFilteredNotes(sortedNotes);
      return;
    }
    
    const lowerSearch = searchText.toLowerCase();
    const filtered = notes.filter(note => 
      (note.title?.toLowerCase().includes(lowerSearch) || 
      note.content?.toLowerCase().includes(lowerSearch))
    ).sort((a, b) => {
      const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
      const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
      return dateB - dateA;
    });
    
    setFilteredNotes(filtered);
  }, [notes, searchText]);
  
  // Set up periodic refresh
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshNotes().catch(err => console.error('Background refresh error:', err));
      }
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [refreshNotes]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };
  
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
  
  // Open delete confirmation modal
  const openDeleteModal = (e, note) => {
    e.preventDefault();
    e.stopPropagation();
    setNoteToDelete(note);
    setDeleteModalOpen(true);
  };
  
  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    
    setDeletingId(noteToDelete.id);
    setDeleteModalOpen(false);
    
    try {
      await moveToTrash(noteToDelete.id);
    } catch (err) {
      console.error('Error deleting note:', err);
    } finally {
      setDeletingId(null);
      setNoteToDelete(null);
    }
  };
  
  // Handle note download as DOCX
  const handleDownloadNote = (e, note) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a simple DOCX-like format with HTML
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .content { line-height: 1.6; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${note.title || 'Untitled Note'}</h1>
          <div class="content">${note.content.replace(/\n/g, '<br>')}</div>
          <div class="footer">
            Created with NoteSphere<br>
            ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;
    
    // Create a Blob and download link
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Untitled Note'}.doc`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
  
  // Animated navigation to create a new note
  const handleCreateNote = () => {
    navigate('/notes/new');
  };

  // Animated navigation to view a note
  const handleNoteClick = (e, noteId) => {
    e.preventDefault();
    navigate(`/notes/${noteId}`);
  };
  
  // Get note excerpt for preview
  const getExcerpt = (content, maxLength = 100) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    
    // Find the last complete word within the limit
    return content.substring(0, maxLength).split(' ').slice(0, -1).join(' ') + '...';
  };
  
  // Force manual refresh
  const handleManualRefresh = () => {
    console.log("Manual refresh triggered");
    refreshNotes();
  };
  
  if (loading && filteredNotes.length === 0) {
    return (
      <div className="pt-16 h-screen flex justify-center items-start">
        <div className="mt-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4 text-center">Loading notes...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header with status info */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notes</h1>
            
            {/* Status indicators */}
            {isOffline && (
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                Offline
              </span>
            )}
            
            {/* Guest mode indicator */}
            {isGuestMode && (
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                Guest Mode
              </span>
            )}
            
            {/* Manual refresh button with enhanced spin animation */}
            <motion.button
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              onClick={handleManualRefresh} 
              className="ml-3 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Refresh notes"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </div>
          
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchText}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md">
            {error}
            <button 
              onClick={handleManualRefresh} 
              className="ml-3 underline"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Notes grid */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            {searchText ? (
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">No notes match your search</p>
                <button
                  onClick={() => setSearchText('')}
                  className="text-purple-600 dark:text-purple-400 underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-6">You don't have any notes yet</p>
                <button
                  onClick={handleCreateNote}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow"
                >
                  Create your first note
                </button>
              </div>
            )}
          </div>
        ) : (
          // Grid layout for more square-like cards
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
                {/* Main content area (clickable) */}
                <div 
                  onClick={(e) => handleNoteClick(e, note.id)}
                  className="flex-grow p-4 cursor-pointer overflow-hidden flex flex-col"
                >
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate mb-2">
                    {note.title || 'Untitled Note'}
                  </h2>
                  
                  <div className="text-gray-600 dark:text-gray-300 text-sm flex-grow overflow-hidden">
                    {getExcerpt(note.content)}
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {formatDate(note.lastUpdated)}
                    {note.id && note.id.startsWith('local-') && (
                      <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                        Not synced
                      </span>
                    )}
                    {note.id && note.id.startsWith('guest-') && (
                      <span className="ml-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                        Guest Note
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action buttons footer */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center border-t border-gray-100 dark:border-gray-700">
                  {/* Download Button - FIXED CURSOR ISSUE */}
                  <motion.button
                    onClick={(e) => handleDownloadNote(e, note)}
                    className="p-1.5 rounded-full text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative cursor-pointer"
                    aria-label="Download note"
                    whileHover="hover"
                    initial="initial"
                  >
                    <div className="w-5 h-5 relative" style={{ pointerEvents: 'none' }}>
                      {/* Document Icon */}
                      <motion.svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute inset-0"
                        variants={{
                          initial: { y: 0, opacity: 1 },
                          hover: { y: -8, opacity: 0 }
                        }}
                        transition={{ duration: 0.3 }}
                        style={{ pointerEvents: 'none' }}
                      >
                        <path
                          d="M14 2.5H6C5.44772 2.5 5 2.94772 5 3.5V20.5C5 21.0523 5.44772 21.5 6 21.5H18C18.5523 21.5 19 21.0523 19 20.5V7.5L14 2.5Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2.5V7.5H19"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 12.5H8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 16.5H8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 8.5H9H8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>

                      {/* Download Arrow and Circle */}
                      <motion.svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute inset-0"
                        variants={{
                          initial: { y: 8, opacity: 0 },
                          hover: { y: 0, opacity: 1 }
                        }}
                        transition={{ duration: 0.3 }}
                        style={{ pointerEvents: 'none' }}
                      >
                        {/* Circle */}
                        <motion.circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          variants={{
                            initial: { pathLength: 0 },
                            hover: { pathLength: 1 }
                          }}
                          transition={{ duration: 0.6, ease: "easeInOut" }}
                        />

                        {/* Arrow */}
                        <motion.path
                          d="M12 8V16M12 16L16 12M12 16L8 12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          variants={{
                            initial: { y: -4, opacity: 0 },
                            hover: { y: 0, opacity: 1 }
                          }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                        />
                      </motion.svg>

                      {/* Pulse Effect */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-blue-400 dark:bg-blue-600"
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
                  </motion.button>
                  
                  {/* Trash Button - MADE SKINNIER */}
                  <motion.button
                    onClick={(e) => openDeleteModal(e, note)}
                    disabled={deletingId === note.id}
                    className="p-1.5 rounded-full text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative cursor-pointer"
                    aria-label="Delete note"
                    whileHover="hover"
                    initial="initial"
                  >
                    {deletingId === note.id ? (
                      <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-gray-400 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 relative" style={{ pointerEvents: 'none' }}>
                        {/* Skinnier Trash Can Body */}
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
                          {/* Modified path to make trash can skinnier */}
                          <path d="M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
                          {/* Adjusted vertical lines inside trash can */}
                          <line x1="9" y1="10" x2="9" y2="18" />
                          <line x1="12" y1="10" x2="12" y2="18" />
                          <line x1="15" y1="10" x2="15" y2="18" />
                        </svg>
                        
                        {/* Animated Lid - Pops off on hover */}
                        <motion.svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-5 h-5 absolute top-0 left-0"
                          variants={{
                            initial: { y: 0 },
                            hover: { y: -5 }
                          }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 500, 
                            damping: 15
                          }}
                          style={{ pointerEvents: 'none' }}
                        >
                          {/* Trash can lid */}
                          <path d="M4 6h16" />
                          {/* Top arch */}
                          <path d="M10 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
                        </motion.svg>
                        
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
        
        {/* Floating action button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="fixed bottom-6 right-6"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCreateNote}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
            aria-label="Create new note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={noteToDelete?.title}
      />
    </div>
  );
}

export default NotesList;