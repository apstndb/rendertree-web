/**
 * Test utilities for Rendertree Web E2E tests
 * 
 * This module provides a comprehensive set of utilities to reduce code duplication
 * across E2E test files and standardize common testing patterns.
 */

import type { Page } from '@playwright/test';

type TestType = {
  skip: (condition: boolean, reason: string) => void;
};

// WASM-related utilities
export {
  setupConsoleLogging,
  checkForWasmErrors,
  waitForPageLoad,
  waitForWasmInitialization,
  waitForMessageState,
  setupWasmTest,
  type ConsoleMessageData
} from './wasmHelpers';

// Import setupWasmTest for internal use
import { setupWasmTest } from './wasmHelpers';

// File and interaction utilities
export {
  getTestDataPath,
  uploadTestFile,
  clickRenderButton,
  waitForRenderingComplete,
  uploadAndRender
} from './fileHelpers';

// Screenshot utilities
export {
  generateScreenshotName,
  getScreenshotPath,
  takeScreenshot,
  takeTestScreenshot,
  ScreenshotWorkflow,
  createScreenshotWorkflow
} from './screenshotHelpers';

/**
 * Complete test setup utility that combines all common initialization steps
 * @param page - Playwright page object
 * @param test - Playwright test object
 * @param options - Configuration options
 */
export async function setupCompleteTest(
  page: Page,
  test: TestType,
  options: {
    debug?: boolean;
    url?: string;
  } = {}
) {
  const { debug = false, url = '/' } = options;

  // Navigate to the page
  await page.goto(url);

  // Set up WASM test environment
  const consoleMessages = await setupWasmTest(page, test, debug);

  return { consoleMessages };
}