import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';

function NotesList() {
  const { notes, loading, error, isOffline, deleteNote, refreshNotes, initialLoadComplete } = useNotes();
  const { currentUser } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const navigate = useNavigate();

  // Filter notes when search text or notes change
  useEffect(() => {
    if (!notes) {
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
  
  // Refresh notes on mount and periodically
  useEffect(() => {
    // Initial refresh
    refreshNotes();
    
    // Set up periodic refresh in background (every 30 seconds)
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
  
  // Handle note deletion with immediate UI update
  const handleDeleteNote = useCallback(async (e, noteId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this note?')) {
      setDeletingId(noteId);
      
      try {
        await deleteNote(noteId);
        // UI is automatically updated by the context
      } catch (err) {
        console.error('Error deleting note:', err);
      } finally {
        setDeletingId(null);
      }
    }
  }, [deleteNote]);
  
  // Handle creating a new note
  const handleCreateNote = () => {
    navigate('/notes/new');
  };
  
  // Get note excerpt for preview
  const getExcerpt = (content, maxLength = 120) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    
    // Find the last complete word within the limit
    return content.substring(0, maxLength).split(' ').slice(0, -1).join(' ') + '...';
  };
  
  // Force manual refresh
  const handleManualRefresh = () => {
    refreshNotes();
  };
  
  if (loading && !initialLoadComplete) {
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
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header with status info */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notes</h1>
            {isOffline && (
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                Offline
              </span>
            )}
            {/* Manual refresh button */}
            <button
              onClick={handleManualRefresh} 
              className="ml-3 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Refresh notes"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map(note => (
              <Link
                key={note.id}
                to={`/notes/${note.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
              >
                <div className="p-4 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {note.title || 'Untitled Note'}
                    </h2>
                    <button
                      onClick={(e) => handleDeleteNote(e, note.id)}
                      disabled={deletingId === note.id}
                      className="ml-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                      aria-label="Delete note"
                    >
                      {deletingId === note.id ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                    {getExcerpt(note.content)}
                  </div>
                </div>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                  <span>{formatDate(note.lastUpdated)}</span>
                  {note.id && note.id.startsWith('local-') && (
                    <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                      Not synced
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {/* Floating action button */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handleCreateNote}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
            aria-label="Create new note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotesList;