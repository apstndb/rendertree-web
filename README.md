# Rendertree Web

A web-based tool for visualizing Google Cloud Spanner execution plans.

## Project Structure

This project consists of:
* TypeScript + React frontend
* Go WebAssembly backend
* Vite build system

## Development

### Prerequisites

- Node.js (v18 or later)
- Go (v1.24 or later)

### Setup

```bash
# Install dependencies
npm install
```

### Development Server

```bash
# Start the development server
npm run dev
# or
./dev.sh

# Stop the development server (if started with dev.sh)
./stop-dev.sh
```

## Building for Production

```bash
# Build the project
npm run build
```

## Testing the Production Build

### Using npm preview

After building the project, you can preview it using the Vite preview server:

```bash
# Preview the built application
npm run preview
```

The application will be available at http://localhost:4173/rendertree-web/. The preview server is configured to use the same base path as the production build (`/rendertree-web/`), ensuring that all assets are correctly loaded from this path.

> **Note:** Always access the application at http://localhost:4173/rendertree-web/ (with the `/rendertree-web/` path) to match the base path used in GitHub Pages deployment.

## Testing

### Testing the Development Server

```bash
# Run all tests against the development server
npm test

# Run tests with verbose logging
npm run test:verbose

# Run tests with UI
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Build the project and run tests
npm run test:with-build
```

### Testing the Preview Server

#### Using the Vite Preview Server

```bash
# Run all tests against the Vite preview server
npm run test:preview

# Run tests against the Vite preview server with verbose logging
npm run test:preview:verbose
```

#### Using the Custom Express Preview Server

We also provide a custom Express server for testing that ensures WASM files are served with the correct MIME type:

```bash
# Run all tests against the Express preview server
npm run test:preview:express

# Run tests against the Express preview server with verbose logging
npm run test:preview:express:verbose
```

These preview server tests automatically build the project and start the preview server before running the tests, ensuring that the application works correctly in an environment that closely resembles the production environment. The Express preview server is particularly useful for testing WebAssembly functionality, as it ensures that WASM files are served with the correct MIME type.

## Sample Data

The application includes sample data files that can be loaded directly from the UI:
- `testdata/dca_profile.yaml`
- `testdata/dca_plan.yaml`

These files are automatically included in the production build.

## Deployment Notes

### Base Path Configuration

This application is configured to use a base path of `/rendertree-web/` when deployed to GitHub Pages. When running locally in development mode, the application will handle this base path automatically:

- In development mode, the base path is set to `/` for easier local development
- In production mode, the base path is set to `/rendertree-web/` to match GitHub Pages

If you're experiencing issues with assets not loading correctly, make sure you're accessing the application at the correct path:
- GitHub Pages: https://[username].github.io/rendertree-web/
