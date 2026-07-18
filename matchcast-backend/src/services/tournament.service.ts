import { prisma } from "../prisma-client";

export class TournamentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 400,
  ) {
    super(message);
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "tournament";
  let n = 1;
  while (await prisma.tournament.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function createTournament(
  ownerId: string,
  data: { name: string; sport: string; format?: string },
) {
  const name = data.name?.trim();
  if (!name) {
    throw new TournamentError("Tournament name is required", "VALIDATION_ERROR", 400);
  }
  const sport = data.sport?.trim();
  if (!sport) {
    throw new TournamentError("Sport is required", "VALIDATION_ERROR", 400);
  }
  const slug = await uniqueSlug(slugify(name));

  return prisma.tournament.create({
    data: {
      name,
      sport,
      slug,
      format: data.format ?? "knockout",
      ownerId,
    },
  });
}

export async function listTournaments(ownerId: string) {
  return prisma.tournament.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { teams: true } } },
  });
}

export async function getPublicTournamentBySlug(slug: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      teams: { orderBy: { id: "asc" } },
      matches: {
        orderBy: [{ round: "asc" }, { matchOrder: "asc" }],
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
          winnerTeam: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!tournament) {
    throw new TournamentError("Tournament not found", "NOT_FOUND", 404);
  }
  return tournament;
}

export async function getTournament(id: string, ownerId: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { id, ownerId },
    include: {
      teams: { orderBy: { id: "asc" } },
      matches: {
        orderBy: [{ round: "asc" }, { matchOrder: "asc" }],
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
          winnerTeam: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!tournament) {
    throw new TournamentError("Tournament not found", "NOT_FOUND", 404);
  }
  return tournament;
}

export async function addTeam(tournamentId: string, ownerId: string, name: string) {
  const tName = name?.trim();
  if (!tName) {
    throw new TournamentError("Team name is required", "VALIDATION_ERROR", 400);
  }
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, ownerId },
  });
  if (!tournament) {
    throw new TournamentError("Tournament not found", "NOT_FOUND", 404);
  }
  if (tournament.status !== "draft") {
    throw new TournamentError(
      "Teams cannot be added after bracket is generated",
      "BRACKET_LOCKED",
      403,
    );
  }

  return prisma.team.create({
    data: { name: tName, tournamentId },
  });
}

export async function deleteTeam(tournamentId: string, teamId: string, ownerId: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, ownerId },
  });
  if (!tournament) {
    throw new TournamentError("Tournament not found", "NOT_FOUND", 404);
  }
  if (tournament.status !== "draft") {
    throw new TournamentError(
      "Teams cannot be deleted after bracket is generated",
      "BRACKET_LOCKED",
      403,
    );
  }

  const team = await prisma.team.findFirst({
    where: { id: teamId, tournamentId },
  });
  if (!team) {
    throw new TournamentError("Team not found", "NOT_FOUND", 404);
  }

  await prisma.team.delete({ where: { id: teamId } });
}
