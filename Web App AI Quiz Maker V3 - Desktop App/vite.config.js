import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // CRITICAL: Use relative paths for Electron's file:// protocol
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});