import type { ApiResult } from '$lib/types';

export class AuthError extends Error {
	constructor(
		message: string,
		public code: string
	) {
		super(message);
	}
}

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
	matches?: Match[];
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

export interface PaginatedMatches {
	matches: Match[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

async function request<T>(path: string, init?: RequestInit, fetchFn = fetch): Promise<T> {
	const res = await fetchFn(`/api${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }
	});
	const data = (await res.json()) as ApiResult<T>;
	if (!data.success) {
		const msg = data.error?.message || 'Request failed';
		const code = data.error?.code || 'UNKNOWN';
		if (code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN') {
			throw new AuthError(msg, code);
		}
		throw new Error(msg);
	}
	return data.data;
}

export function createTournament(
	input: { name: string; sport: string; format?: string },
	fetchFn = fetch
) {
	return request<Tournament>(
		'/tournaments',
		{
			method: 'POST',
			body: JSON.stringify(input)
		},
		fetchFn
	);
}

export function listTournaments(fetchFn = fetch) {
	return request<Tournament[]>('/tournaments', undefined, fetchFn);
}

export function getTournament(id: string, fetchFn = fetch) {
	return request<Tournament>(`/tournaments/${id}`, undefined, fetchFn);
}

export function addTeam(tournamentId: string, name: string, fetchFn = fetch) {
	return request<Team>(
		`/tournaments/${tournamentId}/teams`,
		{
			method: 'POST',
			body: JSON.stringify({ name })
		},
		fetchFn
	);
}

export function deleteTeam(tournamentId: string, teamId: string, fetchFn = fetch) {
	return request<null>(
		`/tournaments/${tournamentId}/teams/${teamId}`,
		{
			method: 'DELETE'
		},
		fetchFn
	);
}

export function generateBracket(tournamentId: string, fetchFn = fetch) {
	return request<Match[]>(
		`/tournaments/${tournamentId}/generate-bracket`,
		{
			method: 'POST'
		},
		fetchFn
	);
}

export function startMatch(matchId: string, fetchFn = fetch) {
	return request<Match>(
		`/matches/${matchId}/start`,
		{
			method: 'PATCH'
		},
		fetchFn
	);
}

export function updateMatchScore(
	matchId: string,
	homeScore: number,
	awayScore: number,
	fetchFn = fetch
) {
	return request<Match>(
		`/matches/${matchId}/score`,
		{
			method: 'PATCH',
			body: JSON.stringify({ homeScore, awayScore })
		},
		fetchFn
	);
}

export function getPublicTournament(slug: string, fetchFn = fetch) {
	return request<Tournament>(`/t/${slug}`, undefined, fetchFn);
}

export function getPublicMatches(slug: string, fetchFn = fetch) {
	return request<PaginatedMatches>(`/t/${slug}/matches`, undefined, fetchFn);
}

export function apiLogout(fetchFn = fetch) {
	return request<null>('/auth/logout', { method: 'POST' }, fetchFn);
}
