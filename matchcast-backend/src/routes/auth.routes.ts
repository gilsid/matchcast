import type { FastifyPluginAsync } from "fastify";
import * as authService from "../services/auth.service";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/register", async (request, reply) => {
    const { email, password, name } = request.body as {
      email: string;
      password: string;
      name: string;
    };

    if (!email || !password || !name) {
      reply.code(400).send({
        success: false,
        error: { message: "Email, password, and name are required", code: "VALIDATION_ERROR" },
      });
      return;
    }

    if (password.length < 8) {
      reply.code(400).send({
        success: false,
        error: { message: "Password must be at least 8 characters", code: "VALIDATION_ERROR" },
      });
      return;
    }

    try {
      const user = await authService.register(email, password, name);
      reply.code(201).send({ success: true, data: user });
    } catch (err) {
      if (err instanceof authService.AuthError) {
        reply.code(err.statusCode).send({
          success: false,
          error: { message: err.message, code: err.code },
        });
        return;
      }
      throw err;
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      reply.code(400).send({
        success: false,
        error: { message: "Email and password are required", code: "VALIDATION_ERROR" },
      });
      return;
    }

    try {
      const user = await authService.login(email, password);
      const token = app.jwt.sign({ id: user.id }, { expiresIn: "7d" });

      reply.setCookie("token", token, {
        httpOnly: true,
        secure: process.env["NODE_ENV"] === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      reply.send({ success: true, data: { token, user } });
    } catch (err) {
      if (err instanceof authService.AuthError) {
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
