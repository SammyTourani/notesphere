// src/context/NotesContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  Timestamp, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

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
  
  // Local storage keys
  const LOCAL_NOTES_KEY = 'localNotes';
  const GUEST_NOTES_KEY = 'guestNotes';
  const TRASHED_NOTES_KEY = 'trashedNotes';
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('App is online');
      setIsOffline(false);
      syncLocalNotesToFirestore();
    };
    
    const handleOffline = () => {
      console.log('App is offline');
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Helper function to sanitize HTML content
  const sanitizeHtml = (html) => {
    // For now, we'll perform basic sanitization
    if (!html) return '';
    
    // Basic sanitization to remove potentially harmful script tags
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };
  
  // Get all notes for the current user
  const refreshNotes = useCallback(async () => {
    console.log("refreshNotes called, currentUser:", !!currentUser, "isGuestMode:", isGuestMode);
    setLoading(true);
    setError(null);
    
    try {
      // CASE 1: Logged in user - get notes from Firestore
      if (currentUser) {
        console.log("Getting notes for authenticated user:", currentUser.uid);
        
        try {
          // First, try to get any local notes that need to be synced
          const unsynced = getLocalNotes();
          if (unsynced.length > 0) {
            console.log(`Found ${unsynced.length} local notes to sync`);
            await syncLocalNotesToFirestore();
          }
          
          // Then fetch from Firestore
          const q = query(
            collection(db, 'notes'),
            where('userId', '==', currentUser.uid),
            where('deleted', '==', false)
          );
          
          const notesSnapshot = await getDocs(q);
          const notesList = notesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            content: sanitizeHtml(doc.data().content),
            lastUpdated: doc.data().lastUpdated?.toDate().toISOString() || new Date().toISOString()
          }));
          
          console.log(`Fetched ${notesList.length} notes from Firestore`);
          setNotes(notesList);
          
          // Get trashed notes
          const trashedQuery = query(
            collection(db, 'notes'),
            where('userId', '==', currentUser.uid),
            where('deleted', '==', true)
          );
          
          const trashedSnapshot = await getDocs(trashedQuery);
          const trashedList = trashedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            content: sanitizeHtml(doc.data().content),
            lastUpdated: doc.data().lastUpdated?.toDate().toISOString() || new Date().toISOString(),
            deletedAt: doc.data().deletedAt?.toDate().toISOString() || new Date().toISOString()
          }));
          
          setTrashedNotes(trashedList);
        } catch (err) {
          console.error("Error fetching from Firestore:", err);
          
          // Fall back to cached notes if online fetch fails
          const cachedNotes = getLocalNotes();
          if (cachedNotes.length > 0) {
            console.log("Falling back to cached notes");
            setNotes(cachedNotes);
          } else {
            setError('Failed to load notes. Please check your connection.');
          }
        }
      } 
      // CASE 2: Guest mode - get notes from localStorage
      else if (isGuestMode) {
        console.log("Getting notes for guest user");
        
        try {
          // Get guest notes from localStorage
          const guestNotes = JSON.parse(localStorage.getItem(GUEST_NOTES_KEY) || '[]');
          
          // Get guest trashed notes
          const guestTrashed = JSON.parse(localStorage.getItem(`${GUEST_NOTES_KEY}-trash`) || '[]');
          
          console.log(`Found ${guestNotes.length} guest notes and ${guestTrashed.length} guest trashed notes`);
          
          // Process content for each note
          const processedNotes = guestNotes.map(note => ({
            ...note,
            content: sanitizeHtml(note.content)
          }));
          
          const processedTrashed = guestTrashed.map(note => ({
            ...note,
            content: sanitizeHtml(note.content)
          }));
          
          setNotes(processedNotes);
          setTrashedNotes(processedTrashed);
        } catch (err) {
          console.error("Error fetching guest notes:", err);
          setError('Failed to load guest notes.');
        }
      }
      // CASE 3: Not logged in and not in guest mode - no notes
      else {
        console.log("No user and not in guest mode, clearing notes");
        setNotes([]);
        setTrashedNotes([]);
      }
    } catch (err) {
      console.error("Error in refreshNotes:", err);
      setError('Failed to load notes. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, isGuestMode]);
  
  // Load notes when user changes or on mount
  useEffect(() => {
    refreshNotes();
  }, [refreshNotes, currentUser, isGuestMode]);
  
  // Create a new note
  const createNote = async (noteData) => {
    console.log("createNote called with:", noteData);
    setError(null);
    
    try {
      // Ensure note has title and content
      const newNote = {
        title: noteData.title || '',
        content: sanitizeHtml(noteData.content) || '',
        lastUpdated: new Date().toISOString(),
        deleted: false,
        deletedAt: null,
        pinned: noteData.pinned || false
      };
      
      // CASE 1: User is authenticated and online - save to Firestore
      if (currentUser && !isOffline) {
        console.log("Creating note directly in Firestore");
        
        try {
          const notesRef = collection(db, 'notes');
          const firestoreNote = {
            ...newNote,
            userId: currentUser.uid,
            created: serverTimestamp(),
            lastUpdated: serverTimestamp()
          };
          
          const docRef = await addDoc(notesRef, firestoreNote);
          console.log("Note created in Firestore with ID:", docRef.id);
          
          // Add new note to state
          const createdNote = {
            id: docRef.id,
            ...newNote,
            userId: currentUser.uid,
            created: new Date().toISOString()
          };
          
          setNotes(prevNotes => [...prevNotes, createdNote]);
          
          return { success: true, id: docRef.id };
        } catch (err) {
          console.error("Error creating note in Firestore:", err);
          
          // Fall back to local storage if Firestore fails
          return saveNoteLocally(newNote);
        }
      }
      // CASE 2: User is authenticated but offline - save locally for later sync
      else if (currentUser && isOffline) {
        console.log("Creating note locally (offline mode)");
        return saveNoteLocally(newNote);
      }
      // CASE 3: Guest mode - save to localStorage
      else if (isGuestMode) {
        console.log("Creating note in guest mode");
        
        try {
          const guestId = `guest-${uuidv4()}`;
          const guestNote = {
            id: guestId,
            ...newNote,
            created: new Date().toISOString()
          };
          
          // Get existing guest notes
          const existingNotes = JSON.parse(localStorage.getItem(GUEST_NOTES_KEY) || '[]');
          
          // Add new note
          const updatedNotes = [...existingNotes, guestNote];
          localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(updatedNotes));
          
          // Update state
          setNotes(prevNotes => [...prevNotes, guestNote]);
          
          return { success: true, id: guestId };
        } catch (err) {
          console.error("Error creating guest note:", err);
          throw new Error('Failed to create note in guest mode.');
        }
      }
      // CASE 4: No user and not in guest mode - can't create note
      else {
        console.error("Cannot create note - user not authenticated and not in guest mode");
        throw new Error('You must be logged in to create notes.');
      }
    } catch (err) {
      console.error("Error in createNote:", err);
      return { success: false, error: err.message };
    }
  };
  
  // Save note locally for offline use or syncing later
  const saveNoteLocally = (noteData) => {
    console.log("Saving note locally:", noteData);
    
    try {
      // Generate a temporary ID
      const tempId = `local-${uuidv4()}`;
      
      // Create the note with the temporary ID
      const localNote = {
        id: tempId,
        ...noteData,
        userId: currentUser?.uid,
        created: new Date().toISOString(),
        needsSync: true
      };
      
      // Get existing local notes
      const existingNotes = JSON.parse(localStorage.getItem(LOCAL_NOTES_KEY) || '[]');
      
      // Add the new note
      const updatedNotes = [...existingNotes, localNote];
      localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(updatedNotes));
      
      // Update state
      setNotes(prevNotes => [...prevNotes, localNote]);
      
      return { success: true, id: tempId };
    } catch (err) {
      console.error("Error saving note locally:", err);
      return { success: false, error: 'Failed to save note locally.' };
    }
  };
  
  // Get local notes (offline-created or unsynced)
  const getLocalNotes = () => {
    try {
      const localNotes = JSON.parse(localStorage.getItem(LOCAL_NOTES_KEY) || '[]');
      console.log(`Retrieved ${localNotes.length} local notes`);
      return localNotes;
    } catch (err) {
      console.error("Error getting local notes:", err);
      return [];
    }
  };
  
  // Sync local notes to Firestore once back online
  const syncLocalNotesToFirestore = async () => {
    console.log("Syncing local notes to Firestore");
    
    // Only attempt sync if online and authenticated
    if (isOffline || !currentUser) {
      console.log("Cannot sync - offline or not authenticated");
      return;
    }
    
    try {
      const localNotes = getLocalNotes();
      
      if (localNotes.length === 0) {
        console.log("No local notes to sync");
        return;
      }
      
      console.log(`Found ${localNotes.length} local notes to sync`);
      
      // Keep track of successful syncs
      const syncedNotes = [];
      
      for (const note of localNotes) {
        try {
          // Add note to Firestore
          const notesRef = collection(db, 'notes');
          const firestoreNote = {
            title: note.title,
            content: note.content,
            userId: currentUser.uid,
            created: Timestamp.fromDate(new Date(note.created)),
            lastUpdated: serverTimestamp(),
            deleted: note.deleted || false,
            deletedAt: note.deletedAt ? Timestamp.fromDate(new Date(note.deletedAt)) : null,
            pinned: note.pinned || false
          };
          
          const docRef = await addDoc(notesRef, firestoreNote);
          console.log(`Synced local note to Firestore with ID: ${docRef.id}`);
          
          // Add to synced list
          syncedNotes.push({
            localId: note.id,
            firestoreId: docRef.id
          });
        } catch (err) {
          console.error(`Error syncing note ${note.id}:`, err);
        }
      }
      
      console.log(`Successfully synced ${syncedNotes.length} out of ${localNotes.length} notes`);
      
      // If we synced any notes, update localStorage
      if (syncedNotes.length > 0) {
        // Remove synced notes from local storage
        const remainingNotes = localNotes.filter(note => 
          !syncedNotes.some(synced => synced.localId === note.id)
        );
        
        localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(remainingNotes));
        
        // Refresh notes to get the latest from Firestore
        await refreshNotes();
      }
    } catch (err) {
      console.error("Error during sync process:", err);
    }
  };
  
  // Get a specific note
  const getNote = async (noteId) => {
    console.log(`getNote called for ID: ${noteId}`);
    setError(null);
    
    try {
      // CASE 1: It's a guest note
      if (noteId.startsWith('guest-')) {
        console.log("Getting guest note");
        
        try {
          // Get all guest notes
          const guestNotes = JSON.parse(localStorage.getItem(GUEST_NOTES_KEY) || '[]');
          
          // Find the specific note
          const note = guestNotes.find(note => note.id === noteId);
          
          if (note) {
            return { 
              success: true, 
              data: {
                ...note,
                content: sanitizeHtml(note.content),
                pinned: note.pinned || false
              } 
            };
          } else {
            return { success: false, error: 'Note not found' };
          }
        } catch (err) {
          console.error("Error getting guest note:", err);
          return { success: false, error: err.message };
        }
      }
      // CASE 2: It's a local note (offline-created)
      else if (noteId.startsWith('local-')) {
        console.log("Getting local note");
        
        try {
          // Get all local notes
          const localNotes = getLocalNotes();
          
          // Find the specific note
          const note = localNotes.find(note => note.id === noteId);
          
          if (note) {
            return { 
              success: true, 
              data: {
                ...note,
                content: sanitizeHtml(note.content),
                pinned: note.pinned || false
              } 
            };
          } else {
            return { success: false, error: 'Note not found' };
          }
        } catch (err) {
          console.error("Error getting local note:", err);
          return { success: false, error: err.message };
        }
      }
      // CASE 3: It's a Firestore note
      else {
        console.log(`Getting Firestore note: ${noteId}`);
        
        // Check if the user is authenticated
        if (!currentUser) {
          console.error("Cannot get Firestore note - not authenticated");
          return { success: false, error: 'You must be logged in to access this note.' };
        }
        
        try {
          // Get the note from Firestore
          const noteRef = doc(db, 'notes', noteId);
          const noteSnapshot = await getDoc(noteRef);
          
          if (noteSnapshot.exists()) {
            // Check if the note belongs to the current user
            const noteData = noteSnapshot.data();
            
            if (noteData.userId !== currentUser.uid) {
              console.error("Note does not belong to current user");
              return { success: false, error: 'You do not have permission to access this note.' };
            }
            
            return { 
              success: true, 
              data: {
                id: noteSnapshot.id,
                ...noteData,
                content: sanitizeHtml(noteData.content),
                lastUpdated: noteData.lastUpdated?.toDate().toISOString() || new Date().toISOString(),
                created: noteData.created?.toDate().toISOString() || new Date().toISOString(),
                pinned: noteData.pinned || false
              } 
            };
          } else {
            console.log(`Note ${noteId} not found`);
            return { success: false, error: 'Note not found' };
          }
        } catch (err) {
          console.error("Error getting Firestore note:", err);
          
          // Check if there's a cached version in state
          const cachedNote = notes.find(note => note.id === noteId);
          
          if (cachedNote) {
            console.log("Using cached note due to Firestore error");
            return { success: true, data: cachedNote };
          }
          
          return { success: false, error: 'Failed to load note. Please try again later.' };
        }
      }
    } catch (err) {
      console.error("Error in getNote:", err);
      return { success: false, error: err.message };
    }
  };
  
  // Update a note
  const updateNote = async (noteId, noteData) => {
    console.log(`updateNote called for ID: ${noteId} with data:`, noteData);
    setError(null);
    
    try {
      // Process the note data
      const updatedNote = {
        ...noteData,
        content: sanitizeHtml(noteData.content),
        lastUpdated: new Date().toISOString(),
        pinned: noteData.pinned !== undefined ? noteData.pinned : false
      };
      
      // CASE 1: It's a guest note
      if (noteId.startsWith('guest-')) {
        console.log("Updating guest note");
        
        try {
          // Get all guest notes
          const guestNotes = JSON.parse(localStorage.getItem(GUEST_NOTES_KEY) || '[]');
          
          // Find the note index
          const noteIndex = guestNotes.findIndex(note => note.id === noteId);
          
          if (noteIndex !== -1) {
            // Update the note
            guestNotes[noteIndex] = {
              ...guestNotes[noteIndex],
              ...updatedNote,
              lastUpdated: new Date().toISOString()
            };
            
            // Save back to localStorage
            localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(guestNotes));
            
            // Update state
            setNotes(prevNotes => {
              const newNotes = [...prevNotes];
              const stateNoteIndex = newNotes.findIndex(note => note.id === noteId);
              
              if (stateNoteIndex !== -1) {
                newNotes[stateNoteIndex] = {
                  ...newNotes[stateNoteIndex],
                  ...updatedNote,
                  lastUpdated: new Date().toISOString()
                };
              }
              
              return newNotes;
            });
            
            return { success: true };
          } else {
            return { success: false, error: 'Note not found' };
          }
        } catch (err) {
          console.error("Error updating guest note:", err);
          return { success: false, error: err.message };
        }
      }
      // CASE 2: It's a local note (offline-created)
      else if (noteId.startsWith('local-')) {
        console.log("Updating local note");
        
        try {
          // Get all local notes
          const localNotes = getLocalNotes();
          
          // Find the note index
          const noteIndex = localNotes.findIndex(note => note.id === noteId);
          
          if (noteIndex !== -1) {
            // Update the note
            localNotes[noteIndex] = {
              ...localNotes[noteIndex],
              ...updatedNote,
              lastUpdated: new Date().toISOString(),
              needsSync: true
            };
            
            // Save back to localStorage
            localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(localNotes));
            
            // Update state
            setNotes(prevNotes => {
              const newNotes = [...prevNotes];
              const stateNoteIndex = newNotes.findIndex(note => note.id === noteId);
              
              if (stateNoteIndex !== -1) {
                newNotes[stateNoteIndex] = {
                  ...newNotes[stateNoteIndex],
                  ...updatedNote,
                  lastUpdated: new Date().toISOString()
                };
              }
              
              return newNotes;
            });
            
            return { success: true };
          } else {
            return { success: false, error: 'Note not found' };
          }
        } catch (err) {
          console.error("Error updating local note:", err);
          return { success: false, error: err.message };
        }
      }
      // CASE 3: It's a Firestore note
      else {
        console.log(`Updating Firestore note: ${noteId}`);
        
        // Check if the user is authenticated
        if (!currentUser) {
          console.error("Cannot update Firestore note - not authenticated");
          return { success: false, error: 'You must be logged in to update this note.' };
        }
        
        try {
          // Update the note in Firestore
          const noteRef = doc(db, 'notes', noteId);
          
          await updateDoc(noteRef, {
            title: updatedNote.title,
            content: updatedNote.content,
            lastUpdated: serverTimestamp(),
            pinned: updatedNote.pinned
          });
          
          console.log(`Updated Firestore note: ${noteId}`);
          
          // Update state
          setNotes(prevNotes => {
            const newNotes = [...prevNotes];
            const noteIndex = newNotes.findIndex(note => note.id === noteId);
            
            if (noteIndex !== -1) {
              newNotes[noteIndex] = {
                ...newNotes[noteIndex],
                ...updatedNote,
                lastUpdated: new Date().toISOString()
              };
            }
            
            return newNotes;
          });
          
          return { success: true };
        } catch (err) {
          console.error("Error updating Firestore note:", err);
          
          // If offline, save locally for later sync
          if (isOffline) {
            console.log("Offline - saving note locally for later sync");
            
            try {
              // Get current local notes
              const localNotes = getLocalNotes();
              
              // Check if this note is already saved locally
              const existingIndex = localNotes.findIndex(note => note.id === noteId);
              
              if (existingIndex !== -1) {
                // Update existing local copy
                localNotes[existingIndex] = {
                  ...localNotes[existingIndex],
                  ...updatedNote,
                  lastUpdated: new Date().toISOString(),
                  needsSync: true
                };
              } else {
                // Add new local copy
                localNotes.push({
                  id: noteId,
                  ...updatedNote,
                  userId: currentUser.uid,
                  lastUpdated: new Date().toISOString(),
                  needsSync: true
                });
              }
              
              // Save back to localStorage
              localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(localNotes));
              
              // Update state
              setNotes(prevNotes => {
                const newNotes = [...prevNotes];
                const noteIndex = newNotes.findIndex(note => note.id === noteId);
                
                if (noteIndex !== -1) {
                  newNotes[noteIndex] = {
                    ...newNotes[noteIndex],
                    ...updatedNote,
                    lastUpdated: new Date().toISOString()
                  };
                }
                
                return newNotes;
              });
              
              return { success: true };
            } catch (localErr) {
              console.error("Error saving note locally:", localErr);
              return { success: false, error: 'Failed to save note changes locally.' };
            }
          }
          
          return { success: false, error: 'Failed to update note. Please try again later.' };
        }
      }
    } catch (err) {
      console.error("Error in updateNote:", err);
      return { success: false, error: err.message };
    }
  };
  
  // Toggle pin status of a note
  const togglePinStatus = async (noteId) => {
    console.log(`togglePinStatus called for ID: ${noteId}`);
    setError(null);
    
    try {
      // Find the note in our current state to get its current pin status
      const noteToToggle = notes.find(note => note.id === noteId);
      
      if (!noteToToggle) {
        return { success: false, error: 'Note not found' };
      }
      
      // The new pin status is the opposite of the current status
      const newPinStatus = !(noteToToggle.pinned || false);
      
      // CASE 1: It's a guest note
      if (noteId.startsWith('guest-')) {
        console.log(`Toggling pin status of guest note to: ${newPinStatus}`);
        
        try {
          // Get all guest notes
          const guestNotes = JSON.parse(localStorage.getItem(GUEST_NOTES_KEY) || '[]');
          
          // Find the note index
          const noteIndex = guestNotes.findIndex(note => note.id === noteId);
          
          if (noteIndex !== -1) {
            // Update the note
            guestNotes[noteIndex] = {
              ...guestNotes[noteIndex],
              pinned: newPinStatus,
              lastUpdated: new Date().toISOString()
            };
            
            // Save back to localStorage
            localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(guestNotes));
            
            // Update state
            setNotes(prevNotes => {
              const newNotes = [...prevNotes];
              const stateNoteIndex = newNotes.findIndex(note => note.id === noteId);
              
              if (stateNoteIndex !== -1) {
                newNotes[stateNoteIndex] = {
                  ...newNotes[stateNoteIndex],
                  pinned: newPinStatus,
                  lastUpdated: new Date().toISOString()
                };
              }
              
              return newNotes;
            });
            
            return { success: true };
          } else {
            return { success: false, error: 'Note not found' };
          }
        } catch (err) {
          console.error("Error toggling pin status of guest note:", err);
          return { success: false, error: err.message };
        }
      }
      // CASE 2: It's a local note (offline-created)
      else if (noteId.startsWith('local-')) {
        console.log(`Toggling pin status of local note to: ${newPinStatus}`);
        
        try {
          // Get all local notes
          const localNotes = getLocalNotes();
          
          // Find the note index
          const noteIndex = localNotes.findIndex(note => note.id === noteId);
          
          if (noteIndex !== -1) {
            // Update the note
            localNotes[noteIndex] = {
              ...localNotes[noteIndex],
              pinned: newPinStatus,
              lastUpdated: new Date().toISOString(),
              needsSync: true
            };
            
            // Save back to localStorage
            localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(localNotes));
            
            // Update state
            setNotes(prevNotes => {
              const newNotes = [...prevNotes];
              const stateNoteIndex = newNotes.findIndex(note => note.id === noteId);
              
              if (stateNoteIndex !== -1) {
                newNotes[stateNoteIndex] = {
                  ...newNotes[stateNoteIndex],
                  pinned: newPinStatus,
                  lastUpdated: new Date().toISOString()
                };
              }
              
              return newNotes;
            });
            
            return { success: true };
          } else {
            return { success: false, error: 'Note not found' };
          }
        } catch (err) {
          console.error("Error toggling pin status of local note:", err);
          return { success: false, error: err.message };
        }
      }
      // CASE 3: It's a Firestore note
      else {
        console.log(`Toggling pin status of Firestore note: ${noteId} to: ${newPinStatus}`);
        
        // Check if the user is authenticated
        if (!currentUser) {
          console.error("Cannot update Firestore note - not authenticated");
          return { success: false, error: 'You must be logged in to update this note.' };
        }
        
        try {
          // Update the note in Firestore
          const noteRef = doc(db, 'notes', noteId);
          
          await updateDoc(noteRef, {
            pinned: newPinStatus,
            lastUpdated: serverTimestamp()
          });
          
          console.log(`Updated pin status of Firestore note: ${noteId}`);
          
          // Update state
          setNotes(prevNotes => {
            const newNotes = [...prevNotes];
            const noteIndex = newNotes.findIndex(note => note.id === noteId);
            
            if (noteIndex !== -1) {
              newNotes[noteIndex] = {
                ...newNotes[noteIndex],
                pinned: newPinStatus,
                lastUpdated: new Date().toISOString()
              };
            }
            
            return newNotes;
          });
          
          return { success: true };
        } catch (err) {
          console.error("Error updating Firestore note:", err);
          
          // If offline, save locally for later sync
          if (isOffline) {
            console.log("Offline - saving pin status change locally for later sync");
            
            try {
              // Get current local notes
              const localNotes = getLocalNotes();
              
              // Check if this note is already saved locally
              const existingIndex = localNotes.findIndex(note => note.id === noteId);
              
              if (existingIndex !== -1) {
                // Update existing local copy
                localNotes[existingIndex] = {
                  ...localNotes[existingIndex],
                  pinned: newPinStatus,
                  lastUpdated: new Date().toISOString(),
                  needsSync: true
                };
              } else {
                // Add new local copy
                localNotes.push({
                  id: noteId,
                  ...noteToToggle,
                  pinned: newPinStatus,
                  lastUpdated: new Date().toISOString(),
                  needsSync: true
                });
              }
              
              // Save back to localStorage
              localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(localNotes));
              
              // Update state
              setNotes(prevNotes => {
                const newNotes = [...prevNotes];
                const noteIndex = newNotes.findIndex(note => note.id === noteId);
                
                if (noteIndex !== -1) {
                  newNotes[noteIndex] = {
                    ...newNotes[noteIndex],
                    pinned: newPinStatus,
                    lastUpdated: new Date().toISOString()
                  };
                }
                
                return newNotes;
              });
              
              return { success: true };
            } catch (localErr) {
              console.error("Error saving pin status locally:", localErr);
              return { success: false, error: 'Failed to save pin status locally.' };
            }
          }
          
          return { success: false, error: 'Failed to update note. Please try again later.' };
        }
      }
    } catch (err) {
      console.error("Error in togglePinStatus:", err);
      return { success: false, error: err.message };
    }
  };
  
  // Move a note to trash
  const moveToTrash = async (noteId) => {
    console.log(`moveToTrash called for ID: ${noteId}`);
    setError(null);
    
    try {
      // CASE 1: It's a guest note
      if (noteId.startsWith('guest-')) {
        console.log("Moving guest note to trash");
        
        try {
          // Get all guest notes
          const guestNotes = JSON.parse(localStorage.getItem(GUEST_NOTES_KEY) || '[]');
          
          // Find the note index
          const noteIndex = guestNotes.findIndex(note => note.id === noteId);
          
          if (noteIndex !== -1) {
            // Get the note to delete
            const noteToTrash = guestNotes[noteIndex];
            
            // Remove from notes array
            guestNotes.splice(noteIndex, 1);
            
            // Save back to localStorage
            localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(guestNotes));
            
            // Add to trash
            const trashed = JSON.parse(localStorage.getItem(`${GUEST_NOTES_KEY}-trash`) || '[]');
            trashed.push({
              ...noteToTrash,
              deleted: true,
              deletedAt: new Date().toISOString()
            });
            
            localStorage.setItem(`${GUEST_NOTES_KEY}-trash`, JSON.stringify(trashed));
            
            // Update state
            setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
            setTrashedNotes(prevTrashed => [
              ...prevTrashed, 
              {
                ...noteToTrash,
                deleted: true,
                deletedAt: new Date().toISOString()
              }
            ]);
            
            return { success: true };
          } else {
            return { success: false, error: 'Note not found' };
          }
        } catch (err) {
          console.error("Error moving guest note to trash:", err);
          return { success: false, error: err.message };
        }
      }
      // CASE 2: It's a local note
      else if (noteId.startsWith('local-')) {
        console.log("Moving local note to trash");
        
        try {
          // Get all local notes
          const localNotes = getLocalNotes();
          
          // Find the note index
          const noteIndex = localNotes.findIndex(note => note.id === noteId);
          
          if (noteIndex !== -1) {
            // Remove from local notes
            const noteToTrash = localNotes[noteIndex];
            localNotes.splice(noteIndex, 1);
            
            // Save back to localStorage
            localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(localNotes));
            
            // Add to trashed notes
            const trashed = JSON.parse(localStorage.getItem(`${LOCAL_NOTES_KEY}-trash`) || '[]');
            trashed.push({
              ...noteToTrash,
              deleted: true,
              deletedAt: new Date().toISOString()
            });
            
            localStorage.setItem(`${LOCAL_NOTES_KEY}-trash`, JSON.stringify(trashed));
            
            // Update state
            setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
            setTrashedNotes(prevTrashed => [
              ...prevTrashed,
              {
                ...noteToTrash,
                deleted: true,
                deletedAt: new Date().toISOString()
              }
            ]);
            
            return { success: true };
          } else {
            return { success: false, error: 'Note not found' };
          }
        } catch (err) {
          console.error("Error moving local note to trash:", err);
          return { success: false, error: err.message };
        }
      }
      // CASE 3: It's a Firestore note
      else {
        console.log(`Moving Firestore note to trash: ${noteId}`);
        
        // Check if the user is authenticated
        if (!currentUser) {
          console.error("Cannot move Firestore note to trash - not authenticated");
          return { success: false, error: 'You must be logged in to delete this note.' };
        }
        
        try {
          // Update the note in Firestore
          const noteRef = doc(db, 'notes', noteId);
          
          await updateDoc(noteRef, {
            deleted: true,
            deletedAt: serverTimestamp()
          });
          
          console.log(`Moved Firestore note to trash: ${noteId}`);
          
          // Find the note in state
          const noteToTrash = notes.find(note => note.id === noteId);
          
          // Update state
          setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
          
          if (noteToTrash) {
            setTrashedNotes(prevTrashed => [
              ...prevTrashed,
              {
                ...noteToTrash,
                deleted: true,
                deletedAt: new Date().toISOString()
              }
            ]);
          }
          
          return { success: true };
        } catch (err) {
          console.error("Error moving Firestore note to trash:", err);
          
          // If offline, handle locally
          if (isOffline) {
            console.log("Offline - marking note for deletion when online");
            
            try {
              // Get current notes
              const noteToDelte = notes.find(note => note.id === noteId);
              
              if (noteToDelte) {
                // Add to pending deletions
                const pendingDeletions = JSON.parse(localStorage.getItem('pendingDeletions') || '[]');
                pendingDeletions.push(noteId);
                localStorage.setItem('pendingDeletions', JSON.stringify(pendingDeletions));
                
                // Update state to reflect deletion
                setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
                setTrashedNotes(prevTrashed => [
                  ...prevTrashed,
                  {
                    ...noteToDelte,
                    deleted: true,
                    deletedAt: new Date().toISOString()
                  }
                ]);
                
                return { success: true };
              } else {
                return { success: false, error: 'Note not found in current state' };
              }
            } catch (localErr) {
              console.error("Error in local deletion process:", localErr);
              return { success: false, error: 'Failed to mark note for deletion.' };
            }
          }
          
          return { success: false, error: 'Failed to move note to trash. Please try again later.' };
        }
      }
    } catch (err) {
      console.error("Error in moveToTrash:", err);
      return { success: false, error: err.message };
    }
  };
  
  // Restore a note from trash
  const restoreFromTrash = async (noteId) => {
    console.log(`restoreFromTrash called for ID: ${noteId}`);
    setError(null);
    
    try {
      // CASE 1: It's a guest note
      if (noteId.startsWith('guest-')) {
        console.log("Restoring guest note from trash");
        
        try {
          // Get trashed guest notes
          const trashedGuest = JSON.parse(localStorage.getItem(`${GUEST_NOTES_KEY}-trash`) || '[]');
          
          // Find the note index
          const noteIndex = trashedGuest.findIndex(note => note.id === noteId);
          
          if (noteIndex !== -1) {
            // Get the note to restore
            const noteToRestore = trashedGuest[noteIndex];
            
            // Remove from trash
            trashedGuest.splice(noteIndex, 1);
            localStorage.setItem(`${GUEST_NOTES_KEY}-trash`, JSON.stringify(trashedGuest));
            
            // Add back to notes
            const guestNotes = JSON.parse(localStorage.getItem(GUEST_NOTES_KEY) || '[]');
            guestNotes.push({
              ...noteToRestore,
              deleted: false,
              deletedAt: null,
              lastUpdated: new Date().toISOString()
            });
            
            localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(guestNotes));
            
            // Update state
            setTrashedNotes(prevTrashed => prevTrashed.filter(note => note.id !== noteId));
            setNotes(prevNotes => [
              ...prevNotes,
              {
                ...noteToRestore,
                deleted: false,
                deletedAt: null,
                lastUpdated: new Date().toISOString()
              }
            ]);
            
            return { success: true };
          } else {
            return { success: false, error: 'Note not found in trash' };
          }
        } catch (err) {
          console.error("Error restoring guest note:", err);
          return { success: false, error: err.message };
        }
      }
      // CASE 2: It's a Firestore note
      else {
        console.log(`Restoring Firestore note from trash: ${noteId}`);
        
        // Check if the user is authenticated
        if (!currentUser) {
          console.error("Cannot restore Firestore note - not authenticated");
          return { success: false, error: 'You must be logged in to restore this note.' };
        }
        
        try {
          // Update the note in Firestore
          const noteRef = doc(db, 'notes', noteId);
          
          await updateDoc(noteRef, {
            deleted: false,
            deletedAt: null,
            lastUpdated: serverTimestamp()
          });
          
          console.log(`Restored Firestore note: ${noteId}`);
          
          // Find the note in trashed notes
          const noteToRestore = trashedNotes.find(note => note.id === noteId);
          
          // Update state
          setTrashedNotes(prevTrashed => prevTrashed.filter(note => note.id !== noteId));
          
          if (noteToRestore) {
            setNotes(prevNotes => [
              ...prevNotes,
              {
                ...noteToRestore,
                deleted: false,
                deletedAt: null,
                lastUpdated: new Date().toISOString()
              }
            ]);
          }
          
          return { success: true };
        } catch (err) {
          console.error("Error restoring Firestore note:", err);
          return { success: false, error: 'Failed to restore note. Please try again later.' };
        }
      }
    } catch (err) {
      console.error("Error in restoreFromTrash:", err);
      return { success: false, error: err.message };
    }
  };
  
  // Permanently delete a note
  const deleteNotePermanently = async (noteId) => {
    console.log(`deleteNotePermanently called for ID: ${noteId}`);
    setError(null);
    
    try {
      // CASE 1: It's a guest note
      if (noteId.startsWith('guest-')) {
        console.log("Permanently deleting guest note");
        
        try {
          // Get trashed guest notes
          const trashedGuest = JSON.parse(localStorage.getItem(`${GUEST_NOTES_KEY}-trash`) || '[]');
          
          // Filter out the note
          const updatedTrash = trashedGuest.filter(note => note.id !== noteId);
          
          // Save back to localStorage
          localStorage.setItem(`${GUEST_NOTES_KEY}-trash`, JSON.stringify(updatedTrash));
          
          // Update state
          setTrashedNotes(prevTrashed => prevTrashed.filter(note => note.id !== noteId));
          
          return { success: true };
        } catch (err) {
          console.error("Error permanently deleting guest note:", err);
          return { success: false, error: err.message };
        }
      }
      // CASE 2: It's a Firestore note
      else {
        console.log(`Permanently deleting Firestore note: ${noteId}`);
        
        // Check if the user is authenticated
        if (!currentUser) {
          console.error("Cannot permanently delete Firestore note - not authenticated");
          return { success: false, error: 'You must be logged in to delete this note.' };
        }
        
        try {
          // In a real app, you might want to actually delete the document
          // For now, we'll just mark it as permanently deleted
          const noteRef = doc(db, 'notes', noteId);
          
          await updateDoc(noteRef, {
            permanentlyDeleted: true,
            lastUpdated: serverTimestamp()
          });
          
          console.log(`Permanently deleted Firestore note: ${noteId}`);
          
          // Update state
          setTrashedNotes(prevTrashed => prevTrashed.filter(note => note.id !== noteId));
          
          return { success: true };
        } catch (err) {
          console.error("Error permanently deleting Firestore note:", err);
          return { success: false, error: 'Failed to delete note. Please try again later.' };
        }
      }
    } catch (err) {
      console.error("Error in deleteNotePermanently:", err);
      return { success: false, error: err.message };
    }
  };
  
  // Empty the trash
  const emptyTrash = async () => {
    console.log("emptyTrash called");
    setError(null);
    
    try {
      // CASE 1: Guest mode
      if (isGuestMode) {
        console.log("Emptying guest trash");
        
        try {
          // Clear trash in localStorage
          localStorage.setItem(`${GUEST_NOTES_KEY}-trash`, JSON.stringify([]));
          
          // Update state
          setTrashedNotes([]);
          
          return { success: true };
        } catch (err) {
          console.error("Error emptying guest trash:", err);
          return { success: false, error: err.message };
        }
      }
      // CASE 2: Authenticated user
      else if (currentUser) {
        console.log("Emptying user trash");
        
        try {
          const promises = trashedNotes.map(note => {
            const noteRef = doc(db, 'notes', note.id);
            return updateDoc(noteRef, { permanentlyDeleted: true });
          });
          
          await Promise.all(promises);
          console.log("All trashed notes marked as permanently deleted");
          
          // Update state
          setTrashedNotes([]);
          
          return { success: true };
        } catch (err) {
          console.error("Error emptying user trash:", err);
          return { success: false, error: 'Failed to empty trash. Please try again later.' };
        }
      } else {
        console.error("Cannot empty trash - not authenticated and not in guest mode");
        return { success: false, error: 'You must be logged in to perform this action.' };
      }
    } catch (err) {
      console.error("Error in emptyTrash:", err);
      return { success: false, error: err.message };
    }
  };
  
  // Get merge options for guest mode
  const getMergeOptions = () => {
    const guestNotes = JSON.parse(localStorage.getItem(GUEST_NOTES_KEY) || '[]');
    const hasGuestNotes = guestNotes.length > 0;
    const guestNotesCount = guestNotes.length;
    
    return {
      hasGuestNotes,
      guestNotesCount,
      guestNotes
    };
  };
  
  // Check if a note exists
  const doesNoteExist = async (noteId) => {
    try {
      const result = await getNote(noteId);
      return result.success;
    } catch (err) {
      console.error("Error in doesNoteExist:", err);
      return false;
    }
  };
  
  // Provide context values
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
    getMergeOptions,
    doesNoteExist,
    togglePinStatus
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