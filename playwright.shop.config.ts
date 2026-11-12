import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /shop-e2e\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  timeout: 90000,
  use: {
    baseURL,
    trace: "off",
    video: "off",
    channel: "msedge",
  },
  projects: [
    {
      name: "msedge-desktop",
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
  webServer: {
    command: "npx next start -p 3100",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || ".next-e2e",
    },
  },
});

