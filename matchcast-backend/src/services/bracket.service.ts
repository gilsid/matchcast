import { prisma } from "../prisma-client";
import type { Prisma } from "../generated/prisma/client";
import { DomainError } from "../utils/route-handler";

export class BracketError extends DomainError {}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

interface TeamWithSeed {
  id: string;
  name: string;
  seed: number;
}

export async function generateBracket(tournamentId: string, ownerId: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, ownerId },
    include: { teams: { orderBy: { id: "asc" } } },
  });

  if (!tournament) {
    throw new BracketError("Tournament not found", "NOT_FOUND", 404);
  }

  if (tournament.teams.length < 2) {
    throw new BracketError("Minimum 2 teams required", "NOT_ENOUGH_TEAMS", 400);
  }

  // Shuffle teams for random seeding
  const shuffledTeams = shuffleArray(tournament.teams);
  const teamsWithSeed: TeamWithSeed[] = shuffledTeams.map((t, i) => ({
    id: t.id,
    name: t.name,
    seed: i + 1,
  }));

  const n = teamsWithSeed.length;
  const P = nextPowerOf2(n);
  const byes = P - n;

  // Teams with seeds 1..byes get bye to round 2
  // Teams with seeds byes+1..n play in round 1
  const round1Teams = teamsWithSeed.slice(byes);
  const round1Matches = round1Teams.length / 2;
  const totalRounds = Math.log2(P);

  const matchesToCreate: Array<{
    round: number;
    matchOrder: number;
    homeTeamId: string | null;
    awayTeamId: string | null;
    status: string;
  }> = [];

  // Round 1 matches
  let matchOrder = 1;
  for (let i = 0; i < round1Matches; i++) {
    matchesToCreate.push({
      round: 1,
      matchOrder: matchOrder++,
      homeTeamId: round1Teams[i * 2]!.id,
      awayTeamId: round1Teams[i * 2 + 1]!.id,
      status: "scheduled",
    });
  }

  // Rounds 2..totalRounds
  let prevRoundMatches = round1Matches + byes;
  for (let r = 2; r <= totalRounds; r++) {
    const matchesInRound = prevRoundMatches / 2;
    matchOrder = 1;

    // Round 2: compute which slots propagateWinner will fill from R1 matches
    const propagateSlots = new Set<number>();
    if (r === 2 && round1Matches > 0) {
      for (let m = 1; m <= round1Matches; m++) {
        const r2MatchIdx = Math.ceil(m / 2) - 1;
        const isHome = m % 2 === 1;
        propagateSlots.add(r2MatchIdx * 2 + (isHome ? 0 : 1));
      }
    }

    const byeTeams = r === 2 ? teamsWithSeed.slice(0, byes) : [];
    let byeIdx = 0;

    for (let i = 0; i < matchesInRound; i++) {
      const match: {
        round: number;
        matchOrder: number;
        homeTeamId: string | null;
        awayTeamId: string | null;
        status: string;
      } = {
        round: r,
        matchOrder: matchOrder++,
        homeTeamId: null,
        awayTeamId: null,
        status: "scheduled",
      };

      // Place bye teams into round 2 slots NOT reserved for propagate
      if (r === 2 && byes > 0) {
        const homeSlot = i * 2;
        const awaySlot = i * 2 + 1;
        if (byeIdx < byes && !propagateSlots.has(homeSlot)) {
          match.homeTeamId = byeTeams[byeIdx++]!.id;
        }
        if (byeIdx < byes && !propagateSlots.has(awaySlot)) {
          match.awayTeamId = byeTeams[byeIdx++]!.id;
        }
      }

      matchesToCreate.push(match);
    }
    prevRoundMatches = matchesInRound;
  }

  // Create all matches in a transaction (atomic lock + match creation + seed persist)
  const createdMatches = await prisma.$transaction(async (tx) => {
    // Atomic lock: update status hanya jika masih "draft"
    const locked = await tx.tournament.updateMany({
      where: { id: tournamentId, status: "draft" },
      data: { status: "ongoing" },
    });
    if (locked.count === 0) {
      throw new BracketError("Bracket already generated or tournament not in draft status", "BRACKET_EXISTS", 409);
    }

    // Persist computed seeds
    for (const t of teamsWithSeed) {
      await tx.team.update({ where: { id: t.id }, data: { seed: t.seed } });
    }

    const created = [];
    for (const m of matchesToCreate) {
      const match = await tx.match.create({
        data: {
          tournamentId,
          round: m.round,
          matchOrder: m.matchOrder,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          status: m.status,
        },
        include: { homeTeam: true, awayTeam: true },
      });
      created.push(match);
    }
    return created;
  });

  return createdMatches;
}

