import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  /*
   * Local: Start servers manually before running tests
   *   Terminal 1: cd backend && npm run dev
   *   Terminal 2: cd frontend && npm run dev
   *
   * CI: Servers auto-start via webServer config
   */
  ...(process.env.CI
    ? {
        webServer: [
          {
            command: "cd ../backend && npm run start",
            port: 5000,
            reuseExistingServer: false,
            timeout: 30000,
          },
          {
            command: "npm run dev",
            port: 5173,
            reuseExistingServer: false,
            timeout: 30000,
          },
        ],
      }
    : {}),
});
