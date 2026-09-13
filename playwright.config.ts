import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:5173",
  },
  projects: [
    {
      name: "mobile",
      use: {
        viewport: { width: 375, height: 667 },
      },
    },
  ],
  webServer: [
    {
      command:
        "cd ../matchcast-backend && bun run src/index.ts",
      port: 3001,
      reuseExistingServer: !process.env["CI"],
      env: {
        NODE_ENV: "test",
        PORT: "3001",
        CORS_ORIGIN: "http://localhost:5173",
        JWT_SECRET: "test-secret-for-playwright",
        AUTH_RATE_LIMIT: "100",
        DATABASE_URL: process.env["DATABASE_URL"] || "postgresql://postgres:postgres@localhost:5432/tournament_db?schema=public",
        DATABASE_URL_UNPOOLED: process.env["DATABASE_URL_UNPOOLED"] || "postgresql://postgres:postgres@localhost:5432/tournament_db?schema=public",
      },
    },
    {
      command: "bun run preview --port 5173",
      port: 5173,
      reuseExistingServer: !process.env["CI"],
      env: { VITE_API_URL: "http://localhost:3001" },
    },
  ],
});
