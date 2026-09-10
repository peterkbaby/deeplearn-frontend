import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node tests/mock-api.mjs",
      url: "http://127.0.0.1:8100",
      reuseExistingServer: false,
    },
    {
      command: process.env.TEST_PRODUCTION
        ? "npm run start -- --port 3100"
        : "npm run dev -- --port 3100",
      url: "http://localhost:3100/login",
      reuseExistingServer: false,
      env: {
        AUTH_API_URL: "http://127.0.0.1:8100",
        AUTH_REFRESH_COOKIE_NAME: "refresh_token",
        APP_ORIGIN: "http://localhost:3100",
      },
    },
  ],
});
