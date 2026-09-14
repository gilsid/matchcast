import type { RequestHandler } from './$types';
import { updateMatchScore } from '$lib/server/bracket.service';
import { authCheck, fail, failure, ok } from '$lib/server/respond';

export const PATCH: RequestHandler = async (event) => {
	const denied = authCheck(event);
	if (denied) return denied;
	try {
		const body = (await event.request.json()) as { homeScore?: number; awayScore?: number };
		if (body.homeScore === undefined || body.awayScore === undefined) {
			return fail('homeScore dan awayScore wajib diisi', 'VALIDATION_ERROR', 400);
		}
		return ok(
			await updateMatchScore(event.params.id, event.locals.user!.id, body.homeScore, body.awayScore)
		);
	} catch (err) {
		return failure(err);
	}
};
