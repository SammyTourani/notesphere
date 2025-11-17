/**
 * LocalStorage Adapter
 * Stores notes in browser's localStorage
 * Used for offline storage and guest mode
 */

import { StorageAdapter } from './StorageAdapter.js';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../utils/logger';

const logger = createLogger('LocalStorageAdapter');

export class LocalStorageAdapter extends StorageAdapter {
  constructor(storageKey = 'localNotes') {
    super();
    this.storageKey = storageKey;
    this.trashedKey = `${storageKey}_trashed`;
  }

  async initialize() {
    // LocalStorage is synchronous, nothing to initialize
    return true;
  }

  async getAllNotes(filter = {}) {
    const notes = this._loadNotes();
    
    if (filter.deleted === false) {
      return notes.filter(note => !note.deleted);
    }
    if (filter.deleted === true) {
      return notes.filter(note => note.deleted);
    }
    
    return notes;
  }

  async getNote(noteId) {
    const notes = this._loadNotes();
    return notes.find(note => note.id === noteId) || null;
  }

  async createNote(noteData) {
    const notes = this._loadNotes();
    
    const newNote = {
      id: noteData.id || uuidv4(),
      title: noteData.title || '',
      content: noteData.content || '',
      created: noteData.created || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      deleted: false,
      pinned: false,
      ...noteData
    };

    notes.push(newNote);
    this._saveNotes(notes);
    
    return newNote;
  }

  async updateNote(noteId, updates) {
    const notes = this._loadNotes();
    const index = notes.findIndex(note => note.id === noteId);
    
    if (index === -1) {
      throw new Error(`Note ${noteId} not found`);
    }

    notes[index] = {
      ...notes[index],
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    this._saveNotes(notes);
    return notes[index];
  }

  async deleteNote(noteId) {
    const notes = this._loadNotes();
    const note = notes.find(n => n.id === noteId);
    
    if (!note) {
      throw new Error(`Note ${noteId} not found`);
    }

    note.deleted = true;
    note.deletedAt = new Date().toISOString();
    this._saveNotes(notes);
    
    return true;
  }

  async permanentlyDeleteNote(noteId) {
    const notes = this._loadNotes();
    const filteredNotes = notes.filter(note => note.id !== noteId);
    
    if (notes.length === filteredNotes.length) {
      throw new Error(`Note ${noteId} not found`);
    }

    this._saveNotes(filteredNotes);
    return true;
  }

  async getTrashedNotes() {
    const notes = this._loadNotes();
    return notes.filter(note => note.deleted);
  }

  async restoreNote(noteId) {
    const notes = this._loadNotes();
    const note = notes.find(n => n.id === noteId);
    
    if (!note) {
      throw new Error(`Note ${noteId} not found`);
    }

    note.deleted = false;
    delete note.deletedAt;
    this._saveNotes(notes);
    
    return true;
  }

  async emptyTrash() {
    const notes = this._loadNotes();
    const activeNotes = notes.filter(note => !note.deleted);
    this._saveNotes(activeNotes);
    return true;
  }

  async togglePin(noteId) {
    const notes = this._loadNotes();
    const note = notes.find(n => n.id === noteId);
    
    if (!note) {
      throw new Error(`Note ${noteId} not found`);
    }

    note.pinned = !note.pinned;
    this._saveNotes(notes);
    
    return note.pinned;
  }

  supportsSync() {
    return false;
  }

  getType() {
    return 'localStorage';
  }

  // Private helper methods
  _loadNotes() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Error loading notes from localStorage:', error);
      return [];
    }
  }

  _saveNotes(notes) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(notes));
    } catch (error) {
      logger.error('Error saving notes to localStorage:', error);
      throw error;
    }
  }

  async clear() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.trashedKey);
  }
}

export default LocalStorageAdapter;
