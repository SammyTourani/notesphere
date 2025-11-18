/**
 * Notes Feature - Public API
 * 
 * Exports all public-facing components, hooks, and services
 * for the notes management feature.
 */

// Component exports
export { default as NoteCard } from './components/NoteCard.jsx';
export { default as NotesList } from './components/NotesList.jsx';
export { default as TrashView } from './components/TrashView.jsx';
export { default as PinButton } from './components/PinButton.jsx';
export { default as DeleteModal } from './components/DeleteModal.jsx';

// Page exports
export { default as NoteEditorPage } from './pages/NoteEditorPage.jsx';

// Hook exports
export { useNoteEditor } from './hooks/useNoteEditor.js';
export { useAutoSave } from './hooks/useAutoSave.js';
