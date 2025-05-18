import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // if you want to use vitest globals like describe, it, expect
    environment: 'node', // or 'jsdom' if you're testing browser features
    setupFiles: ['./src/vitest.setup.ts'], // path to your setup file
    watch: false,
  },
});
