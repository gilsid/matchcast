import type { RequestHandler } from './$types';
import { getPublicTournamentBySlug } from '$lib/server/tournament.service';
import { failure, ok } from '$lib/server/respond';

export const GET: RequestHandler = async ({ params }) => {
	try {
		return ok(await getPublicTournamentBySlug(params.slug));
	} catch (err) {
		return failure(err);
	}
};
