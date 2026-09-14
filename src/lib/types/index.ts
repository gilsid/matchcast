export interface ApiSuccess<T> {
	success: true;
	data: T;
}

export interface ApiErrorResponse {
	success: false;
	error: { message: string; code: string };
}

export type ApiResult<T> = ApiSuccess<T> | ApiErrorResponse;

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
