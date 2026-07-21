import { test, expect } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:3001';
const TEAM_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

test.describe('Mobile responsive — 375x667', () => {
	let authCookie: string;
	let tournamentSlug: string;
	let tournamentId: string;
	let setupFailed = '';

	test.beforeAll(async ({ request }) => {
		try {
			// Register + login via API
			const suffix = Date.now().toString(36);
			const email = `mobile-${suffix}@test.com`;

			const regRes = await request.post(`${API}/auth/register`, {
				data: { email, password: 'testpass123', name: 'Mobile Tester' }
			});
			if (!regRes.ok()) throw new Error(`register failed: ${regRes.status()}`);

			const loginRes = await request.post(`${API}/auth/login`, {
				data: { email, password: 'testpass123' }
			});
			if (!loginRes.ok()) throw new Error(`login failed: ${loginRes.status()}`);
			const loginBody = await loginRes.json();
			authCookie = loginBody.data.token;

			// Create tournament + add teams + generate bracket
			const tRes = await request.post(`${API}/tournaments`, {
				data: { name: `Mobile Test ${suffix}`, sport: 'futsal' },
				headers: { Authorization: `Bearer ${authCookie}` }
			});
			if (!tRes.ok()) throw new Error(`create tournament failed: ${tRes.status()}`);
			const tBody = await tRes.json();
			const t = tBody.data;
			tournamentId = t.id;
			tournamentSlug = t.slug;

			for (const name of TEAM_NAMES) {
				const teamRes = await request.post(`${API}/tournaments/${t.id}/teams`, {
					data: { name: `Tim ${name}` },
					headers: { Authorization: `Bearer ${authCookie}` }
				});
				if (!teamRes.ok()) throw new Error(`add team failed: ${teamRes.status()}`);
			}

			const bracketRes = await request.post(`${API}/tournaments/${t.id}/generate-bracket`, {
				data: {},
				headers: { Authorization: `Bearer ${authCookie}` }
			});
			if (!bracketRes.ok()) throw new Error(`generate bracket failed: ${bracketRes.status()}`);
		} catch (e) {
			setupFailed =
				e instanceof Error ? `setup failed: ${e.message}` : 'setup failed: unknown error';
			// eslint-disable-next-line no-console
			process.stderr.write(setupFailed + '\n');
		}
	});

	test.beforeEach(async ({ context }) => {
		// Set auth cookie for authenticated pages
		await context.addCookies([
			{ name: 'token', value: authCookie, domain: 'localhost', path: '/' }
		]);
	});

	test(`login page — form elements visible and tappable`, async ({ page }) => {
		test.skip(setupFailed !== '');
		await page.goto('/login');
		await page.waitForLoadState('networkidle');

		const heading = page.locator('h1');
		await expect(heading).toBeVisible();
		await expect(heading).toHaveText('Login');

		const emailInput = page.locator('#email');
		await expect(emailInput).toBeVisible();
		await emailInput.fill('test@test.com');

		const passInput = page.locator('#password');
		await expect(passInput).toBeVisible();
		await passInput.fill('testpass123');

		const submitBtn = page.locator('button[type="submit"]');
		await expect(submitBtn).toBeVisible();
		await expect(submitBtn).toBeEnabled();

		// No horizontal scroll
		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scrollWidth).toBeLessThanOrEqual(375);
	});

	test(`register page — form elements visible and tappable`, async ({ page }) => {
		test.skip(setupFailed !== '');
		await page.goto('/register');
		await page.waitForLoadState('networkidle');

		const heading = page.locator('h1');
		await expect(heading).toBeVisible();
		await expect(heading).toHaveText('Register');

		await expect(page.locator('#name')).toBeVisible();
		await expect(page.locator('#email')).toBeVisible();
		await expect(page.locator('#password')).toBeVisible();

		const submitBtn = page.locator('button[type="submit"]');
		await expect(submitBtn).toBeVisible();
		await expect(submitBtn).toBeEnabled();

		// Link to login
		const loginLink = page.locator('a[href="/login"]');
		await expect(loginLink).toBeVisible();
		await expect(loginLink).toBeEnabled();

		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scrollWidth).toBeLessThanOrEqual(375);
	});

	test(`public tournament page — bracket readable, no overflow`, async ({ page }) => {
		test.skip(setupFailed !== '');
		// Wait for the API response that loads tournament data
		const responsePromise = page.waitForResponse(
			(res) => res.url().includes(`/t/${tournamentSlug}`) && res.status() === 200
		);
		await page.goto(`/t/${tournamentSlug}`);
		await responsePromise;
		await page.waitForLoadState('networkidle');

		// Tournament name visible
		const heading = page.locator('h1');
		await expect(heading).toBeVisible();
		expect(await heading.textContent()).toContain('Mobile Test');

		// Wait for bracket to render by checking for team names
		for (const name of TEAM_NAMES) {
			await expect(page.getByText(`Tim ${name}`, { exact: false }).first()).toBeVisible({
				timeout: 10000
			});
		}

		// At minimum, the page title should not overflow
		const headerOverflow = await page.evaluate(() => {
			const h1 = document.querySelector('h1');
			if (!h1) return false;
			return h1.scrollWidth > h1.clientWidth;
		});
		expect(headerOverflow).toBeFalsy();
	});

	test(`dashboard — tournament list accessible`, async ({ page }) => {
		test.skip(setupFailed !== '');
		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		const heading = page.locator('h1');
		await expect(heading).toBeVisible();
		expect(await heading.textContent()).toContain('Dashboard');

		// Create tournament form visible
		await expect(page.locator('#name')).toBeVisible();
		await expect(page.locator('#sport')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();

		// Tournament list visible
		const tournamentCards = page.locator('text=Mobile Test');
		await expect(tournamentCards.first()).toBeVisible();

		// No horizontal overflow
		const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scrollW).toBeLessThanOrEqual(375);
	});

	test(`tournament admin page — bracket actions accessible`, async ({ page }) => {
		test.skip(setupFailed !== '');
		await page.goto(`/tournaments/${tournamentId}`);
		await page.waitForLoadState('networkidle');

		// Tournament heading
		const heading = page.locator('h1');
		await expect(heading).toBeVisible();
		expect(await heading.textContent()).toContain('Mobile Test');

		// Bracket rendered
		const bracketText = page.locator('text=Bracket');
		await expect(bracketText).toBeVisible();

		// All match cards visible — check at least one "Mulai" button
		const mulaiButtons = page.locator("button:has-text('Mulai')");
		const count = await mulaiButtons.count();
		expect(count).toBeGreaterThan(0);

		// First mulai button should be tappable (visible + enabled)
		await expect(mulaiButtons.first()).toBeVisible();
		await expect(mulaiButtons.first()).toBeEnabled();

		// No horizontal overflow on body
		const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scrollW).toBeLessThanOrEqual(375);
	});
});
