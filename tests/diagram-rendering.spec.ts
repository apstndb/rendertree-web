import { test, expect } from '@playwright/test';
import {
  setupCompleteTest,
  uploadTestFile,
  selectOutputView,
  waitForDiagramComplete,
} from './utils';

const DEBUG = process.env.DEBUG === 'true';

test.describe('Diagram Rendering', () => {
  test.setTimeout(120000);

  test('should render a query plan as a Mermaid SVG diagram', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'diagram');
    await uploadTestFile(page, 'dca_profile.yaml');
    await waitForDiagramComplete(page);

    const diagram = page.getByTestId('diagram-output');
    await expect(diagram).toBeVisible();
    await expect(diagram.locator('svg')).toBeVisible();

    await expect(diagram).toContainText(/Distributed/i);
    await expect(diagram).toContainText(/Scan/i);
  });

  test('should switch between ASCII and diagram views', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await uploadTestFile(page, 'dca_profile.yaml');

    await expect(page.getByTestId('output-code')).toContainText('Distributed Union', { timeout: 60000 });

    await selectOutputView(page, 'diagram');
    await waitForDiagramComplete(page);
    await expect(page.getByTestId('output-code')).toHaveCount(0);
    await expect(page.getByTestId('diagram-output').locator('svg')).toBeVisible();

    await selectOutputView(page, 'ascii');
    await expect(page.getByTestId('output-code')).toContainText('Distributed Union', { timeout: 60000 });
    await expect(page.getByTestId('diagram-output').locator('svg')).toHaveCount(0);
  });

  test('should keep diagram source copyable', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions are configured for Chromium only');

    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'diagram');
    await uploadTestFile(page, 'dca_profile.yaml');
    await waitForDiagramComplete(page);

    await page.getByTestId('copy-button').click();
    await expect(page.getByTestId('copy-button')).toHaveText(/copied/i, { timeout: 5000 });

    const clipboardText = await page.evaluate(async () => navigator.clipboard.readText());
    expect(clipboardText).toContain('graph TD');
    expect(clipboardText).toContain('Distributed&nbsp;Union');
  });

  test('should expose diagram zoom controls instead of font size', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'diagram');

    await expect(page.getByTestId('diagram-zoom-controls')).toBeVisible();
    await expect(page.getByTestId('diagram-zoom-display')).toHaveText('100%');
    await expect(page.locator('#decrease-font')).toHaveCount(0);
  });

  test('should zoom the rendered diagram and enable scrolling when enlarged', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'diagram');
    await uploadTestFile(page, 'dca_profile.yaml');
    await waitForDiagramComplete(page);

    const container = page.getByTestId('diagram-scroll');
    const initialScrollWidth = await container.evaluate((el) => el.scrollWidth);

    await page.getByTestId('diagram-zoom-in').click();
    await expect(page.getByTestId('diagram-zoom-display')).toHaveText('110%');
    await expect(page.locator('[data-diagram-zoom="110"]')).toBeVisible();

    await expect.poll(async () => container.evaluate((el) => el.scrollWidth)).toBeGreaterThan(initialScrollWidth);
  });

  test('should download Mermaid source with mermaid extension', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'diagram');
    await uploadTestFile(page, 'dca_profile.yaml');
    await waitForDiagramComplete(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-button').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('query-plan.mermaid');
  });

  test('should fit the diagram to the visible container', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'diagram');
    await uploadTestFile(page, 'dca_profile.yaml');
    await waitForDiagramComplete(page);

    for (let i = 0; i < 10; i += 1) {
      await page.getByTestId('diagram-zoom-in').click();
    }
    await expect(page.getByTestId('diagram-zoom-display')).toHaveText('200%');

    await page.getByTestId('diagram-zoom-fit').click();

    const fitZoom = await page.getByTestId('diagram-zoom-display').textContent();
    expect(fitZoom).toMatch(/^\d+%$/);
    expect(Number.parseInt(fitZoom ?? '0', 10)).toBeLessThan(200);

    const container = page.getByTestId('diagram-scroll');
    await container.dispatchEvent('wheel', { deltaY: -50, ctrlKey: true });
    await expect(page.getByTestId('diagram-zoom-display')).not.toHaveText(fitZoom ?? '');
  });
});
