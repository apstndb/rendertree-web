import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base public path when served in production
  base: './',
  
  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't empty the output directory to preserve Go WASM files
    sourcemap: true,
    
    // Output configuration for JavaScript
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'script.js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  
  // Optimizations for production
  optimizeDeps: {
    exclude: ['wasm_exec.js'], // Don't optimize the Go WASM executor
  },
});
