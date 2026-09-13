import type { RequestHandler } from './$types';
import { addTeam } from '$lib/server/tournament.service';
import { fail, failure, ok } from '$lib/server/respond';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const userId = locals.user?.id;
	if (!userId) return fail('Unauthorized', 'UNAUTHORIZED', 401);
	try {
		const body = (await request.json()) as { name?: string };
		const teamName = body.name?.trim() ?? '';
		if (teamName.length > 50) {
			return fail('Nama tim maksimal 50 karakter', 'VALIDATION_ERROR', 400);
		}
		return ok(await addTeam(params.id, userId, teamName), 201);
	} catch (err) {
		return failure(err);
	}
};
