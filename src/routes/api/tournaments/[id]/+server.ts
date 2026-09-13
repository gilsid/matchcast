import type { RequestHandler } from './$types';
import { getTournament } from '$lib/server/tournament.service';
import { authCheck, failure, ok } from '$lib/server/respond';

export const GET: RequestHandler = async (event) => {
	const denied = authCheck(event);
	if (denied) return denied;
	try {
		return ok(await getTournament(event.params.id, event.locals.user!.id));
	} catch (err) {
		return failure(err);
	}
};
