import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	timeout: 45000,
	fullyParallel: false,
	use: {
		baseURL: 'http://localhost:5173'
	},
	projects: [
		{
			name: 'api',
			testMatch: 'api/*.spec.ts'
		},
		{
			name: 'mobile',
			testMatch: 'mobile-responsive.spec.ts',
			use: {
				viewport: { width: 375, height: 667 }
			}
		}
	],
	webServer: {
		command: 'bun run preview --port 5173',
		port: 5173,
		reuseExistingServer: !process.env['CI'],
		env: {
			DATABASE_URL:
				process.env['DATABASE_URL'] || 'postgresql://postgres@127.0.0.1:5433/matchcast_dev',
			JWT_SECRET: 'test-secret-for-playwright'
		}
	}
});
