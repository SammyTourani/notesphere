/**
 * Optimized NotesList Component - WITH ALL VISUAL FEATURES RESTORED
 * Performance improvements:
 * - Extracted NoteCard to separate memoized component (NoteCardEnhanced)
 * - Utility functions moved to noteUtils.js with caching
 * - ALL original animations preserved (5 gradient layers, animated trash lid, download animations)
 * - Added will-change and GPU acceleration hints
 * - Reduced re-renders with useMemo and useCallback
 * - React.memo prevents unnecessary card re-renders
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../../../core/state/NotesContext';
import { useAuth } from '../../../core/state/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import NoteCardEnhanced from './NoteCard';
import DeleteConfirmationModal from './DeleteModal';
import {
  getNoteTheme,
  getNoteIcon,
  getTimeSince,
  filterAndSortNotes,
  getPersonalizedGreeting
} from '../../../shared/utils/noteUtils';

function NotesListOptimized() {
  const navigate = useNavigate();
  const { notes, loading, isOffline, moveToTrash, refreshNotes } = useNotes();
  const { currentUser, isGuestMode, userProfile } = useAuth();

  // State
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // Track which note is being deleted

  // Memoized greeting (only recalculates when dependencies change)
  const greeting = useMemo(
    () => getPersonalizedGreeting(currentUser, notes, isGuestMode),
    [currentUser?.uid, notes?.length, isGuestMode]
  );

  // Memoized filtered and sorted notes
  const { pinned: pinnedNotes, unpinned: unpinnedNotes } = useMemo(
    () => filterAndSortNotes(notes, searchText),
    [notes, searchText]
  );

  // RESTORED: Handle note download as HTML with enhanced formatting
  const handleDownloadNote = useCallback((e, note) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a sophisticated HTML format with note content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${note.title || 'Untitled Note'} - NoteSphere</title>
          <style>
            :root {
              --primary-color: #8b5cf6;
              --text-color: #333;
              --bg-color: #fafafa;
              --border-color: #e5e7eb;
            }
            
            @media (prefers-color-scheme: dark) {
              :root {
                --primary-color: #a78bfa;
                --text-color: #f3f4f6;
                --bg-color: #1f2937;
                --border-color: #374151;
              }
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.7;
              color: var(--text-color);
              background-color: var(--bg-color);
              max-width: 900px;
              margin: 0 auto;
              padding: 2rem;
            }
            
            .container {
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              padding: 2rem;
              margin: 2rem 0;
            }
            
            h1 {
              font-size: 2rem;
              font-weight: 700;
              margin-bottom: 1rem;
              color: var(--primary-color);
              border-bottom: 2px solid var(--border-color);
              padding-bottom: 0.5rem;
            }
            
            .content {
              line-height: 1.7;
              margin: 1.5rem 0;
            }
            
            .content img {
              max-width: 100%;
              border-radius: 4px;
              margin: 1rem 0;
            }
            
            .content a {
              color: var(--primary-color);
              text-decoration: none;
            }
            
            .content a:hover {
              text-decoration: underline;
            }
            
            .content ul, .content ol {
              margin-left: 1.5rem;
              margin-bottom: 1rem;
            }
            
            .footer {
              margin-top: 3rem;
              font-size: 0.875rem;
              color: #6b7280;
              text-align: center;
              border-top: 1px solid var(--border-color);
              padding-top: 1rem;
            }
            
            .logo {
              display: block;
              text-align: center;
              margin-bottom: 1.5rem;
              font-weight: 700;
              font-size: 1.25rem;
              color: var(--primary-color);
            }
            
            @media (max-width: 768px) {
              body {
                padding: 1rem;
              }
              
              .container {
                padding: 1.5rem;
                margin: 1rem 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="logo">NoteSphere</div>
          <div class="container">
            <h1>${note.title || 'Untitled Note'}</h1>
            <div class="content">${note.content || ''}</div>
          </div>
          <div class="footer">
            Exported from NoteSphere<br>
            ${new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </body>
      </html>
    `;
    
    // Create a Blob and download link
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Untitled Note'}.html`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }, []);

  // Handlers
  const handleSearchChange = useCallback((e) => {
    setSearchText(e.target.value);
  }, []);

  const handleCreateNote = useCallback(() => {
    navigate('/notes/new');
  }, [navigate]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshNotes();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [refreshNotes]);

  const handleDeleteClick = useCallback((e, note) => {
    e.preventDefault();
    e.stopPropagation();
    setNoteToDelete(note);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (noteToDelete) {
      setDeletingId(noteToDelete.id);
      try {
        await moveToTrash(noteToDelete.id);
        setDeleteModalOpen(false);
        setNoteToDelete(null);
      } finally {
        setDeletingId(null);
      }
    }
  }, [noteToDelete, moveToTrash]);

  const cancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setNoteToDelete(null);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your notes...</p>
        </div>
      </div>
    );
  }

  const hasNotes = notes && notes.length > 0;
  const hasSearchResults = searchText && (pinnedNotes.length > 0 || unpinnedNotes.length > 0);
  const noResults = searchText && pinnedNotes.length === 0 && unpinnedNotes.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Greeting Section - Optimized animations */}
        <motion.div
          className="text-center mb-12 pt-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={greeting.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent mb-3">
                {greeting.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {greeting.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Controls Bar - Simplified */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-center mb-8 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 p-4 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center mb-4 sm:mb-0 gap-3">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              My Notes
            </h2>

            {/* Status badges */}
            {isOffline && (
              <span className="px-2.5 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 rounded-full">
                Offline
              </span>
            )}
            {isGuestMode && (
              <span className="px-2.5 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 rounded-full">
                Guest Mode
              </span>
            )}

            {/* Refresh button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              title="Refresh notes"
            >
              {isRefreshing ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>

          {/* Search Input - Simplified animations */}
          <div className="w-full sm:w-72">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 transition-colors ${searchFocused ? 'text-purple-500' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchText}
                onChange={handleSearchChange}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors
                  ${searchFocused 
                    ? 'border-purple-500 dark:border-purple-400 ring-2 ring-purple-100 dark:ring-purple-900/30' 
                    : 'border-gray-300 dark:border-gray-600'
                  }
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none`}
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Empty State */}
        {!hasNotes && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/40 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">No notes yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Start by creating your first note</p>
            <button
              onClick={handleCreateNote}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-md transition-all"
            >
              Create your first note
            </button>
          </motion.div>
        )}

        {/* No Search Results */}
        {noResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">No matches found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              No notes matching "{searchText}"
            </p>
            <button
              onClick={() => setSearchText('')}
              className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800/50"
            >
              Clear search
            </button>
          </motion.div>
        )}

        {/* Notes Grid */}
        {(hasSearchResults || (hasNotes && !searchText)) && (
          <div>
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center mb-5 pl-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    className="w-5 h-5 text-amber-500 dark:text-amber-400 mr-2"
                  >
                    <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
                  </svg>
                  <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Pinned Notes</h2>
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    {pinnedNotes.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pinnedNotes.map((note, index) => (
                    <NoteCardEnhanced
                      key={note.id}
                      note={note}
                      index={index}
                      theme={getNoteTheme(note.id)}
                      noteIcon={getNoteIcon(note)}
                      timeSince={getTimeSince(note.lastUpdated)}
                      onNoteClick={(e, id) => navigate(`/notes/${id}`)}
                      onDownload={handleDownloadNote}
                      onDelete={handleDeleteClick}
                      deletingId={deletingId}
                    />
                  ))}
                </div>

                {unpinnedNotes.length > 0 && (
                  <div className="my-12">
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-500 to-transparent"></div>
                  </div>
                )}
              </div>
            )}

            {/* All Notes */}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length === 0 && (
                  <div className="mb-5">
                    <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">All Notes</h2>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {unpinnedNotes.map((note, index) => (
                    <NoteCardEnhanced
                      key={note.id}
                      note={note}
                      index={index + pinnedNotes.length}
                      theme={getNoteTheme(note.id)}
                      noteIcon={getNoteIcon(note)}
                      timeSince={getTimeSince(note.lastUpdated)}
                      onNoteClick={(e, id) => navigate(`/notes/${id}`)}
                      onDownload={handleDownloadNote}
                      onDelete={handleDeleteClick}
                      deletingId={deletingId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Action Button */}
        {hasNotes && (
          <motion.button
            onClick={handleCreateNote}
            className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center z-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </motion.button>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}

export default NotesListOptimized;
