import { prisma } from "../prisma-client";
import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 12;

import { DomainError } from "../utils/route-handler";

export class AuthError extends DomainError {}

export async function register(email: string, password: string, name: string) {
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		throw new AuthError("Email already registered", "EMAIL_EXISTS", 409);
	}

	const passwordHash = await hash(password, SALT_ROUNDS);
	const user = await prisma.user.create({
		data: { email, passwordHash, name },
		select: { id: true, email: true, name: true, createdAt: true },
	});

	return user;
}

export async function login(email: string, password: string) {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw new AuthError("Invalid credentials", "INVALID_CREDENTIALS", 401);
	}

	const valid = await compare(password, user.passwordHash);
	if (!valid) {
		throw new AuthError("Invalid credentials", "INVALID_CREDENTIALS", 401);
	}

	return (({ passwordHash: _, ...rest }) => rest)(user);
}
