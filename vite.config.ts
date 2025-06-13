import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    base: command === 'serve' ? '/' : '/rendertree-web/', // Use root path for dev, GitHub Pages path for production
    build: {
      outDir: 'dist',
      emptyOutDir: false, // Don't empty the dist directory as it contains WASM files
      rollupOptions: {
        // No need to externalize files that are properly imported
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    // Serve dist directory during development
    server: {
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
    },
  };
});