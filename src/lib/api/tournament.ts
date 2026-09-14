import { request } from './request';
import type { Match, PaginatedMatches, Team, Tournament } from '$lib/types';

export async function createTournament(
	input: { name: string; sport: string; format?: string },
	fetchFn = fetch
): Promise<Tournament> {
	return await request<Tournament>(
		'/tournaments',
		{ method: 'POST', body: JSON.stringify(input) },
		fetchFn
	);
}

export async function listTournaments(fetchFn = fetch): Promise<Tournament[]> {
	return await request<Tournament[]>('/tournaments', undefined, fetchFn);
}

export async function getTournament(id: string, fetchFn = fetch): Promise<Tournament> {
	return await request<Tournament>(`/tournaments/${id}`, undefined, fetchFn);
}

export async function addTeam(tournamentId: string, name: string, fetchFn = fetch): Promise<Team> {
	return await request<Team>(
		`/tournaments/${tournamentId}/teams`,
		{ method: 'POST', body: JSON.stringify({ name }) },
		fetchFn
	);
}

export async function deleteTeam(
	tournamentId: string,
	teamId: string,
	fetchFn = fetch
): Promise<null> {
	return await request<null>(
		`/tournaments/${tournamentId}/teams/${teamId}`,
		{ method: 'DELETE' },
		fetchFn
	);
}

export async function generateBracket(tournamentId: string, fetchFn = fetch): Promise<Match[]> {
	return await request<Match[]>(
		`/tournaments/${tournamentId}/generate-bracket`,
		{ method: 'POST' },
		fetchFn
	);
}

export async function startMatch(matchId: string, fetchFn = fetch): Promise<Match> {
	return await request<Match>(`/matches/${matchId}/start`, { method: 'PATCH' }, fetchFn);
}

export async function updateMatchScore(
	matchId: string,
	homeScore: number,
	awayScore: number,
	fetchFn = fetch
): Promise<Match> {
	return await request<Match>(
		`/matches/${matchId}/score`,
		{ method: 'PATCH', body: JSON.stringify({ homeScore, awayScore }) },
		fetchFn
	);
}

export async function getPublicTournament(slug: string, fetchFn = fetch): Promise<Tournament> {
	return await request<Tournament>(`/t/${slug}`, undefined, fetchFn);
}

export async function getPublicMatches(
	slug: string,
	page = 1,
	limit = 50,
	fetchFn = fetch
): Promise<PaginatedMatches> {
	return await request<PaginatedMatches>(
		`/t/${slug}/matches?page=${page}&limit=${limit}`,
		undefined,
		fetchFn
	);
}

export async function apiLogout(fetchFn = fetch): Promise<null> {
	return await request<null>('/auth/logout', { method: 'POST' }, fetchFn);
}
