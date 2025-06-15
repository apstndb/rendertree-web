import { test, expect } from '@playwright/test';
import {
  setupCompleteTest,
  takeScreenshot
} from './utils';

// This test requires the WASM file to be built
// Run with npm run test:with-build to ensure the WASM file is available
test.describe('WebAssembly Initialization', () => {
  // Increase timeout for the entire test
  test.setTimeout(60000);

  test('should load WASM module successfully', async ({ page }) => {
    // Complete test setup with WASM initialization and console logging
    const { consoleMessages } = await setupCompleteTest(page, test, { 
      debug: true // Enable console logging for debugging
    });

    // Take a screenshot for debugging
    await takeScreenshot(page, 'wasm-init');

    // Verify no WASM initialization errors occurred
    const wasmErrors = consoleMessages
      .filter(msg => msg.type === 'error')
      .filter(msg => msg.text.includes('WebAssembly') || msg.text.includes('WASM'));

    expect(wasmErrors).toEqual([]);

    // Check if there's an error message in the UI
    const errorMessage = await page.textContent('.placeholder');
    if (errorMessage && errorMessage.includes('Error')) {
      console.error('Error message found in UI:', errorMessage);
      throw new Error(`WASM initialization failed with error: ${errorMessage}`);
    }
  });
});