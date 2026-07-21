import type { PageLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { getPublicTournament } from '$lib/api/tournament';

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const slug = params.slug;
		if (!slug) throw error(400, 'Slug tidak ditemukan');
		const tournament = await getPublicTournament(slug, fetch);
		return { tournament };
	} catch {
		throw error(404, 'Turnamen tidak ditemukan');
	}
};
