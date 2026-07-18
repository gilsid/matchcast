import type { FastifyReply, FastifyRequest } from "fastify";

export class DomainError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 400,
  ) {
    super(message);
  }
}

type Handler<T> = (request: FastifyRequest, reply: FastifyReply) => Promise<T>;

export function wrapHandler<T>(fn: Handler<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return await fn(request, reply);
    } catch (err: unknown) {
      if (err instanceof DomainError) {
        reply.code(err.statusCode).send({
          success: false,
          error: { message: err.message, code: err.code },
        });
        return;
      }
      throw err;
    }
  };
}
