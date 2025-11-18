/**
 * Storage Adapter Interface
 * Defines the contract for all storage implementations
 */

export class StorageAdapter {
  /**
   * Initialize the storage adapter
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Get all notes
   * @param {Object} filter - Optional filter criteria
   * @returns {Promise<Array>} Array of notes
   */
  async getAllNotes(filter = {}) {
    throw new Error('getAllNotes() must be implemented by subclass');
  }

  /**
   * Get a single note by ID
   * @param {string} noteId - Note ID
   * @returns {Promise<Object|null>} Note object or null
   */
  async getNote(noteId) {
    throw new Error('getNote() must be implemented by subclass');
  }

  /**
   * Create a new note
   * @param {Object} noteData - Note data
   * @returns {Promise<Object>} Created note
   */
  async createNote(noteData) {
    throw new Error('createNote() must be implemented by subclass');
  }

  /**
   * Update an existing note
   * @param {string} noteId - Note ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated note
   */
  async updateNote(noteId, updates) {
    throw new Error('updateNote() must be implemented by subclass');
  }

  /**
   * Delete a note (move to trash)
   * @param {string} noteId - Note ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteNote(noteId) {
    throw new Error('deleteNote() must be implemented by subclass');
  }

  /**
   * Permanently delete a note
   * @param {string} noteId - Note ID
   * @returns {Promise<boolean>} Success status
   */
  async permanentlyDeleteNote(noteId) {
    throw new Error('permanentlyDeleteNote() must be implemented by subclass');
  }

  /**
   * Get trashed notes
   * @returns {Promise<Array>} Array of trashed notes
   */
  async getTrashedNotes() {
    throw new Error('getTrashedNotes() must be implemented by subclass');
  }

  /**
   * Restore a note from trash
   * @param {string} noteId - Note ID
   * @returns {Promise<boolean>} Success status
   */
  async restoreNote(noteId) {
    throw new Error('restoreNote() must be implemented by subclass');
  }

  /**
   * Empty all trashed notes
   * @returns {Promise<boolean>} Success status
   */
  async emptyTrash() {
    throw new Error('emptyTrash() must be implemented by subclass');
  }

  /**
   * Toggle pin status
   * @param {string} noteId - Note ID
   * @returns {Promise<boolean>} New pin status
   */
  async togglePin(noteId) {
    throw new Error('togglePin() must be implemented by subclass');
  }

  /**
   * Check if adapter supports sync
   * @returns {boolean}
   */
  supportsSync() {
    return false;
  }

  /**
   * Get storage type identifier
   * @returns {string}
   */
  getType() {
    throw new Error('getType() must be implemented by subclass');
  }
}

export default StorageAdapter;
