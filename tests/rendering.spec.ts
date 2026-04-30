import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  setupCompleteTest,
  uploadTestFile
} from './utils';

const DEBUG = process.env.DEBUG === 'true';

test.describe('Query Plan Rendering', () => {
  test.setTimeout(120000);

  test('should render a simple query plan', async ({ page }) => {
    // Complete test setup with WASM initialization
    await setupCompleteTest(page, test, { debug: DEBUG });

    // Upload test file
    await uploadTestFile(page, 'dca_profile.yaml');

    await verifyOutput(page);
  });
});

/**
 * Verifies that output contains expected content
 */
async function verifyOutput(page: Page) {
  const output = page.getByTestId('output-code');
  await expect(output).toContainText('Distributed Union', { timeout: 60000 });
}
