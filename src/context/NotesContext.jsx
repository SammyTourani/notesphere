// src/context/NotesContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid'; // Make sure to install uuid

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
  const { currentUser, isGuestMode } = useAuth();

  // Constants for guest mode
  const GUEST_NOTES_KEY = 'guestNotes';
  const GUEST_TRASH_KEY = 'guestTrash';

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

  // GUEST MODE FUNCTIONS

  // Save guest notes to localStorage
  const saveGuestNotes = (notesArray) => {
    localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(notesArray));
  };

  // Save guest trash to localStorage
  const saveGuestTrash = (trashArray) => {
    localStorage.setItem(GUEST_TRASH_KEY, JSON.stringify(trashArray));
  };

  // Load notes from Firestore or localStorage (for guest mode)
  const refreshNotes = useCallback(async () => {
    console.log("refreshNotes called - isGuestMode:", isGuestMode, "currentUser:", !!currentUser);
    
    // If guest mode is active, load from localStorage
    if (isGuestMode) {
      console.log("Loading notes in guest mode");
      try {
        setLoading(true);
        setError(null);

        // Load notes from localStorage
        const storedNotes = localStorage.getItem(GUEST_NOTES_KEY);
        const storedTrash = localStorage.getItem(GUEST_TRASH_KEY);
        
        if (storedNotes) {
          const parsedNotes = JSON.parse(storedNotes);
          console.log("Loaded guest notes:", parsedNotes);
          setNotes(parsedNotes);
        } else {
          console.log("No guest notes found, initializing empty array");
          setNotes([]);
          saveGuestNotes([]);
        }
        
        if (storedTrash) {
          setTrashedNotes(JSON.parse(storedTrash));
        } else {
          setTrashedNotes([]);
          saveGuestTrash([]);
        }

        return { success: true };
      } catch (err) {
        console.error('Error loading guest notes:', err);
        setError('Failed to load notes');
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    }
    
    // Standard Firestore loading for authenticated users
    if (!currentUser) {
      setNotes([]);
      setTrashedNotes([]);
      setLoading(false);
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Loading notes for authenticated user:", currentUser.uid);

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
      
      console.log("Fetched notes for authenticated user:", fetchedNotes.length);
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
  }, [currentUser, isGuestMode]);

  // Load notes on startup and when auth state or guest mode changes
  useEffect(() => {
    refreshNotes();
  }, [refreshNotes, currentUser, isGuestMode]);

  // Get a specific note by ID
  const getNote = async (noteId) => {
    console.log("getNote called - noteId:", noteId, "isGuestMode:", isGuestMode);
    
    // Handle invalid noteId
    if (!noteId) {
      console.log("Invalid noteId provided:", noteId);
      return { success: false, error: 'Invalid note ID' };
    }
    
    // Handle 'new' note ID special case
    if (noteId === 'new') {
      console.log("Special case: returning empty 'new' note template");
      return { 
        success: true, 
        data: { 
          id: 'new', 
          title: '', 
          content: '',
          isNew: true // Flag to indicate this is a new note
        } 
      };
    }
    
    // Guest mode handling
    if (isGuestMode) {
      console.log("Getting note in guest mode:", noteId);
      // Find note in guest notes or trash
      const note = notes.find(n => n.id === noteId) || trashedNotes.find(n => n.id === noteId);
      
      if (note) {
        console.log("Found guest note:", note);
        return { success: true, data: note };
      } else {
        console.log("Guest note not found");
        return { success: false, error: 'Note not found' };
      }
    }
    
    // Standard authenticated flow
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      console.log("Getting note for authenticated user:", noteId);
      // Safety check for invalid IDs
      if (typeof noteId !== 'string' || noteId.trim() === '') {
        return { success: false, error: 'Invalid note ID' };
      }
      
      const noteRef = doc(db, 'notes', noteId);
      const noteSnapshot = await getDoc(noteRef);

      if (noteSnapshot.exists()) {
        const noteData = noteSnapshot.data();
        
        // Check if this note belongs to the current user
        if (noteData.userId !== currentUser.uid) {
          console.log("Note doesn't belong to current user");
          return { success: false, error: 'Note not found' };
        }
        
        console.log("Found note for authenticated user");
        return { 
          success: true, 
          data: { 
            id: noteSnapshot.id, 
            ...convertTimestamps(noteData) 
          }
        };
      } else {
        console.log("Note not found in Firestore");
        return { success: false, error: 'Note not found' };
      }
    } catch (err) {
      console.error('Error getting note:', err);
      return { success: false, error: err.message };
    }
  };

  // Create a new note
  const createNote = async (noteData) => {
    console.log("createNote called with data:", noteData, "isGuestMode:", isGuestMode);
    
    // Guest mode handling
    if (isGuestMode) {
      console.log("Creating note in guest mode");
      try {
        const newNote = {
          id: `guest-${uuidv4()}`,
          title: noteData.title || '',
          content: noteData.content || '',
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          deleted: false,
          deletedAt: null
        };
        
        console.log("Created new guest note:", newNote);
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        saveGuestNotes(updatedNotes);
        
        return { success: true, id: newNote.id };
      } catch (err) {
        console.error('Error creating guest note:', err);
        return { success: false, error: err.message };
      }
    }
    
    // Standard authenticated flow
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      console.log("Creating note for authenticated user");
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
      console.log("Created note in Firestore with ID:", docRef.id);
      
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
    console.log("updateNote called - noteId:", noteId, "isGuestMode:", isGuestMode);
    
    // Guest mode handling
    if (isGuestMode) {
      console.log("Updating note in guest mode:", noteId);
      try {
        const updatedNotes = notes.map(note => 
          note.id === noteId 
            ? { 
                ...note, 
                title: noteData.title, 
                content: noteData.content,
                lastUpdated: new Date().toISOString()
              } 
            : note
        );
        
        setNotes(updatedNotes);
        saveGuestNotes(updatedNotes);
        console.log("Updated guest note successfully");
        
        return { success: true };
      } catch (err) {
        console.error('Error updating guest note:', err);
        return { success: false, error: err.message };
      }
    }
    
    // Standard authenticated flow
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      console.log("Updating note for authenticated user:", noteId);
      const noteRef = doc(db, 'notes', noteId);
      
      const updates = {
        title: noteData.title,
        content: noteData.content,
        lastUpdated: serverTimestamp()
      };
      
      await updateDoc(noteRef, updates);
      console.log("Updated note in Firestore successfully");
      
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
    console.log("moveToTrash called - noteId:", noteId, "isGuestMode:", isGuestMode);
    
    // Guest mode handling
    if (isGuestMode) {
      console.log("Moving note to trash in guest mode:", noteId);
      try {
        // Find the note to move
        const noteToMove = notes.find(note => note.id === noteId);
        if (!noteToMove) {
          console.log("Note not found in guest notes");
          return { success: false, error: 'Note not found' };
        }
        
        // Remove from notes
        const updatedNotes = notes.filter(note => note.id !== noteId);
        setNotes(updatedNotes);
        saveGuestNotes(updatedNotes);
        
        // Add to trash
        const trashedNote = {
          ...noteToMove,
          deleted: true,
          deletedAt: new Date().toISOString()
        };
        
        const updatedTrash = [trashedNote, ...trashedNotes];
        setTrashedNotes(updatedTrash);
        saveGuestTrash(updatedTrash);
        console.log("Moved guest note to trash successfully");
        
        return { success: true };
      } catch (err) {
        console.error('Error moving guest note to trash:', err);
        return { success: false, error: err.message };
      }
    }
    
    // Standard authenticated flow
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      console.log("Moving note to trash for authenticated user:", noteId);
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
      
      console.log("Moved note to trash successfully");
      return { success: true };
    } catch (err) {
      console.error('Error moving note to trash:', err);
      return { success: false, error: err.message };
    }
  };

  // Restore note from trash
  const restoreFromTrash = async (noteId) => {
    console.log("restoreFromTrash called - noteId:", noteId, "isGuestMode:", isGuestMode);
    
    // Guest mode handling
    if (isGuestMode) {
      console.log("Restoring note from trash in guest mode:", noteId);
      try {
        // Find the note to restore
        const noteToRestore = trashedNotes.find(note => note.id === noteId);
        if (!noteToRestore) {
          console.log("Note not found in guest trash");
          return { success: false, error: 'Note not found in trash' };
        }
        
        // Remove from trash
        const updatedTrash = trashedNotes.filter(note => note.id !== noteId);
        setTrashedNotes(updatedTrash);
        saveGuestTrash(updatedTrash);
        
        // Add back to notes
        const restoredNote = {
          ...noteToRestore,
          deleted: false,
          deletedAt: null,
          lastUpdated: new Date().toISOString()
        };
        
        const updatedNotes = [restoredNote, ...notes];
        setNotes(updatedNotes);
        saveGuestNotes(updatedNotes);
        console.log("Restored guest note from trash successfully");
        
        return { success: true };
      } catch (err) {
        console.error('Error restoring guest note from trash:', err);
        return { success: false, error: err.message };
      }
    }
    
    // Standard authenticated flow
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      console.log("Restoring note from trash for authenticated user:", noteId);
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
      
      console.log("Restored note from trash successfully");
      return { success: true };
    } catch (err) {
      console.error('Error restoring note from trash:', err);
      return { success: false, error: err.message };
    }
  };

  // Permanently delete a note
  const permanentlyDeleteNote = async (noteId) => {
    console.log("permanentlyDeleteNote called - noteId:", noteId, "isGuestMode:", isGuestMode);
    
    // Guest mode handling
    if (isGuestMode) {
      console.log("Permanently deleting note in guest mode:", noteId);
      try {
        // Remove from trash
        const updatedTrash = trashedNotes.filter(note => note.id !== noteId);
        setTrashedNotes(updatedTrash);
        saveGuestTrash(updatedTrash);
        console.log("Permanently deleted guest note successfully");
        
        return { success: true };
      } catch (err) {
        console.error('Error permanently deleting guest note:', err);
        return { success: false, error: err.message };
      }
    }
    
    // Standard authenticated flow
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      console.log("Permanently deleting note for authenticated user:", noteId);
      const noteRef = doc(db, 'notes', noteId);
      
      // Permanently delete the document
      await deleteDoc(noteRef);
      
      // Update local state
      setTrashedNotes(prevTrashed => prevTrashed.filter(note => note.id !== noteId));
      console.log("Permanently deleted note successfully");
      
      return { success: true };
    } catch (err) {
      console.error('Error permanently deleting note:', err);
      return { success: false, error: err.message };
    }
  };

  // Empty the entire trash
  const emptyTrash = async () => {
    console.log("emptyTrash called - isGuestMode:", isGuestMode);
    
    // Guest mode handling
    if (isGuestMode) {
      console.log("Emptying trash in guest mode");
      try {
        setTrashedNotes([]);
        saveGuestTrash([]);
        console.log("Emptied guest trash successfully");
        
        return { success: true };
      } catch (err) {
        console.error('Error emptying guest trash:', err);
        return { success: false, error: err.message };
      }
    }
    
    // Standard authenticated flow
    if (!currentUser || trashedNotes.length === 0) {
      return { success: trashedNotes.length === 0, error: !currentUser ? 'User not authenticated' : null };
    }

    try {
      console.log("Emptying trash for authenticated user");
      // Delete all trashed notes
      const deletePromises = trashedNotes.map(note => 
        deleteDoc(doc(db, 'notes', note.id))
      );
      
      await Promise.all(deletePromises);
      
      // Clear local trash state
      setTrashedNotes([]);
      console.log("Emptied trash successfully");
      
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

  // Transfer guest notes to user account
  const transferGuestNotesToUser = async () => {
    console.log("transferGuestNotesToUser called - isGuestMode:", isGuestMode, "currentUser:", !!currentUser, "notes count:", notes.length);
    
    try {
      // Safety check - this is critical!
      if (!currentUser) {
        console.log("Cannot transfer notes: No authenticated user found in context");
        return { success: false, error: 'Cannot transfer notes: User not authenticated' };
      }

      if (!isGuestMode) {
        console.log("Not in guest mode, no notes to transfer");
        return { success: true, message: 'Not in guest mode, no notes to transfer' };
      }

      // Get fresh copy of guest notes directly from localStorage
      const storedNotes = localStorage.getItem(GUEST_NOTES_KEY);
      if (!storedNotes) {
        console.log("No guest notes found in localStorage");
        return { success: true, count: 0, total: 0, message: 'No guest notes found' };
      }
      
      const guestNotes = JSON.parse(storedNotes);
      if (guestNotes.length === 0) {
        console.log("No guest notes to transfer (empty array)");
        return { success: true, count: 0, total: 0, message: 'No guest notes to transfer' };
      }

      console.log(`Starting to transfer ${guestNotes.length} guest notes to user account:`, currentUser.uid);
      let transferredCount = 0;
      const transferErrors = [];
      
      // Create each guest note in Firestore
      for (const note of guestNotes) {
        try {
          console.log(`Transferring note: ${note.id}`);
          
          const newNote = {
            title: note.title || '',
            content: note.content || '',
            userId: currentUser.uid,
            created: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            deleted: false,
            deletedAt: null
          };
          
          const docRef = await addDoc(collection(db, 'notes'), newNote);
          console.log(`Successfully transferred note to ID: ${docRef.id}`);
          transferredCount++;
        } catch (err) {
          console.error(`Error transferring note ${note.id}:`, err);
          transferErrors.push({ noteId: note.id, error: err.message });
        }
      }
      
      // Clear guest notes after successful transfer to prevent duplicates
      if (transferredCount > 0) {
        console.log("Clearing guest notes from localStorage after transfer");
        localStorage.removeItem(GUEST_NOTES_KEY);
        setNotes([]); // Clear notes array in state
      }
      
      // Refresh notes after transfer to get the newly created notes
      await refreshNotes();
      
      return { 
        success: true, 
        count: transferredCount,
        total: guestNotes.length,
        errors: transferErrors.length > 0 ? transferErrors : undefined,
        message: `Successfully transferred ${transferredCount} out of ${guestNotes.length} notes.`
      };
    } catch (err) {
      console.error('Error transferring guest notes:', err);
      return { success: false, error: err.message };
    }
  };

  // Get merge options for note transfer
  const getMergeOptions = () => {
    return {
      hasGuestNotes: isGuestMode && notes.length > 0,
      guestNotesCount: notes.length
    };
  };

  // The value that will be supplied to consuming components
  const value = {
    notes,
    trashedNotes,
    loading,
    error,
    isOffline,
    isGuestMode,
    getNote,
    createNote,
    updateNote,
    deleteNote, // Legacy function keeps API compatibility
    moveToTrash,
    restoreFromTrash,
    permanentlyDeleteNote,
    emptyTrash,
    refreshNotes,
    transferGuestNotesToUser,
    getMergeOptions
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};

export default NotesContext;