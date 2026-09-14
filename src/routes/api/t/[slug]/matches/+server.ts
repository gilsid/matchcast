import type { RequestHandler } from './$types';
import { getPublicMatches } from '$lib/server/bracket.service';
import { failure, ok } from '$lib/server/respond';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const page = parseInt(url.searchParams.get('page') ?? '1', 10);
		const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
		return ok(await getPublicMatches(params.slug, page, limit));
	} catch (err) {
		return failure(err);
	}
};
