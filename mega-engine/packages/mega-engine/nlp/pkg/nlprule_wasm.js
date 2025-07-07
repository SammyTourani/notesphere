import * as wasm from "./nlprule_wasm_bg.wasm?url";
import { __wbg_set_wasm } from "./nlprule_wasm_bg.js";

// Re-export everything from background module
export * from "./nlprule_wasm_bg.js";

/**
 * Initialize the WASM module
 * @param {WebAssembly.Module | Response | BufferSource | undefined} module_or_path
 * @returns {Promise<WebAssembly.Module>}
 */
async function init(module_or_path) {
    let wasmModule;
    
    if (typeof module_or_path === 'undefined') {
        // Load from the bundled WASM file
        const wasmUrl = typeof wasm === 'string' ? wasm : wasm.default;
        const response = await fetch(wasmUrl);
        wasmModule = await WebAssembly.compileStreaming(response);
    } else if (module_or_path instanceof Response) {
        wasmModule = await WebAssembly.compileStreaming(module_or_path);
    } else if (module_or_path instanceof WebAssembly.Module) {
        wasmModule = module_or_path;
    } else {
        wasmModule = await WebAssembly.compile(module_or_path);
    }

    const imports = {};
    const { instance } = await WebAssembly.instantiate(wasmModule, imports);
    
    __wbg_set_wasm(instance.exports);
    
    // Call the start function if it exists
    if (instance.exports.__wbindgen_start) {
        instance.exports.__wbindgen_start();
    }
    
    return wasmModule;
}

export default init;
