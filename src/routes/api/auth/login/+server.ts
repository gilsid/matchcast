import type { RequestHandler } from './$types';
import { authCookies, login, signToken } from '$lib/server/auth';
import { fail, failure, ok } from '$lib/server/respond';

function validateLoginInput(email: string, password: string): { error: string } | null {
	const trimmedEmail = email?.trim() ?? '';
	if (!trimmedEmail || !password) {
		return { error: 'Email dan password wajib diisi' };
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
		return { error: 'Format email tidak valid' };
	}
	if (password.length > 128) return { error: 'Password maksimal 128 karakter' };
	return null;
}

export const POST: RequestHandler = async ({ cookies, request }) => {
	try {
		const { email, password } = (await request.json()) as {
			email: string;
			password: string;
		};

		const invalid = validateLoginInput(email, password);
		if (invalid) return fail(invalid.error, 'VALIDATION_ERROR', 400);

		const user = await login(email?.trim() ?? '', password);
		const token = await signToken(user.id);

		cookies.set('token', token, authCookies());
		return ok({ token, user });
	} catch (err) {
		return failure(err);
	}
};
