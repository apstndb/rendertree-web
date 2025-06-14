const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4173;

// Set the correct MIME type for WASM files
express.static.mime.define({ 'application/wasm': ['wasm'] });

// Middleware to log requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware to handle WASM files explicitly
app.use((req, res, next) => {
  if (req.path.endsWith('.wasm')) {
    console.log(`Setting MIME type for WASM file: ${req.url}`);
    res.set('Content-Type', 'application/wasm');
  }
  next();
});

// Redirect root to /rendertree-web/
app.get('/', (req, res) => {
  res.redirect('/rendertree-web/');
});

// Serve static files from the dist directory under /rendertree-web/ path
app.use('/rendertree-web', express.static(path.join(__dirname, 'dist')));

// Handle all other routes for the SPA
app.get('/rendertree-web/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}/rendertree-web/`);
  console.log(`Serving files from: ${path.join(__dirname, 'dist')}`);

  // List available WASM files for debugging
  const distPath = path.join(__dirname, 'dist');
  console.log('Available WASM files:');

  // Check if rendertree.wasm exists in the root dist directory
  if (fs.existsSync(path.join(distPath, 'rendertree.wasm'))) {
    console.log(`- /rendertree-web/rendertree.wasm`);
  }

  // Check if rendertree.wasm exists in the assets directory
  if (fs.existsSync(path.join(distPath, 'assets', 'rendertree.wasm'))) {
    console.log(`- /rendertree-web/assets/rendertree.wasm`);
  }
});
