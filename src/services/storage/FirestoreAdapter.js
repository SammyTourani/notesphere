/**
 * Firestore Adapter
 * Implements StorageAdapter for Firebase Firestore
 * Handles cloud storage with user authentication
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { StorageAdapter } from './StorageAdapter.js';
import { db } from '../../firebaseConfig';
import { createLogger } from '../../utils/logger';

const logger = createLogger('FirestoreAdapter');

export class FirestoreAdapter extends StorageAdapter {
  constructor(userId) {
    super();
    if (!userId) {
      throw new Error('userId is required for FirestoreAdapter');
    }
    this.userId = userId;
    this.collectionName = 'notes';
  }

  async initialize() {
    return true;
  }

  async getAllNotes(filter = {}) {
    try {
      const notesRef = collection(db, this.collectionName);
      let q = query(notesRef, where('userId', '==', this.userId));

      if (filter.deleted === false) {
        q = query(q, where('deleted', '==', false));
      } else if (filter.deleted === true) {
        q = query(q, where('deleted', '==', true));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error getting notes from Firestore:', error);
      throw error;
    }
  }

  async getNote(noteId) {
    try {
      const noteRef = doc(db, this.collectionName, noteId);
      const noteSnap = await getDoc(noteRef);

      if (!noteSnap.exists()) {
        return null;
      }

      const noteData = { id: noteSnap.id, ...noteSnap.data() };
      
      // Security: Verify ownership
      if (noteData.userId !== this.userId) {
        throw new Error('Unauthorized access to note');
      }

      return noteData;
    } catch (error) {
      logger.error(`Error getting note ${noteId}:`, error);
      throw error;
    }
  }

  async createNote(noteData) {
    try {
      const notesRef = collection(db, this.collectionName);
      
      const newNote = {
        ...noteData,
        userId: this.userId,
        created: noteData.created || serverTimestamp(),
        lastUpdated: serverTimestamp(),
        deleted: false
      };

      const docRef = await addDoc(notesRef, newNote);
      
      return {
        id: docRef.id,
        ...newNote
      };
    } catch (error) {
      logger.error('Error creating note in Firestore:', error);
      throw error;
    }
  }

  async updateNote(noteId, updates) {
    try {
      const noteRef = doc(db, this.collectionName, noteId);
      
      // Security: Verify ownership before updating
      const noteSnap = await getDoc(noteRef);
      if (!noteSnap.exists() || noteSnap.data().userId !== this.userId) {
        throw new Error('Note not found or unauthorized');
      }

      const updateData = {
        ...updates,
        lastUpdated: serverTimestamp()
      };

      await updateDoc(noteRef, updateData);
      
      return {
        id: noteId,
        ...noteSnap.data(),
        ...updates
      };
    } catch (error) {
      logger.error(`Error updating note ${noteId}:`, error);
      throw error;
    }
  }

  async deleteNote(noteId) {
    try {
      const noteRef = doc(db, this.collectionName, noteId);
      
      const noteSnap = await getDoc(noteRef);
      if (!noteSnap.exists() || noteSnap.data().userId !== this.userId) {
        throw new Error('Note not found or unauthorized');
      }

      await updateDoc(noteRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      logger.error(`Error deleting note ${noteId}:`, error);
      throw error;
    }
  }

  async permanentlyDeleteNote(noteId) {
    try {
      const noteRef = doc(db, this.collectionName, noteId);
      
      const noteSnap = await getDoc(noteRef);
      if (!noteSnap.exists() || noteSnap.data().userId !== this.userId) {
        throw new Error('Note not found or unauthorized');
      }

      await deleteDoc(noteRef);
      return true;
    } catch (error) {
      logger.error(`Error permanently deleting note ${noteId}:`, error);
      throw error;
    }
  }

  async getTrashedNotes() {
    try {
      const notesRef = collection(db, this.collectionName);
      const q = query(
        notesRef,
        where('userId', '==', this.userId),
        where('deleted', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error getting trashed notes:', error);
      throw error;
    }
  }

  async restoreNote(noteId) {
    try {
      const noteRef = doc(db, this.collectionName, noteId);
      
      const noteSnap = await getDoc(noteRef);
      if (!noteSnap.exists() || noteSnap.data().userId !== this.userId) {
        throw new Error('Note not found or unauthorized');
      }

      await updateDoc(noteRef, {
        deleted: false,
        deletedAt: null
      });
      
      return true;
    } catch (error) {
      logger.error(`Error restoring note ${noteId}:`, error);
      throw error;
    }
  }

  async emptyTrash() {
    try {
      const trashedNotes = await this.getTrashedNotes();
      const deletePromises = trashedNotes.map(note => 
        this.permanentlyDeleteNote(note.id)
      );
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      logger.error('Error emptying trash:', error);
      throw error;
    }
  }

  async togglePin(noteId) {
    try {
      const noteRef = doc(db, this.collectionName, noteId);
      
      const noteSnap = await getDoc(noteRef);
      if (!noteSnap.exists() || noteSnap.data().userId !== this.userId) {
        throw new Error('Note not found or unauthorized');
      }

      const currentPinned = noteSnap.data().pinned || false;
      
      await updateDoc(noteRef, {
        pinned: !currentPinned
      });
      
      return !currentPinned;
    } catch (error) {
      logger.error(`Error toggling pin for note ${noteId}:`, error);
      throw error;
    }
  }

  supportsSync() {
    return true;
  }

  getType() {
    return 'firestore';
  }
}

export default FirestoreAdapter;
