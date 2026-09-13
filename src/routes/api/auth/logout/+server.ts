import type { RequestHandler } from './$types';
import { ok } from '$lib/server/respond';

export const POST: RequestHandler = ({ cookies }) => {
	cookies.delete('token', { path: '/' });
	return ok(null);
};
