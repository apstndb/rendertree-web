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

## Development Workflow

### Making Changes
When implementing changes or fixes, follow this workflow:

1. **Identify the issue**: Check `KNOWN_ISSUES.md` for documented problems or create a plan for new features
2. **Implement the fix**: Make necessary code changes following existing patterns and conventions
3. **Test thoroughly**: Run the full test suite to ensure no regressions
   ```bash
   npm test             # Run all Playwright tests (development mode)
   npm run lint         # Check code quality with ESLint
   npm run test:preview # Test against production build to ensure build works
   ```
4. **Commit changes**: Create a descriptive commit message following the existing style
   - Use present tense ("Fix memory leak" not "Fixed memory leak")
   - Include context about what problem is being solved
   - Reference issue numbers when applicable
   - Include the standard footer with Claude Code attribution

### Quality Assurance
- **Always run tests before committing**: All three commands must pass:
  - `npm test` - Development mode tests
  - `npm run lint` - Code quality checks 
  - `npm run test:preview` - Production build tests
- **Fix linting errors**: Address all ESLint warnings and errors
- **Update documentation**: Update `KNOWN_ISSUES.md` when fixing documented issues
- **Test across browsers**: Playwright tests automatically run on Chromium, Firefox, and WebKit
- **Verify production builds**: `test:preview` ensures changes work in production environment

### Issue Tracking
- Use `KNOWN_ISSUES.md` to track known problems, technical debt, and improvement opportunities
- Categorize issues by priority (🔴 High, 🟡 Medium, 🟢 Low)
- **Resolving Issues**: When fixing documented issues:
  1. Complete the implementation and verify all tests pass
  2. **Delete the resolved issue** from `KNOWN_ISSUES.md` entirely
  3. Issue numbers can remain as gaps (e.g., if Issue #8 is resolved, it's deleted and numbers jump from #7 to #9)
  4. Update improvement recommendation checklists to mark items as completed with ✅
  5. Update the "Last Updated" date at the bottom of the file
- Include file paths and line numbers for easy navigation

### TypeScript and CI Compatibility
- **Ensure TypeScript compilation**: All code must compile without errors for CI to pass
- **Use proper types**: 
  - Use `window.setTimeout()` instead of `setTimeout()` for timeout operations to get correct return type
  - Include `"types": ["vite/client"]` in `tsconfig.json` for Vite environment variables support
- **Verify CI status**: After pushing changes, check CI status with `gh run list --branch main` and `gh run watch <run-id>`

### Deployment and CI/CD
- **Automatic deployment**: GitHub Pages automatically deploys from main branch when CI passes
- **CI pipeline includes**:
  - TypeScript compilation (`npm run build`)
  - Code quality checks (`npm run lint`)
  - Cross-browser testing (`npm test`)
  - Production build verification (`npm run test:preview`)
- **Monitor CI**: Use GitHub CLI to check build status after pushing
  ```bash
  gh run list --branch main --limit 5  # Check recent runs
  gh run watch [run-id]                 # Watch specific run in real-time
  ```