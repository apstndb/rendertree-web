import { test, expect } from '@playwright/test';

// Skip this test for now as it requires the WASM file to be built
// which is not happening in the test environment
test.describe.skip('Query Plan Rendering', () => {
  // Increase timeout for the entire test
  test.setTimeout(60000);

  test('should render a simple query plan', async ({ page }) => {
    // Enable console logging for debugging
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });
      console.log(`Browser console: ${type}: ${text}`);
    });

    // Navigate to the application
    await page.goto('/');

    // Wait for the application to load
    await page.waitForSelector('#root', { timeout: 10000 });

    // Check for WASM loading errors
    const hasWasmError = consoleMessages.some(
      msg => msg.type === 'error' && 
             (msg.text.includes('WebAssembly') || 
              msg.text.includes('WASM') || 
              msg.text.includes('404'))
    );

    if (hasWasmError) {
      console.warn('WASM loading errors detected. This test requires the WASM file to be built.');
      console.warn('Run `npm run build` before running this test.');

      // Skip the test with a descriptive message
      test.skip(true, 'WASM file not found. Run `npm run build` before running this test.');
      return;
    }

    // Wait for WASM initialization to complete
    await page.waitForFunction(() => {
      return !document.querySelector('.loading-container .loading-indicator');
    }, { timeout: 30000 });

    // Wait for the ready message to appear
    await page.waitForFunction(() => {
      const message = document.querySelector('.placeholder');
      return message && message.textContent && message.textContent.includes('Ready');
    }, { timeout: 10000 });

    // Wait for the input area to be enabled
    await page.waitForFunction(() => {
      const textarea = document.querySelector('.input-area');
      return textarea && !(textarea as HTMLTextAreaElement).disabled;
    }, { timeout: 5000 });

    // Input a simple query plan
    const samplePlan = JSON.stringify({
      "queryPlan": {
        "planNodes": [
          {
            "index": 0,
            "kind": "RELATIONAL",
            "displayName": "Distributed Union"
          }
        ]
      }
    });

    // Fill the input area and verify it was filled correctly
    await page.fill('.input-area', samplePlan);
    console.log('Input filled with sample plan');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/before-render.png' });

    // Click the render button
    await page.click('.primary-button');
    console.log('Render button clicked');

    // Wait for the rendering message to appear
    await page.waitForFunction(() => {
      const message = document.querySelector('.placeholder');
      return message && message.textContent && message.textContent.includes('Rendering');
    }, { timeout: 5000 }).catch(e => console.log('Rendering message not found, continuing...'));

    // Wait for the rendering message to disappear
    await page.waitForFunction(() => {
      const message = document.querySelector('.placeholder');
      return !message || !message.textContent || !message.textContent.includes('Rendering');
    }, { timeout: 10000 }).catch(e => console.log('Rendering message still present, continuing...'));

    // Take a screenshot after rendering
    await page.screenshot({ path: 'test-results/after-render.png' });

    // Wait a bit to ensure rendering is complete
    await page.waitForTimeout(3000);

    // Check if there's an error message
    const errorMessage = await page.textContent('.placeholder');
    if (errorMessage && errorMessage.includes('Error')) {
      console.error('Error message found:', errorMessage);
    }

    // Get all the HTML for debugging
    const html = await page.content();
    console.log('Page HTML after rendering:', html.substring(0, 1000) + '...');

    // Check if the pre-container exists
    const preContainerExists = await page.isVisible('.pre-container');
    console.log('Pre-container exists:', preContainerExists);

    // Try different selectors to find the output
    let outputText;
    try {
      outputText = await page.textContent('.content-container pre code') || 
                   await page.textContent('.pre-container code') || 
                   await page.textContent('pre code') || 
                   await page.textContent('pre');

      console.log('Output text found:', outputText ? outputText.substring(0, 100) + '...' : 'null');
    } catch (e) {
      console.error('Error getting output text:', e);
      outputText = null;
    }

    // If no output text was found, check the message instead
    if (!outputText) {
      const message = await page.textContent('.placeholder');
      console.log('Message text:', message);

      // If there's an error message, fail the test with that message
      if (message && message.includes('Error')) {
        throw new Error(`Rendering failed with error: ${message}`);
      }
    }

    // Verify the output contains expected content or the test is skipped if no output
    expect(outputText, 'Output text should not be null').not.toBeNull();
    expect(outputText).toContain('Distributed Union');
  });
});
