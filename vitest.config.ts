// Vitest 4 no longer augments vite's `defineConfig` to accept a `test` block via
// a `/// <reference types="vitest" />` triple-slash directive; the typed config
// helper now lives in `vitest/config`.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/tests/**', '**/playwright-report/**', '**/test-results/**'],
    include: ['**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});