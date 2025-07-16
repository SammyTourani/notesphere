/**
 * Streaming Asset Loader
 * Handles large asset loading with streaming and persistent caching
 */

import { Logger } from './logger.js';

export interface AssetCache {
  data: any;
  timestamp: number;
  size: number;
  type: 'text' | 'binary' | 'wasm';
}

export interface LoadOptions {
  useCache?: boolean;
  cacheTTL?: number; // milliseconds
  streamThreshold?: number; // bytes
  retryAttempts?: number;
}

export class StreamingAssetLoader {
  private static instance: StreamingAssetLoader | null = null;
  private logger = new Logger('StreamingAssetLoader');
  
  private memoryCache = new Map<string, AssetCache>();
  private loadingPromises = new Map<string, Promise<any>>();
  private maxMemoryCacheSize = 50 * 1024 * 1024; // 50MB
  private currentMemoryUsage = 0;
  private indexedDBSupported = false;
  private dbName = 'MegaEngineAssets';
  private dbVersion = 1;

  constructor() {
    this.checkIndexedDBSupport();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): StreamingAssetLoader {
    if (!StreamingAssetLoader.instance) {
      StreamingAssetLoader.instance = new StreamingAssetLoader();
    }
    return StreamingAssetLoader.instance;
  }

  /**
   * Check if IndexedDB is supported
   */
  private async checkIndexedDBSupport(): Promise<void> {
    if (typeof window === 'undefined') {
      this.indexedDBSupported = false;
      return;
    }

    try {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => {
        this.indexedDBSupported = false;
        this.logger.warn('IndexedDB not supported, using memory cache only');
      };
      request.onsuccess = () => {
        this.indexedDBSupported = true;
        this.logger.info('IndexedDB supported for persistent caching');
      };
    } catch (error) {
      this.indexedDBSupported = false;
      this.logger.warn('IndexedDB check failed', { error });
    }
  }

  /**
   * Load text asset with streaming support
   */
  async loadTextAsset(path: string, options: LoadOptions = {}): Promise<string> {
    const cacheKey = `text:${path}`;
    const opts = this.getDefaultOptions(options);

    // Check memory cache first
    if (opts.useCache) {
      const cached = this.getFromMemoryCache(cacheKey);
      if (cached) return cached as string;
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey) as Promise<string>;
    }

    // Start loading
    const loadPromise = this.loadTextAssetInternal(path, cacheKey, opts);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      this.loadingPromises.delete(cacheKey);
      return result;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Load binary asset with streaming support
   */
  async loadBinaryAsset(path: string, options: LoadOptions = {}): Promise<ArrayBuffer> {
    const cacheKey = `binary:${path}`;
    const opts = this.getDefaultOptions(options);

    // Check memory cache first
    if (opts.useCache) {
      const cached = this.getFromMemoryCache(cacheKey);
      if (cached) return cached as ArrayBuffer;
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey) as Promise<ArrayBuffer>;
    }

    // Start loading
    const loadPromise = this.loadBinaryAssetInternal(path, cacheKey, opts);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      this.loadingPromises.delete(cacheKey);
      return result;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Load WASM module with streaming support
   */
  async loadWasmModule(wasmPath: string, jsPath: string, options: LoadOptions = {}): Promise<any> {
    const cacheKey = `wasm:${wasmPath}:${jsPath}`;
    const opts = this.getDefaultOptions(options);

    // Check memory cache first
    if (opts.useCache) {
      const cached = this.getFromMemoryCache(cacheKey);
      if (cached) return cached;
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Start loading
    const loadPromise = this.loadWasmModuleInternal(wasmPath, jsPath, cacheKey, opts);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      this.loadingPromises.delete(cacheKey);
      return result;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Internal text asset loading with streaming
   */
  private async loadTextAssetInternal(path: string, cacheKey: string, options: LoadOptions): Promise<string> {
    const retryAttempts = options.retryAttempts || 3;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        this.logger.debug(`Loading text asset: ${path} (attempt ${attempt})`);
        
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength) : 0;
        
        let text: string;
        
        // Use streaming for large files
        if (size > (options.streamThreshold || 1024 * 1024)) { // 1MB threshold
          text = await this.streamTextResponse(response);
          this.logger.debug(`Streamed text asset: ${path} (${size} bytes)`);
        } else {
          text = await response.text();
          this.logger.debug(`Loaded text asset: ${path} (${size} bytes)`);
        }

        // Cache the result
        if (options.useCache) {
          this.cacheAsset(cacheKey, text, 'text', size);
        }

        return text;
      } catch (error) {
        this.logger.warn(`Text asset loading failed (attempt ${attempt}): ${path}`, { error });
        
        if (attempt === retryAttempts) {
          throw new Error(`Failed to load text asset after ${retryAttempts} attempts: ${path}`);
        }
        
        // Wait before retry
        await this.delay(1000 * attempt);
      }
    }

