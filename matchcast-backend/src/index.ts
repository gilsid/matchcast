import Fastify from "fastify";
import cors from "@fastify/cors";
import fjwt from "@fastify/jwt";
import fcookie from "@fastify/cookie";

const DEV_SECRET = "dev-secret-change-in-production";
import { healthRoutes } from "./routes/health.routes";
import { authRoutes } from "./routes/auth.routes";
import { tournamentRoutes } from "./routes/tournament.routes";
import { matchRoutes } from "./routes/match.routes";
import { publicRoutes } from "./routes/public.routes";
import { makeOnRequestAuth } from "./plugins/auth";

const app = Fastify({ logger: true });

await app.register(fcookie);
const jwtSecret = process.env["JWT_SECRET"] || DEV_SECRET;
if (process.env["NODE_ENV"] === "production" && jwtSecret === DEV_SECRET) {
	app.log.error("FATAL: JWT_SECRET must be set in production");
	process.exit(1);
}
if (process.env["NODE_ENV"] !== "production") {
	app.log.warn("WARN: using default JWT_SECRET for development");
}

await app.register(fjwt, {
	secret: jwtSecret,
	cookie: { cookieName: "token", signed: false },
});

const FE_PORT = "5173";
const DEFAULT_ORIGIN = `http://localhost:${FE_PORT}`;
const corsOrigins = (process.env["CORS_ORIGIN"] || DEFAULT_ORIGIN)
	.split(",")
	.map((s: string) => s.trim())
	.filter(Boolean);
await app.register(cors, {
	origin: corsOrigins,
	credentials: true,
	methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
});

const requireAuth = makeOnRequestAuth(app.jwt);

await app.register(healthRoutes, { prefix: "" });
await app.register(authRoutes, { prefix: "" });
await app.register(tournamentRoutes, { prefix: "", requireAuth });
await app.register(matchRoutes, { prefix: "", requireAuth });
await app.register(publicRoutes);

app.setErrorHandler((err, request, reply) => {
	app.log.error(
		{ err, url: request.url, method: request.method },
		"Unhandled error",
	);
	const statusCode =
		typeof err === "object" && err !== null && "statusCode" in err
			? (err as { statusCode: number }).statusCode
			: 500;
	reply.code(statusCode).send({
		success: false,
		error: {
			message:
				statusCode === 429
					? "Terlalu banyak permintaan."
					: "Terjadi kesalahan, coba lagi nanti.",
			code: statusCode === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR",
		},
	});
});

const port = parseInt(process.env["PORT"] || "3001", 10);

try {
	await app.listen({ port, host: "0.0.0.0" });
	app.log.info(`Server running on port ${port}`);
} catch (err) {
	app.log.error(err);
	process.exit(1);
}
