/**
 * Application Configuration
 * 
 * Central configuration file for application-wide settings
 */

export const APP_CONFIG = {
  // Application metadata
  name: 'NoteSphere',
  version: '2.0.0',
  description: 'Your intelligent note-taking companion',
  
  // Feature flags
  features: {
    grammarChecking: true,
    offlineMode: true,
    guestMode: true,
    autoSave: true,
    darkMode: true,
  },
  
  // Editor settings
  editor: {
    autoSaveDelay: 2000, // ms
    debounceTime: 300,   // ms
    maxUndoLevels: 100,
  },
  
  // Grammar settings
  grammar: {
    defaultTier: 1,
    debounceTime: 1000,
    maxIssues: 100,
  },
  
  // Storage settings
  storage: {
    cacheTimeout: 300000, // 5 minutes
    maxCacheSize: 1000,
  },
  
  // UI settings
  ui: {
    animationDuration: 300,
    toastDuration: 3000,
  },
};

export default APP_CONFIG;
