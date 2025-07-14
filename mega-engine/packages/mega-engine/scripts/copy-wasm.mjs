import fsp from 'node:fs/promises';
import path from 'node:path';

const srcDir = 'src/nlp/pkg';
const outDir = 'dist/nlp/pkg';

await fsp.mkdir(outDir, { recursive: true });

for (const file of ['nlprule_wasm.js', 'nlprule_wasm_bg.wasm']) {
  await fsp.copyFile(path.join(srcDir, file), path.join(outDir, file));
}

console.log('✓ Copied nlprule glue + wasm');
