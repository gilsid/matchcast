import type { FastifyPluginAsync } from "fastify";
import rateLimit from "@fastify/rate-limit";
import * as tournamentService from "../services/tournament.service";
import * as bracketService from "../services/bracket.service";

export const publicRoutes: FastifyPluginAsync = async (app) => {
  await app.register(rateLimit, {
    max: 30,
    timeWindow: "1 minute",
    errorResponseBuilder: (_req, context) => ({
      success: false,
      error: {
        message: `Too many requests. Try again in ${context.after?.replace("s", " detik") ?? "60 detik"}.`,
        code: "RATE_LIMITED",
      },
    }),
  });

  app.get("/t/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    try {
      const tournament = await tournamentService.getPublicTournamentBySlug(slug);
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

  app.get("/t/:slug/matches", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    try {
      const matches = await bracketService.getPublicMatches(slug);
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
};
