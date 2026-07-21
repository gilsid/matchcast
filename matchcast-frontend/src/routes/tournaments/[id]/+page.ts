import { redirect, error } from '@sveltejs/kit';
import type { PageLoad } from './$types.js';
import { AuthError, getTournament } from '$lib/api/tournament';

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const id = params.id;
		if (!id) throw error(400, 'ID turnamen diperlukan');
		const tournament = await getTournament(id, fetch);
		return { tournament };
	} catch (e) {
		if (e instanceof AuthError) throw redirect(302, '/login');
		throw error(404, 'Turnamen tidak ditemukan');
	}
};
