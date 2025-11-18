/**
 * Editor Feature - Public API
 * 
 * Exports all public-facing components, hooks, and services
 * for the rich text editor feature.
 */

// Core component exports
export { default as TipTapEditor } from './core/TipTapEditor.jsx';
export { default as EditorToolbar } from './core/EditorToolbar.jsx';

// Plugin exports
export { default as WordCountDisplay } from './plugins/WordCountDisplay.jsx';

// Hook exports
export { useTipTapEditor } from './hooks/useTipTapEditor.js';

// Extension exports
export { default as GrammarExtension } from './extensions/GrammarExtension.js';
