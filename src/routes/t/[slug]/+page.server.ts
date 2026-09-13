import { error } from '@sveltejs/kit';
import type { Config } from '@sveltejs/adapter-vercel';
import type { PageServerLoad } from './$types';
import { TournamentError, getPublicTournamentBySlug } from '$lib/server/tournament.service';

export const config: Config = {
	isr: { expiration: 60 }
};

export const load: PageServerLoad = async ({ params }) => {
	try {
		if (!params.slug) throw error(400, 'Slug tidak ditemukan');
		const tournament = await getPublicTournamentBySlug(params.slug);
		return { tournament };
	} catch (e) {
		if (e instanceof TournamentError) throw error(404, 'Turnamen tidak ditemukan');
		throw e;
	}
};
