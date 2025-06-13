import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import goWasm from './src/vite-plugin-go-wasm';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react(), goWasm()],
    base: command === 'serve' ? '/' : '/rendertree-web/', // Use root path for dev, GitHub Pages path for production
    build: {
      outDir: 'dist',
      emptyOutDir: true, // Empty the dist directory as WASM files are now built by the plugin
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

  // Only add custom MIME type configuration in development mode
  if (command === 'serve') {
    // Add a custom plugin to handle WASM MIME types
    config.plugins.push({
      name: 'configure-wasm-mime-type',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          }
          next();
        });
      }
    });
  }

  return config;
});
