/**
 * Notes Context - Refactored
 * Clean separation of concerns using Repository and SyncEngine
 * Reduced from 1414 lines to ~200 lines
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';
import { getNotesRepository } from '../services/NotesRepository';
import { SyncEngine } from '../services/SyncEngine';
import { createLogger } from '../utils/logger';

const logger = createLogger('NotesContext');

// Create context
const NotesContext = createContext();

// Context Provider component
export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { currentUser, isGuestMode } = useAuth();
  
  const repository = getNotesRepository();
  const [syncEngine, setSyncEngine] = useState(null);

  // Initialize repository when auth state changes
  useEffect(() => {
    async function initializeRepository() {
      try {
        setLoading(true);
        
        const result = await repository.initialize({
          db,
          userId: currentUser?.uid,
          isGuestMode
        });

        if (result.success) {
          const sync = new SyncEngine(repository);
          setSyncEngine(sync);
          
          // Sync local notes if switching to authenticated mode
          if (result.type === 'firestore') {
            await sync.syncLocalNotesToFirestore();
          }
        }

        await refreshNotes();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initializeRepository();
  }, [currentUser, isGuestMode]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      if (syncEngine && currentUser) {
        await syncEngine.syncLocalNotesToFirestore();
        await refreshNotes();
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncEngine, currentUser]);

  // Refresh notes from repository
  const refreshNotes = useCallback(async () => {
    try {
      setError(null);
      const [activeNotes, trashed] = await Promise.all([
        repository.getAllNotes(),
        repository.getTrashedNotes()
      ]);
      
      setNotes(activeNotes);
      setTrashedNotes(trashed);
    } catch (err) {
      setError(err.message);
      logger.error('Error refreshing notes:', err);
    }
  }, [repository]);

  // Create note
  const createNote = useCallback(async (noteData) => {
    try {
      const newNote = await repository.createNote(noteData);
      setNotes(prev => [...prev, newNote]);
      return { success: true, data: newNote };
    } catch (err) {
      logger.error('Error creating note:', err);
      return { success: false, error: err.message };
    }
  }, [repository]);

  // Get single note
  const getNote = useCallback(async (noteId) => {
    try {
      const note = await repository.getNote(noteId);
      if (!note) {
        return { success: false, error: 'Note not found' };
      }
      return { success: true, data: note };
    } catch (err) {
      logger.error('Error getting note:', err);
      return { success: false, error: err.message };
    }
  }, [repository]);

  // Update note
  const updateNote = useCallback(async (noteId, updates) => {
    try {
      const updatedNote = await repository.updateNote(noteId, updates);
      setNotes(prev => prev.map(note => 
        note.id === noteId ? updatedNote : note
      ));
      return { success: true, data: updatedNote };
    } catch (err) {
      logger.error('Error updating note:', err);
      return { success: false, error: err.message };
    }
  }, [repository]);

  // Move to trash
  const moveToTrash = useCallback(async (noteId) => {
    try {
      await repository.deleteNote(noteId);
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        setTrashedNotes(prev => [...prev, { ...note, deleted: true }]);
      }
      return { success: true };
    } catch (err) {
      logger.error('Error moving to trash:', err);
      return { success: false, error: err.message };
    }
  }, [repository, notes]);

  // Restore from trash
  const restoreFromTrash = useCallback(async (noteId) => {
    try {
      await repository.restoreNote(noteId);
      const note = trashedNotes.find(n => n.id === noteId);
      if (note) {
        setTrashedNotes(prev => prev.filter(n => n.id !== noteId));
        setNotes(prev => [...prev, { ...note, deleted: false }]);
      }
      return { success: true };
    } catch (err) {
      logger.error('Error restoring from trash:', err);
      return { success: false, error: err.message };
    }
  }, [repository, trashedNotes]);

  // Permanently delete
  const deleteNotePermanently = useCallback(async (noteId) => {
    try {
      await repository.permanentlyDeleteNote(noteId);
      setTrashedNotes(prev => prev.filter(n => n.id !== noteId));
      return { success: true };
    } catch (err) {
      logger.error('Error permanently deleting note:', err);
      return { success: false, error: err.message };
    }
  }, [repository]);

  // Empty trash
  const emptyTrash = useCallback(async () => {
    try {
      await repository.emptyTrash();
      setTrashedNotes([]);
      return { success: true };
    } catch (err) {
      logger.error('Error emptying trash:', err);
      return { success: false, error: err.message };
    }
  }, [repository]);

  // Toggle pin
  const togglePinStatus = useCallback(async (noteId) => {
    try {
      const newPinStatus = await repository.togglePin(noteId);
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, pinned: newPinStatus } : note
      ));
      return { success: true, pinned: newPinStatus };
    } catch (err) {
      logger.error('Error toggling pin:', err);
      return { success: false, error: err.message };
    }
  }, [repository]);

  // Check if note exists
  const doesNoteExist = useCallback(async (noteId) => {
    try {
      const note = await repository.getNote(noteId);
      return note !== null;
    } catch (err) {
      return false;
    }
  }, [repository]);

  // Get merge options (for offline sync conflicts)
  const getMergeOptions = useCallback(async () => {
    if (!syncEngine) return null;
    const conflicts = await syncEngine.detectMergeConflicts();
    return conflicts.length > 0 ? conflicts : null;
  }, [syncEngine]);

  // Context value
  const value = {
    notes,
    trashedNotes,
    loading,
    error,
    isOffline,
    refreshNotes,
    createNote,
    getNote,
    updateNote,
    moveToTrash,
    restoreFromTrash,
    deleteNotePermanently,
    emptyTrash,
    togglePinStatus,
    doesNoteExist,
    getMergeOptions
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}

// Custom hook to use the Notes context
export function useNotes() {
  return useContext(NotesContext);
}
