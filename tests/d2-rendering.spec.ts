import { test, expect } from '@playwright/test';
import {
  setupCompleteTest,
  uploadTestFile,
  selectOutputView,
  waitForDiagramComplete,
} from './utils';

const DEBUG = process.env.DEBUG === 'true';

test.describe('D2 Diagram Rendering', () => {
  test.setTimeout(120000);

  test('should render a query plan as a D2 diagram', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'd2');
    await uploadTestFile(page, 'dca_profile.yaml');

    // The D2 view now lays the diagram out in-browser via @terrastruct/d2 and
    // shows the resulting SVG (the first render also downloads the large lazy
    // D2 chunk, hence the generous timeout).
    await waitForDiagramComplete(page);
    const diagram = page.getByTestId('diagram-output');
    await expect(diagram).toBeVisible();
    // D2 embeds per-shape icon <svg> elements, so scope to the outer diagram SVG.
    const outerSvg = diagram.locator('svg').first();
    await expect(outerSvg).toBeVisible();
    await expect(outerSvg).toContainText(/Distributed/i);
  });

  test('should switch between ASCII and D2 views', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await uploadTestFile(page, 'dca_profile.yaml');

    await expect(page.getByTestId('output-code')).toContainText('Distributed Union', { timeout: 60000 });

    await selectOutputView(page, 'd2');
    await waitForDiagramComplete(page);
    await expect(page.getByTestId('diagram-output').locator('svg').first()).toBeVisible();
    await expect(page.getByTestId('output-code')).toHaveCount(0);

    await selectOutputView(page, 'ascii');
    await expect(page.getByTestId('output-code')).toContainText('Distributed Union', { timeout: 60000 });
    await expect(page.getByTestId('diagram-output')).toHaveCount(0);
  });

  test('should download the D2 source with a d2 extension', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'd2');
    await uploadTestFile(page, 'dca_profile.yaml');
    await waitForDiagramComplete(page);

    // Copy/Download keep operating on the raw D2 source, not the rendered SVG.
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-button').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('query-plan.d2');
  });

  test('should keep the D2 source copyable', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions are configured for Chromium only');

    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'd2');
    await uploadTestFile(page, 'dca_profile.yaml');
    await waitForDiagramComplete(page);

    await page.getByTestId('copy-button').click();
    await expect(page.getByTestId('copy-button')).toHaveText(/copied/i, { timeout: 5000 });

    // The clipboard carries the D2 source (not the SVG markup).
    const clipboardText = await page.evaluate(async () => navigator.clipboard.readText());
    expect(clipboardText).toContain('direction: down');
    expect(clipboardText).toContain('node0');
  });
});
