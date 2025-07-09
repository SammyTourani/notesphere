import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      name: 'chromium',
    },
  },
});
