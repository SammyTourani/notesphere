import * as wasm from './nlprule_wasm_bg.js';

let wasm_bindgen;
export function __wbg_set_wasm(val) {
    wasm_bindgen = val;
}

export const NlpRuleChecker = wasm.NlpRuleChecker;

/**
* Initialize the wasm module.
* @param {RequestInfo | URL | Response | BufferSource | WebAssembly.Module} input
* @returns {Promise<void>}
*/
export default async function init(input) {
    if (typeof input === 'undefined') {
        input = new URL('nlprule_wasm_bg.wasm', import.meta.url);
    }
    
    let initInput;
    if (typeof input === 'string' || (typeof Request !== 'undefined' && input instanceof Request) || (typeof URL !== 'undefined' && input instanceof URL)) {
        initInput = fetch(input);
    } else {
        initInput = Promise.resolve(input);
    }

    const { instance, module } = await WebAssembly.instantiateStreaming(initInput, getImports());
    
    return finalizeInit(instance, module);
}

function getImports() {
    const imports = {};
    imports['./nlprule_wasm_bg.js'] = wasm;
    return imports;
}

function finalizeInit(instance, module) {
    wasm.__wbg_set_wasm(instance.exports);
    init.__wbindgen_wasm_module = module;
    wasm_bindgen = instance.exports;
    return wasm_bindgen;
}
