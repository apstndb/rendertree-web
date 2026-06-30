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
