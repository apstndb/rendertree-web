import type { Page, ScreenshotOptions } from '@playwright/test';
import { join } from 'path';

/**
 * Default screenshot options
 */
const DEFAULT_SCREENSHOT_OPTIONS: ScreenshotOptions = {
  fullPage: true
};

/**
 * Generates a standardized screenshot file name
 * @param testName - Name of the test or component being screenshotted
 * @param step - Specific step or state being captured
 * @param browserName - Browser name (optional, will be auto-detected)
 * @returns Standardized screenshot file name
 */
export function generateScreenshotName(
  testName: string, 
  step: string, 
  browserName?: string
): string {
  // Clean up test name and step for file system compatibility
  const cleanTestName = testName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanStep = step.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  const parts = [cleanTestName, cleanStep];
  
  if (browserName) {
    parts.push(browserName);
  }
  
  return `${parts.join('-')}.png`;
}

/**
 * Gets the full path for a screenshot file
 * @param fileName - Screenshot file name
 * @param resultsDir - Results directory (default: 'test-results')
 * @returns Full path to screenshot file
 */
export function getScreenshotPath(fileName: string, resultsDir: string = 'test-results'): string {
  return join(resultsDir, fileName);
}

/**
 * Takes a screenshot with standardized naming and options
 * @param page - Playwright page object
 * @param name - Descriptive name for the screenshot
 * @param options - Screenshot options (will be merged with defaults)
 * @returns Promise that resolves when screenshot is saved
 */
export async function takeScreenshot(
  page: Page, 
  name: string, 
  options: ScreenshotOptions = {}
): Promise<void> {
  const mergedOptions = { ...DEFAULT_SCREENSHOT_OPTIONS, ...options };
  const fileName = name.endsWith('.png') ? name : `${name}.png`;
  const screenshotPath = getScreenshotPath(fileName);
  
  await page.screenshot({ 
    path: screenshotPath,
    ...mergedOptions 
  });
}

/**
 * Takes a screenshot with test context (auto-generates name based on test and step)
 * @param page - Playwright page object
 * @param testName - Name of the current test
 * @param step - Current step or state
 * @param options - Screenshot options
 */
export async function takeTestScreenshot(
  page: Page,
  testName: string,
  step: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const browserName = page.context().browser()?.browserType().name();
  const fileName = generateScreenshotName(testName, step, browserName);
  await takeScreenshot(page, fileName, options);
}

/**
 * Screenshot workflow helpers for common UI interaction sequences
 */
export class ScreenshotWorkflow {
  private page: Page;
  private testName: string;
  private stepCounter: number = 0;

  constructor(page: Page, testName: string) {
    this.page = page;
    this.testName = testName;
  }

  /**
   * Takes a screenshot for the current step and increments counter
   * @param stepDescription - Description of the current step
   * @param options - Screenshot options
   */
  async captureStep(stepDescription: string, options: ScreenshotOptions = {}): Promise<void> {
    this.stepCounter++;
    const stepName = `step-${this.stepCounter.toString().padStart(2, '0')}-${stepDescription}`;
    await takeTestScreenshot(this.page, this.testName, stepName, options);
  }

  /**
   * Captures initial page load state
   */
  async captureInitialState(options: ScreenshotOptions = {}): Promise<void> {
    await this.captureStep('initial-load', options);
  }

  /**
   * Captures state after file upload
   */
  async captureAfterUpload(options: ScreenshotOptions = {}): Promise<void> {
    await this.captureStep('after-file-upload', options);
  }

  /**
   * Captures state after clicking render
   */
  async captureAfterRender(options: ScreenshotOptions = {}): Promise<void> {
    await this.captureStep('after-render-click', options);
  }

  /**
   * Captures final rendered output
   */
  async captureFinalOutput(options: ScreenshotOptions = {}): Promise<void> {
    await this.captureStep('final-output', options);
  }

  /**
   * Captures error state
   */
  async captureError(errorType: string, options: ScreenshotOptions = {}): Promise<void> {
    await this.captureStep(`error-${errorType}`, options);
  }

  /**
   * Gets the current step count
   */
  getStepCount(): number {
    return this.stepCounter;
  }

  /**
   * Resets the step counter
   */
  resetStepCounter(): void {
    this.stepCounter = 0;
  }
}

/**
 * Creates a new screenshot workflow for a test
 * @param page - Playwright page object
 * @param testName - Name of the test
 * @returns New ScreenshotWorkflow instance
 */
export function createScreenshotWorkflow(page: Page, testName: string): ScreenshotWorkflow {
  return new ScreenshotWorkflow(page, testName);
}