import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const dbUrl = process.env["DATABASE_URL"];
if (!dbUrl) {
	console.error("FATAL: DATABASE_URL must be set");
	process.exit(1);
}
const pool = new pg.Pool({
	connectionString: dbUrl,
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

// ponytail: suppress pg@8 concurrent client.query() deprecation warning (harmless, gone in pg@9)
const origEmit = process.emitWarning.bind(process);
process.emitWarning = (warning, ...args) => {
	if (
		typeof warning === "string"
			? args[0] === "DeprecationWarning" && warning.includes("client.query()")
			: (warning as Error).name === "DeprecationWarning" &&
				(warning as Error).message.includes("client.query()")
	)
		return;
	return (origEmit as any)(warning, ...args);
};
