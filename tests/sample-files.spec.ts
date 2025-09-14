import { test, expect } from '@playwright/test';
import { setupCompleteTest } from './utils';

const DEBUG = process.env.DEBUG === 'true';

test.describe('Sample File Loading', () => {
  test.setTimeout(60000);

  test('should load dca_profile.yaml sample file', async ({ page }) => {
    // Complete test setup with WASM initialization
    await setupCompleteTest(page, test, { debug: DEBUG });

    // Click the "Load dca_profile.yaml" button
    const profileButton = page.locator('button:has-text("Load dca_profile.yaml")');
    await expect(profileButton).toBeVisible();
    await expect(profileButton).toBeEnabled();
    
    // Click the button
    await profileButton.click();

    // Wait for the file to be loaded into the textarea
    await page.waitForTimeout(500); // Allow time for file to load
    
    // Verify the content was loaded
    const textareaContent = await page.locator('textarea.input-area').inputValue();
    expect(textareaContent).toBeTruthy();
    expect(textareaContent).toContain('metadata');
    expect(textareaContent).toContain('rowType');
    
    // Wait for auto-render to complete (sample files auto-render after loading)
    await page.waitForTimeout(1000);
    
    // Verify the output was rendered
    const outputSelectors = [
      '[data-testid="output-code"]',
      '[data-testid="output-container"] code',
      '.pre-container code',
      'code',
      'pre code'
    ];

    let outputFound = false;
    for (const selector of outputSelectors) {
      try {
        const text = await page.textContent(selector);
        if (text && text.includes('Distributed Union')) {
          outputFound = true;
          DEBUG && console.log(`Found rendered output using selector "${selector}"`);
          expect(text).toContain('Distributed Union');
          break;
        }
      } catch {
        // Try next selector
      }
    }

    expect(outputFound).toBe(true);
  });

  test('should load dca_plan.yaml sample file', async ({ page }) => {
    // Complete test setup with WASM initialization
    await setupCompleteTest(page, test, { debug: DEBUG });

    // Click the "Load dca_plan.yaml" button
    const planButton = page.locator('button:has-text("Load dca_plan.yaml")');
    await expect(planButton).toBeVisible();
    await expect(planButton).toBeEnabled();
    
    // Click the button
    await planButton.click();

    // Wait for the file to be loaded into the textarea
    await page.waitForTimeout(500); // Allow time for file to load
    
    // Verify the content was loaded
    const textareaContent = await page.locator('textarea.input-area').inputValue();
    expect(textareaContent).toBeTruthy();
    expect(textareaContent).toContain('metadata');
    expect(textareaContent).toContain('planNodes');
    
    // Wait for auto-render to complete
    await page.waitForTimeout(1000);
    
    // Verify the output was rendered
    const outputSelectors = [
      '[data-testid="output-code"]',
      '[data-testid="output-container"] code',
      '.pre-container code',
      'code',
      'pre code'
    ];

    let outputFound = false;
    for (const selector of outputSelectors) {
      try {
        const text = await page.textContent(selector);
        if (text && (text.includes('Distributed Union') || text.includes('ID') || text.includes('Operator'))) {
          outputFound = true;
          DEBUG && console.log(`Found rendered output using selector "${selector}"`);
          break;
        }
      } catch {
        // Try next selector
      }
    }

    expect(outputFound).toBe(true);
  });

  test('should handle sample file loading errors gracefully', async ({ page }) => {
    // Complete test setup with WASM initialization
    await setupCompleteTest(page, test, { debug: DEBUG });

    // Intercept fetch requests to simulate error
    await page.route('**/testdata/dca_profile.yaml', route => {
      route.fulfill({
        status: 404,
        contentType: 'text/plain',
        body: 'Not Found'
      });
    });

    // Click the "Load dca_profile.yaml" button
    const profileButton = page.locator('button:has-text("Load dca_profile.yaml")');
    await expect(profileButton).toBeVisible();
    await expect(profileButton).toBeEnabled();
    
    // Click the button
    await profileButton.click();

    // Wait for error message
    await page.waitForTimeout(500);
    
    // Check for error message in the UI
    const messageElement = page.locator('.placeholder, [data-testid="message-placeholder"]');
    const messageText = await messageElement.textContent();
    
    // Should show an error message
    expect(messageText).toContain('Error');
    expect(messageText?.toLowerCase()).toContain('error loading sample file');
  });

  test('should disable sample file buttons when rendering is in progress', async ({ page }) => {
    // Complete test setup with WASM initialization
    await setupCompleteTest(page, test, { debug: DEBUG });

    // First load a sample file
    const profileButton = page.locator('button:has-text("Load dca_profile.yaml")');
    await profileButton.click();
    
    // Wait for content to load and start rendering
    await page.waitForTimeout(500);
    
    // During rendering, buttons should be disabled
    // Check if buttons are disabled during rendering
    const isRendering = await page.evaluate(() => {
      const message = document.querySelector('.placeholder, [data-testid="message-placeholder"]');
      return message?.textContent?.includes('Rendering') ?? false;
    });

    if (isRendering) {
      // Sample file buttons should be disabled during rendering
      await expect(profileButton).toBeDisabled();
      const planButton = page.locator('button:has-text("Load dca_plan.yaml")');
      await expect(planButton).toBeDisabled();
    }

    // Wait for rendering to complete
    await page.waitForTimeout(2000);
    
    // After rendering, buttons should be enabled again
    await expect(profileButton).toBeEnabled();
    const planButton = page.locator('button:has-text("Load dca_plan.yaml")');
    await expect(planButton).toBeEnabled();
  });
});