import type { RequestHandler } from './$types';
import { generateBracket } from '$lib/server/bracket.service';
import { fail, failure, ok } from '$lib/server/respond';

export const POST: RequestHandler = async ({ locals, params }) => {
	const userId = locals.user?.id;
	if (!userId) return fail('Unauthorized', 'UNAUTHORIZED', 401);
	try {
		return ok(await generateBracket(params.id, userId));
	} catch (err) {
		return failure(err);
	}
};
