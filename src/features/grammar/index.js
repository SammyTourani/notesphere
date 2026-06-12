/**
 * Grammar Feature - Public API
 * 
 * Exports all public-facing components, hooks, and services
 * for the grammar checking feature.
 */

// Core exports
export { getUnifiedGrammarController } from './core/GrammarController.js';

// Component exports
export { default as GrammarInsights } from './components/GrammarInsights.jsx';
export { default as GrammarHighlighter } from './components/GrammarHighlighter.jsx';

// Hook exports
export { useGrammarIntegration } from './hooks/useGrammarIntegration.js';

// Service exports
export { createCommandBasedReplacer } from './services/ReplacementService.js';

// Extension exports
export { default as GrammarExtension, registerGrammarAssistantCallbacks, updateGrammarDecorations } from '../editor/extensions/GrammarExtension.js';
