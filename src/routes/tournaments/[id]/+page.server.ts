import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { TournamentError, getTournament } from '$lib/server/tournament.service';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (!params.id) throw error(400, 'ID turnamen diperlukan');
	try {
		const tournament = await getTournament(params.id, locals.user.id);
		return { tournament };
	} catch (e) {
		if (e instanceof TournamentError && e.code === 'NOT_FOUND') {
			throw error(404, 'Turnamen tidak ditemukan');
		}
		throw e;
	}
};
