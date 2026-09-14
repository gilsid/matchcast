import type { RequestHandler } from './$types';
import { authCookies, login, signToken } from '$lib/server/auth';
import { failure, ok } from '$lib/server/respond';

export const POST: RequestHandler = async ({ cookies, request }) => {
	try {
		const { email, password } = (await request.json()) as {
			email: string;
			password: string;
		};

		const user = await login(email ?? '', password);
		const token = await signToken(user.id);

		cookies.set('token', token, authCookies());
		return ok({ token, user });
	} catch (err) {
		return failure(err);
	}
};
