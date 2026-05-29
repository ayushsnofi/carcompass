import { readFileSync } from "fs";
import { Client } from "pg";

function readEnv(key: string): string | undefined {
  const env = readFileSync(".env", "utf8");
  const match = env.match(new RegExp(`${key}="([^"]+)"`));
  return match?.[1];
}

async function main() {
  const directUrl = readEnv("DIRECT_URL");
  const databaseUrl = readEnv("DATABASE_URL");

  if (!directUrl) {
    console.error("DIRECT_URL not found in .env");
    process.exit(1);
  }

  console.log("Testing DIRECT_URL...");
  const client = new Client({
    connectionString: directUrl,
    connectionTimeoutMillis: 20_000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const res = await client.query("SELECT 1 AS ok");
    console.log("SUCCESS:", res.rows);
  } catch (e) {
    console.error("FAILED:", e instanceof Error ? e.message : e);
    console.error("\nTips:");
    console.error("- Copy fresh URLs from Prisma Console / Vercel Storage");
    console.error("- DIRECT_URL must use db.prisma.io (not pooled.db.prisma.io)");
    console.error("- Ensure the database is Active (not paused)");
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }

  if (databaseUrl?.includes("pooled.db.prisma.io")) {
    console.warn(
      "\nWARN: DATABASE_URL uses pooled host — use db.prisma.io for migrations (DIRECT_URL)."
    );
  }
}

main();
