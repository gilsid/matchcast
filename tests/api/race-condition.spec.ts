import { test, expect } from '@playwright/test';
import { loginUser, createTournament, addTeam } from './helpers';

test.describe('Race conditions', () => {
	test('concurrent generate-bracket only creates one set of matches', async ({ request }) => {
		const suffix = Date.now().toString(36);
		const { token } = await loginUser(request);
		const t = await createTournament(request, token, `Race Bracket ${suffix}`);

		for (const name of ['A', 'B', 'C', 'D']) {
			await addTeam(request, token, t.id, `Team ${name}`);
		}

		// Fire 3 concurrent requests
		const results = await Promise.allSettled([
			request.post(`/api/tournaments/${t.id}/generate-bracket`, {
				data: {},
				headers: { Authorization: `Bearer ${token}` }
			}),
			request.post(`/api/tournaments/${t.id}/generate-bracket`, {
				data: {},
				headers: { Authorization: `Bearer ${token}` }
			}),
			request.post(`/api/tournaments/${t.id}/generate-bracket`, {
				data: {},
				headers: { Authorization: `Bearer ${token}` }
			})
		]);

		// Count successes
		const rejected = results.filter((r) => r.status === 'rejected');
		expect(rejected).toHaveLength(0);
		const successCount = results.filter(
			(r) => r.status === 'fulfilled' && r.value.status() === 200
		).length;
		const failCount = results.filter(
			(r) => r.status === 'fulfilled' && r.value.status() === 409
		).length;

		// Exactly 1 should succeed, the rest should be 409
		expect(successCount).toBe(1);
		expect(failCount).toBe(2);

		// Verify only one set of matches exists
		const detailRes = await request.get(`/api/tournaments/${t.id}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		const detail = await detailRes.json();
		expect(detail.data.matches.length).toBe(3); // n-1 = 3 for 4 teams
	});

	test('concurrent score update only applies once', async ({ request }) => {
		const suffix = Date.now().toString(36);
		const { token } = await loginUser(request);
		const t = await createTournament(request, token, `Race Score ${suffix}`);

		for (const name of ['A', 'B', 'C', 'D']) {
			await addTeam(request, token, t.id, `Team ${name}`);
		}

		const genRes = await request.post(`/api/tournaments/${t.id}/generate-bracket`, {
			data: {},
			headers: { Authorization: `Bearer ${token}` }
		});
		expect(genRes.ok()).toBeTruthy();
		const genData = await genRes.json();
		const matchId = genData.data[0].id;

		// Start the match
		const startRes = await request.patch(`/api/matches/${matchId}/start`, {
			data: {},
			headers: { Authorization: `Bearer ${token}` }
		});
		expect(startRes.ok()).toBeTruthy();

		// Fire 3 concurrent score updates with different scores
		const results = await Promise.allSettled([
			request.patch(`/api/matches/${matchId}/score`, {
				data: { homeScore: 3, awayScore: 1 },
				headers: { Authorization: `Bearer ${token}` }
			}),
			request.patch(`/api/matches/${matchId}/score`, {
				data: { homeScore: 5, awayScore: 2 },
				headers: { Authorization: `Bearer ${token}` }
			}),
			request.patch(`/api/matches/${matchId}/score`, {
				data: { homeScore: 1, awayScore: 0 },
				headers: { Authorization: `Bearer ${token}` }
			})
		]);

		const rejected = results.filter((r) => r.status === 'rejected');
		expect(rejected).toHaveLength(0);
		const successCount = results.filter(
			(r) => r.status === 'fulfilled' && r.value.status() === 200
		).length;
		const failCount = results.filter(
			(r) => r.status === 'fulfilled' && r.value.status() === 400
		).length;

		// Exactly 1 should succeed, the rest should be 400 (already finished)
		expect(successCount).toBe(1);
		expect(failCount).toBe(2);
	});
});
