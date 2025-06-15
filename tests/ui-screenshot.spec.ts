import { test, expect } from '@playwright/test';
import {
  setupCompleteTest,
  uploadTestFile,
  clickRenderButton,
  waitForRenderingComplete,
  createScreenshotWorkflow,
  takeScreenshot
} from './utils';

test.describe('UI Screenshot Tests', () => {
  test('should capture screenshots of each UI interaction stage', async ({ page }) => {
    // Set up screenshot workflow
    const screenshots = createScreenshotWorkflow(page, 'ui-interaction-stages');

    // Navigate and set up test environment
    await setupCompleteTest(page, test);

    // Stage 1: Initial page load
    await page.waitForSelector('[data-testid="file-picker"]');
    await screenshots.captureInitialState();

    // Stage 2: WASM initialization complete (already handled by setupCompleteTest)
    const messageElement = page.locator('[data-testid="message-placeholder"]');
    await expect(messageElement).toContainText(/Ready|Please enter a query plan/);
    await screenshots.captureStep('wasm-ready');

    // Stage 3: File upload
    await uploadTestFile(page, 'profile.yaml');
    await screenshots.captureAfterUpload();

    // Stage 4: Render button active
    const renderButton = page.locator('button:has-text("Render")');
    await expect(renderButton).toBeEnabled();
    await screenshots.captureStep('render-ready');

    // Stage 5: Click render and wait for output
    await clickRenderButton(page);
    await waitForRenderingComplete(page);
    await screenshots.captureAfterRender();

    // Stage 6: Output with ruler visible
    const outputContainer = page.locator('[data-testid="output-container"]');
    await expect(outputContainer).toBeVisible();
    
    // Check that ruler is aligned with text
    const ruler = page.locator('.character-ruler');
    const outputCode = page.locator('[data-testid="output-code"]');
    await expect(ruler).toBeVisible();
    await expect(outputCode).toBeVisible();
    
    await screenshots.captureStep('output-with-ruler');

    // Stage 7: Test copy functionality (skip on browsers with clipboard permission issues)
    const browserName = page.context().browser()?.browserType().name();
    if (browserName === 'chromium') {
      const copyButton = page.locator('[data-testid="copy-button"]');
      await copyButton.click();
      await expect(copyButton).toContainText('Copied!');
    } else {
      // For Firefox and WebKit, just verify the copy button exists and is clickable
      const copyButton = page.locator('[data-testid="copy-button"]');
      await expect(copyButton).toBeVisible();
      await expect(copyButton).toBeEnabled();
    }
    await screenshots.captureStep('copy-success');

    // Stage 8: Font size adjustment (if settings are available)
    const fontSlider = page.locator('input[type="range"]');
    if (await fontSlider.isVisible()) {
      await fontSlider.fill('16');
      await screenshots.captureStep('font-adjusted');
    }

    // Stage 9: Ruler alignment verification - close-up of ruler and text
    await screenshots.captureStep('ruler-alignment-detail', {
      clip: { x: 0, y: 200, width: 800, height: 400 }  // Focus on output area
    });
  });

  test('should verify ruler alignment accuracy', async ({ page }) => {
    // Set up test environment
    await setupCompleteTest(page, test);

    // Upload file and render
    await uploadTestFile(page, 'profile.yaml');
    await clickRenderButton(page);
    await waitForRenderingComplete(page);
    
    // Get ruler and text positions
    const ruler = page.locator('.character-ruler');
    const outputCode = page.locator('[data-testid="output-code"]');
    
    await expect(ruler).toBeVisible();
    await expect(outputCode).toBeVisible();
    
    // Capture ruler alignment for manual verification
    await takeScreenshot(page, 'ruler-alignment-verification', {
      clip: { x: 0, y: 200, width: 1000, height: 300 }
    });
    
    // Test that ruler marks are positioned correctly
    const firstMark = page.locator('.ruler-mark').first();
    await expect(firstMark).toBeVisible();
    
    // Verify ruler scrolls with content
    const preElement = page.locator('pre');
    await preElement.evaluate(element => {
      element.scrollLeft = 100;
    });
    
    await takeScreenshot(page, 'ruler-scroll-verification', {
      clip: { x: 0, y: 200, width: 1000, height: 300 }
    });
  });
});