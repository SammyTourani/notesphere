/**
 * Note Utilities
 * Extracted helper functions for note rendering
 * Optimized for performance with memoization
 */

// Cache for theme calculations
const themeCache = new Map();
const CACHE_SIZE = 100;

/**
 * Get deterministic theme for a note based on its ID
 * Cached for performance
 */
export const getNoteTheme = (noteId) => {
  if (themeCache.has(noteId)) {
    return themeCache.get(noteId);
  }

  // Generate consistent hash from noteId
  let hash = 0;
  for (let i = 0; i < noteId.length; i++) {
    hash = ((hash << 5) - hash) + noteId.charCodeAt(i);
    hash = hash & hash;
  }
  
  const themeIndex = Math.abs(hash) % noteThemes.length;
  const theme = noteThemes[themeIndex];

  // Cache management - remove oldest if too large
  if (themeCache.size >= CACHE_SIZE) {
    const firstKey = themeCache.keys().next().value;
    themeCache.delete(firstKey);
  }
  
  themeCache.set(noteId, theme);
  return theme;
};

/**
 * Note theme definitions - optimized gradients
 */
export const noteThemes = [
  {
    name: 'Purple Dream',
    bg: 'bg-white dark:bg-gray-800',
    accentStyle: {
      backgroundImage: 'linear-gradient(135deg, hsl(260, 80%, 65%) 0%, hsl(290, 70%, 60%) 100%)'
    }
  },
  {
    name: 'Ocean Blue',
    bg: 'bg-white dark:bg-gray-800',
    accentStyle: {
      backgroundImage: 'linear-gradient(135deg, hsl(200, 85%, 55%) 0%, hsl(220, 80%, 60%) 100%)'
    }
  },
  {
    name: 'Sunset Orange',
    bg: 'bg-white dark:bg-gray-800',
    accentStyle: {
      backgroundImage: 'linear-gradient(135deg, hsl(25, 85%, 60%) 0%, hsl(340, 75%, 60%) 100%)'
    }
  },
  {
    name: 'Forest Green',
    bg: 'bg-white dark:bg-gray-800',
    accentStyle: {
      backgroundImage: 'linear-gradient(135deg, hsl(145, 70%, 50%) 0%, hsl(165, 65%, 50%) 100%)'
    }
  },
  {
    name: 'Rose Pink',
    bg: 'bg-white dark:bg-gray-800',
    accentStyle: {
      backgroundImage: 'linear-gradient(135deg, hsl(330, 75%, 65%) 0%, hsl(350, 70%, 60%) 100%)'
    }
  },
  {
    name: 'Cyber Teal',
    bg: 'bg-white dark:bg-gray-800',
    accentStyle: {
      backgroundImage: 'linear-gradient(135deg, hsl(175, 70%, 55%) 0%, hsl(190, 75%, 50%) 100%)'
    }
  },
  {
    name: 'Golden Hour',
    bg: 'bg-white dark:bg-gray-800',
    accentStyle: {
      backgroundImage: 'linear-gradient(135deg, hsl(40, 85%, 60%) 0%, hsl(20, 80%, 60%) 100%)'
    }
  },
  {
    name: 'Lavender Mist',
    bg: 'bg-white dark:bg-gray-800',
    accentStyle: {
      backgroundImage: 'linear-gradient(135deg, hsl(270, 60%, 70%) 0%, hsl(250, 65%, 65%) 100%)'
    }
  }
];

/**
 * Get icon for note based on content
 * Simplified and optimized
 */
