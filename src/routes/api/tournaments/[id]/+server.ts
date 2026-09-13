import type { RequestHandler } from './$types';
import { getTournament } from '$lib/server/tournament.service';
import { fail, failure, ok } from '$lib/server/respond';

export const GET: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) return fail('Unauthorized', 'UNAUTHORIZED', 401);
	try {
		return ok(await getTournament(params.id, userId));
	} catch (err) {
		return failure(err);
	}
};
