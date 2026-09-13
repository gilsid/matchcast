import type { RequestHandler } from './$types';
import { deleteTeam } from '$lib/server/tournament.service';
import { authCheck, failure, ok } from '$lib/server/respond';

export const DELETE: RequestHandler = async (event) => {
	const denied = authCheck(event);
	if (denied) return denied;
	try {
		await deleteTeam(event.params.id, event.params.teamId, event.locals.user!.id);
		return ok(null);
	} catch (err) {
		return failure(err);
	}
};
