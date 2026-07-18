import type { FastifyPluginAsync } from "fastify";
import rateLimit from "@fastify/rate-limit";
import * as authService from "../services/auth.service";

export const authRoutes: FastifyPluginAsync = async (app) => {
  await app.register(rateLimit, {
    max: parseInt(process.env["AUTH_RATE_LIMIT"] || "5", 10),
    timeWindow: "1 minute",
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      success: false,
      error: { message: "Terlalu banyak percobaan. Coba lagi dalam 1 menit.", code: "RATE_LIMITED" },
    }),
  });

  app.post("/auth/register", async (request, reply) => {
    const { email, password, name } = request.body as {
      email: string;
      password: string;
      name: string;
    };

    const trimmedEmail = email?.trim() ?? "";
    const trimmedName = name?.trim() ?? "";

    if (!trimmedEmail || !password || !trimmedName) {
      reply.code(400).send({
        success: false,
        error: { message: "Email, password, and name are required", code: "VALIDATION_ERROR" },
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      reply.code(400).send({
        success: false,
        error: { message: "Format email tidak valid", code: "VALIDATION_ERROR" },
      });
      return;
    }

    if (trimmedEmail.length > 254 || trimmedName.length > 100) {
      reply.code(400).send({
        success: false,
        error: { message: "Email atau nama terlalu panjang", code: "VALIDATION_ERROR" },
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
    if (password.length > 128) {
      reply.code(400).send({
        success: false,
        error: { message: "Password maksimal 128 karakter", code: "VALIDATION_ERROR" },
      });
      return;
    }

    try {
      const user = await authService.register(trimmedEmail, password, trimmedName);
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

    const trimmedEmail = email?.trim() ?? "";

    if (!trimmedEmail || !password) {
      reply.code(400).send({
        success: false,
        error: { message: "Email and password are required", code: "VALIDATION_ERROR" },
      });
      return;
    }
    if (password.length > 128) {
      reply.code(400).send({
        success: false,
        error: { message: "Password maksimal 128 karakter", code: "VALIDATION_ERROR" },
      });
      return;
    }

    try {
      const user = await authService.login(trimmedEmail, password);
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
