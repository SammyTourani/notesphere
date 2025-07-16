/**
 * Smart Cache Implementation
 * PHASE 1: Enhanced caching with statistics and memory management
 */

import type { CacheStats } from './types.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

export class SmartCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private stats = {
    hits: 0,
    misses: 0
  };

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Get an item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (entry) {
      entry.hits++;
      this.stats.hits++;
      return entry.data;
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Set an item in cache
   */
  set(key: string, value: T): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      this._evictOldest();
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove an item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: hitRate
    };
  }

  /**
   * Get cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache values
   */
  values(): T[] {
    return Array.from(this.cache.values()).map(entry => entry.data);
  }

  /**
   * Get cache entries
   */
  entries(): [string, T][] {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.data]);
  }

  /**
   * Evict the oldest entry from cache
   */
  private _evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Evict entries older than specified time
   */
  evictOlderThan(maxAge: number): number {
    const now = Date.now();
    let evictedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
        evictedCount++;
      }
    }

    return evictedCount;
  }

  /**
   * Get memory usage estimate (rough calculation)
   */
  getMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Rough estimate: key length + value size + overhead
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 100; // Entry overhead
    }
    
    return totalSize;
  }
}
