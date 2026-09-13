import type { RequestHandler } from './$types';
import { generateBracket } from '$lib/server/bracket.service';
import { authCheck, failure, ok } from '$lib/server/respond';

export const POST: RequestHandler = async (event) => {
	const denied = authCheck(event);
	if (denied) return denied;
	try {
		return ok(await generateBracket(event.params.id, event.locals.user!.id));
	} catch (err) {
		return failure(err);
	}
};
