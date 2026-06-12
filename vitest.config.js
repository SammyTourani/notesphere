import { defineConfig } from 'vitest/config'

// Vitest configuration for NoteSphere unit tests.
//
// Scope: pure, framework-free logic only (grammar fallback engine, suggestion
// classification, note utilities). These modules have no imports and require
// neither Firebase, the WASM grammar binary, a browser, nor network access, so
// the lightweight `node` environment is sufficient and keeps CI fast and green.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globals: false,
  },
})
