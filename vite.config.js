import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Configure module resolution with clean path aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@features': resolve(__dirname, 'src/features'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@wasm': resolve(__dirname, 'src/wasm'),
      '@mega-engine': resolve(__dirname, 'mega-engine/packages/mega-engine/src'),
    },
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['uuid'],
  },
})
