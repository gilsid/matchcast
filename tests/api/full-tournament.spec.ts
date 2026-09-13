import { test, expect } from '@playwright/test';
import {
	loginUser,
	createTournament,
	addTeam,
	generateBracket,
	type MatchData,
	type TournamentData
} from './helpers';

test.describe('Full tournament scenario — 6 teams (bye logic)', () => {
	test('complete flow + verify public page', async ({ request }) => {
		const suffix = Date.now().toString(36);
		const { token } = await loginUser(request);

		// 1. Create tournament
		const t = await createTournament(request, token, `E2E Full 6 ${suffix}`);
		expect(t.id).toBeTruthy();
		expect(t.status).toBe('draft');

		// 2. Add 6 teams (bukan pangkat 2 — verify bye logic)
		const teamNames = ['Tim A', 'Tim B', 'Tim C', 'Tim D', 'Tim E', 'Tim F'];
		const teams: { id: string; name: string }[] = [];
		for (const name of teamNames) {
			const team = await addTeam(request, token, t.id, name);
			teams.push(team);
		}
		expect(teams.length).toBe(6);

		// 3. Generate bracket
		const matches = await generateBracket(request, token, t.id);
		expect(matches.length).toBe(5); // n - 1 = 5

		// Verify all 6 teams placed somewhere in bracket
		const matchedTeamIds = new Set<string>();
		for (const m of matches) {
			if (m.homeTeamId) matchedTeamIds.add(m.homeTeamId);
			if (m.awayTeamId) matchedTeamIds.add(m.awayTeamId);
		}
		expect(matchedTeamIds.size).toBe(6);

		// 4. Get tournament detail
		type DetailData = TournamentData & { matches: MatchData[] };
		const getTournament = async (): Promise<DetailData> => {
			const res = await request.get(`/api/tournaments/${t.id}`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const body = await res.json();
			return body.data as DetailData;
		};

		let tournamentData = await getTournament();

		async function playMatch(matchId: string, homeScore: number, awayScore: number) {
			const res = await request.patch(`/api/matches/${matchId}/score`, {
				data: { homeScore, awayScore },
				headers: { Authorization: `Bearer ${token}` }
			});
			const body = await res.json();
			expect(body.success).toBeTruthy();
			tournamentData = await getTournament();
			return body.data;
		}

		async function startMatch(matchId: string) {
			const res = await request.patch(`/api/matches/${matchId}/start`, {
				data: {},
				headers: { Authorization: `Bearer ${token}` }
			});
			const body = await res.json();
			expect(body.success).toBeTruthy();
		}

		// 5. Play round 1
		for (const m of tournamentData.matches) {
			if (m.round !== 1) continue;
			await startMatch(m.id);
			tournamentData = await getTournament();
			expect(tournamentData.matches.find((mm) => mm.id === m.id)!.status).toBe('ongoing');
			await playMatch(m.id, 3, 1);
		}

		// Verify round 1 finished
		tournamentData = await getTournament();
		expect(
			tournamentData.matches.filter((m) => m.round === 1).every((m) => m.status === 'finished')
		).toBeTruthy();

		// 6. Play round 2
		for (const m of tournamentData.matches) {
			if (m.round !== 2) continue;
			expect(m.homeTeamId).not.toBeNull();
			expect(m.awayTeamId).not.toBeNull();
			await startMatch(m.id);
			await playMatch(m.id, 2, 0);
		}

		// 7. Play final
		tournamentData = await getTournament();
		const finalMatch = tournamentData.matches.find((m) => m.round === 3)!;
		expect(finalMatch).toBeTruthy();
		expect(finalMatch.homeTeamId).not.toBeNull();
		expect(finalMatch.awayTeamId).not.toBeNull();

		await startMatch(finalMatch.id);
		await playMatch(finalMatch.id, 4, 2);
		tournamentData = await getTournament();

		// Verify tournament finished
		expect(tournamentData.status).toBe('finished');
		expect(tournamentData.matches.every((m) => m.status === 'finished')).toBeTruthy();

		// 8. Access public page (no auth)
		const publicRes = await request.get(`/api/t/${t.slug}`);
		const publicBody = await publicRes.json();
		expect(publicBody.success).toBeTruthy();

		const publicTournament = publicBody.data;
		expect(publicTournament.name).toBe(t.name);
		expect(publicTournament.status).toBe('finished');

		// Verify public matches match the admin view
		expect(publicTournament.matches.length).toBe(tournamentData.matches.length);
		const firstMatch = publicTournament.matches[0];
		expect(firstMatch.homeTeam).toBeTruthy();
		expect(firstMatch.awayTeam).toBeTruthy();
		expect(typeof firstMatch.homeScore).toBe('number');
		expect(typeof firstMatch.awayScore).toBe('number');

		// No team should have "?" placeholder in public view
		for (const m of publicTournament.matches) {
			expect(m.homeTeam?.name).toBeTruthy();
			expect(m.awayTeam?.name).toBeTruthy();
		}
	});
});
