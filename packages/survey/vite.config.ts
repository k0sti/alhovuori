import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../shared'),
      '@alhovuori/shared': path.resolve(__dirname, '../../shared'),
    },
  },
});
