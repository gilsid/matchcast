import { json, type RequestEvent } from '@sveltejs/kit';
import { DomainError } from './errors';

export function ok<T>(data: T, status = 200) {
	return json({ success: true, data }, { status });
}

export function fail(message: string, code: string, status = 400) {
	return json({ success: false, error: { message, code } }, { status });
}

export function failure(err: unknown) {
	if (err instanceof DomainError) return fail(err.message, err.code, err.statusCode);
	throw err;
}

export function authCheck(event: RequestEvent) {
	if (event.locals.user) return null;
	if (event.locals.tokenInvalid) return fail('Invalid token', 'INVALID_TOKEN', 401);
	return fail('Unauthorized', 'UNAUTHORIZED', 401);
}
