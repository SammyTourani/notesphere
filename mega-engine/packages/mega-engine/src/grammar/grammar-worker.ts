import init, { NlpRuleChecker } from './nlprule_wasm.js';

let checker: NlpRuleChecker;

self.onerror = e => {
  postMessage({ __error__: e.toString() });
};

self.onmessage = async (e: MessageEvent) => {
  if (e.data === '__init__') {
    try {
      // 1. Initialize WASM module
      await init(new URL('./nlprule_wasm_bg.wasm', import.meta.url));

      // 2. Load rules and create the checker instance
      const rulesBuf = await fetch(new URL('./en.bin', import.meta.url)).then(r => r.arrayBuffer());
      checker = NlpRuleChecker.deserialize(new Uint8Array(rulesBuf));
      
      postMessage('__ready__');
    } catch (err: any) {
      postMessage({ __error__: err.toString() });
    }
    return;
  }

  try {
    const issues = checker.check_str(e.data as string);
    postMessage(issues);
  } catch (error) {
    postMessage({ __error__: String(error) });
  }
};
