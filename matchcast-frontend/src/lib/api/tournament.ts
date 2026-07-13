const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface ApiSuccess<T> {
  success: true;
  data: T;
}
interface ApiErrorResponse {
  success: false;
  error: { message: string; code: string };
}
type ApiResult<T> = ApiSuccess<T> | ApiErrorResponse;

export interface Team {
  id: string;
  name: string;
  seed: number | null;
}

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  sport: string;
  format: string;
  status: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  teams?: Team[];
  _count?: { teams: number };
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  matchOrder: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
  status: string;
  homeTeam?: { id: string; name: string } | null;
  awayTeam?: { id: string; name: string } | null;
  winnerTeam?: { id: string; name: string } | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  const data = (await res.json()) as ApiResult<T>;
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}

export function createTournament(input: { name: string; sport: string; format?: string }) {
  return request<Tournament>("/tournaments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listTournaments() {
  return request<Tournament[]>("/tournaments");
}

export function getTournament(id: string) {
  return request<Tournament>(`/tournaments/${id}`);
}

export function addTeam(tournamentId: string, name: string) {
  return request<Team>(`/tournaments/${tournamentId}/teams`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteTeam(tournamentId: string, teamId: string) {
  return request<null>(`/tournaments/${tournamentId}/teams/${teamId}`, {
    method: "DELETE",
  });
}

// Phase 3
export function generateBracket(tournamentId: string) {
  return request<Match[]>(`/tournaments/${tournamentId}/generate-bracket`, {
    method: "POST",
  });
}

export function updateMatchScore(matchId: string, homeScore: number, awayScore: number) {
  return request<Match>(`/matches/${matchId}/score`, {
    method: "PATCH",
    body: JSON.stringify({ homeScore, awayScore }),
  });
}

export function getPublicTournament(slug: string) {
  return request<Tournament>(`/t/${slug}`);
}

export function getPublicMatches(slug: string) {
  return request<Match[]>(`/t/${slug}/matches`);
}