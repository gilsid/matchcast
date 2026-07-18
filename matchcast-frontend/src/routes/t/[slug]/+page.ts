import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  const { getPublicTournament } = await import("$lib/api/tournament");
  try {
    const tournament = await getPublicTournament(params.slug!, fetch);
    return { tournament, error: false };
  } catch {
    return { tournament: null, error: true };
  }
};
