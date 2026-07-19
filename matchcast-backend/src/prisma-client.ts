import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env["DATABASE_URL"]!,
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
