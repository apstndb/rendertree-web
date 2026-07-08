import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  setupCompleteTest,
  uploadTestFile,
} from './utils';

const DEBUG = process.env.DEBUG === 'true';

// Regression coverage for two follow-up fixes on top of PR #37 (both defects
// pre-existed that PR):
//   1. A failing render after a successful one must surface the error and drop
//      the stale output, instead of silently leaving the old output on screen.
//   2. Switching the output view must render exactly once, not twice.
test.describe('Render error visibility and single render on view switch', () => {
  test.setTimeout(120000);

  test('failing render after a successful one shows the error and clears stale output', async ({ page }) => {
    await setupCompleteTest(page, test, { debug: DEBUG });

    // First, render a valid plan so the ASCII view has real output on screen.
    await uploadTestFile(page, 'dca_profile.yaml');
    const output = page.getByTestId('output-code');
    await expect(output).toContainText('Distributed Union', { timeout: 60000 });

    // Now submit invalid input. `{` fails both JSON and YAML parsing, so the
    // WASM render rejects. The auto-render debounce in InputPanel picks up the
    // input change and triggers the failing render.
    await page.getByTestId('plan-input').fill('{');

    // The error placeholder must become visible...
    const placeholder = page.getByTestId('message-placeholder');
    await expect(placeholder).toBeVisible({ timeout: 60000 });
    await expect(placeholder).toContainText('Error', { timeout: 60000 });

    // ...and the previous (now stale) successful output must be gone.
    await expect(page.getByTestId('output-container')).toHaveCount(0);
  });

  test('switching the output view renders exactly once', async ({ page }) => {
    // The render counter reads logger.info output, which production builds
    // suppress by default. loglevel honors a level persisted under the
    // "loglevel" localStorage key (see src/utils/logger.ts), so raise it
    // before any app script runs -- this keeps the test valid in preview mode.
    await page.addInitScript(() => localStorage.setItem('loglevel', 'INFO'));
    const { consoleMessages } = await setupCompleteTest(page, test, { debug: DEBUG });

    // Render a valid plan in the default ASCII view.
    await uploadTestFile(page, 'dca_profile.yaml');
    await expect(page.getByTestId('output-code')).toContainText('Distributed Union', {
      timeout: 60000,
    });

    // Let any in-flight debounced auto-render settle, then take a baseline of
    // the console log so we only count renders triggered by the view switch.
    // logger.info('Starting rendering process') fires exactly once per render
    // that passes the empty-input guard (dev build emits info logs to console).
    await settle(page);
    const baselineRenderCount = countRenders(consoleMessages);

    // Switch to the D2 diagram view. The render counter is incremented
    // synchronously at handleRender start (before any await), so it is already
    // accurate regardless of how long the D2 layout / lazy-chunk load takes;
    // still, wait for the diagram so the switch's render has actually run.
    await page.getByTestId('output-view-select').selectOption('d2');
    await expect(page.getByTestId('diagram-output').locator('svg').first()).toBeVisible({ timeout: 60000 });

    // Wait past the auto-render debounce window (200ms) for any second render to
    // appear, then assert exactly one render happened for the view switch.
    await settle(page);
    const rendersForSwitch = countRenders(consoleMessages) - baselineRenderCount;
    expect(rendersForSwitch).toBe(1);
  });
});

function countRenders(consoleMessages: Array<{ text: string }>): number {
  return consoleMessages.filter((msg) => msg.text.includes('Starting rendering process')).length;
}

async function settle(page: Page): Promise<void> {
  // Comfortably longer than the 200ms InputPanel auto-render debounce so a
  // second (buggy) render would have been logged by the time we count.
  await page.waitForTimeout(800);
}
