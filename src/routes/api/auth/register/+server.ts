import type { RequestHandler } from './$types';
import { register } from '$lib/server/auth';
import { failure, ok } from '$lib/server/respond';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, password, name } = (await request.json()) as {
			email: string;
			password: string;
			name: string;
		};

		const user = await register(email ?? '', password, name ?? '');
		return ok(user, 201);
	} catch (err) {
		return failure(err);
	}
};