export const getNoteIcon = (note) => {
  const content = `${note.title} ${note.content}`.toLowerCase();
  
  // Quick checks for common categories
  if (content.includes('meeting') || content.includes('discussion')) return '💼';
  if (content.includes('idea') || content.includes('brainstorm')) return '💡';
  if (content.includes('todo') || content.includes('task')) return '✅';
  if (content.includes('code') || content.includes('programming')) return '💻';
  if (content.includes('book') || content.includes('reading')) return '📚';
  if (content.includes('shopping') || content.includes('buy')) return '🛒';
  if (content.includes('travel') || content.includes('trip')) return '✈️';
  if (content.includes('health') || content.includes('fitness')) return '💪';
  if (content.includes('recipe') || content.includes('cooking')) return '🍳';
  if (content.includes('music') || content.includes('song')) return '🎵';
  
  // Default icons by hash
  const hash = Math.abs(note.id.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
  const icons = ['📝', '📄', '📋', '📌', '✏️', '🗒️', '📑'];
  return icons[hash % icons.length];
};

/**
 * Get human-readable time since last update
 * Optimized with quick returns
 */
export const getTimeSince = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  
  // Quick returns for common cases
  if (diffMs < 60000) return 'Just now'; // < 1 minute
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`; // < 1 hour
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`; // < 1 day
  if (diffMs < 604800000) return `${Math.floor(diffMs / 86400000)}d ago`; // < 1 week
  
  return new Date(timestamp).toLocaleDateString();
};

/**
 * Filter and sort notes efficiently
 */
export const filterAndSortNotes = (notes, searchText) => {
  if (!notes || notes.length === 0) return { pinned: [], unpinned: [] };
  
  // Filter by search text if provided
  let filtered = notes;
  if (searchText && searchText.trim()) {
    const search = searchText.toLowerCase().trim();
    filtered = notes.filter(note => 
      note.title?.toLowerCase().includes(search) ||
      note.content?.toLowerCase().includes(search)
    );
  }
  
  // Split into pinned and unpinned
  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);
  
  // Sort both by lastUpdated (most recent first)
  const sortByDate = (a, b) => {
    const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
    const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
    return dateB - dateA;
  };
  
  return {
    pinned: pinned.sort(sortByDate),
    unpinned: unpinned.sort(sortByDate)
  };
};

/**
 * Generate personalized greeting
 * Simplified version with caching
 */
const greetingCache = new Map();

export const getPersonalizedGreeting = (currentUser, notes, isGuestMode) => {
  const hour = new Date().getHours();
  const today = new Date().toDateString();
  const cacheKey = `${currentUser?.uid || 'guest'}-${today}-${notes?.length || 0}`;
  
  if (greetingCache.has(cacheKey)) {
    return greetingCache.get(cacheKey);
  }
  
  // Time-based greeting
  let timeGreeting = "Good morning";
  if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
  else if (hour >= 17 && hour < 22) timeGreeting = "Good evening";
  else if (hour >= 22 || hour < 6) timeGreeting = "Working late";
  
  // Get user name
  const userName = currentUser?.displayName || 
    (currentUser?.email ? currentUser.email.split('@')[0] : null);
  
  const displayName = userName || (isGuestMode ? 'explorer' : 'there');
  
  // Guest mode greeting
  if (isGuestMode) {
    const greeting = {
      title: `Welcome, ${displayName}! 🚀`,
      subtitle: 'Take a spin and see what NoteSphere can do'
    };
    greetingCache.set(cacheKey, greeting);
    return greeting;
  }
  
  // Check note count
  const noteCount = notes?.length || 0;
  
  // Milestone greetings
  if (noteCount === 0) {
    const greeting = {
      title: `${timeGreeting}, ${displayName}!`,
      subtitle: 'Ready to capture your first brilliant idea?'
    };
    greetingCache.set(cacheKey, greeting);
    return greeting;
  }
  
  if (noteCount === 10) {
    const greeting = {
      title: `Double digits, ${displayName}! 🎊`,
      subtitle: '10 notes! You\'re really getting into the flow'
    };
    greetingCache.set(cacheKey, greeting);
    return greeting;
  }
  
  // Default greeting
  const greeting = {
    title: `${timeGreeting}, ${displayName}!`,
    subtitle: `You have ${noteCount} ${noteCount === 1 ? 'note' : 'notes'}`
  };
  
  greetingCache.set(cacheKey, greeting);
  return greeting;
};

/**
 * Clear caches (call on logout or when needed)
 */
export const clearNoteCaches = () => {
  themeCache.clear();
  greetingCache.clear();
};
