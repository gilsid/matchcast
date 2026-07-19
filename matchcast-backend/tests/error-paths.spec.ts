import { test, expect, request as apiRequest } from "@playwright/test";
import { loginUser, createTournament, addTeam, generateBracket } from "./helpers";

test.describe("Auth errors", () => {
  test("register with duplicate email returns 409 EMAIL_EXISTS", async ({ request }) => {
    const email = `dup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}@test.com`;

    const res1 = await request.post("/auth/register", {
      data: { email, password: "testpass123", name: "First" },
    });
    expect(res1.status()).toBe(201);

    const res2 = await request.post("/auth/register", {
      data: { email, password: "testpass123", name: "Second" },
    });
    const body2 = await res2.json();
    expect(res2.status()).toBe(409);
    expect(body2.success).toBe(false);
    expect(body2.error.code).toBe("EMAIL_EXISTS");
  });

  test("login with wrong password returns 401 INVALID_CREDENTIALS", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const email = `wrongpw-${suffix}@test.com`;

    await request.post("/auth/register", {
      data: { email, password: "testpass123", name: "Test" },
    });

    const res = await request.post("/auth/login", {
      data: { email, password: "wrongpassword" },
    });
    const body = await res.json();
    expect(res.status()).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  test("login with wrong email returns 401 INVALID_CREDENTIALS", async ({ request }) => {
    const res = await request.post("/auth/login", {
      data: { email: "nonexistent@test.com", password: "testpass123" },
    });
    const body = await res.json();
    expect(res.status()).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  test("protected route without token returns 401 UNAUTHORIZED", async ({ request }) => {
    const res = await request.get("/tournaments");
    const body = await res.json();
    expect(res.status()).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("protected route with malformed token returns 401 INVALID_TOKEN", async ({ request }) => {
    const res = await request.get("/tournaments", {
      headers: { Authorization: "Bearer thisisnotavalidjwttoken" },
    });
    const body = await res.json();
    expect(res.status()).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_TOKEN");
  });

  test("protected route with empty Bearer returns 401 UNAUTHORIZED or INVALID_TOKEN", async ({ request }) => {
    const res = await request.get("/tournaments", {
      headers: { Authorization: "Bearer " },
    });
    const body = await res.json();
    expect(res.status()).toBe(401);
    expect(body.success).toBe(false);
    // HTTP normalization may strip trailing space, so replace may not match → INVALID_TOKEN
    expect(["UNAUTHORIZED", "INVALID_TOKEN"]).toContain(body.error.code);
  });
});

test.describe("API error paths", () => {
  test("DELETE team: happy path", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Delete Happy ${suffix}`);
    const team = await addTeam(request, token, t.id, "Temp Team");

    const res = await request.delete(`/tournaments/${t.id}/teams/${team.id}`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  test("DELETE team: non-existent team returns 404 NOT_FOUND", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Delete NF ${suffix}`);

    const res = await request.delete(`/tournaments/${t.id}/teams/nonexistent-id`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  test("DELETE team: non-existent tournament returns 404 NOT_FOUND", async ({ request }) => {
    const { token } = await loginUser(request);

    const res = await request.delete(`/tournaments/nonexistent-id/teams/nonexistent-id`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  test("DELETE team: after bracket generated returns 403 BRACKET_LOCKED", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Delete Locked ${suffix}`);
    const teams: Array<{ id: string; name: string }> = [];
    for (const name of ["A", "B", "C", "D"]) {
      teams.push(await addTeam(request, token, t.id, `Team ${name}`));
    }
    await generateBracket(request, token, t.id);

    const teamId = teams[0]!.id;
    const res = await request.delete(`/tournaments/${t.id}/teams/${teamId}`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BRACKET_LOCKED");
  });

  test("DELETE team: other user's tournament returns 404 NOT_FOUND", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token: ownerToken } = await loginUser(request);
    const t = await createTournament(request, ownerToken, `Delete Other ${suffix}`);
    const team = await addTeam(request, ownerToken, t.id, "Team A");

    const otherCtx = await apiRequest.newContext({ baseURL: "http://localhost:3001" });
    const { token: otherToken } = await loginUser(otherCtx);
    const res = await otherCtx.delete(`/tournaments/${t.id}/teams/${team.id}`, {
      data: {},
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  test("PATCH start: finished match returns 400 INVALID_STATUS", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Start Finished ${suffix}`);
    for (const name of ["A", "B", "C", "D"]) {
      await addTeam(request, token, t.id, `Team ${name}`);
    }
    const matches = await generateBracket(request, token, t.id);
    const m = matches[0]!;

    await request.patch(`/matches/${m.id}/start`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    await request.patch(`/matches/${m.id}/score`, {
      data: { homeScore: 3, awayScore: 1 },
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await request.patch(`/matches/${m.id}/start`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_STATUS");
  });

  test("PATCH start: match with null team slots returns 400 MISSING_TEAMS", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Start Null ${suffix}`);
    for (const name of ["A", "B", "C", "D"]) {
      await addTeam(request, token, t.id, `Team ${name}`);
    }
    const matches = await generateBracket(request, token, t.id);

    const futureMatch = matches.find((m: any) => m.homeTeamId === null || m.awayTeamId === null);
    if (!futureMatch) {
      test.skip();
      return;
    }

    const res = await request.patch(`/matches/${futureMatch.id}/start`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("MISSING_TEAMS");
  });

  test("PATCH start: non-existent match returns 404 NOT_FOUND", async ({ request }) => {
    const { token } = await loginUser(request);
    const res = await request.patch("/matches/nonexistent-id/start", {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  test("PATCH start: other user's match returns 403 UNAUTHORIZED", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token: ownerToken } = await loginUser(request);

    const t = await createTournament(request, ownerToken, `Start Other ${suffix}`);
    for (const name of ["A", "B", "C", "D"]) {
      await addTeam(request, ownerToken, t.id, `Team ${name}`);
    }
    const matches = await generateBracket(request, ownerToken, t.id);
    const m = matches[0]!;

    const otherCtx = await apiRequest.newContext({ baseURL: "http://localhost:3001" });
    const { token: otherToken } = await loginUser(otherCtx);
    const res = await otherCtx.patch(`/matches/${m.id}/start`, {
      data: {},
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("PATCH score: tied score returns 400 TIED_SCORE", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Score Tie ${suffix}`);
    for (const name of ["A", "B", "C", "D"]) {
      await addTeam(request, token, t.id, `Team ${name}`);
    }
    const matches = await generateBracket(request, token, t.id);
    const m = matches[0]!;
    await request.patch(`/matches/${m.id}/start`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await request.patch(`/matches/${m.id}/score`, {
      data: { homeScore: 2, awayScore: 2 },
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("TIED_SCORE");
  });

  test("PATCH score: negative score returns 400 VALIDATION_ERROR", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Score Neg ${suffix}`);
    for (const name of ["A", "B", "C", "D"]) {
      await addTeam(request, token, t.id, `Team ${name}`);
    }
    const matches = await generateBracket(request, token, t.id);
    const m = matches[0]!;
    await request.patch(`/matches/${m.id}/start`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await request.patch(`/matches/${m.id}/score`, {
      data: { homeScore: -1, awayScore: 0 },
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  test("PATCH score: non-integer score returns 400 VALIDATION_ERROR", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Score Float ${suffix}`);
    for (const name of ["A", "B", "C", "D"]) {
      await addTeam(request, token, t.id, `Team ${name}`);
    }
    const matches = await generateBracket(request, token, t.id);
    const m = matches[0]!;
    await request.patch(`/matches/${m.id}/start`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await request.patch(`/matches/${m.id}/score`, {
      data: { homeScore: 3.5, awayScore: 1 },
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  test("PATCH score: missing awayScore returns 400 VALIDATION_ERROR", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Score Miss ${suffix}`);
    for (const name of ["A", "B", "C", "D"]) {
      await addTeam(request, token, t.id, `Team ${name}`);
    }
    const matches = await generateBracket(request, token, t.id);
    const m = matches[0]!;
    await request.patch(`/matches/${m.id}/start`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await request.patch(`/matches/${m.id}/score`, {
      data: { homeScore: 3 },
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  test("PATCH score: non-existent match returns 404 NOT_FOUND", async ({ request }) => {
    const { token } = await loginUser(request);
    const res = await request.patch("/matches/nonexistent-id/score", {
      data: { homeScore: 3, awayScore: 1 },
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  test("PATCH score: other user's match returns 403 UNAUTHORIZED", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token: ownerToken } = await loginUser(request);

    const t = await createTournament(request, ownerToken, `Score Other ${suffix}`);
    for (const name of ["A", "B", "C", "D"]) {
      await addTeam(request, ownerToken, t.id, `Team ${name}`);
    }
    const matches = await generateBracket(request, ownerToken, t.id);
    const m = matches[0]!;
    await request.patch(`/matches/${m.id}/start`, {
      data: {},
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    const otherCtx = await apiRequest.newContext({ baseURL: "http://localhost:3001" });
    const { token: otherToken } = await loginUser(otherCtx);
    const res = await otherCtx.patch(`/matches/${m.id}/score`, {
      data: { homeScore: 3, awayScore: 1 },
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("PATCH score: already finished match returns 400 ALREADY_FINISHED", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Score Done ${suffix}`);
    for (const name of ["A", "B", "C", "D"]) {
      await addTeam(request, token, t.id, `Team ${name}`);
    }
    const matches = await generateBracket(request, token, t.id);
    const m = matches[0]!;
    await request.patch(`/matches/${m.id}/start`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    await request.patch(`/matches/${m.id}/score`, {
      data: { homeScore: 3, awayScore: 1 },
      headers: { Authorization: `Bearer ${token}` },
    });

    const res = await request.patch(`/matches/${m.id}/score`, {
      data: { homeScore: 5, awayScore: 2 },
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("ALREADY_FINISHED");
  });

  test("POST generate-bracket: sequential double-generate returns 409 BRACKET_EXISTS", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Seq Bracket ${suffix}`);
    for (const name of ["A", "B", "C", "D"]) {
      await addTeam(request, token, t.id, `Team ${name}`);
    }

    const res1 = await request.post(`/tournaments/${t.id}/generate-bracket`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res1.status()).toBe(200);

    const res2 = await request.post(`/tournaments/${t.id}/generate-bracket`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    const body2 = await res2.json();
    expect(res2.status()).toBe(409);
    expect(body2.success).toBe(false);
    expect(body2.error.code).toBe("BRACKET_EXISTS");
  });

  test("POST generate-bracket: less than 2 teams returns 400 NOT_ENOUGH_TEAMS", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Few Teams ${suffix}`);
    await addTeam(request, token, t.id, "Only One");

    const res = await request.post(`/tournaments/${t.id}/generate-bracket`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_ENOUGH_TEAMS");
  });

  test("POST generate-bracket: zero teams returns 400 NOT_ENOUGH_TEAMS", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Zero Teams ${suffix}`);

    const res = await request.post(`/tournaments/${t.id}/generate-bracket`, {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_ENOUGH_TEAMS");
  });

  test("GET /t/:slug/matches: happy path", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token } = await loginUser(request);
    const t = await createTournament(request, token, `Pub Matches ${suffix}`);
    for (const name of ["A", "B", "C", "D"]) {
      await addTeam(request, token, t.id, `Team ${name}`);
    }
    await generateBracket(request, token, t.id);

    const res = await request.get(`/t/${t.slug}/matches`);
    const body = await res.json();
    expect(res.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("matches");
    expect(Array.isArray(body.data.matches)).toBe(true);
    expect(body.data.matches.length).toBe(3);
    expect(body.data.pagination).toHaveProperty("page", 1);
    expect(body.data.pagination).toHaveProperty("limit", 50);
    expect(body.data.pagination.total).toBeGreaterThanOrEqual(3);

    // Count total filled team slots = all 4 teams appear in round 1
    const filledSlots = new Set<string>();
    for (const m of body.data.matches) {
      expect(m.tournamentId).toBe(t.id);
      expect(typeof m.round).toBe("number");
      expect(typeof m.matchOrder).toBe("number");
      if (m.homeTeam) {
        expect(m.homeTeam.name).toBeTruthy();
        filledSlots.add(m.homeTeam.id);
      }
      if (m.awayTeam) {
        expect(m.awayTeam.name).toBeTruthy();
        filledSlots.add(m.awayTeam.id);
      }
    }
    // All 4 teams should appear across the bracket
    expect(filledSlots.size).toBe(4);
  });

  test("GET /t/:slug/matches: non-existent slug returns 404 NOT_FOUND", async ({ request }) => {
    const res = await request.get("/t/nonexistent-slug-12345/matches");
    const body = await res.json();
    expect(res.status()).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  test("GET /tournaments/:id: non-existent ID returns 404 NOT_FOUND", async ({ request }) => {
    const { token } = await loginUser(request);
    const res = await request.get("/tournaments/nonexistent-id", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  test("GET /tournaments/:id: other user's tournament returns 404 NOT_FOUND", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token: ownerToken } = await loginUser(request);

    const t = await createTournament(request, ownerToken, `Get Other ${suffix}`);

    const otherCtx = await apiRequest.newContext({ baseURL: "http://localhost:3001" });
    const { token: otherToken } = await loginUser(otherCtx);
    const res = await otherCtx.get(`/tournaments/${t.id}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    const body = await res.json();
    expect(res.status()).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  test("GET /t/:slug: non-existent slug returns 404 NOT_FOUND", async ({ request }) => {
    const res = await request.get("/t/nonexistent-slug-12345");
    const body = await res.json();
    expect(res.status()).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  test("DELETE team: other user trying to delete from bracket-locked tournament returns 404", async ({ request }) => {
    const suffix = Date.now().toString(36);
    const { token: ownerToken } = await loginUser(request);

    const t = await createTournament(request, ownerToken, `Del Multi ${suffix}`);
    const teams: Array<{ id: string; name: string }> = [];
    for (const name of ["A", "B", "C", "D"]) {
      teams.push(await addTeam(request, ownerToken, t.id, `Team ${name}`));
    }
    await generateBracket(request, ownerToken, t.id);

    const otherCtx = await apiRequest.newContext({ baseURL: "http://localhost:3001" });
    const { token: otherToken } = await loginUser(otherCtx);
    const res = await otherCtx.delete(`/tournaments/${t.id}/teams/${teams[0]!.id}`, {
      data: {},
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
