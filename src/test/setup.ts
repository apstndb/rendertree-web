import '@testing-library/jest-dom';

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/',
    href: 'http://localhost:3000/',
  },
  writable: true,
});

// Mock performance API for WASM timing tests
global.performance = global.performance || {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
} as Performance;