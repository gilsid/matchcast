import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import { AuthError } from "$lib/api/tournament";

export const load: PageLoad = async ({ fetch }) => {
  const { listTournaments } = await import("$lib/api/tournament");
  try {
    const tournaments = await listTournaments(fetch);
    return { tournaments };
  } catch (e) {
    if (e instanceof AuthError) throw redirect(302, "/login");
    return { tournaments: [] };
  }
};
