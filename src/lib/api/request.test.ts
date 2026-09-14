import { describe, it, expect } from 'vitest';
import { AuthError, request } from './request';

function jsonFetch(body: unknown) {
	return (async () =>
		new Response(JSON.stringify(body), {
			headers: { 'Content-Type': 'application/json' }
		})) as unknown as typeof fetch;
}

describe('request', () => {
	it('returns data on success', async () => {
		const data = await request<{ a: number }>(
			'/x',
			undefined,
			jsonFetch({ success: true, data: { a: 1 } })
		);
		expect(data).toEqual({ a: 1 });
	});

	it('throws AuthError on auth codes', async () => {
		for (const code of ['UNAUTHORIZED', 'INVALID_TOKEN']) {
			await expect(
				request('/x', undefined, jsonFetch({ success: false, error: { message: 'no', code } }))
			).rejects.toBeInstanceOf(AuthError);
		}
	});

	it('throws plain Error otherwise', async () => {
		await expect(
			request(
				'/x',
				undefined,
				jsonFetch({ success: false, error: { message: 'bad', code: 'TIED_SCORE' } })
			)
		).rejects.toThrow('bad');
	});
});
