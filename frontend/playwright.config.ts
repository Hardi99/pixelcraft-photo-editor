import { defineConfig } from "@playwright/test";

/**
 * Tests de bout en bout : un vrai navigateur pilote l'application, branchée sur
 * le vrai backend Rails. Le backend doit tourner (docker compose up, ou la CI).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5173",
    // En local, le Chrome déjà installé ; en CI, le Chromium de Playwright.
    channel: process.env.CI ? undefined : "chrome",
    viewport: { width: 1280, height: 800 },
    acceptDownloads: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
