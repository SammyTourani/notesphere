// src/grammar-worker.ts
import init, { NlpRuleChecker } from './nlp/pkg/nlprule_wasm.js';

let checker: any | null = null;

self.onmessage = async ({ data }) => {
  if (data === '__init__') {
    if (!checker) {
      console.log('🚀 [WORKER] WASM init start...');
      
      // ① Initialize WASM with explicit URL  
      const wasmUrl = new URL('./nlp/pkg/nlprule_wasm_bg.wasm', import.meta.url);
      await init(wasmUrl);
      console.log('📦 [WORKER] WASM module loaded, creating checker...');
      
      // ② Create checker (this is the basic version without custom rules)
      checker = NlpRuleChecker.new();
      console.log('✅ [WORKER] ready with basic nlprule rules');
    }
    postMessage('__ready__');
    return;
  }

  if (!checker) { return postMessage({ error: 'not-ready' }); }
  
  // Use the check method (not check_str)
  const result = checker.check(data);
  postMessage(result);
};
