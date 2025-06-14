# Known Issues

This document tracks known issues, technical debt, and areas requiring improvement in the Rendertree Web project.

## 🔴 High Priority Issues

### 1. Complex WASM Path Resolution
**Files**: `src/wasm.ts:38-54`, `index.html:14-30`
- Overly complex path detection logic for different environments (dev/prod/preview)
- Brittle solution that depends on URL path detection
- Could fail in edge cases or different deployment scenarios

### 2. Dual WASM Building
**File**: `src/vite-plugin-go-wasm.ts`
- WASM is built in both `buildStart` and `closeBundle` hooks
- Inefficient and may cause race conditions

### 3. File Upload Security Validation Gap
**File**: `src/contexts/AppContext.tsx`
- Accepts any content type despite `accept` attribute
- No file size validation
- No content validation before processing

## 🟡 Medium Priority Issues

### 4. ~~Unused/Redundant Code~~ ✅ **FIXED**
**File**: `src/components/InputPanel.tsx:69-78`
- ~~Hidden duplicate file input element that's never used~~
- ~~Should be removed to reduce complexity~~
- **Fixed**: Removed unused hidden file input element (verified with lint + tests)

### 5. ~~ESLint Configuration Issues~~ ✅ **FIXED**
**File**: `eslint.config.js:42`
- ~~`no-unused-vars` is disabled globally, masking potential issues~~
- ~~Should use TypeScript-specific rules instead~~
- **Fixed**: Updated ESLint configuration with TypeScript-specific rules and proper configuration structure

### 6. ~~Excessive Debug Logging~~ ✅ **FIXED**
**Codebase-wide**
- ~~Every component and function has extensive debug logging~~
- ~~Should be conditional based on development vs production environment~~
- **Fixed**: Reduced verbose logging and implemented proper environment-conditional logging using Vite environment variables

### 7. ~~Potential Memory Leaks~~ ✅ **FIXED**
**File**: `src/components/OutputPanel.tsx:207-211`
- ~~`setTimeout` without cleanup in copy button functionality~~
- ~~Could cause memory leaks if component unmounts during timeout~~
- **Fixed**: Added useRef for timeout management and proper cleanup in useEffect

## 🟢 Low Priority Issues

### 9. ~~Misplaced Test Files~~ ✅ **FIXED**
**Root directory**: `p.json`, `plan.json`, `plan.yaml`
- ~~Should be moved to `testdata/` directory or removed~~
- ~~Currently showing as untracked files in git status~~
- **Fixed**: Removed duplicate test files from root directory

### 10. Complex Test Logic
**File**: `tests/rendering.spec.ts`
- Overly complex test file (450+ lines)
- Browser-specific workarounds suggest underlying issues
- Should be simplified and root causes addressed

### 11. Architecture Coupling
**File**: `src/contexts/AppContext.tsx`
- AppContext has too many responsibilities (state, file handling, rendering)
- Should be split into separate contexts/hooks

## 🔧 Improvement Recommendations

### Immediate Fixes
- [x] Remove unused file input element ✅
- [x] Fix ESLint configuration to use TypeScript-specific rules ✅
- [x] Add proper cleanup for setTimeout ✅
- [x] Move test files to appropriate directories ✅

### Medium-term Improvements
- [ ] Simplify WASM path resolution logic
- [x] Reduce debug logging verbosity ✅
- [ ] Add file upload validation
- [x] Improve error handling with proper typing ✅

### Long-term Improvements
- [ ] Add comprehensive unit tests
- [ ] Split large contexts into smaller, focused ones
- [ ] Add proper API documentation
- [ ] Optimize build process to eliminate dual WASM building
- [x] Implement proper character width measurement ✅

### Security Enhancements
- [ ] Add input validation for file uploads
- [ ] Implement content-type verification
- [ ] Add file size limits

## 📋 Technical Debt

### Go Version Requirement
**File**: `go.mod:3`
- Uses Go 1.24 which may not be stable/available
- Should specify minimum required version

### TypeScript Strict Mode Issues
**File**: `src/wasm.ts`
- Extensive use of `unknown[]` type indicates incomplete typing
- More specific type definitions needed

### ~~Environment Variable Exposure~~ ✅ **FIXED**
**File**: `src/utils/logger.ts:4`
- ~~Uses `process.env.NODE_ENV` in client-side code without proper Vite configuration~~
- ~~May cause runtime errors if not properly handled~~
- **Fixed**: Updated to use Vite environment variables (import.meta.env) for proper client-side compatibility

### Missing Unit Test Coverage
- No unit tests for individual components or utilities
- Only end-to-end tests exist

### Build Process Error Handling
**File**: `src/vite-plugin-go-wasm.ts:27, 48`
- Build errors are logged but build continues
- Could cause silent failures

---

**Last Updated**: June 14, 2025  
**Next Review**: July 14, 2025