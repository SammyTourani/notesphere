/**
 * Cross-platform asset loader for Node.js and browser environments
 */

// Detect environment
const isNode = typeof window === 'undefined' && typeof global !== 'undefined';
const isBrowser = typeof window !== 'undefined';

// Node.js module cache
let nodeModules: any = null;

async function getNodeModules() {
  if (nodeModules) return nodeModules;
  
  if (isNode) {
    const fs = await import('fs/promises');
    const url = await import('url');
    const path = await import('path');
    
let currentDir: string;
  try {
      currentDir = path.dirname(url.fileURLToPath(import.meta.url));
  } catch {
    currentDir = process.cwd();
  }
    
    nodeModules = {
      readFile: fs.readFile,
      join: path.join,
      currentDir
    };
  }
  
  return nodeModules;
}

/**
 * Load text asset from public directory
 */
export async function loadTextAsset(relativePath: string): Promise<string> {
  if (isNode) {
    const nodeModules = await getNodeModules();
    if (!nodeModules) throw new Error('Node.js modules not available');
    
    // Node.js: use fs.readFile with absolute path
    const absolutePath = nodeModules.join(nodeModules.currentDir, '..', 'public', relativePath);
    try {
      return await nodeModules.readFile(absolutePath, 'utf-8');
    } catch (error) {
      // Fallback: try from package root
      const fallbackPath = nodeModules.join(process.cwd(), 'public', relativePath);
      return await nodeModules.readFile(fallbackPath, 'utf-8');
    }
  } else {
    // Browser: use fetch with absolute URL (Vite serves from root, not /public/)
    const response = await fetch(`/${relativePath}`);
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${relativePath} (Status: ${response.status})`);
    }
    return await response.text();
  }
}

/**
 * Load binary asset from public directory
 */
export async function loadBinaryAsset(relativePath: string): Promise<ArrayBuffer> {
  if (isNode) {
    const nodeModules = await getNodeModules();
    if (!nodeModules) throw new Error('Node.js modules not available');
    
    // Node.js: use fs.readFile with absolute path
    const absolutePath = nodeModules.join(nodeModules.currentDir, '..', 'public', relativePath);
    try {
      const buffer = await nodeModules.readFile(absolutePath);
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } catch (error) {
      // Fallback: try from package root
      const fallbackPath = nodeModules.join(process.cwd(), 'public', relativePath);
      const buffer = await nodeModules.readFile(fallbackPath);
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
  } else {
    // Browser: use fetch with absolute URL (Vite serves from root, not /public/)
    const response = await fetch(`/${relativePath}`);
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${relativePath} (Status: ${response.status})`);
    }
    return await response.arrayBuffer();
  }
}

/**
 * Load WASM module in a cross-platform way
 */
export async function loadWasmModule(wasmPath: string, jsPath: string): Promise<any> {
  if (isNode) {
    const nodeModules = await getNodeModules();
    if (!nodeModules) throw new Error('Node.js modules not available');
    
    // Node.js: Load WASM manually using fs and WebAssembly
    try {
      // Load the JS module first
      const jsAbsolutePath = nodeModules.join(nodeModules.currentDir, '..', jsPath);
      const mod = await import(jsAbsolutePath);
      
      // Load WASM binary manually
      const wasmAbsolutePath = nodeModules.join(nodeModules.currentDir, '..', wasmPath);
      const wasmBuffer = await nodeModules.readFile(wasmAbsolutePath);
      const wasmModule = await WebAssembly.compile(wasmBuffer);
      
      // Initialize with the compiled WASM
      if (mod.default) {
        await mod.default(wasmModule);
      }
      
      return mod;
    } catch (error) {
      // Fallback: try from package root
      try {
        const jsAbsolutePath = nodeModules.join(process.cwd(), jsPath);
        const mod = await import(jsAbsolutePath);
        
        const wasmAbsolutePath = nodeModules.join(process.cwd(), wasmPath);
        const wasmBuffer = await nodeModules.readFile(wasmAbsolutePath);
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
export async function getAssetBasePath(): Promise<string> {
  if (isNode) {
    const nodeModules = await getNodeModules();
    if (!nodeModules) throw new Error('Node.js modules not available');
    return nodeModules.join(nodeModules.currentDir, '..', 'public');
  } else {
    return '/';  // Vite serves assets from root
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
