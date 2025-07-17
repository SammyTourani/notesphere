/**
 * Type declarations for node-wasm-loader
 */

export interface WasmLoadOptions {
  dictBuffer?: Buffer;
  fallbackStrategies?: string[];
}

export class NodeWasmLoader {
  loadWasmModule(wasmPath: string, jsPath: string, options?: WasmLoadOptions): Promise<any>;
}

export const nodeWasmLoader: NodeWasmLoader;