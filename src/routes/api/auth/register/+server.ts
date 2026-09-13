import type { RequestHandler } from './$types';
import { register } from '$lib/server/auth';
import { fail, failure, ok } from '$lib/server/respond';

function validateRegisterInput(
	email: string,
	password: string,
	name: string
): { error: string } | null {
	const trimmedEmail = email?.trim() ?? '';
	const trimmedName = name?.trim() ?? '';

	if (!trimmedEmail || !password || !trimmedName) {
		return { error: 'Email, password, dan nama wajib diisi' };
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
		return { error: 'Format email tidak valid' };
	}
	if (trimmedEmail.length > 254 || trimmedName.length > 100) {
		return { error: 'Email atau nama terlalu panjang' };
	}
	if (password.length < 8) return { error: 'Password minimal 8 karakter' };
	if (password.length > 128) return { error: 'Password maksimal 128 karakter' };
	return null;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, password, name } = (await request.json()) as {
			email: string;
			password: string;
			name: string;
		};

		const invalid = validateRegisterInput(email, password, name);
		if (invalid) return fail(invalid.error, 'VALIDATION_ERROR', 400);

		const user = await register(email?.trim() ?? '', password, name?.trim() ?? '');
		return ok(user, 201);
	} catch (err) {
		return failure(err);
	}
};
