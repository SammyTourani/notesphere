/**
 * WASM Grammar Engine powered by nlprule (Web Worker in browser, stub in Node)
 */

let worker: Worker | null = null;
let ready = false;

export async function initGrammar(): Promise<boolean> {
  if (typeof window === 'undefined') return false; // Node -> stub
  if (ready) return true;

  worker = new Worker(new URL('./grammar-worker.ts', import.meta.url), { type: 'module' });
  await new Promise(res => {
    worker!.onmessage = e => { if (e.data === '__ready__') res(null); };
    worker!.postMessage('__init__');
  });
  ready = true;
  return true;
}

export async function grammarIssues(text: string): Promise<any[]> {
  if (!worker || !ready) return [];
  return new Promise(resolve => {
    worker!.onmessage = e => resolve(e.data);
    worker!.postMessage(text);
  });
}
