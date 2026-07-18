import { redirect, error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import { AuthError } from "$lib/api/tournament";

export const load: PageLoad = async ({ params, fetch }) => {
  const { getTournament } = await import("$lib/api/tournament");
  try {
    const tournament = await getTournament(params.id!, fetch);
    return { tournament };
  } catch (e) {
    if (e instanceof AuthError) throw redirect(302, "/login");
    throw error(404, "Turnamen tidak ditemukan");
  }
};
