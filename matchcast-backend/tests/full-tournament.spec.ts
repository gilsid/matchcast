import { test, expect } from "@playwright/test";
import { loginUser, createTournament, addTeam, generateBracket } from "./helpers";

function updateScore(matches: any[], matchId: string, homeScore: number, awayScore: number) {
  return matches.find((m: any) => m.id === matchId);
}

test.describe("Full tournament scenario — 8 teams", () => {
  test("create tournament, add teams, generate bracket, play all matches to completion", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);

    // 1. Create tournament
    const t = await createTournament(request, token, `E2E Full 8 ${suffix}`);
    expect(t.id).toBeTruthy();
    expect(t.status).toBe("draft");

    // 2. Add 8 teams
    const teamNames = ["Tim A", "Tim B", "Tim C", "Tim D", "Tim E", "Tim F", "Tim G", "Tim H"];
    const teams: { id: string; name: string }[] = [];
    for (const name of teamNames) {
      const team = await addTeam(request, token, t.id, name);
      teams.push(team);
    }
    expect(teams.length).toBe(8);

    // 3. Generate bracket
    const matches = await generateBracket(request, token, t.id);
    expect(matches.length).toBe(7); // n - 1 = 7

    // Verify all 8 teams are placed in round 1
    const round1 = matches.filter((m: any) => m.round === 1);
    expect(round1.length).toBe(4);
    const r1TeamIds = new Set<string>();
    for (const m of round1) {
      r1TeamIds.add(m.homeTeamId);
      r1TeamIds.add(m.awayTeamId);
    }
    expect(r1TeamIds.size).toBe(8);

    // 4. Get tournament detail to have match data with teams
    const getTournament = async () => {
      const res = await request.get(`/tournaments/${t.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      return body.data;
    };

    // Reload to get matches with team info
    let tournamentData = await getTournament();

    // Helper: update score and return updated data
    async function playMatch(matchId: string, homeScore: number, awayScore: number) {
      const res = await request.patch(`/matches/${matchId}/score`, {
        data: { homeScore, awayScore },
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      expect(body.success).toBeTruthy();
      tournamentData = await getTournament();
      return body.data;
    }

    async function startMatch(matchId: string) {
      const res = await request.patch(`/matches/${matchId}/start`, {
        data: {},
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      expect(body.success).toBeTruthy();
    }

    // 5. Play round 1 — 4 matches
    for (const m of tournamentData.matches) {
      if (m.round !== 1) continue;

      // Start the match
      await startMatch(m.id);
      tournamentData = await getTournament();
      const startedMatch = tournamentData.matches.find((mm: any) => mm.id === m.id);
      expect(startedMatch.status).toBe("ongoing");

      // Play it
      await playMatch(m.id, 3, 1);
    }

    // Verify round 1 all finished + winners propagated to round 2
    tournamentData = await getTournament();
    const round1Finished = tournamentData.matches.filter((m: any) => m.round === 1);
    expect(round1Finished.every((m: any) => m.status === "finished")).toBeTruthy();

    // 6. Play round 2 — 2 matches
    for (const m of tournamentData.matches) {
      if (m.round !== 2) continue;

      // Both teams should be assigned (from R1 propagate)
      expect(m.homeTeamId).not.toBeNull();
      expect(m.awayTeamId).not.toBeNull();

      await startMatch(m.id);
      await playMatch(m.id, 2, 0);
    }

    tournamentData = await getTournament();
    const round2Finished = tournamentData.matches.filter((m: any) => m.round === 2);
    expect(round2Finished.every((m: any) => m.status === "finished")).toBeTruthy();

    // 7. Play final — round 3
    const finalMatch = tournamentData.matches.find((m: any) => m.round === 3);
    expect(finalMatch).toBeTruthy();
    expect(finalMatch.homeTeamId).not.toBeNull();
    expect(finalMatch.awayTeamId).not.toBeNull();

    await startMatch(finalMatch.id);
    await playMatch(finalMatch.id, 4, 2);
    tournamentData = await getTournament();

    // 8. Verify tournament finished
    const finalUpdated = tournamentData.matches.find((m: any) => m.id === finalMatch.id);
    expect(tournamentData.status).toBe("finished");
    const allFinished = tournamentData.matches.every((m: any) => m.status === "finished");
    expect(allFinished).toBeTruthy();
    expect(finalUpdated.winnerTeamId).toBeTruthy();
  });
});
