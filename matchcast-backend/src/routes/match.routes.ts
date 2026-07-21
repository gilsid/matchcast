import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import * as bracketService from "../services/bracket.service";
import { wrapHandler } from "../utils/route-handler";

export const matchRoutes: FastifyPluginAsync<{
	requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
}> = async (app, opts) => {
	const auth = opts.requireAuth;

	app.patch(
		"/matches/:id/start",
		{ onRequest: [auth] },
		wrapHandler(async (request, reply) => {
			const { id } = request.params as { id: string };
			const match = await bracketService.startMatch(id, request.userId);
			reply.send({ success: true, data: match });
		}),
	);

	app.patch(
		"/matches/:id/score",
		{ onRequest: [auth] },
		wrapHandler(async (request, reply) => {
			const { id } = request.params as { id: string };
			const body = request.body as { homeScore?: number; awayScore?: number };
			if (body.homeScore === undefined || body.awayScore === undefined) {
				reply.code(400).send({
					success: false,
					error: {
						message: "homeScore dan awayScore wajib diisi",
						code: "VALIDATION_ERROR",
					},
				});
				return;
			}
			if (
				!Number.isInteger(body.homeScore) ||
				!Number.isInteger(body.awayScore)
			) {
				reply.code(400).send({
					success: false,
					error: {
						message: "Skor harus berupa bilangan bulat",
						code: "VALIDATION_ERROR",
					},
				});
				return;
			}
			if (body.homeScore < 0 || body.awayScore < 0) {
				reply.code(400).send({
					success: false,
					error: {
						message: "Skor tidak boleh negatif",
						code: "VALIDATION_ERROR",
					},
				});
				return;
			}
			const match = await bracketService.updateMatchScore(
				id,
				request.userId,
				body.homeScore,
				body.awayScore,
			);
			reply.send({ success: true, data: match });
		}),
	);
};
