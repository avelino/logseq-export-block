import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true
  },
  optimizeDeps: {
    exclude: ['@logseq/libs']
  }
});