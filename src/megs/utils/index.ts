/**
 * Utility functions for MEGS
 */

/**
 * Generate a unique ID for grammar issues
 */
export function generateId(prefix: string = 'megs'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a canonical signature for an issue to help with deduplication
 * Combines span range and normalized message
 */
export function createCanonicalSignature(
  start: number,
  end: number,
  message: string
): string {
  // Normalize the message by removing punctuation, extra spaces, and converting to lowercase
  const normalizedMessage = message
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return `${start}-${end}-${normalizedMessage}`;
}

/**
 * Calculate the overlap percentage between two text ranges
 */
export function calculateOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): number {
  // No overlap
  if (end1 <= start2 || end2 <= start1) {
    return 0;
  }
  
  // Calculate overlap
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  const overlapLength = overlapEnd - overlapStart;
  
  // Calculate the percentage relative to the shorter range
  const length1 = end1 - start1;
  const length2 = end2 - start2;
  const shorterLength = Math.min(length1, length2);
  
  return (overlapLength / shorterLength) * 100;
}

/**
 * Split text into sentences for more efficient processing and caching
 */
export function splitIntoSentences(text: string): string[] {
  // Simple sentence splitting - can be improved with NLP libraries
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .filter(sentence => sentence.trim().length > 0);
}

/**
 * Calculate the diff between two texts at the sentence level
 * Returns the indices of sentences that have changed
 */
export function sentenceLevelDiff(oldText: string, newText: string): number[] {
  const oldSentences = splitIntoSentences(oldText);
  const newSentences = splitIntoSentences(newText);
  const changedIndices: number[] = [];
  
  // Find changed sentences
  const maxLength = Math.max(oldSentences.length, newSentences.length);
  
  for (let i = 0; i < maxLength; i++) {
    const oldSentence = i < oldSentences.length ? oldSentences[i] : null;
    const newSentence = i < newSentences.length ? newSentences[i] : null;
    
    // If either sentence is missing or they're different, mark as changed
    if (oldSentence !== newSentence) {
      changedIndices.push(i);
    }
  }
  
  return changedIndices;
}

/**
 * Calculate a cache key for text content
 */
export function calculateCacheKey(text: string, options?: Record<string, any>): string {
  // Create a hash of the text content
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Add options to the key if provided
  let optionsStr = '';
  if (options) {
    optionsStr = Object.entries(options)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
      .join('|');
  }
  
  return `${hash}-${optionsStr}`;
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * Detect the language of a text
 * This is a simple implementation that should be replaced with a more robust solution
 */
export function detectLanguage(text: string): string {
  // This is a very naive implementation
  // In a real implementation, use a proper language detection library
  
  // Count common words in different languages
  const englishWords = ['the', 'and', 'is', 'in', 'to', 'it', 'that', 'was', 'for'];
  const spanishWords = ['el', 'la', 'es', 'en', 'y', 'que', 'por', 'un', 'una'];
  const frenchWords = ['le', 'la', 'est', 'et', 'en', 'que', 'pour', 'un', 'une'];
  
  const lowerText = text.toLowerCase();
  let englishCount = 0;
  let spanishCount = 0;
  let frenchCount = 0;
  
  // Count occurrences of common words
  englishWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) {
      englishCount += matches.length;
    }
  });
  
  spanishWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) {
      spanishCount += matches.length;
    }
  });
  
  frenchWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) {
      frenchCount += matches.length;
    }
  });
  
  // Determine the most likely language
  if (englishCount > spanishCount && englishCount > frenchCount) {
    return 'en';
  } else if (spanishCount > englishCount && spanishCount > frenchCount) {
    return 'es';
  } else if (frenchCount > englishCount && frenchCount > spanishCount) {
    return 'fr';
  }
  
  // Default to English if no clear winner
  return 'en';
}