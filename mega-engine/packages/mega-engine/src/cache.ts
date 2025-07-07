/**
 * Intelligent caching system for grammar checking results
 */

import type { CacheEntry, CacheStats } from './types.js';

export class SmartCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize = 1000, defaultTtl = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  /**
   * Store a value in the cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      hits: 0
    };

    // Remove expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
      
      // If still full, remove least recently used
      if (this.cache.size >= this.maxSize) {
        const lruKey = this.getLeastRecentlyUsed();
        if (lruKey) {
          this.cache.delete(lruKey);
        }
      }
    }

    this.cache.set(key, entry);
  }

  /**
   * Retrieve a value from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.defaultTtl) {
      this.cache.delete(key);
      return null;
    }

    // Update access count
    entry.hits++;
    
    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTtl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Find the least recently used entry
   */
  private getLeastRecentlyUsed(): string | null {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < lruTime) {
        lruTime = entry.timestamp;
        lruKey = key;
      }
    }

    return lruKey;
  }

  /**
   * Generate a cache key from text and options
   */
  static generateKey(text: string, options?: Record<string, any>): string {
    const textHash = text.length > 200 
      ? text.substring(0, 100) + text.substring(text.length - 100)
      : text;
    
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${textHash.length}:${textHash}:${optionsStr}`;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalHits = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.hits, 0);
    
    const totalRequests = totalHits + this.cache.size; // Rough estimate
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 chars
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 64; // Estimated overhead
    }
    
    return totalSize;
  }
}
