import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import goWasm from './src/vite-plugin-go-wasm';


// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react(), goWasm()],
    // Use different base paths for development and production/preview
    // In development mode, use the root path
    // In production/preview mode, use /rendertree-web/
    base: command === 'serve' ? '/' : '/rendertree-web/',
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

  // Add custom MIME type configuration for WASM files
  // This ensures WASM files are served with the correct MIME type
  config.plugins.push({
    name: 'configure-wasm-mime-type',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Simple string check to avoid TypeScript errors
        const url = req.url || '';

        // Set Content-Type header for WASM files
        if (url.indexOf('.wasm') > -1) {
          res.setHeader('Content-Type', 'application/wasm');
        }

        // Handle the case where files are requested from /rendertree-web/dist/
        // but should be served from /rendertree-web/
        // This ensures that files in the dist directory are accessible with the same URL
        // when the base path is changed
        if (url.includes('/rendertree-web/dist/')) {
          // Redirect to the correct path
          const newUrl = url.replace('/rendertree-web/dist/', '/rendertree-web/');
          res.writeHead(302, {
            'Location': newUrl
          });
          res.end();
          return;
        }

        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        // Simple string check to avoid TypeScript errors
        const url = req.url || '';

        // Set Content-Type header for WASM files
        if (url.indexOf('.wasm') > -1) {
          res.setHeader('Content-Type', 'application/wasm');
        }

        // Handle the case where files are requested from /rendertree-web/dist/
        // but should be served from /rendertree-web/
        // This ensures that files in the dist directory are accessible with the same URL
        // when the base path is changed
        if (url.includes('/rendertree-web/dist/')) {
          // Redirect to the correct path
          const newUrl = url.replace('/rendertree-web/dist/', '/rendertree-web/');
          res.writeHead(302, {
            'Location': newUrl
          });
          res.end();
          return;
        }

        next();
      });
    }
  });

  return config;
});
