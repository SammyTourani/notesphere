// dump-nlprule-exports.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Absolute path to the glue JS you copied into src/grammar/
const gluePath = path.resolve('./src/grammar/nlprule_wasm.js');

// Dynamically import the glue module **without** trying to run init()
const mod = await import(fileURLToPath(`file://${gluePath}`));

// Show every top-level symbol the module actually exports
console.log('\n🔑  nlprule_wasm.js exports:\n', Object.keys(mod), '\n');
