import { defineConfig } from 'vite';

export default defineConfig({
  build: { 
    target: 'es2022',
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  },
  worker: {
    format: 'es'
  },
  assetsInclude: ['**/*.wasm', '**/*.bin'],
  optimizeDeps: {
    exclude: ['nlprule_wasm.js']
  }
});
