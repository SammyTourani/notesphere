import { db, auth } from '../firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Constants
const OFFLINE_NOTES_KEY = 'offlineNotes';
const SYNC_QUEUE_KEY = 'syncQueue';
const LOCAL_ID_PREFIX = 'local-';

class NotesService {
  // Generate a unique ID for local notes
  static generateLocalId() {
    return `${LOCAL_ID_PREFIX}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  // Check if a string is a local ID
  static isLocalId(id) {
    return id && id.startsWith(LOCAL_ID_PREFIX);
  }
  
  // Get offline notes from localStorage
  static getOfflineNotes() {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_NOTES_KEY) || '[]');
    } catch (error) {
      console.error('Error parsing offline notes:', error);
      return [];
    }
  }
  
  // Save offline notes to localStorage
  static saveOfflineNotes(notes) {
    try {
      localStorage.setItem(OFFLINE_NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving offline notes:', error);
    }
  }
  
  // Get sync queue from localStorage
  static getSyncQueue() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    } catch (error) {
      console.error('Error parsing sync queue:', error);
      return [];
    }
  }
  
  // Save sync queue to localStorage
  static saveSyncQueue(queue) {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }
  
  // Add a note to sync queue
  static addToSyncQueue(noteId) {
    const queue = this.getSyncQueue();
    if (!queue.includes(noteId)) {
      queue.push(noteId);
      this.saveSyncQueue(queue);
    }
  }
  
  // Remove a note from sync queue
  static removeFromSyncQueue(noteId) {
    const queue = this.getSyncQueue();
    const updatedQueue = queue.filter(id => id !== noteId);
    this.saveSyncQueue(updatedQueue);
  }
  
  // Find a note in offline storage
  static findOfflineNote(noteId) {
    const notes = this.getOfflineNotes();
    return notes.find(note => note.id === noteId);
  }
  
  // Save a note to offline storage
  static saveNoteOffline(note) {
    try {
      // Ensure note has an ID and timestamps
      const noteWithMeta = {
        ...note,
        id: note.id || this.generateLocalId(),
        lastUpdated: new Date().toISOString(),
        createdAt: note.createdAt || new Date().toISOString()
      };
      
      // Update existing or add new
      const notes = this.getOfflineNotes();
      const index = notes.findIndex(n => n.id === noteWithMeta.id);
      
      if (index !== -1) {
        notes[index] = noteWithMeta;
      } else {
        notes.push(noteWithMeta);
      }
      
      this.saveOfflineNotes(notes);
      this.addToSyncQueue(noteWithMeta.id);
      
      return {
        success: true,
        id: noteWithMeta.id,
        isOfflineOnly: true
      };
    } catch (error) {
      console.error('Error saving note offline:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Create a note in Firestore
  static async createNoteInFirestore(userId, note) {
    // For new notes (not syncing local ones)
    try {
      const notesRef = collection(db, 'users', userId, 'notes');
      
      // Add timestamps
      const noteWithTimestamps = {
        ...note,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      // Add to Firestore with auto-generated ID
      const docRef = await addDoc(notesRef, noteWithTimestamps);
      
      // Return the Firestore-generated ID
      return {
        success: true,
        id: docRef.id,
        isCloud: true
      };
    } catch (error) {
      console.error('Error creating note in Firestore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Update a note in Firestore
  static async updateNoteInFirestore(userId, noteId, noteData) {
    try {
      const noteRef = doc(db, 'users', userId, 'notes', noteId);
      
      // Add timestamp
      const noteWithTimestamp = {
        ...noteData,
        lastUpdated: serverTimestamp()
      };
      
      await setDoc(noteRef, noteWithTimestamp, { merge: true });
      
      return {
        success: true,
        id: noteId,
        isCloud: true
      };
    } catch (error) {
      console.error('Error updating note in Firestore:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Sync an offline note to Firestore
  static async syncOfflineNoteToCloud(userId, noteId) {
    try {
      const offlineNote = this.findOfflineNote(noteId);
      if (!offlineNote) {
        return { success: false, error: 'Offline note not found' };
      }
      
      // If it's a local ID, create a new Firestore document
      if (this.isLocalId(noteId)) {
        const { title, content, createdAt } = offlineNote;
        const result = await this.createNoteInFirestore(userId, { title, content });
        
        if (result.success) {
          // Update references in offline storage
          this.updateLocalNoteId(noteId, result.id);
          this.removeFromSyncQueue(noteId);
        }
        
        return result;
      } else {
        // It's an existing cloud note that was edited offline
        const { title, content } = offlineNote;
        const result = await this.updateNoteInFirestore(userId, noteId, { title, content });
        
        if (result.success) {
          // Remove from offline storage and sync queue
          this.removeOfflineNote(noteId);
          this.removeFromSyncQueue(noteId);
        }
        
        return result;
      }
    } catch (error) {
      console.error('Error syncing offline note to cloud:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Sync all offline notes to Firestore
  static async syncAllOfflineNotes(userId) {
    try {
      if (!userId) return { success: false, error: 'User not authenticated' };
      if (!navigator.onLine) return { success: false, error: 'No internet connection' };
      
      const queue = this.getSyncQueue();
      if (queue.length === 0) return { success: true, message: 'No notes to sync' };
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const noteId of queue) {
        try {
          const result = await this.syncOfflineNoteToCloud(userId, noteId);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error syncing note ${noteId}:`, error);
          errorCount++;
        }
      }
      
      return {
        success: true,
        syncedCount: successCount,
        failedCount: errorCount
      };
    } catch (error) {
      console.error('Error syncing all offline notes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Update a local note ID after cloud sync
  static updateLocalNoteId(oldId, newId) {
    try {
      // Update in offline notes
      const notes = this.getOfflineNotes();
      const updatedNotes = notes.map(note => {
        if (note.id === oldId) {
          return { ...note, id: newId };
        }
        return note;
      });
      
      this.saveOfflineNotes(updatedNotes);
      
      // Update sync queue
      const queue = this.getSyncQueue();
      const updatedQueue = queue.map(id => id === oldId ? newId : id);
      this.saveSyncQueue(updatedQueue);
      
      // Update lastNote references
      const userId = auth.currentUser?.uid;
      if (userId) {
        const lastNoteKey = `lastNote-${userId}`;
        if (localStorage.getItem(lastNoteKey) === oldId) {
          localStorage.setItem(lastNoteKey, newId);
        }
      }
    } catch (error) {
      console.error('Error updating local note ID:', error);
    }
  }
  
  // Remove a note from offline storage
  static removeOfflineNote(noteId) {
    const notes = this.getOfflineNotes();
    const updatedNotes = notes.filter(note => note.id !== noteId);
    this.saveOfflineNotes(updatedNotes);
  }
  
  // Delete a note (handles both online and offline)
  static async deleteNote(userId, noteId) {
    try {
      // Always remove from offline storage and sync queue
      this.removeOfflineNote(noteId);
      this.removeFromSyncQueue(noteId);
      
      // If it's not a local ID and we're online, delete from Firestore
      if (!this.isLocalId(noteId) && navigator.onLine && userId && noteId) {
        try {
          const noteRef = doc(db, 'users', userId, 'notes', noteId);
          await deleteDoc(noteRef);
        } catch (error) {
          console.error('Error deleting from Firestore:', error);
          // Continue even if Firestore deletion fails
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting note:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get a specific note (handles both online and offline)
  static async getNote(userId, noteId) {
    try {
      // Check offline storage first
      const offlineNote = this.findOfflineNote(noteId);
      if (offlineNote) {
        return {
          success: true,
          data: { ...offlineNote, source: 'offline' },
          source: 'offline'
        };
      }
      
      // If online, check Firestore
      if (navigator.onLine) {
        const noteRef = doc(db, 'users', userId, 'notes', noteId);
        const noteSnap = await getDoc(noteRef);
        
        if (noteSnap.exists()) {
          const data = noteSnap.data();
          
          // Convert Firestore timestamps to ISO strings for consistent handling
          const formattedData = {
            ...data,
            id: noteSnap.id,
            lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate().toISOString() : data.lastUpdated,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            source: 'cloud'
          };
          
          return {
            success: true,
            data: formattedData,
            source: 'cloud'
          };
        }
      }
      
      return {
        success: false,
        error: 'Note not found',
        source: navigator.onLine ? 'cloud' : 'offline'
      };
    } catch (error) {
      console.error('Error getting note:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get all notes (merges offline and online)
  static async getAllNotes(userId) {
    try {
      const offlineNotes = this.getOfflineNotes().map(note => ({
        ...note,
        source: 'offline'
      }));
      
      let cloudNotes = [];
      
      // If online, get notes from Firestore
      if (navigator.onLine) {
        try {
          const notesRef = collection(db, 'users', userId, 'notes');
          const notesSnap = await getDocs(notesRef);
          
          cloudNotes = notesSnap.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate().toISOString() : data.lastUpdated,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
              source: 'cloud'
            };
          });
          
          // Filter out offline notes that have cloud versions
          const cloudIds = cloudNotes.map(note => note.id);
          const localOnlyNotes = offlineNotes.filter(note => 
            this.isLocalId(note.id) || !cloudIds.includes(note.id)
          );
          
          // Merge cloud and local-only notes
          const mergedNotes = [...cloudNotes, ...localOnlyNotes];
          
          return {
            success: true,
            data: mergedNotes,
            source: 'merged'
          };
        } catch (error) {
          console.error('Error getting cloud notes:', error);
          // Fall back to offline notes on error
          return {
            success: true,
            data: offlineNotes,
            source: 'offline-fallback'
          };
        }
      }
      
      // If offline, just return offline notes
      return {
        success: true,
        data: offlineNotes,
        source: 'offline-only'
      };
    } catch (error) {
      console.error('Error getting all notes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Save a note (dispatches to appropriate method based on network status)
  static async saveNote(userId, noteData) {
    try {
      const isNewNote = !noteData.id;
      const isLocalId = noteData.id && this.isLocalId(noteData.id);
      
      // If online and not a local ID, save directly to Firestore
      if (navigator.onLine && !isLocalId) {
        if (isNewNote) {
          return await this.createNoteInFirestore(userId, noteData);
        } else {
          return await this.updateNoteInFirestore(userId, noteData.id, noteData);
        }
      }
      
      // Otherwise save offline
      return this.saveNoteOffline(noteData);
    } catch (error) {
      console.error('Error saving note:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Create a new note
  static async createNote(userId, noteData) {
    return this.saveNote(userId, noteData);
  }
  
  // Update an existing note
  static async updateNote(userId, noteId, noteData) {
    return this.saveNote(userId, { ...noteData, id: noteId });
  }
  
  // Initialize sync listener
  static initSync() {
    // Sync when online
    window.addEventListener('online', () => {
      if (auth.currentUser) {
        this.syncAllOfflineNotes(auth.currentUser.uid);
      }
    });
    
    // Also sync on auth state change
    auth.onAuthStateChanged((user) => {
      if (user && navigator.onLine) {
        this.syncAllOfflineNotes(user.uid);
      }
    });
  }
}

// Initialize sync listener
NotesService.initSync();

export default NotesService;