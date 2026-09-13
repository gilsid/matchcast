import type { RequestHandler } from './$types';
import { startMatch } from '$lib/server/bracket.service';
import { authCheck, failure, ok } from '$lib/server/respond';

export const PATCH: RequestHandler = async (event) => {
	const denied = authCheck(event);
	if (denied) return denied;
	try {
		return ok(await startMatch(event.params.id, event.locals.user!.id));
	} catch (err) {
		return failure(err);
	}
};
