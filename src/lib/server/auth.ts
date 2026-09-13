import type { Cookies } from '@sveltejs/kit';
import { SignJWT, jwtVerify } from 'jose';
import { compare, hash } from 'bcryptjs';
import { prisma } from './db';
import { DomainError } from './errors';

export class AuthError extends DomainError {}

const SALT_ROUNDS = 12;
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const DEV_SECRET = 'dev-secret-change-in-production';

function getSecret(): Uint8Array {
	const secret = process.env['JWT_SECRET'] ?? DEV_SECRET;
	if (secret === DEV_SECRET) {
		if (process.env['NODE_ENV'] === 'production') {
			console.error('FATAL: JWT_SECRET must be set in production');
			process.exit(1);
		}
		console.warn('WARN: using default JWT_SECRET for development');
	}
	return new TextEncoder().encode(secret);
}

export async function register(email: string, password: string, name: string) {
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		throw new AuthError('Email already registered', 'EMAIL_EXISTS', 409);
	}

	const passwordHash = await hash(password, SALT_ROUNDS);
	return prisma.user.create({
		data: { email, passwordHash, name },
		select: { id: true, email: true, name: true, createdAt: true }
	});
}

export async function login(email: string, password: string) {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
	}

	const valid = await compare(password, user.passwordHash);
	if (!valid) {
		throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
	}

	return {
		id: user.id,
		email: user.email,
		name: user.name,
		createdAt: user.createdAt
	};
}

export function signToken(userId: string): Promise<string> {
	return new SignJWT({ id: userId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
		.sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ id: string } | null> {
	try {
		const { payload } = await jwtVerify(token, getSecret());
		if (typeof payload['id'] !== 'string') return null;
		return { id: payload['id'] };
	} catch {
		return null;
	}
}

export function authCookies() {
	return {
		path: '/',
		httpOnly: true,
		secure: process.env['NODE_ENV'] === 'production',
		sameSite: 'lax' as const,
		maxAge: TOKEN_TTL_SECONDS
	};
}

export function extractToken(cookies: Cookies, request: Request): string | null {
	return (
		cookies.get('token') ?? request.headers.get('authorization')?.replace('Bearer ', '') ?? null
	);
}
