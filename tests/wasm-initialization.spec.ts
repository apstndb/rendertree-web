import { test, expect } from '@playwright/test';
import {
  setupConsoleLogging,
  waitForPageLoad,
  waitForMessageState,
  uploadTestFile,
  takeScreenshot,
} from './utils';

// The Go WASM module now initializes lazily on the first render rather than at
// page load. These tests pin that contract: the page reaches a ready state
// without fetching the (large) Go WASM binary, and the binary is fetched and
// initialized successfully as part of the first render.
//
// Requires the WASM file to be built (served by the dev/preview server).
test.describe('WebAssembly Lazy Initialization', () => {
  test.setTimeout(60000);

  test('is ready without fetching the WASM binary at page load', async ({ page }) => {
    const consoleMessages = setupConsoleLogging(page);

    const wasmRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('rendertree.wasm')) {
        wasmRequests.push(req.url());
      }
    });

    await page.goto('.');
    await waitForPageLoad(page);
    // App is immediately ready; nothing is loading in the background.
    await waitForMessageState(page, 'Ready');

    // The Go WASM binary must not be requested until the user renders.
    expect(wasmRequests).toEqual([]);

    // And no WASM errors should have been logged at load.
    const wasmErrors = consoleMessages
      .filter((msg) => msg.type === 'error')
      .filter((msg) => msg.text.includes('WebAssembly') || msg.text.includes('WASM'));
    expect(wasmErrors).toEqual([]);
  });

  test('fetches and initializes the WASM binary on first render', async ({ page }) => {
    const consoleMessages = setupConsoleLogging(page);

    const wasmRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('rendertree.wasm')) {
        wasmRequests.push(req.url());
      }
    });

    await page.goto('.');
    await waitForPageLoad(page);
    await waitForMessageState(page, 'Ready');
    expect(wasmRequests).toEqual([]);

    // Loading a sample auto-renders, which triggers the lazy initialization.
    await uploadTestFile(page, 'dca_profile.yaml');
    await expect(page.getByTestId('output-code')).toContainText('Distributed Union', {
      timeout: 60000,
    });

    await takeScreenshot(page, 'wasm-lazy-init');

    // The binary was fetched only as part of that first render.
    expect(wasmRequests.length).toBeGreaterThan(0);

    // A successful render implies initialization succeeded without WASM errors.
    const wasmErrors = consoleMessages
      .filter((msg) => msg.type === 'error')
      .filter((msg) => msg.text.includes('WebAssembly') || msg.text.includes('WASM'));
    expect(wasmErrors).toEqual([]);
  });
});
