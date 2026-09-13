import type { RequestHandler } from './$types';
import { createTournament, listTournaments } from '$lib/server/tournament.service';
import { authCheck, failure, ok, fail } from '$lib/server/respond';

export const GET: RequestHandler = async (event) => {
	const denied = authCheck(event);
	if (denied) return denied;
	try {
		return ok(await listTournaments(event.locals.user!.id));
	} catch (err) {
		return failure(err);
	}
};

export const POST: RequestHandler = async (event) => {
	const denied = authCheck(event);
	if (denied) return denied;
	try {
		const body = (await event.request.json()) as {
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
		return ok(
			await createTournament(event.locals.user!.id, { name, sport, format: body.format }),
			201
		);
	} catch (err) {
		return failure(err);
	}
};
