import { defineConfig, devices } from '@playwright/test';

/**
 * The FastAPI backend (http://localhost:8000) and Postgres are external
 * dependencies for this suite (websocket presence, auth, message history).
 * They are NOT started by Playwright — start them yourself before running
 * `npm run e2e`. Only the Angular dev server is managed here, and only if
 * one isn't already running on baseURL.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
