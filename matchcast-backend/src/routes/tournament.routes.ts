import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import * as tournamentService from "../services/tournament.service";
import * as bracketService from "../services/bracket.service";

export const tournamentRoutes: FastifyPluginAsync<{ requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void> }> = async (app, opts) => {
  const auth = opts.requireAuth;

  app.post("/tournaments", { onRequest: [auth] }, async (request, reply) => {
    const body = request.body as { name?: string; sport?: string; format?: string };
    const name = body.name?.trim() ?? "";
    if (name.length > 100) {
      reply.code(400).send({
        success: false,
        error: { message: "Nama turnamen maksimal 100 karakter", code: "VALIDATION_ERROR" },
      });
      return;
    }
    try {
      const tournament = await tournamentService.createTournament(request.userId, { ...body, name });
      reply.code(201).send({ success: true, data: tournament });
    } catch (err) {
      if (err instanceof tournamentService.TournamentError) {
        reply.code(err.statusCode).send({
          success: false,
          error: { message: err.message, code: err.code },
        });
        return;
      }
      throw err;
    }
  });

  app.get("/tournaments", { onRequest: [auth] }, async (request, reply) => {
    const tournaments = await tournamentService.listTournaments(request.userId);
    reply.send({ success: true, data: tournaments });
  });

  app.get("/tournaments/:id", { onRequest: [auth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const tournament = await tournamentService.getTournament(id, request.userId);
      reply.send({ success: true, data: tournament });
    } catch (err) {
      if (err instanceof tournamentService.TournamentError) {
        reply.code(err.statusCode).send({
          success: false,
          error: { message: err.message, code: err.code },
        });
        return;
      }
      throw err;
    }
  });

  app.post("/tournaments/:id/teams", { onRequest: [auth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string };
    const teamName = body.name?.trim() ?? "";
    if (teamName.length > 50) {
      reply.code(400).send({
        success: false,
        error: { message: "Nama tim maksimal 50 karakter", code: "VALIDATION_ERROR" },
      });
      return;
    }
    try {
      const team = await tournamentService.addTeam(id, request.userId, teamName);
      reply.code(201).send({ success: true, data: team });
    } catch (err) {
      if (err instanceof tournamentService.TournamentError) {
        reply.code(err.statusCode).send({
          success: false,
          error: { message: err.message, code: err.code },
        });
        return;
      }
      throw err;
    }
  });

  app.delete("/tournaments/:id/teams/:teamId", { onRequest: [auth] }, async (request, reply) => {
    const { id, teamId } = request.params as { id: string; teamId: string };
    try {
      await tournamentService.deleteTeam(id, teamId, request.userId);
      reply.send({ success: true, data: null });
    } catch (err) {
      if (err instanceof tournamentService.TournamentError) {
        reply.code(err.statusCode).send({
          success: false,
          error: { message: err.message, code: err.code },
        });
        return;
      }
      throw err;
    }
  });

  app.post("/tournaments/:id/generate-bracket", { onRequest: [auth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const matches = await bracketService.generateBracket(id, request.userId);
      reply.send({ success: true, data: matches });
    } catch (err) {
      if (err instanceof bracketService.BracketError) {
        reply.code(err.statusCode).send({
          success: false,
          error: { message: err.message, code: err.code },
        });
        return;
      }
      throw err;
    }
  });

  app.patch("/matches/:id/start", { onRequest: [auth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const match = await bracketService.startMatch(id, request.userId);
      reply.send({ success: true, data: match });
    } catch (err) {
      if (err instanceof bracketService.BracketError) {
        reply.code(err.statusCode).send({
          success: false,
          error: { message: err.message, code: err.code },
        });
        return;
      }
      throw err;
    }
  });

  app.patch("/matches/:id/score", { onRequest: [auth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { homeScore?: number; awayScore?: number };
    if (body.homeScore === undefined || body.awayScore === undefined) {
      reply.code(400).send({
        success: false,
        error: { message: "homeScore and awayScore are required", code: "VALIDATION_ERROR" },
      });
      return;
    }
    try {
      const match = await bracketService.updateMatchScore(id, request.userId, body.homeScore, body.awayScore);
      reply.send({ success: true, data: match });
    } catch (err) {
      if (err instanceof bracketService.BracketError) {
        reply.code(err.statusCode).send({
          success: false,
          error: { message: err.message, code: err.code },
        });
        return;
      }
      throw err;
    }
  });
};
