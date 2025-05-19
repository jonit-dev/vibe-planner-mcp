import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // if you want to use vitest globals like describe, it, expect
    environment: 'jsdom', // Changed from 'node' to 'jsdom' for React component testing
    setupFiles: ['./src/vitest.setup.ts'], // path to your setup file
    watch: false,
  },
});