    throw new Error('Unexpected error in text asset loading');
  }

  /**
   * Internal binary asset loading with streaming
   */
  private async loadBinaryAssetInternal(path: string, cacheKey: string, options: LoadOptions): Promise<ArrayBuffer> {
    const retryAttempts = options.retryAttempts || 3;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        this.logger.debug(`Loading binary asset: ${path} (attempt ${attempt})`);
        
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength) : 0;
        
        let buffer: ArrayBuffer;
        
        // Use streaming for large files
        if (size > (options.streamThreshold || 1024 * 1024)) { // 1MB threshold
          buffer = await this.streamBinaryResponse(response);
          this.logger.debug(`Streamed binary asset: ${path} (${size} bytes)`);
        } else {
          buffer = await response.arrayBuffer();
          this.logger.debug(`Loaded binary asset: ${path} (${size} bytes)`);
        }

        // Cache the result
        if (options.useCache) {
          this.cacheAsset(cacheKey, buffer, 'binary', size);
        }

        return buffer;
      } catch (error) {
        this.logger.warn(`Binary asset loading failed (attempt ${attempt}): ${path}`, { error });
        
        if (attempt === retryAttempts) {
          throw new Error(`Failed to load binary asset after ${retryAttempts} attempts: ${path}`);
        }
        
        // Wait before retry
        await this.delay(1000 * attempt);
      }
    }

    throw new Error('Unexpected error in binary asset loading');
  }

  /**
   * Internal WASM module loading
   */
  private async loadWasmModuleInternal(wasmPath: string, jsPath: string, cacheKey: string, options: LoadOptions): Promise<any> {
    try {
      this.logger.debug(`Loading WASM module: ${jsPath}`);
      
      // Load JS module
      const jsModule = await import(jsPath);
      
      // Load WASM binary
      const wasmBuffer = await this.loadBinaryAsset(wasmPath, { useCache: false }); // Don't cache WASM in memory
      
      // Initialize WASM
      if (jsModule.default) {
        await jsModule.default(wasmBuffer);
      }
      
      // Cache the module (not the binary)
      if (options.useCache) {
        this.cacheAsset(cacheKey, jsModule, 'wasm', 0);
      }
      
      this.logger.debug(`WASM module loaded: ${jsPath}`);
      return jsModule;
    } catch (error) {
      this.logger.error(`WASM module loading failed: ${jsPath}`, { error });
      throw error;
    }
  }

  /**
   * Stream text response for large files
   */
  private async streamTextResponse(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let text = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode(); // Flush any remaining bytes
    } finally {
      reader.releaseLock();
    }

    return text;
  }

  /**
   * Stream binary response for large files
   */
  private async streamBinaryResponse(response: Response): Promise<ArrayBuffer> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalLength += value.length;
      }
    } finally {
      reader.releaseLock();
    }

    // Combine chunks into single ArrayBuffer
    const result = new ArrayBuffer(totalLength);
    const view = new Uint8Array(result);
    let offset = 0;
    
    for (const chunk of chunks) {
      view.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  /**
   * Get default options
   */
  private getDefaultOptions(options: LoadOptions): LoadOptions {
    return {
      useCache: true,
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
      streamThreshold: 1024 * 1024, // 1MB
      retryAttempts: 3,
      ...options
    };
  }

  /**
   * Get asset from memory cache
   */
  private getFromMemoryCache(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > (24 * 60 * 60 * 1000)) { // 24 hours default
      this.memoryCache.delete(key);
      this.currentMemoryUsage -= cached.size;
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return cached.data;
  }

  /**
   * Cache asset in memory
   */
  private cacheAsset(key: string, data: any, type: 'text' | 'binary' | 'wasm', size: number): void {
    // Estimate size if not provided
    if (size === 0) {
      if (typeof data === 'string') {
        size = data.length * 2; // UTF-16 chars
      } else if (data instanceof ArrayBuffer) {
        size = data.byteLength;
      } else {
        size = JSON.stringify(data).length * 2; // Rough estimate
      }
    }

    // Check if we need to evict from cache
    while (this.currentMemoryUsage + size > this.maxMemoryCacheSize && this.memoryCache.size > 0) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        const oldest = this.memoryCache.get(oldestKey);
        if (oldest) {
          this.currentMemoryUsage -= oldest.size;
        }
        this.memoryCache.delete(oldestKey);
      }
    }

    // Add to cache
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      size,
      type
    });
    this.currentMemoryUsage += size;

    this.logger.debug(`Cached asset: ${key} (${size} bytes, ${type})`);
  }

  /**
   * Clear memory cache
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
    this.currentMemoryUsage = 0;
    this.logger.info('Memory cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { memoryCache: { size: number; hits: number; misses: number; hitRate: number }; persistentCache: { size: number; hits: number; misses: number; hitRate: number }; totalAssets: number; totalSize: number } {
    // Calculate memory cache stats
    const memoryStats = {
      size: this.memoryCache.size,
      hits: 0, // Not tracked yet
      misses: 0, // Not tracked yet
      hitRate: 0 // Not tracked yet
    };

    // Calculate persistent cache stats (placeholder)
    const persistentStats = {
      size: 0, // Not implemented yet
      hits: 0,
      misses: 0,
      hitRate: 0
    };

    // Calculate total assets and size
    let totalAssets = this.memoryCache.size;
    let totalSize = this.currentMemoryUsage;

    return {
      memoryCache: memoryStats,
      persistentCache: persistentStats,
      totalAssets,
      totalSize
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const streamingAssetLoader = StreamingAssetLoader.getInstance(); 