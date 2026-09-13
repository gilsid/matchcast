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
		if (!Number.isInteger(body.homeScore) || !Number.isInteger(body.awayScore)) {
			return fail('Skor harus berupa bilangan bulat', 'VALIDATION_ERROR', 400);
		}
		if (body.homeScore < 0 || body.awayScore < 0) {
			return fail('Skor tidak boleh negatif', 'VALIDATION_ERROR', 400);
		}
		return ok(
			await updateMatchScore(event.params.id, event.locals.user!.id, body.homeScore, body.awayScore)
		);
	} catch (err) {
		return failure(err);
	}
};
