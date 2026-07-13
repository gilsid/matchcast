import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3001",
    extraHTTPHeaders: { "Content-Type": "application/json" },
  },
  webServer: {
    command: "bun run src/index.ts",
    port: 3001,
    reuseExistingServer: !process.env["CI"],
    env: {
      NODE_ENV: "test",
      PORT: "3001",
      CORS_ORIGIN: "http://localhost:5173",
      JWT_SECRET: "test-secret-for-playwright",
      DATABASE_URL: process.env["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5432/tournament_db?schema=public",
    },
  },
});
