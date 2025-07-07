/**
 * Cross-platform asset loader for Node.js and browser environments
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Detect environment
const isNode = typeof window === 'undefined' && typeof global !== 'undefined';
const isBrowser = typeof window !== 'undefined';

// Get current directory for Node.js
let currentDir: string;
if (isNode) {
  try {
    currentDir = dirname(fileURLToPath(import.meta.url));
  } catch {
    currentDir = process.cwd();
  }
}

/**
 * Load text asset from public directory
 */
export async function loadTextAsset(relativePath: string): Promise<string> {
  if (isNode) {
    // Node.js: use fs.readFile with absolute path
    const absolutePath = join(currentDir, '..', 'public', relativePath);
    try {
      return await readFile(absolutePath, 'utf-8');
    } catch (error) {
      // Fallback: try from package root
      const fallbackPath = join(process.cwd(), 'public', relativePath);
      return await readFile(fallbackPath, 'utf-8');
    }
  } else {
    // Browser: use fetch with absolute URL
    const response = await fetch(`/public/${relativePath}`);
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${relativePath}`);
    }
    return await response.text();
  }
}

/**
 * Load binary asset from public directory
 */
export async function loadBinaryAsset(relativePath: string): Promise<ArrayBuffer> {
  if (isNode) {
    // Node.js: use fs.readFile with absolute path
    const absolutePath = join(currentDir, '..', 'public', relativePath);
    try {
      const buffer = await readFile(absolutePath);
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } catch (error) {
      // Fallback: try from package root
      const fallbackPath = join(process.cwd(), 'public', relativePath);
      const buffer = await readFile(fallbackPath);
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
  } else {
    // Browser: use fetch with absolute URL
    const response = await fetch(`/public/${relativePath}`);
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${relativePath}`);
    }
    return await response.arrayBuffer();
  }
}

/**
 * Load WASM module in a cross-platform way
 */
export async function loadWasmModule(wasmPath: string, jsPath: string): Promise<any> {
  if (isNode) {
    // Node.js: Load WASM manually using fs and WebAssembly
    try {
      // Load the JS module first
      const jsAbsolutePath = join(currentDir, '..', jsPath);
      const mod = await import(jsAbsolutePath);
      
      // Load WASM binary manually
      const wasmAbsolutePath = join(currentDir, '..', wasmPath);
      const wasmBuffer = await readFile(wasmAbsolutePath);
      const wasmModule = await WebAssembly.compile(wasmBuffer);
      
      // Initialize with the compiled WASM
      if (mod.default) {
        await mod.default(wasmModule);
      }
      
      return mod;
    } catch (error) {
      // Fallback: try from package root
      try {
        const jsAbsolutePath = join(process.cwd(), jsPath);
        const mod = await import(jsAbsolutePath);
        
        const wasmAbsolutePath = join(process.cwd(), wasmPath);
        const wasmBuffer = await readFile(wasmAbsolutePath);
        const wasmModule = await WebAssembly.compile(wasmBuffer);
        
        if (mod.default) {
          await mod.default(wasmModule);
        }
        
        return mod;
      } catch (fallbackError) {
        console.error('Failed to load WASM in Node.js:', fallbackError);
        throw fallbackError;
      }
    }
  } else {
    // Browser: use regular dynamic import
    const mod = await import(jsPath);
    if (mod.default) {
      await mod.default();
    }
    return mod;
  }
}

/**
 * Get the appropriate asset base path for the current environment
 */
export function getAssetBasePath(): string {
  if (isNode) {
    return join(currentDir, '..', 'public');
  } else {
    return '/public';
  }
}

/**
 * Check if we're running in Node.js environment
 */
export function isNodeEnvironment(): boolean {
  return isNode;
}

/**
 * Check if we're running in browser environment
 */
export function isBrowserEnvironment(): boolean {
  return isBrowser;
}
