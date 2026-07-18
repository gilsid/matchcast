import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

function getToken(request: FastifyRequest): string | null {
  return request.cookies?.["token"] ?? request.headers.authorization?.replace("Bearer ", "") ?? null;
}

export function makeOnRequestAuth(jwt: FastifyInstance["jwt"]) {
  // async required — Fastify onRequest hook type expects Promise<void>
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = getToken(request);
    if (!token) {
      reply.code(401).send({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }
    try {
      const decoded = jwt.verify<{ id: string }>(token);
      request.userId = decoded.id;
    } catch {
      reply.code(401).send({ success: false, error: { message: "Invalid token", code: "INVALID_TOKEN" } });
    }
  };
}
