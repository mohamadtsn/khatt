import { defineConfig, devices } from '@playwright/test';

/* The tests run against the real static export, not the dev server. The dev
   server serves every module eagerly, which would make the "a document with no
   diagram fetches zero diagram bytes" assertions meaningless. */
export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  webServer: {
    command: 'npm run build && npm run serve:out',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
});
