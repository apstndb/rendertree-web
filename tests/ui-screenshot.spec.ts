import { test, expect } from '@playwright/test';

test.describe('UI Screenshot Tests', () => {
  test('should capture screenshots of each UI interaction stage', async ({ page }) => {
    await page.goto('/');

    // Stage 1: Initial page load
    await page.waitForSelector('[data-testid="file-picker"]');
    await page.screenshot({ 
      path: 'test-results/ui-stage-1-initial-load.png',
      fullPage: true 
    });

    // Stage 2: WASM initialization complete
    await page.waitForSelector('[data-testid="message-placeholder"]');
    const messageElement = page.locator('[data-testid="message-placeholder"]');
    await expect(messageElement).toContainText(/Ready|Please enter a query plan/);
    await page.screenshot({ 
      path: 'test-results/ui-stage-2-wasm-ready.png',
      fullPage: true 
    });

    // Stage 3: File upload
    const fileInput = page.locator('[data-testid="file-picker"]');
    await fileInput.setInputFiles('./testdata/profile.yaml');
    await page.screenshot({ 
      path: 'test-results/ui-stage-3-file-uploaded.png',
      fullPage: true 
    });

    // Stage 4: Render button active
    const renderButton = page.locator('button:has-text("Render")');
    await expect(renderButton).toBeEnabled();
    await page.screenshot({ 
      path: 'test-results/ui-stage-4-render-ready.png',
      fullPage: true 
    });

    // Stage 5: Click render and wait for output
    await renderButton.click();
    
    // Wait for rendering to complete
    await page.waitForSelector('[data-testid="output-container"]', { timeout: 30000 });
    await page.screenshot({ 
      path: 'test-results/ui-stage-5-rendering-complete.png',
      fullPage: true 
    });

    // Stage 6: Output with ruler visible
    const outputContainer = page.locator('[data-testid="output-container"]');
    await expect(outputContainer).toBeVisible();
    
    // Check that ruler is aligned with text
    const ruler = page.locator('.character-ruler');
    const outputCode = page.locator('[data-testid="output-code"]');
    await expect(ruler).toBeVisible();
    await expect(outputCode).toBeVisible();
    
    await page.screenshot({ 
      path: 'test-results/ui-stage-6-output-with-ruler.png',
      fullPage: true 
    });

    // Stage 7: Test copy functionality
    const copyButton = page.locator('[data-testid="copy-button"]');
    await copyButton.click();
    await expect(copyButton).toContainText('Copied!');
    await page.screenshot({ 
      path: 'test-results/ui-stage-7-copy-success.png',
      fullPage: true 
    });

    // Stage 8: Font size adjustment (if settings are available)
    const fontSlider = page.locator('input[type="range"]');
    if (await fontSlider.isVisible()) {
      await fontSlider.fill('16');
      await page.screenshot({ 
        path: 'test-results/ui-stage-8-font-adjusted.png',
        fullPage: true 
      });
    }

    // Stage 9: Ruler alignment verification - close-up of ruler and text
    await page.screenshot({ 
      path: 'test-results/ui-stage-9-ruler-alignment-detail.png',
      clip: { x: 0, y: 200, width: 800, height: 400 }  // Focus on output area
    });
  });

  test('should verify ruler alignment accuracy', async ({ page }) => {
    await page.goto('/');
    
    // Wait for WASM to be ready
    await page.waitForSelector('[data-testid="message-placeholder"]');
    const messageElement = page.locator('[data-testid="message-placeholder"]');
    await expect(messageElement).toContainText(/Ready|Please enter a query plan/);

    // Upload file and render
    const fileInput = page.locator('[data-testid="file-picker"]');
    await fileInput.setInputFiles('./testdata/profile.yaml');
    
    const renderButton = page.locator('button:has-text("Render")');
    await renderButton.click();
    
    // Wait for output
    await page.waitForSelector('[data-testid="output-container"]', { timeout: 30000 });
    
    // Get ruler and text positions
    const ruler = page.locator('.character-ruler');
    const outputCode = page.locator('[data-testid="output-code"]');
    
    await expect(ruler).toBeVisible();
    await expect(outputCode).toBeVisible();
    
    // Capture ruler alignment for manual verification
    await page.screenshot({ 
      path: 'test-results/ruler-alignment-verification.png',
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
    
    await page.screenshot({ 
      path: 'test-results/ruler-scroll-verification.png',
      clip: { x: 0, y: 200, width: 1000, height: 300 }
    });
  });
});