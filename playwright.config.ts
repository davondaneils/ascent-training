import { defineConfig, devices } from "@playwright/test";

// Critical-flow E2E. Specs arrive with auth + database (slice 2) and need a Supabase dev project.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    timezoneId: "America/Toronto",
  },
  projects: [
    { name: "iphone-se", use: { ...devices["iPhone SE (3rd gen)"], viewport: { width: 375, height: 812 } } },
    { name: "iphone-14", use: { ...devices["iPhone 14"], viewport: { width: 390, height: 844 } } },
    { name: "iphone-pro-max", use: { ...devices["iPhone 14 Pro Max"], viewport: { width: 430, height: 932 } } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
