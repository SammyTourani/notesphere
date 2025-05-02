import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

// Create the NotesContext
const NotesContext = createContext();

// Use a custom hook to access the context
export const useNotes = () => useContext(NotesContext);

// Provider component
export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { currentUser } = useAuth();

  // Helper function to convert Firestore timestamps
  const convertTimestamps = (data) => {
    const result = { ...data };
    
    // Convert Firestore timestamps to ISO strings
    if (result.created && typeof result.created.toDate === 'function') {
      result.created = result.created.toDate().toISOString();
    }
    
    if (result.lastUpdated && typeof result.lastUpdated.toDate === 'function') {
      result.lastUpdated = result.lastUpdated.toDate().toISOString();
    }
    
    if (result.deletedAt && typeof result.deletedAt.toDate === 'function') {
      result.deletedAt = result.deletedAt.toDate().toISOString();
    }
    
    return result;
  };

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load notes from Firestore
  const refreshNotes = useCallback(async () => {
    if (!currentUser) {
      setNotes([]);
      setTrashedNotes([]);
      setLoading(false);
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);

      // Get regular notes
      const q = query(
        collection(db, 'notes'),
        where('userId', '==', currentUser.uid),
        where('deleted', '==', false),
        orderBy('lastUpdated', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedNotes = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...convertTimestamps(data)
        };
      });
      
      setNotes(fetchedNotes);

      // Get trashed notes
      const trashQuery = query(
        collection(db, 'notes'),
        where('userId', '==', currentUser.uid),
        where('deleted', '==', true),
        orderBy('lastUpdated', 'desc')
      );

      const trashQuerySnapshot = await getDocs(trashQuery);
      const fetchedTrashedNotes = trashQuerySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...convertTimestamps(data)
        };
      });
      
      setTrashedNotes(fetchedTrashedNotes);

      return { success: true };
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes. Please try again.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load notes on startup and when user changes
  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  // Get a specific note by ID
  const getNote = async (noteId) => {
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const noteRef = doc(db, 'notes', noteId);
      const noteSnapshot = await getDoc(noteRef);

      if (noteSnapshot.exists()) {
        const noteData = noteSnapshot.data();
        
        // Check if this note belongs to the current user
        if (noteData.userId !== currentUser.uid) {
          return { success: false, error: 'Note not found' };
        }
        
        return { 
          success: true, 
          data: { 
            id: noteSnapshot.id, 
            ...convertTimestamps(noteData) 
          }
        };
      } else {
        return { success: false, error: 'Note not found' };
      }
    } catch (err) {
      console.error('Error getting note:', err);
      return { success: false, error: err.message };
    }
  };

  // Create a new note
  const createNote = async (noteData) => {
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const newNote = {
        title: noteData.title || '',
        content: noteData.content || '',
        userId: currentUser.uid,
        created: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        deleted: false,
        deletedAt: null
      };

      const docRef = await addDoc(collection(db, 'notes'), newNote);
      
      // Add new note to local state
      const noteWithId = {
        id: docRef.id,
        ...newNote,
        created: new Date().toISOString(), // Use client timestamp for immediate display
        lastUpdated: new Date().toISOString()
      };
      
      setNotes(prevNotes => [noteWithId, ...prevNotes]);
      
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error('Error creating note:', err);
      return { success: false, error: err.message };
    }
  };

  // Update an existing note
  const updateNote = async (noteId, noteData) => {
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const noteRef = doc(db, 'notes', noteId);
      
      const updates = {
        title: noteData.title,
        content: noteData.content,
        lastUpdated: serverTimestamp()
      };
      
      await updateDoc(noteRef, updates);
      
      // Update local state
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId 
            ? { 
                ...note, 
                ...updates, 
                lastUpdated: new Date().toISOString() // Use client timestamp for immediate display
              } 
            : note
        )
      );
      
      return { success: true };
    } catch (err) {
      console.error('Error updating note:', err);
      return { success: false, error: err.message };
    }
  };

  // Move note to trash (soft delete)
  const moveToTrash = async (noteId) => {
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const noteRef = doc(db, 'notes', noteId);
      
      // Mark as deleted instead of actually deleting
      await updateDoc(noteRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      });
      
      // Get the note being deleted
      const noteToMove = notes.find(note => note.id === noteId);
      
      // Update local states
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      
      if (noteToMove) {
        const trashedNote = {
          ...noteToMove,
          deleted: true,
          deletedAt: new Date().toISOString()
        };
        setTrashedNotes(prevTrashed => [trashedNote, ...prevTrashed]);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error moving note to trash:', err);
      return { success: false, error: err.message };
    }
  };

  // Restore note from trash
  const restoreFromTrash = async (noteId) => {
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const noteRef = doc(db, 'notes', noteId);
      
      // Mark as not deleted
      await updateDoc(noteRef, {
        deleted: false,
        deletedAt: null,
        lastUpdated: serverTimestamp()
      });
      
      // Get the note being restored
      const noteToRestore = trashedNotes.find(note => note.id === noteId);
      
      // Update local states
      setTrashedNotes(prevTrashed => prevTrashed.filter(note => note.id !== noteId));
      
      if (noteToRestore) {
        const restoredNote = {
          ...noteToRestore,
          deleted: false,
          deletedAt: null,
          lastUpdated: new Date().toISOString()
        };
        setNotes(prevNotes => [restoredNote, ...prevNotes]);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Error restoring note from trash:', err);
      return { success: false, error: err.message };
    }
  };

  // Permanently delete a note
  const permanentlyDeleteNote = async (noteId) => {
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const noteRef = doc(db, 'notes', noteId);
      
      // Permanently delete the document
      await deleteDoc(noteRef);
      
      // Update local state
      setTrashedNotes(prevTrashed => prevTrashed.filter(note => note.id !== noteId));
      
      return { success: true };
    } catch (err) {
      console.error('Error permanently deleting note:', err);
      return { success: false, error: err.message };
    }
  };

  // Empty the entire trash
  const emptyTrash = async () => {
    if (!currentUser || trashedNotes.length === 0) {
      return { success: trashedNotes.length === 0, error: !currentUser ? 'User not authenticated' : null };
    }

    try {
      // Delete all trashed notes
      const deletePromises = trashedNotes.map(note => 
        deleteDoc(doc(db, 'notes', note.id))
      );
      
      await Promise.all(deletePromises);
      
      // Clear local trash state
      setTrashedNotes([]);
      
      return { success: true };
    } catch (err) {
      console.error('Error emptying trash:', err);
      return { success: false, error: err.message };
    }
  };

  // Legacy delete note function - now forwards to moveToTrash
  const deleteNote = async (noteId) => {
    return moveToTrash(noteId);
  };

  // The value that will be supplied to consuming components
  const value = {
    notes,
    trashedNotes,
    loading,
    error,
    isOffline,
    getNote,
    createNote,
    updateNote,
    deleteNote, // Legacy function keeps API compatibility
    moveToTrash,
    restoreFromTrash,
    permanentlyDeleteNote,
    emptyTrash,
    refreshNotes,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};

export default NotesContext;