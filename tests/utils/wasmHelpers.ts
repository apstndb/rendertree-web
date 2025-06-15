import type { Page } from '@playwright/test';

/**
 * Interface for console message logging
 */
export interface ConsoleMessageData {
  type: string;
  text: string;
}

/**
 * Sets up console message capture for debugging
 * @param page - Playwright page object
 * @param debug - Whether to log console messages to stdout
 * @returns Array that will be populated with console messages
 */
export function setupConsoleLogging(page: Page, debug: boolean = false): ConsoleMessageData[] {
  const consoleMessages: ConsoleMessageData[] = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    
    if (debug) {
      console.log(`Browser console: ${type}: ${text}`);
    }
  });
  
  return consoleMessages;
}

/**
 * Checks for WASM loading errors in console messages and skips test if found
 * @param consoleMessages - Array of captured console messages
 * @param test - Playwright test object for skipping
 */
export function checkForWasmErrors(consoleMessages: ConsoleMessageData[], test: { skip: (condition: boolean, reason: string) => void }): void {
  const hasWasmError = consoleMessages.some(
    msg => msg.type === 'error' && 
           (msg.text.includes('WebAssembly') || 
            msg.text.includes('WASM') || 
            msg.text.includes('404'))
  );

  if (hasWasmError) {
    console.warn('WASM loading errors detected. Run `npm run build` before running this test.');
    test.skip(true, 'WASM file not found. Run `npm run build` before running this test.');
    return;
  }
}

/**
 * Waits for the page to load and root element to be available
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 10000)
 */
export async function waitForPageLoad(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForSelector('#root', { timeout });
}

/**
 * Waits for WASM module to initialize completely
 * This includes waiting for loading indicators to disappear and input to be enabled
 * @param page - Playwright page object
 * @param loadingTimeout - Timeout for loading indicator (default: 30000)
 * @param inputTimeout - Timeout for input enablement (default: 5000)
 */
export async function waitForWasmInitialization(
  page: Page, 
  loadingTimeout: number = 30000,
  inputTimeout: number = 5000
): Promise<void> {
  // Wait for loading indicator to disappear
  await page.waitForFunction(() => {
    return !document.querySelector('.loading-container .loading-indicator');
  }, { timeout: loadingTimeout });

  // Wait for input to be enabled
  await page.waitForFunction(() => {
    const textarea = document.querySelector('.input-area');
    return textarea && !(textarea as HTMLTextAreaElement).disabled;
  }, { timeout: inputTimeout });
}

/**
 * Waits for a specific message to appear in the placeholder
 * @param page - Playwright page object
 * @param expectedText - Text to wait for in the message
 * @param timeout - Timeout in milliseconds (default: 10000)
 */
export async function waitForMessageState(
  page: Page, 
  expectedText: string, 
  timeout: number = 10000
): Promise<void> {
  await page.waitForFunction((text) => {
    const message = document.querySelector('.placeholder');
    return message && message.textContent && message.textContent.includes(text);
  }, expectedText, { timeout });
}

/**
 * Comprehensive WASM setup that combines page load, console logging, and WASM initialization
 * @param page - Playwright page object
 * @param test - Playwright test object for error handling
 * @param debug - Whether to enable debug logging
 * @returns Console messages array for further inspection
 */
export async function setupWasmTest(
  page: Page, 
  test: { skip: (condition: boolean, reason: string) => void }, 
  debug: boolean = false
): Promise<ConsoleMessageData[]> {
  // Set up console logging
  const consoleMessages = setupConsoleLogging(page, debug);
  
  // Wait for page to load
  await waitForPageLoad(page);
  
  // Check for WASM errors early
  checkForWasmErrors(consoleMessages, test);
  
  // Wait for WASM initialization
  await waitForWasmInitialization(page);
  
  // Wait for ready state
  await waitForMessageState(page, 'Ready');
  
  return consoleMessages;
}