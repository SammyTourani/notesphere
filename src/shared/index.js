/**
 * Shared Module - Public API
 * 
 * Exports all shared components, hooks, and utilities
 * that can be used across the application.
 */

// Layout components
export { default as PageTransition } from './components/layout/PageTransition.jsx';
export { default as ErrorBoundary } from './components/layout/ErrorBoundary.jsx';
export { default as SlideInMenu } from './components/layout/SlideInMenu.jsx';

// Feedback components
export { default as SavePrompt } from './components/feedback/SavePrompt.jsx';
export { default as GuestBanner } from './components/feedback/GuestBanner.jsx';
export { default as MergeOptions } from './components/feedback/MergeOptions.jsx';

// Hooks
export { default as useTheme } from './hooks/useTheme.js';

// Utilities
export { createLogger } from './utils/logger.js';
export * from './utils/noteUtils.js';
