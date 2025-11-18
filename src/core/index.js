/**
 * Core Module - Public API
 * 
 * Exports core services, configuration, and state management
 * that forms the foundation of the application.
 */

// Configuration exports
export { db } from './config/firebase.config.js';

// Service exports
export { getNotesRepository } from './services/notes/NotesRepository.js';
export { default as NotesService } from './services/notes/NotesService.js';
export { SyncEngine } from './services/notes/SyncEngine.js';

// Storage exports
export { StorageAdapter } from './services/storage/StorageAdapter.js';
export { LocalStorageAdapter } from './services/storage/LocalStorageAdapter.js';
export { FirestoreAdapter } from './services/storage/FirestoreAdapter.js';

// State exports (Context)
export { AuthProvider, useAuth } from './state/AuthContext.jsx';
export { NotesProvider, useNotes } from './state/NotesContext.jsx';
export { ThemeProvider, useTheme as useThemeContext } from './state/ThemeContext.jsx';
export { FontProvider, useFont } from './state/FontContext.jsx';
