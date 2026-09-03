import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    // three.js is the whole of the lazily-loaded terrain chunk; it never
    // blocks first paint, so the default 500 kB warning is not useful here.
    chunkSizeWarningLimit: 700,
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        capabilities: resolve(import.meta.dirname, 'capabilities.html'),
        thesis: resolve(import.meta.dirname, 'thesis.html'),
        about: resolve(import.meta.dirname, 'about.html'),
      },
    },
  },
  server: { host: true, port: 5173 },
});
