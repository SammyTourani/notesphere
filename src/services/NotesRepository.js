/**
 * NotesRepository
 * Coordinates between different storage adapters
 * Acts as the single source of truth for note operations
 */

import DOMPurify from 'dompurify';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter';
import { FirestoreAdapter } from './storage/FirestoreAdapter';
import { createLogger } from '../utils/logger';

const logger = createLogger('NotesRepository');

export class NotesRepository {
  constructor() {
    this.adapter = null;
    this.localAdapter = new LocalStorageAdapter('localNotes');
    this.guestAdapter = new LocalStorageAdapter('guestNotes');
    this.firestoreAdapter = null;
  }

  /**
   * Initialize repository with appropriate adapter
   * @param {Object} options - Configuration options
   * @param {Object} options.db - Firebase database instance
   * @param {string} options.userId - Current user ID (null for guest)
   * @param {boolean} options.isGuestMode - Guest mode flag
   */
  async initialize({ db, userId, isGuestMode }) {
    try {
      if (isGuestMode) {
        // Guest mode: use guest localStorage
        this.adapter = this.guestAdapter;
        await this.adapter.initialize();
        return { success: true, type: 'guest' };
      }

      if (userId && db) {
        // Authenticated user: use Firestore
        this.firestoreAdapter = new FirestoreAdapter(userId);
        this.adapter = this.firestoreAdapter;
        await this.adapter.initialize();
        return { success: true, type: 'firestore' };
      }

      // Fallback: use localStorage
      this.adapter = this.localAdapter;
      await this.adapter.initialize();
      return { success: true, type: 'localStorage' };

    } catch (error) {
      logger.error('Repository initialization failed:', error);
      // Fallback to localStorage if everything fails
      this.currentAdapter = new LocalStorageAdapter('emergencyNotes');
      return false;
    }
  }

  /**
   * Get all active notes
   * @returns {Promise<Array>}
   */
  async getAllNotes() {
    this._ensureInitialized();
    return await this.adapter.getAllNotes({ deleted: false });
  }

  /**
   * Get a specific note
   * @param {string} noteId
   * @returns {Promise<Object|null>}
   */
  async getNote(noteId) {
    this._ensureInitialized();
    return await this.adapter.getNote(noteId);
  }

  /**
   * Create a new note
   * @param {Object} noteData
   * @returns {Promise<Object>}
   */
  async createNote(noteData) {
    this._ensureInitialized();
    return await this.adapter.createNote(noteData);
  }

  /**
   * Update an existing note
   * @param {string} noteId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateNote(noteId, updates) {
    this._ensureInitialized();
    return await this.adapter.updateNote(noteId, updates);
  }

  /**
   * Move note to trash
   * @param {string} noteId
   * @returns {Promise<boolean>}
   */
  async deleteNote(noteId) {
    this._ensureInitialized();
    return await this.adapter.deleteNote(noteId);
  }

  /**
   * Permanently delete note
   * @param {string} noteId
   * @returns {Promise<boolean>}
   */
  async permanentlyDeleteNote(noteId) {
    this._ensureInitialized();
    return await this.adapter.permanentlyDeleteNote(noteId);
  }

  /**
   * Get all trashed notes
   * @returns {Promise<Array>}
   */
  async getTrashedNotes() {
    this._ensureInitialized();
    return await this.adapter.getTrashedNotes();
  }

  /**
   * Restore note from trash
   * @param {string} noteId
   * @returns {Promise<boolean>}
   */
  async restoreNote(noteId) {
    this._ensureInitialized();
    return await this.adapter.restoreNote(noteId);
  }

  /**
   * Empty trash
   * @returns {Promise<boolean>}
   */
  async emptyTrash() {
    this._ensureInitialized();
    return await this.adapter.emptyTrash();
  }

  /**
   * Toggle pin status
   * @param {string} noteId
   * @returns {Promise<boolean>}
   */
  async togglePin(noteId) {
    this._ensureInitialized();
    return await this.adapter.togglePin(noteId);
  }

  /**
   * Get storage type
   * @returns {string}
   */
  getStorageType() {
    return this.adapter ? this.adapter.getType() : 'none';
  }

  /**
   * Check if current adapter supports sync
   * @returns {boolean}
   */
  supportsSync() {
    return this.adapter ? this.adapter.supportsSync() : false;
  }

  /**
   * Sanitize HTML content
   * @param {string} html
   * @returns {string}
   */
  sanitizeHtml(html) {
    if (!html) return '';
    // Basic sanitization to remove potentially harmful script tags
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  /**
   * Get local storage notes (for syncing)
   * @returns {Array}
   */
  getLocalNotes() {
    try {
      const stored = localStorage.getItem('localNotes');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Error loading local notes:', error);
      return [];
    }
  }

  /**
   * Clear local notes after sync
   */
  clearLocalNotes() {
    localStorage.removeItem('localNotes');
  }

  // Private methods
  _ensureInitialized() {
    if (!this.adapter) {
      throw new Error('Repository not initialized. Call initialize() first.');
    }
  }
}

// Singleton instance
let repositoryInstance = null;

export function getNotesRepository() {
  if (!repositoryInstance) {
    repositoryInstance = new NotesRepository();
  }
  return repositoryInstance;
}

export default NotesRepository;
