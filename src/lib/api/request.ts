import type { ApiResult } from '$lib/types';

export class AuthError extends Error {
	constructor(
		message: string,
		public code: string
	) {
		super(message);
	}
}

// Single typed reader for every /api call. Throws AuthError on
// auth failures so pages can redirect, plain Error otherwise.
export async function request<T>(path: string, init?: RequestInit, fetchFn = fetch): Promise<T> {
	const res = await fetchFn(`/api${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }
	});
	const data = (await res.json()) as ApiResult<T>;
	if (!data.success) {
		const msg = data.error?.message || 'Request failed';
		const code = data.error?.code || 'UNKNOWN';
		if (code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN') {
			throw new AuthError(msg, code);
		}
		throw new Error(msg);
	}
	return data.data;
}
