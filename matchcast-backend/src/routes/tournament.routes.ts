import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import * as tournamentService from "../services/tournament.service";
import * as bracketService from "../services/bracket.service";
import { wrapHandler } from "../utils/route-handler";

export const tournamentRoutes: FastifyPluginAsync<{ requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void> }> = async (app, opts) => {
  const auth = opts.requireAuth;

  app.post("/tournaments", { onRequest: [auth] }, wrapHandler(async (request, reply) => {
    const body = request.body as { name?: string; sport?: string; format?: string };
    const name = body.name?.trim() ?? "";
    const sport = body.sport?.trim() ?? "";
    if (name.length > 100) {
      reply.code(400).send({
        success: false,
        error: { message: "Nama turnamen maksimal 100 karakter", code: "VALIDATION_ERROR" },
      });
      return;
    }
    if (!sport) {
      reply.code(400).send({
        success: false,
        error: { message: "Sport is required", code: "VALIDATION_ERROR" },
      });
      return;
    }
    const tournament = await tournamentService.createTournament(request.userId, { name, sport, format: body.format });
    reply.code(201).send({ success: true, data: tournament });
  }));

  app.get("/tournaments", { onRequest: [auth] }, wrapHandler(async (request, reply) => {
    const tournaments = await tournamentService.listTournaments(request.userId);
    reply.send({ success: true, data: tournaments });
  }));

  app.get("/tournaments/:id", { onRequest: [auth] }, wrapHandler(async (request, reply) => {
    const { id } = request.params as { id: string };
    const tournament = await tournamentService.getTournament(id, request.userId);
    reply.send({ success: true, data: tournament });
  }));

  app.post("/tournaments/:id/teams", { onRequest: [auth] }, wrapHandler(async (request, reply) => {
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
    const team = await tournamentService.addTeam(id, request.userId, teamName);
    reply.code(201).send({ success: true, data: team });
  }));

  app.delete("/tournaments/:id/teams/:teamId", { onRequest: [auth] }, wrapHandler(async (request, reply) => {
    const { id, teamId } = request.params as { id: string; teamId: string };
    await tournamentService.deleteTeam(id, teamId, request.userId);
    reply.send({ success: true, data: null });
  }));

  app.post("/tournaments/:id/generate-bracket", { onRequest: [auth] }, wrapHandler(async (request, reply) => {
    const { id } = request.params as { id: string };
    const matches = await bracketService.generateBracket(id, request.userId);
    reply.send({ success: true, data: matches });
  }));

  app.patch("/matches/:id/start", { onRequest: [auth] }, wrapHandler(async (request, reply) => {
    const { id } = request.params as { id: string };
    const match = await bracketService.startMatch(id, request.userId);
    reply.send({ success: true, data: match });
  }));

  app.patch("/matches/:id/score", { onRequest: [auth] }, wrapHandler(async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { homeScore?: number; awayScore?: number };
    if (body.homeScore === undefined || body.awayScore === undefined) {
      reply.code(400).send({
        success: false,
        error: { message: "homeScore and awayScore are required", code: "VALIDATION_ERROR" },
      });
      return;
    }
    const match = await bracketService.updateMatchScore(id, request.userId, body.homeScore, body.awayScore);
    reply.send({ success: true, data: match });
  }));
};
