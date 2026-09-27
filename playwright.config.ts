import { defineConfig, devices } from "@playwright/test";

// Critical-flow E2E against the real Supabase project, as a dedicated test account (E2E_EMAIL).
// Serial: the specs share that account's data and the server-side dev clock cookie.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    navigationTimeout: 60_000,
    trace: "retain-on-failure",
    timezoneId: "America/Toronto",
    storageState: "tests/e2e/.auth/user.json",
  },
  projects: [
    // Chromium with iPhone-sized viewport and touch (Chromium only, to keep the install small).
    { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  // A production build (fast, prod-like). The dev clock override is enabled explicitly for tests only.
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100/login",
    env: { ASCENT_ALLOW_TIME_OVERRIDE: "1" },
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
  },
});
