import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

const OfflineNotesContext = createContext();

export function OfflineNotesProvider({ children }) {
  const [localNotes, setLocalNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [syncQueue, setSyncQueue] = useState([]);
  
  // Set up auth listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Load notes from local storage on startup
  useEffect(() => {
    setIsLoading(true);
    
    try {
      // Find all items in localStorage that start with 'note-'
      const localStorageNotes = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('note-')) {
          try {
            const noteData = JSON.parse(localStorage.getItem(key));
            localStorageNotes.push(noteData);
          } catch (e) {
            console.error('Failed to parse note from localStorage:', e);
          }
        }
      }
      
      // Sort by updatedAt
      localStorageNotes.sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      
      setLocalNotes(localStorageNotes);
    } catch (error) {
      console.error('Failed to load notes from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Save a note to the cloud when user is logged in
  const saveNoteToCloud = useCallback(async (noteData) => {
    if (!user) {
      // If user is not authenticated, add to sync queue
      setSyncQueue(prev => [...prev, noteData]);
      return Promise.resolve(); // Resolve immediately, we'll sync later
    }
    
    try {
      const db = getFirestore();
      const notesCollection = collection(db, `users/${user.uid}/notes`);
      
      // If it's a local ID (starts with 'local-'), create a new doc
      if (noteData.id.startsWith('local-')) {
        const docRef = await addDoc(notesCollection, {
          ...noteData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: user.uid
        });
        
        // Update the local copy with the new ID
        const updatedNote = { ...noteData, id: docRef.id };
        localStorage.setItem(`note-${docRef.id}`, JSON.stringify(updatedNote));
        localStorage.removeItem(`note-${noteData.id}`);
        
        // Update localNotes state
        setLocalNotes(prev => 
          prev.map(note => note.id === noteData.id ? updatedNote : note)
        );
        
        return docRef.id;
      } else {
        // Otherwise update existing doc
        const noteRef = doc(db, `users/${user.uid}/notes/${noteData.id}`);
        await updateDoc(noteRef, {
          ...noteData,
          updatedAt: serverTimestamp()
        });
        return noteData.id;
      }
    } catch (error) {
      console.error('Error saving note to Firestore:', error);
      throw error;
    }
  }, [user]);
  
  // Sync local notes when user signs in
  useEffect(() => {
    if (!user || syncQueue.length === 0) return;
    
    const syncNotes = async () => {
      try {
        for (const note of syncQueue) {
          await saveNoteToCloud(note);
        }
        setSyncQueue([]);
      } catch (error) {
        console.error('Failed to sync notes:', error);
      }
    };
    
    syncNotes();
  }, [user, syncQueue, saveNoteToCloud]);

  return (
    <OfflineNotesContext.Provider 
      value={{ 
        localNotes, 
        isLoading, 
        saveNoteToCloud,
        user
      }}
    >
      {children}
    </OfflineNotesContext.Provider>
  );
}

export const useOfflineNotes = () => useContext(OfflineNotesContext);