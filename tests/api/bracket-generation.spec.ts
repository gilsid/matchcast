import { test, expect, type APIRequestContext } from '@playwright/test';
import { loginUser, createTournament, addTeam, generateBracket, cleanupUser } from './helpers';

test.describe('Bracket generation - bye logic', () => {
	const TEAM_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
	let userId = '';

	test.afterAll(async () => {
		if (userId) await cleanupUser(userId);
	});

	async function setupTournamentWithTeams(
		request: APIRequestContext,
		teamCount: number,
		suffix: string
	) {
		const { token, userId: id } = await loginUser(request);
		if (!userId) userId = id;
		const t = await createTournament(request, token, `Test ${teamCount} teams ${suffix}`);
		const teams: { id: string; name: string }[] = [];
		for (let i = 0; i < teamCount; i++) {
			const team = await addTeam(request, token, t.id, TEAM_NAMES[i]!);
			teams.push(team);
		}
		const matches = await generateBracket(request, token, t.id);
		return { tournament: t, teams, matches, token };
	}

	for (const teamCount of [4, 5, 6, 7, 8]) {
		test(`generates valid bracket for ${teamCount} teams`, async ({ request }) => {
			const suffix = Date.now().toString(36);
			const { teams, matches } = await setupTournamentWithTeams(request, teamCount, suffix);

			// Verifikasi 1: Jumlah match = n - 1 (knockout, tiap match eliminasi 1 team)
			expect(matches.length).toBe(teamCount - 1);

			// Verifikasi 2: Semua team id muncul sebagai homeTeamId atau awayTeamId
			const allTeamIds = new Set(teams.map((t) => t.id));
			const matchedTeamIds = new Set<string>();
			for (const m of matches) {
				if (m.homeTeamId) matchedTeamIds.add(m.homeTeamId);
				if (m.awayTeamId) matchedTeamIds.add(m.awayTeamId);
			}
			for (const tid of allTeamIds) {
				expect(matchedTeamIds.has(tid)).toBeTruthy();
			}

			// Verifikasi 3: Tidak ada match (selain menunggu propagate) yg kedua slot null
			// Hanya round > 2 yg boleh punya slot null (menunggu hasil babak sblmnya)
			// Round 1 harus penuh, Round 2 (jika ada bye) slot yg ditinggali bye harus terisi
			const round1 = matches.filter((m) => m.round === 1);
			for (const m of round1) {
				expect(m.homeTeamId).not.toBeNull();
				expect(m.awayTeamId).not.toBeNull();
			}

			// Verifikasi 4: Total slot terisi di semua match = teamCount (setiap team main minimal 1x)
			const filledSlots = new Set<string>();
			for (const m of matches) {
				if (m.homeTeamId) filledSlots.add(m.homeTeamId);
				if (m.awayTeamId) filledSlots.add(m.awayTeamId);
			}
			expect(filledSlots.size).toBe(teamCount);
		});
	}
});
