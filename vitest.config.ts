import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    // Vitest v1 bundles Vite v5 which doesn't understand TailwindCSS v4's
    // string-format PostCSS plugin. Disable PostCSS processing for tests —
    // jsdom ignores styles anyway so this has no effect on test correctness.
    postcss: { plugins: [] },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Playwright e2e specs live under src/tests/e2e and import @playwright/test,
    // which vitest cannot resolve. Vitest's default include is
    // '**/*.{test,spec}.?(c|m)[jt]s?(x)', so without this they would be
    // collected here and fail. Run them with Playwright, not vitest.
    exclude: [...configDefaults.exclude, 'src/tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'src/**/__tests__/**',
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/**/*.spec.{js,jsx,ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
