import type { RequestHandler } from './$types';
import { createTournament, listTournaments } from '$lib/server/tournament.service';
import { fail, failure, ok } from '$lib/server/respond';

export const GET: RequestHandler = async ({ locals }) => {
	const userId = locals.user?.id;
	if (!userId) return fail('Unauthorized', 'UNAUTHORIZED', 401);
	try {
		return ok(await listTournaments(userId));
	} catch (err) {
		return failure(err);
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const userId = locals.user?.id;
	if (!userId) return fail('Unauthorized', 'UNAUTHORIZED', 401);
	try {
		const body = (await request.json()) as {
			name?: string;
			sport?: string;
			format?: string;
		};
		const name = body.name?.trim() ?? '';
		const sport = body.sport?.trim() ?? '';
		if (name.length > 100) {
			return fail('Nama turnamen maksimal 100 karakter', 'VALIDATION_ERROR', 400);
		}
		if (!sport) {
			return fail('Olahraga wajib diisi', 'VALIDATION_ERROR', 400);
		}
		return ok(await createTournament(userId, { name, sport, format: body.format }), 201);
	} catch (err) {
		return failure(err);
	}
};
