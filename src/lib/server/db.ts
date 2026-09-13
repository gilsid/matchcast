import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaNeonHttp } from '@prisma/adapter-neon';
import pg from 'pg';

function loadDbUrl(): string {
	const url = process.env['DATABASE_URL'];
	if (!url) {
		console.error('FATAL: DATABASE_URL must be set');
		process.exit(1);
	}
	return url;
}

function createPrisma(): PrismaClient {
	const dbUrl = loadDbUrl();
	// Neon HTTP on Vercel: pg Pool exhausts connections across lambdas.
	// Plain pg Pool stays for local dev and tests.
	if (dbUrl.includes('neon.tech')) {
		return new PrismaClient({ adapter: new PrismaNeonHttp(dbUrl, {}) });
	}
	const pool = new pg.Pool({ connectionString: dbUrl });
	return new PrismaClient({ adapter: new PrismaPg(pool) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function load(): PrismaClient {
	// Shared via globalThis: survives dev HMR reloads and warm lambdas.
	globalForPrisma.prisma ??= createPrisma();
	return globalForPrisma.prisma;
}

// Lazy on purpose. SvelteKit imports server modules during build, when
// DATABASE_URL may not exist yet. First real query triggers the FATAL above.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
	get: (_target, prop) => {
		const value = Reflect.get(load(), prop);
		return typeof value === 'function' ? value.bind(load()) : value;
	}
});
