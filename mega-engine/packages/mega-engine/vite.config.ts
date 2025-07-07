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
  }
});
