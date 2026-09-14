import type { RequestHandler } from './$types';
import { addTeam } from '$lib/server/tournament.service';
import { authCheck, failure, ok } from '$lib/server/respond';

export const POST: RequestHandler = async (event) => {
	const denied = authCheck(event);
	if (denied) return denied;
	try {
		const body = (await event.request.json()) as { name?: string };
		return ok(await addTeam(event.params.id, event.locals.user!.id, body.name ?? ''), 201);
	} catch (err) {
		return failure(err);
	}
};
