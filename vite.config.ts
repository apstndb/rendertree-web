import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import goWasm from './src/vite-plugin-go-wasm';
import fs from 'fs';
import path from 'path';

// Custom plugin to copy testdata directory to build output
function copyTestdataPlugin() {
  return {
    name: 'copy-testdata',
    closeBundle() {
      const testdataDir = path.resolve(__dirname, 'testdata');
      const outputDir = path.resolve(__dirname, 'dist/testdata');

      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Copy all files from testdata to output directory
      const files = fs.readdirSync(testdataDir);
      for (const file of files) {
        const srcPath = path.join(testdataDir, file);
        const destPath = path.join(outputDir, file);

        // Skip directories, only copy files
        if (fs.statSync(srcPath).isFile()) {
          fs.copyFileSync(srcPath, destPath);
          console.log(`Copied ${srcPath} to ${destPath}`);
        }
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react(), goWasm(), copyTestdataPlugin()],
    base: command === 'serve' ? '/' : '/rendertree-web/', // Use root path for dev, GitHub Pages path for production and preview
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
        if (url.indexOf('.wasm') > -1) {
          res.setHeader('Content-Type', 'application/wasm');
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        // Simple string check to avoid TypeScript errors
        const url = req.url || '';
        if (url.indexOf('.wasm') > -1) {
          res.setHeader('Content-Type', 'application/wasm');

          // Handle the case where the WASM file is requested from /rendertree-web/dist/rendertree.wasm
          // but should be served from /rendertree-web/rendertree.wasm
          if (url.includes('/rendertree-web/dist/rendertree.wasm')) {
            // Redirect to the correct path
            res.writeHead(302, {
              'Location': url.replace('/rendertree-web/dist/rendertree.wasm', '/rendertree-web/rendertree.wasm')
            });
            res.end();
            return;
          }
        }
        next();
      });
    }
  });

  return config;
});
