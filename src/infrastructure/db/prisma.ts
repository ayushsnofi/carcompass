import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPool(): Pool {
  const connectionString =
    process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";

  return new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 30_000,
    ssl: connectionString.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
  });
}

function createPrismaClient(): PrismaClient {
  const pool = globalForPrisma.pool ?? createPool();
  if (!globalForPrisma.pool) globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
