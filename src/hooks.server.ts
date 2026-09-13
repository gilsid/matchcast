import type { Handle } from '@sveltejs/kit';
import { extractToken, verifyToken } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.tokenInvalid = false;
	const token = extractToken(event.cookies, event.request);
	if (token) {
		const payload = await verifyToken(token);
		if (payload) event.locals.user = { id: payload.id };
		else event.locals.tokenInvalid = true;
	}
	return resolve(event);
};
