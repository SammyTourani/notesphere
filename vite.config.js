import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Configure module resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
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
