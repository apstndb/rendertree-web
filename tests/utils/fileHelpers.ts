import type { Page } from '@playwright/test';
import { join } from 'path';

/**
 * Gets the absolute path to a test data file
 * @param fileName - Name of the test file (default: 'simple.yaml')
 * @returns Absolute path to the test file
 */
export function getTestDataPath(fileName: string = 'simple.yaml'): string {
  return join(process.cwd(), 'testdata', fileName);
}

/**
 * Uploads a test file to the file input element
 * @param page - Playwright page object
 * @param fileName - Name of the test file to upload (default: 'simple.yaml')
 * @param fileInputSelector - CSS selector for the file input (default: '[data-testid="file-picker"]')
 */
export async function uploadTestFile(
  page: Page, 
  fileName: string = 'simple.yaml',
  fileInputSelector: string = '[data-testid="file-picker"]'
): Promise<void> {
  const filePath = getTestDataPath(fileName);
  await page.setInputFiles(fileInputSelector, filePath);
}

/**
 * Clicks the render button with optional fallback logic for different browsers
 * @param page - Playwright page object
 * @param useComplexFallback - Whether to use complex fallback logic for browser compatibility
 * @param timeout - Timeout for render button operations (default: 30000)
 */
export async function clickRenderButton(
  page: Page, 
  useComplexFallback: boolean = false,
  _timeout: number = 30000
): Promise<void> {
  if (!useComplexFallback) {
    // Simple approach - works for most cases
    const renderButton = page.locator('button:has-text("Render")');
    await renderButton.click();
    return;
  }

  // Complex fallback approach for browser compatibility issues
  const browserName = page.context().browser()?.browserType().name() || 'unknown';
  
  try {
    // Try to find and click the render button
    const renderButton = page.locator('button:has-text("Render")');
    await renderButton.waitFor({ timeout: 5000 });
    
    const isVisible = await renderButton.isVisible();
    const isEnabled = await renderButton.isEnabled();
    
    if (!isVisible || !isEnabled) {
      throw new Error(`Render button not ready - visible: ${isVisible}, enabled: ${isEnabled}`);
    }
    
    await renderButton.click();
    console.log(`${browserName} test passed: File was uploaded and Render button is clickable`);
    
  } catch (error) {
    console.log(`${browserName} test failed: ${error}`);
    
    // Additional debugging info
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on page`);
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      const isEnabled = await buttons[i].isEnabled();
      console.log(`Button ${i}: "${buttonText}" - visible: ${isVisible}, enabled: ${isEnabled}`);
    }
    
    throw error;
  }
}

/**
 * Waits for rendering to complete and output to be available
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 30000)
 * @param outputSelector - CSS selector for the output container (default: '[data-testid="output-container"]')
 */
export async function waitForRenderingComplete(
  page: Page,
  timeout: number = 30000,
  outputSelector: string = '[data-testid="output-container"]'
): Promise<void> {
  await page.waitForSelector(outputSelector, { timeout });
}

/**
 * Complete file upload and render workflow
 * Combines file upload, render button click, and waiting for completion
 * @param page - Playwright page object
 * @param fileName - Name of the test file to upload (default: 'simple.yaml')
 * @param useComplexFallback - Whether to use complex render button fallback
 */
export async function uploadAndRender(
  page: Page,
  fileName: string = 'simple.yaml',
  useComplexFallback: boolean = false
): Promise<void> {
  // Upload the test file
  await uploadTestFile(page, fileName);
  
  // Click render button
  await clickRenderButton(page, useComplexFallback);
  
  // Wait for rendering to complete
  await waitForRenderingComplete(page);
}