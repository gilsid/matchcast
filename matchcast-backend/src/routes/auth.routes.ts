import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import rateLimit from "@fastify/rate-limit";
import * as authService from "../services/auth.service.js";
import { wrapHandler } from "../utils/route-handler.js";

function validationError(reply: FastifyReply, message: string) {
	reply.code(400).send({
		success: false,
		error: { message, code: "VALIDATION_ERROR" },
	});
}

function validateRegisterInput(
	email: string,
	password: string,
	name: string,
): Record<string, never> | { error: string } {
	const trimmedEmail = email?.trim() ?? "";
	const trimmedName = name?.trim() ?? "";

	if (!trimmedEmail || !password || !trimmedName) {
		return { error: "Email, password, dan nama wajib diisi" };
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
		return { error: "Format email tidak valid" };
	}
	if (trimmedEmail.length > 254 || trimmedName.length > 100) {
		return { error: "Email atau nama terlalu panjang" };
	}
	if (password.length < 8) return { error: "Password minimal 8 karakter" };
	if (password.length > 128) return { error: "Password maksimal 128 karakter" };
	return {};
}

function validateLoginInput(
	email: string,
	password: string,
): Record<string, never> | { error: string } {
	const trimmedEmail = email?.trim() ?? "";
	if (!trimmedEmail || !password) {
		return { error: "Email dan password wajib diisi" };
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
		return { error: "Format email tidak valid" };
	}
	if (password.length > 128) return { error: "Password maksimal 128 karakter" };
	return {};
}

const rateLimitOpts = {
	max: parseInt(process.env["AUTH_RATE_LIMIT"] || "5", 10),
	timeWindow: "1 minute" as const,
	keyGenerator: (req: FastifyRequest) => req.ip,
	errorResponseBuilder: () => ({
		success: false,
		error: {
			message: "Terlalu banyak percobaan. Coba lagi dalam 1 menit.",
			code: "RATE_LIMITED",
		},
	}),
};

export const authRoutes: FastifyPluginAsync = async (app) => {
	await app.register(rateLimit, {
		max: 100,
		timeWindow: "1 minute",
		keyGenerator: (req: FastifyRequest) => req.ip,
		errorResponseBuilder: () => ({
			success: false,
			error: {
				message: "Terlalu banyak percobaan. Coba lagi dalam 1 menit.",
				code: "RATE_LIMITED",
			},
		}),
	});

	app.post(
		"/auth/register",
		{ config: { rateLimit: rateLimitOpts } },
		wrapHandler(async (request, reply) => {
			const { email, password, name } = request.body as {
				email: string;
				password: string;
				name: string;
			};

			const err = validateRegisterInput(email, password, name);
			if ("error" in err) {
				validationError(reply, err.error);
				return;
			}

			const user = await authService.register(
				email?.trim() ?? "",
				password,
				name?.trim() ?? "",
			);
			reply.code(201).send({ success: true, data: user });
		}),
	);

	app.post(
		"/auth/login",
		{ config: { rateLimit: rateLimitOpts } },
		wrapHandler(async (request, reply) => {
			const { email, password } = request.body as {
				email: string;
				password: string;
			};

			const err = validateLoginInput(email, password);
			if ("error" in err) {
				validationError(reply, err.error);
				return;
			}

			const user = await authService.login(email?.trim() ?? "", password);
			const token = app.jwt.sign({ id: user.id }, { expiresIn: "7d" });

			reply.setCookie("token", token, {
				httpOnly: true,
				secure: process.env["NODE_ENV"] === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 7 * 24 * 60 * 60, // 7 days
			});

			reply.send({ success: true, data: { token, user } });
		}),
	);

	app.post(
		"/auth/logout",
		{ config: { rateLimit: rateLimitOpts } },
		wrapHandler((_request, reply) => {
			reply.setCookie("token", "", {
				httpOnly: true,
				secure: process.env["NODE_ENV"] === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 0,
			});
			reply.send({ success: true, data: null });
			return Promise.resolve();
		}),
	);
};
