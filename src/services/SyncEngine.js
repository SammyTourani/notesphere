/**
 * SyncEngine
 * Handles synchronization between local and cloud storage
 * Manages merge conflicts and offline operations
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('SyncEngine');

export class SyncEngine {
  constructor(repository) {
    this.repository = repository;
    this.isSyncing = false;
    this.syncQueue = [];
  }

  /**
   * Sync local notes to Firestore when user logs in
   * @returns {Promise<Object>} Sync results
   */
  async syncLocalNotesToFirestore() {
    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress' };
    }

    if (this.repository.getStorageType() !== 'firestore') {
      return { success: false, error: 'Not using Firestore storage' };
    }

    this.isSyncing = true;

    try {
      const localNotes = this.repository.getLocalNotes();
      
      if (localNotes.length === 0) {
        this.isSyncing = false;
        return { success: true, synced: 0, message: 'No local notes to sync' };
      }

      const syncResults = {
        success: true,
        synced: 0,
        failed: 0,
        errors: []
      };

      // Sync each local note to Firestore
      for (const note of localNotes) {
        try {
          // Check if note already exists in Firestore
          const existingNote = await this.repository.getNote(note.id);

          if (existingNote) {
            // Note exists, update if local is newer
            const localTime = new Date(note.lastUpdated).getTime();
            const remoteTime = new Date(existingNote.lastUpdated).getTime();

            if (localTime > remoteTime) {
              await this.repository.updateNote(note.id, {
                title: note.title,
                content: note.content,
                pinned: note.pinned
              });
              syncResults.synced++;
            }
          } else {
            // Note doesn't exist, create it
            await this.repository.createNote(note);
            syncResults.synced++;
          }
        } catch (error) {
          syncResults.failed++;
          syncResults.errors.push({
            noteId: note.id,
            error: error.message
          });
        }
      }

      // Clear local notes after successful sync
      if (syncResults.synced > 0 && syncResults.failed === 0) {
        this.repository.clearLocalNotes();
      }

      this.isSyncing = false;
      return syncResults;

    } catch (error) {
      this.isSyncing = false;
      logger.error('Sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect merge conflicts between local and remote notes
   * @returns {Promise<Array>} Array of conflicts
   */
  async detectMergeConflicts() {
    if (this.repository.getStorageType() !== 'firestore') {
      return [];
    }

    const localNotes = this.repository.getLocalNotes();
    const conflicts = [];

    for (const localNote of localNotes) {
      try {
        const remoteNote = await this.repository.getNote(localNote.id);

        if (remoteNote) {
          const localTime = new Date(localNote.lastUpdated).getTime();
          const remoteTime = new Date(remoteNote.lastUpdated).getTime();
          const timeDiff = Math.abs(localTime - remoteTime);

          // If notes were edited within 1 minute of each other and content differs
          if (timeDiff < 60000 && localNote.content !== remoteNote.content) {
            conflicts.push({
              noteId: localNote.id,
              localNote,
              remoteNote,
              timeDiff
            });
          }
        }
      } catch (error) {
        logger.error(`Error checking conflict for note ${localNote.id}:`, error);
      }
    }

    return conflicts;
  }

  /**
   * Resolve merge conflict
   * @param {string} noteId - Note ID
   * @param {string} resolution - 'local' or 'remote'
   * @returns {Promise<boolean>}
   */
  async resolveMergeConflict(noteId, resolution) {
    const localNotes = this.repository.getLocalNotes();
    const localNote = localNotes.find(n => n.id === noteId);

    if (!localNote) {
      throw new Error('Local note not found');
    }

    if (resolution === 'local') {
      // Keep local version
      await this.repository.updateNote(noteId, {
        title: localNote.title,
        content: localNote.content,
        pinned: localNote.pinned
      });
    }
    // If 'remote', do nothing - remote is already in Firestore

    // Remove from local storage
    const updatedLocalNotes = localNotes.filter(n => n.id !== noteId);
    localStorage.setItem('localNotes', JSON.stringify(updatedLocalNotes));

    return true;
  }

  /**
   * Queue an operation for sync when online
   * @param {Object} operation
   */
  queueOperation(operation) {
    this.syncQueue.push({
      ...operation,
      timestamp: Date.now()
    });
  }

  /**
   * Process sync queue
   * @returns {Promise<Object>}
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) {
      return { success: true, processed: 0 };
    }

    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    for (const operation of this.syncQueue) {
      try {
        switch (operation.type) {
          case 'create':
            await this.repository.createNote(operation.data);
            break;
          case 'update':
            await this.repository.updateNote(operation.noteId, operation.data);
            break;
          case 'delete':
            await this.repository.deleteNote(operation.noteId);
            break;
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          operation,
          error: error.message
        });
      }
    }

    // Clear processed operations
    if (results.failed === 0) {
      this.syncQueue = [];
    }

    return results;
  }

  /**
   * Get sync status
   * @returns {Object}
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      storageType: this.repository.getStorageType(),
      supportsSync: this.repository.supportsSync()
    };
  }
}

export default SyncEngine;
