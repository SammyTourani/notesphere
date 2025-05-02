import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import NotesService from '../services/NotesService';

// Create the context
const NotesContext = createContext();

// Custom hook for using the notes context
export function useNotes() {
  return useContext(NotesContext);
}

export function NotesProvider({ children }) {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  
  // Track if we've completed initial load
  const initialLoadComplete = useRef(false);
  
  // Load notes when user changes
  useEffect(() => {
    if (!currentUser) {
      setNotes([]);
      setLoading(false);
      initialLoadComplete.current = false;
      return;
    }

    async function loadNotes() {
      setLoading(true);
      setError(null);
      
      try {
        const result = await NotesService.getAllNotes(currentUser.uid);
        
        if (result.success) {
          setNotes(result.data || []);
          setLastSynced(new Date());
          
          // Update offline status based on source
          setIsOffline(['offline-only', 'offline-fallback'].includes(result.source));
          initialLoadComplete.current = true;
        } else {
          console.error('Error loading notes:', result.error);
          setError('Failed to load notes');
          setIsOffline(true);
        }
      } catch (err) {
        console.error('Error in notes context:', err);
        setError('An unexpected error occurred');
        setIsOffline(true);
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, [currentUser]);

  // Handle network status changes
  useEffect(() => {
    function handleOnline() {
      console.log('Network connection restored');
      syncNotes(); // Try to sync notes when connection restored
    }
    
    function handleOffline() {
      console.log('Network connection lost');
      setIsOffline(true);
    }
    
    // Set initial offline state
    setIsOffline(!navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync notes with Firestore
  const syncNotes = useCallback(async () => {
    if (!currentUser) return { success: false };
    if (!navigator.onLine) return { success: false, error: 'No internet connection' };
    
    try {
      setSyncStatus('syncing');
      
      const result = await NotesService.syncAllOfflineNotes(currentUser.uid);
      
      if (result.success) {
        setSyncStatus('success');
        setLastSynced(new Date());
        
        // Refresh notes after sync
        await refreshNotes();
        
        // If online and sync was successful, update offline status
        setIsOffline(false);
      } else {
        setSyncStatus('failed');
      }
      
      // Reset sync status after a delay
      setTimeout(() => {
        setSyncStatus(null);
      }, 3000);
      
      return result;
    } catch (err) {
      console.error('Error syncing notes:', err);
      setSyncStatus('failed');
      
      setTimeout(() => {
        setSyncStatus(null);
      }, 3000);
      
      return { success: false, error: err.message };
    }
  }, [currentUser]);

  // Refresh notes list
  const refreshNotes = useCallback(async () => {
    if (!currentUser) return { success: false };
    
    try {
      const result = await NotesService.getAllNotes(currentUser.uid);
      
      if (result.success) {
        setNotes(result.data || []);
        setLastSynced(new Date());
        
        // Update offline status based on result
        if (result.source === 'merged' || result.source === 'cloud') {
          setIsOffline(false);
        }
      }
      
      return result;
    } catch (err) {
      console.error('Error refreshing notes:', err);
      return { success: false, error: err.message };
    }
  }, [currentUser]);

  // IMPROVED: Delete a note with immediate UI update
  const deleteNote = useCallback(async (noteId) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    
    try {
      // CRITICAL: Immediately update local state for responsiveness
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      
      // Perform the actual deletion
      const result = await NotesService.deleteNote(currentUser.uid, noteId);
      
      // If deletion failed in the backend, revert UI update
      if (!result.success) {
        console.error('Error deleting note:', result.error);
        
        // Revert optimistic update by refreshing
        await refreshNotes();
        return result;
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting note:', err);
      
      // Revert optimistic update on error
      await refreshNotes();
      return { success: false, error: err.message };
    }
  }, [currentUser, refreshNotes]);

  // IMPROVED: Create note with immediate UI update
  const createNote = useCallback(async (noteData) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    
    try {
      // Create the note in the service
      const result = await NotesService.createNote(currentUser.uid, noteData);
      
      if (result.success) {
        // CRITICAL: Immediately update local state with the new note
        const newNote = {
          id: result.id,
          ...noteData,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          source: result.isOfflineOnly ? 'offline' : 'cloud'
        };
        
        setNotes(prevNotes => [...prevNotes, newNote]);
      }
      
      return result;
    } catch (err) {
      console.error('Error creating note:', err);
      return { success: false, error: err.message };
    }
  }, [currentUser]);

  // IMPROVED: Update note with immediate UI update
  const updateNote = useCallback(async (noteId, noteData) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    
    try {
      // CRITICAL: Immediately update local state
      setNotes(prevNotes => prevNotes.map(note => 
        note.id === noteId 
          ? { 
              ...note, 
              ...noteData, 
              lastUpdated: new Date().toISOString() 
            } 
          : note
      ));
      
      // Perform the actual update
      const result = await NotesService.updateNote(currentUser.uid, noteId, noteData);
      
      // If update failed in the backend, revert UI update
      if (!result.success) {
        console.error('Error updating note:', result.error);
        
        // Revert optimistic update by refreshing
        await refreshNotes();
      }
      
      return result;
    } catch (err) {
      console.error('Error updating note:', err);
      
      // Revert optimistic update on error
      await refreshNotes();
      return { success: false, error: err.message };
    }
  }, [currentUser, refreshNotes]);

  // Get a single note, with local cache check first
  const getNote = useCallback(async (noteId) => {
    if (!currentUser || !noteId) return { success: false, error: 'Invalid parameters' };
    
    try {
      // First check if we have this note in local state already
      const cachedNote = notes.find(n => n.id === noteId);
      
      if (cachedNote) {
        return { 
          success: true, 
          data: cachedNote,
          source: 'cache'
        };
      }
      
      // If not in local state, query the service
      return await NotesService.getNote(currentUser.uid, noteId);
    } catch (err) {
      console.error('Error getting note:', err);
      return { success: false, error: err.message };
    }
  }, [currentUser, notes]);

  // The value to be provided by context
  const value = {
    notes,
    loading,
    error,
    isOffline,
    lastSynced,
    syncStatus,
    initialLoadComplete: initialLoadComplete.current,
    refreshNotes,
    syncNotes,
    deleteNote,
    createNote,
    updateNote,
    getNote
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}