import { test, expect } from '@playwright/test';
import {
  setupCompleteTest,
  uploadTestFile,
  selectOutputView,
} from './utils';

const DEBUG = process.env.DEBUG === 'true';

test.describe('D2 Source Rendering', () => {
  test.setTimeout(120000);

  test('should render a query plan as D2 source text', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'd2');
    await uploadTestFile(page, 'dca_profile.yaml');

    const output = page.getByTestId('d2-output-code');
    await expect(output).toContainText('direction: down', { timeout: 60000 });
    await expect(output).toContainText('node0');
    await expect(output).toContainText(/Distributed/i);

    // The hint tells users how to render the source externally with the d2 CLI.
    await expect(page.getByTestId('d2-hint')).toContainText('d2 plan.d2 plan.svg');
  });

  test('should switch between ASCII and D2 views', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await uploadTestFile(page, 'dca_profile.yaml');

    await expect(page.getByTestId('output-code')).toContainText('Distributed Union', { timeout: 60000 });

    await selectOutputView(page, 'd2');
    await expect(page.getByTestId('d2-output-code')).toContainText('direction: down', { timeout: 60000 });
    await expect(page.getByTestId('output-code')).toHaveCount(0);

    await selectOutputView(page, 'ascii');
    await expect(page.getByTestId('output-code')).toContainText('Distributed Union', { timeout: 60000 });
    await expect(page.getByTestId('d2-output-code')).toHaveCount(0);
  });

  test('should download D2 source with d2 extension', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'd2');
    await uploadTestFile(page, 'dca_profile.yaml');
    await expect(page.getByTestId('d2-output-code')).toContainText('direction: down', { timeout: 60000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-button').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('query-plan.d2');
  });

  test('should keep D2 source copyable', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions are configured for Chromium only');

    await setupCompleteTest(page, test, { debug: DEBUG });
    await selectOutputView(page, 'd2');
    await uploadTestFile(page, 'dca_profile.yaml');
    await expect(page.getByTestId('d2-output-code')).toContainText('direction: down', { timeout: 60000 });

    await page.getByTestId('copy-button').click();
    await expect(page.getByTestId('copy-button')).toHaveText(/copied/i, { timeout: 5000 });

    const clipboardText = await page.evaluate(async () => navigator.clipboard.readText());
    expect(clipboardText).toContain('direction: down');
    expect(clipboardText).toContain('node0');
  });
});
