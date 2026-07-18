import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import rateLimit from "@fastify/rate-limit";
import * as tournamentService from "../services/tournament.service";
import * as bracketService from "../services/bracket.service";
import { wrapHandler } from "../utils/route-handler";

export const publicRoutes: FastifyPluginAsync = async (app) => {
  await app.register(rateLimit, {
    max: 30,
    timeWindow: "1 minute",
    errorResponseBuilder: (_req, context) => ({
      success: false,
      error: {
        message: `Too many requests. Try again in ${context.after ? (context.after.endsWith("s") ? context.after.slice(0, -1) + " detik" : context.after) : "60 detik"}.`,
        code: "RATE_LIMITED",
      },
    }),
  });

  app.get("/t/:slug", wrapHandler(async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const tournament = await tournamentService.getPublicTournamentBySlug(slug);
    reply.send({ success: true, data: tournament });
  }));

  app.get("/t/:slug/matches", wrapHandler(async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as { page?: string; limit?: string };
    const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "50", 10) || 50));
    const result = await bracketService.getPublicMatches(slug, page, limit);
    reply.send({ success: true, data: result });
  }));
};
