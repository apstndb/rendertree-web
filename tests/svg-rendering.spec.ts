import { test, expect } from '@playwright/test';
import {
  setupCompleteTest,
  uploadTestFile,
  selectOutputView,
  waitForDiagramComplete,
} from './utils';

test.describe('SVG Rendering', () => {
  test.setTimeout(120000);

  test('should render a query plan as Graphviz SVG', async ({ page }) => {
    await setupCompleteTest(page, test);
    await selectOutputView(page, 'svg');
    await uploadTestFile(page, 'dca_profile.yaml');
    await waitForDiagramComplete(page);

    const diagram = page.getByTestId('diagram-output');
    await expect(diagram).toBeVisible();
    await expect(diagram.locator('svg')).toBeVisible();
    await expect(diagram.locator('svg')).toContainText(/Distributed/i);
  });

  test('should not show ASCII output when SVG view is selected', async ({ page }) => {
    await setupCompleteTest(page, test);
    await uploadTestFile(page, 'dca_profile.yaml');
    await expect(page.getByTestId('output-code')).toContainText('Distributed Union', { timeout: 60000 });

    await selectOutputView(page, 'svg');
    await waitForDiagramComplete(page);

    await expect(page.getByTestId('output-code')).toHaveCount(0);
    await expect(page.getByTestId('diagram-output').locator('svg')).toBeVisible();
  });

  test('should download Graphviz SVG with svg extension', async ({ page }) => {
    await setupCompleteTest(page, test);
    await selectOutputView(page, 'svg');
    await uploadTestFile(page, 'dca_profile.yaml');
    await waitForDiagramComplete(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-button').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('query-plan.svg');
  });

  test('should keep SVG output copyable', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions are configured for Chromium only');

    await setupCompleteTest(page, test);
    await selectOutputView(page, 'svg');
    await uploadTestFile(page, 'dca_profile.yaml');
    await waitForDiagramComplete(page);

    await page.getByTestId('copy-button').click();
    await expect(page.getByTestId('copy-button')).toHaveText(/copied/i, { timeout: 5000 });

    const clipboardText = await page.evaluate(async () => navigator.clipboard.readText());
    expect(clipboardText).toContain('<svg');
  });
});
