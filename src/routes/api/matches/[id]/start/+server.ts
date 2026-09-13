import type { RequestHandler } from './$types';
import { startMatch } from '$lib/server/bracket.service';
import { fail, failure, ok } from '$lib/server/respond';

export const PATCH: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) return fail('Unauthorized', 'UNAUTHORIZED', 401);
	try {
		return ok(await startMatch(params.id, userId));
	} catch (err) {
		return failure(err);
	}
};
