import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listTournaments } from '$lib/server/tournament.service';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	const tournaments = await listTournaments(locals.user.id);
	return { tournaments };
};
