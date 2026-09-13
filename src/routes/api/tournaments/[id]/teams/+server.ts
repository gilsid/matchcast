import type { RequestHandler } from './$types';
import { addTeam } from '$lib/server/tournament.service';
import { authCheck, fail, failure, ok } from '$lib/server/respond';

export const POST: RequestHandler = async (event) => {
	const denied = authCheck(event);
	if (denied) return denied;
	try {
		const body = (await event.request.json()) as { name?: string };
		const teamName = body.name?.trim() ?? '';
		if (teamName.length > 50) {
			return fail('Nama tim maksimal 50 karakter', 'VALIDATION_ERROR', 400);
		}
		return ok(await addTeam(event.params.id, event.locals.user!.id, teamName), 201);
	} catch (err) {
		return failure(err);
	}
};
