# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rendertree Web is a web-based tool for visualizing Google Cloud Spanner execution plans. It consists of:
- **Frontend**: TypeScript + React application built with Vite
- **Backend**: Go WebAssembly module that processes Spanner query plans
- **Architecture**: Hybrid web app where Go WASM handles plan parsing/rendering, React handles UI

## Key Commands

### Development
```bash
npm run dev          # Start development server
./dev.sh            # Start dev server in background
./stop-dev.sh       # Stop background dev server
```

### Building & Testing
```bash
npm run build       # Build for production (includes Go WASM compilation)
npm run preview     # Preview production build
npm test            # Run Playwright tests
npm run test:ui     # Run tests with UI
npm run lint        # Run ESLint
```

### Test Variants
```bash
npm run test:preview          # Test against preview server
npm run test:with-build       # Build then test
npm run test:verbose          # Test with debug logging
```

## Architecture

### Go WASM Integration
- **main.go**: Go WebAssembly entry point that exposes `renderASCII` function to JavaScript
- **src/vite-plugin-go-wasm.ts**: Custom Vite plugin that builds Go WASM during development and production
- Go WASM is compiled to `dist/rendertree.wasm` and `dist/wasm_exec.js`
- Frontend loads WASM via `src/wasm.ts` and calls Go functions from React components

### React Context Architecture
- **WasmContext**: Manages WASM module loading state and provides access to Go functions
- **AppContext**: Manages application state (input text, render settings, output)
- **Contexts are separate**: WASM context handles low-level module state, App context handles UI state
- Both contexts use custom hooks (`useWasm`, `useAppContext`) and are provided at app root

### Component Structure
- **InputPanel**: File upload, sample data loading, render configuration
- **OutputPanel**: Displays rendered ASCII output from Go WASM
- **Main flow**: User uploads plan → App context processes → WASM renders → Output displays result

### Build System
- **Vite configuration**: Custom base path handling for GitHub Pages deployment (`/rendertree-web/`)
- **WASM plugin**: Automatically builds Go WASM during Vite build process
- **Asset handling**: Testdata files copied to dist, WASM files served with correct MIME types
- **Development vs Production**: Different base paths and asset serving strategies

### Sample Data
Sample files in `testdata/` directory are automatically copied to build output and can be loaded via UI buttons.

## TypeScript Configuration
- Strict TypeScript setup with comprehensive ESLint rules
- Context files have relaxed react-refresh rules
- Test files allow console usage
- WASM types defined in `src/types/wasm.ts`