export async function startMatch(matchId: string, ownerId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });

  if (!match) {
    throw new BracketError("Match not found", "NOT_FOUND", 404);
  }

  if (match.tournament.ownerId !== ownerId) {
    throw new BracketError("Not authorized", "UNAUTHORIZED", 403);
  }

  if (match.status !== "scheduled") {
    throw new BracketError("Match already started or finished", "INVALID_STATUS", 400);
  }

  if (!match.homeTeamId || !match.awayTeamId) {
    throw new BracketError("Both teams must be assigned before starting", "MISSING_TEAMS", 400);
  }

  // Atomic update: hanya jika status masih "scheduled" — mencegah race condition
  const updated = await prisma.match.updateMany({
    where: { id: matchId, status: "scheduled" },
    data: { status: "ongoing" },
  });
  if (updated.count === 0) {
    throw new BracketError("Match already started or finished", "INVALID_STATUS", 400);
  }

  return prisma.match.findUnique({ where: { id: matchId } });
}

export async function updateMatchScore(
  matchId: string,
  ownerId: string,
  homeScore: number,
  awayScore: number,
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (!match) {
    throw new BracketError("Match not found", "NOT_FOUND", 404);
  }

  if (match.tournament.ownerId !== ownerId) {
    throw new BracketError("Not authorized", "UNAUTHORIZED", 403);
  }

  if (homeScore < 0 || awayScore < 0) {
    throw new BracketError("Scores cannot be negative", "VALIDATION_ERROR", 400);
  }

  if (homeScore === awayScore) {
    throw new BracketError("Scores cannot be tied in knockout", "TIED_SCORE", 400);
  }

  const winnerTeamId = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
  if (!winnerTeamId) {
    throw new BracketError("Cannot determine winner: missing team", "MISSING_TEAM", 400);
  }

  // Atomic score update + propagate + tournament-finish in single transaction
  const [updatedMatch] = await prisma.$transaction(async (tx) => {
    const updatedBatch = await tx.match.updateMany({
      where: { id: matchId, status: "ongoing" },
      data: {
        homeScore,
        awayScore,
        winnerTeamId,
        status: "finished",
      },
    });
    if (updatedBatch.count === 0) {
      throw new BracketError("Match already finished", "ALREADY_FINISHED", 400);
    }

    const updated = await tx.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true, winnerTeam: true },
    });
    if (!updated) {
      throw new BracketError("Match not found", "NOT_FOUND", 404);
    }

    // Propagate winner to next round
    await propagateWinner(tx, match.tournamentId, match.round, match.matchOrder, winnerTeamId);

    // Check if tournament is finished (final match done)
    const finalMatch = await tx.match.findFirst({
      where: { tournamentId: match.tournamentId },
      orderBy: { round: "desc" },
    });
    if (finalMatch && finalMatch.status === "finished") {
      await tx.tournament.update({
        where: { id: match.tournamentId },
        data: { status: "finished" },
      });
    }

    return [updated];
  });

  return updatedMatch;
}

async function propagateWinner(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  currentRound: number,
  currentMatchOrder: number,
  winnerTeamId: string,
) {
  const nextRound = currentRound + 1;
  // Next round match order: ceil(currentMatchOrder / 2)
  const nextMatchOrder = Math.ceil(currentMatchOrder / 2);

  // In the next round match, winner becomes home if currentMatchOrder is odd, away if even
  const isHome = currentMatchOrder % 2 === 1;

  const nextMatch = await tx.match.findFirst({
    where: {
      tournamentId,
      round: nextRound,
      matchOrder: nextMatchOrder,
    },
  });

  if (!nextMatch) return; // No next round match (this was the final)

  if (isHome) {
    // Winner goes to home slot if empty, else away
    if (nextMatch.homeTeamId === null) {
      await tx.match.update({
        where: { id: nextMatch.id },
        data: { homeTeamId: winnerTeamId },
      });
    } else if (nextMatch.awayTeamId === null) {
      await tx.match.update({
        where: { id: nextMatch.id },
        data: { awayTeamId: winnerTeamId },
      });
    } else {
      throw new BracketError("Next round match already has both teams assigned", "BRACKET_CORRUPT", 500);
    }
  } else {
    // Winner goes to away slot if empty, else home
    if (nextMatch.awayTeamId === null) {
      await tx.match.update({
        where: { id: nextMatch.id },
        data: { awayTeamId: winnerTeamId },
      });
    } else if (nextMatch.homeTeamId === null) {
      await tx.match.update({
        where: { id: nextMatch.id },
        data: { homeTeamId: winnerTeamId },
      });
    } else {
      throw new BracketError("Next round match already has both teams assigned", "BRACKET_CORRUPT", 500);
    }
  }

  // If both teams now filled and status was scheduled, keep as scheduled (will be played)
}

export async function getPublicMatches(slug: string, page = 1, limit = 50) {
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });

  if (!tournament) {
    throw new BracketError("Tournament not found", "NOT_FOUND", 404);
  }

  const skip = (page - 1) * limit;
  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where: { tournamentId: tournament.id },
      orderBy: [{ round: "asc" }, { matchOrder: "asc" }],
      skip,
      take: limit,
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        winnerTeam: { select: { id: true, name: true } },
      },
    }),
    prisma.match.count({ where: { tournamentId: tournament.id } }),
  ]);

  return {
    matches,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}