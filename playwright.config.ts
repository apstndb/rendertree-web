import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:5173/';
const webServer = process.env.BASE_URL
  ? undefined
  : {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    };

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : '50%',
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Grant clipboard permissions for testing copy functionality
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox uses different clipboard permission names
        // Remove unsupported permissions for Firefox
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // WebKit uses different clipboard permission names
        // Remove unsupported permissions for WebKit
      },
    },
  ],
  ...(webServer ? { webServer } : {}),
});
