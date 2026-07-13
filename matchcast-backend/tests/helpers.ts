import type { APIRequestContext } from "@playwright/test";

interface TeamData {
  id: string;
  name: string;
}

interface TournamentData {
  id: string;
  slug: string;
  name: string;
  status: string;
  teams: TeamData[];
  matches?: MatchData[];
}

interface MatchData {
  id: string;
  round: number;
  matchOrder: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  homeTeam?: { id: string; name: string } | null;
  awayTeam?: { id: string; name: string } | null;
}

// Unique per run to avoid collisions
const RUN_ID = Date.now().toString(36);

export async function registerUser(request: APIRequestContext): Promise<AuthData> {
  const email = `test-${RUN_ID}-${Math.random().toString(36).slice(2, 8)}@test.com`;
  const res = await request.post("/auth/register", {
      data: { email, password: "testpass123", name: "Test User" },
  });
  const body = await res.json();
  if (!body.success) throw new Error(`register failed: ${body.error?.message}`);
  return { userId: body.data.id, token: "" };
}

export async function loginUser(request: APIRequestContext): Promise<{ token: string; userId: string }> {
  const email = `test-${RUN_ID}-${Math.random().toString(36).slice(2, 8)}@test.com`;
  let res = await request.post("/auth/register", {
      data: { email, password: "testpass123", name: "Test User" },
    });
    let body = await res.json();
    if (!body.success) throw new Error(`register failed: ${body.error?.message}`);

    res = await request.post("/auth/login", {
      data: { email, password: "testpass123" },
  });
  body = await res.json();
  if (!body.success) throw new Error(`login failed: ${body.error?.message}`);

  // Get token from cookie
  const cookies = res.headers()["set-cookie"] || "";
  const tokenMatch = cookies.match(/token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : body.data?.token || "";

  return { token, userId: body.data.user.id };
}

export async function createTournament(
  request: APIRequestContext,
  token: string,
  name: string,
): Promise<TournamentData> {
  const res = await request.post("/tournaments", {
    data: { name, sport: "futsal" },
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!body.success) throw new Error(`create tournament failed: ${body.error?.message}`);
  return body.data;
}

export async function addTeam(
  request: APIRequestContext,
  token: string,
  tournamentId: string,
  teamName: string,
): Promise<TeamData> {
  const res = await request.post(`/tournaments/${tournamentId}/teams`, {
    data: { name: teamName },
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!body.success) throw new Error(`add team failed: ${body.error?.message}`);
  return body.data;
}

export async function generateBracket(
  request: APIRequestContext,
  token: string,
  tournamentId: string,
): Promise<MatchData[]> {
  const res = await request.post(`/tournaments/${tournamentId}/generate-bracket`, {
    data: {},
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!body.success) {
    const errMsg = typeof body.error === "string" ? body.error : body.error?.message || JSON.stringify(body);
    throw new Error(`generate bracket failed: ${errMsg}`);
  }
  return body.data;
}


