import Fastify from "fastify";
import cors from "@fastify/cors";
import fjwt from "@fastify/jwt";
import fcookie from "@fastify/cookie";
import { healthRoutes } from "./routes/health.routes";
import { authRoutes } from "./routes/auth.routes";
import { tournamentRoutes } from "./routes/tournament.routes";
import { publicRoutes } from "./routes/public.routes";
import { makeOnRequestAuth } from "./plugins/auth";

const app = Fastify({ logger: true });

await app.register(fcookie);
await app.register(fjwt, {
  secret: process.env["JWT_SECRET"] || "dev-secret-change-in-production",
  cookie: { cookieName: "token" },
});

await app.register(cors, {
  origin: process.env["CORS_ORIGIN"] || "http://localhost:5173",
  credentials: true,
});

const requireAuth = makeOnRequestAuth(app.jwt);

await app.register(healthRoutes, { prefix: "" });
await app.register(authRoutes, { prefix: "" });
await app.register(tournamentRoutes, { prefix: "", requireAuth });
await app.register(publicRoutes);

const port = parseInt(process.env["PORT"] || "3001", 10);

try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Server running on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
