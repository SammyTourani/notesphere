import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['**/*.browser.test.ts'],
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright'
    }
  }
});
