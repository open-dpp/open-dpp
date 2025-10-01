import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { configDefaults } from 'vitest/config';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    exclude: [...configDefaults.exclude],
    setupFiles: './setupTest.ts',
    environment: 'jsdom',
  },
  build: {
    target: 'es2022',
  },
  envDir: path.resolve(__dirname, '../../../'),
});
