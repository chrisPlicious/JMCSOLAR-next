import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal, self-contained Playwright config for the Phase 3 e-commerce E2E.
 * The dev server is started separately by the QA run with PAYMENT_PROVIDER=stub
 * (Next honors a real shell env var over .env.local), so this config only points
 * at the already-running server and reuses it.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 90_000,
  expect: { timeout: 20_000 },
  outputDir: './e2e/__artifacts__/test-results',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
