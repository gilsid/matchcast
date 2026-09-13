import type { RequestHandler } from './$types';
import { deleteTeam } from '$lib/server/tournament.service';
import { fail, failure, ok } from '$lib/server/respond';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) return fail('Unauthorized', 'UNAUTHORIZED', 401);
	try {
		await deleteTeam(params.id, params.teamId, userId);
		return ok(null);
	} catch (err) {
		return failure(err);
	}
};
