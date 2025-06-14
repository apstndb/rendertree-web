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
npm run typecheck   # TypeScript compilation check (no emit)
```

### Test Variants
```bash
npm run test:preview          # Test against preview server
npm run test:with-build       # Build then test
npm run test:verbose          # Test with debug logging
npm run test:unit             # Run unit tests with Vitest
npm run test:all              # Run all tests (lint + typecheck + unit + e2e)
npm run test:ci               # Run CI-equivalent tests (lint + typecheck + unit + preview)
npm run test:prod             # Test against production site (https://apstndb.github.io/rendertree-web/)
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

1. **Identify the issue**: Check GitHub issues for documented problems or create a plan for new features
2. **Implement the fix**: Make necessary code changes following existing patterns and conventions
3. **Test thoroughly**: Run the full test suite to ensure no regressions
   ```bash
   npm run test:ci      # Recommended: Run CI-equivalent tests (lint + typecheck + unit + preview)
   # OR run individual commands:
   npm run lint         # Check code quality with ESLint  
   npm run typecheck    # Verify TypeScript compilation (detects CI build errors)
   npm run test:unit    # Run unit tests
   npm run test:preview # Test against production build to ensure build works
   npm test             # Run all Playwright tests (development mode)
   ```
4. **Commit changes**: Create a descriptive commit message following the existing style
   - Use present tense ("Fix memory leak" not "Fixed memory leak")
   - Include context about what problem is being solved
   - Reference issue numbers when applicable
   - Include the standard footer with Claude Code attribution

### Quality Assurance
- **Always run tests before committing**: **CRITICAL** - Run `npm run test:ci` to catch CI build errors locally
  - `npm run lint` - Code quality checks 
  - `npm run typecheck` - TypeScript compilation verification (prevents CI failures)
  - `npm run test:unit` - Unit tests
  - `npm run test:preview` - Production build tests
- **Fix all errors**: Address ESLint warnings, TypeScript compilation errors, and test failures
- **Update documentation**: Close GitHub issues when fixing documented problems
- **Test across browsers**: Playwright tests automatically run on Chromium, Firefox, and WebKit
- **Verify production builds**: `test:preview` ensures changes work in production environment

### Pre-Push Validation
**IMPORTANT**: Before pushing changes, run one of these to prevent CI failures:
```bash
npm run test:ci      # Full CI validation (recommended)
npm run test:all     # All tests including development mode
```
These commands include TypeScript compilation checks that will catch the type errors that cause CI build failures.

### Issue Tracking
- Use GitHub issues to track known problems, technical debt, and improvement opportunities
- Apply appropriate labels for categorization (enhancement, bug, documentation, etc.)
- **Resolving Issues**: When fixing documented issues:
  1. Complete the implementation and verify all tests pass
  2. **Close the GitHub issue** with a reference to the fixing commit
  3. Use commit messages that reference issues (e.g., "Fix ruler alignment issue (#1)")
  4. Add closing keywords in commit messages when appropriate (e.g., "Fixes #1", "Closes #1")
- Include file paths and line numbers in issue descriptions for easy navigation
- Use GitHub's project management features for milestone tracking

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

### Production Testing Workflow
After CI completes and deploys to production, validate the deployment:
1. **Monitor CI completion**: Watch CI status with `gh run watch` until deployment completes
2. **Wait for deployment**: GitHub Pages deployment is usually reflected quickly (within 30-60 seconds)
3. **Test production site**: Run end-to-end tests against the live production environment
   ```bash
   npm run test:prod    # Test against https://apstndb.github.io/rendertree-web/
   ```
4. **Verify functionality**: Ensure all features work correctly in the production environment
5. **Fix deployment issues**: If production tests fail, investigate and fix issues promptly

### Parallel Development Workflow
You can optimize your development workflow by running CI monitoring and production testing in parallel with other tasks:

**Efficient Workflow Pattern**:
1. **Push changes** and immediately start next task
2. **Background monitoring**: Keep `gh run watch <run-id>` running in a separate terminal
3. **Continue development**: Work on other issues while CI runs
4. **Quick validation**: When CI completes, run `npm run test:prod` (takes ~10-15 seconds)
5. **Commit cycle**: Continue with next task while maintaining CI health

**Example Parallel Session**:
```bash
# Terminal 1: Continue development work
git push origin main
# Continue with next issue implementation...

# Terminal 2: Monitor CI (non-blocking)
gh run watch 15656354431

# When CI completes, quick production test
npm run test:prod
```

This approach maximizes productivity by utilizing CI wait time for additional development work.