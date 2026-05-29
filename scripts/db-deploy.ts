/**
 * Apply Prisma migrations via node-pg (workaround for Prisma CLI P1001 on Windows + Prisma Postgres SSL).
 */
import { randomUUID } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { Client } from "pg";

function readEnv(key: string): string {
  const env = readFileSync(".env", "utf8");
  const match = env.match(new RegExp(`${key}="([^"]+)"`));
  if (!match?.[1]) throw new Error(`${key} not set in .env`);
  return match[1];
}

async function main() {
  const url = readEnv("DIRECT_URL");
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 30_000,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to Postgres");

  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);

  const migrationsDir = join(process.cwd(), "prisma", "migrations");
  const folders = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const folder of folders) {
    const sqlPath = join(migrationsDir, folder, "migration.sql");
    let sql: string;
    try {
      sql = readFileSync(sqlPath, "utf8");
    } catch {
      continue;
    }

    const existing = await client.query(
      `SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = $1 AND "finished_at" IS NOT NULL`,
      [folder]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      console.log(`Skip (already applied): ${folder}`);
      continue;
    }

    console.log(`Applying: ${folder}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
         VALUES ($1, $2, $3, now(), 1)`,
        [randomUUID(), "manual", folder]
      );
      await client.query("COMMIT");
      console.log(`Applied: ${folder}`);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  }

  await client.end();
  console.log("Migrations complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
