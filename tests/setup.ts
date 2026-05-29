import { beforeAll } from "vitest";
import { execSync } from "child_process";

beforeAll(
  () => {
    execSync("npm run db:deploy", {
      stdio: "pipe",
      env: { ...process.env },
    });
    execSync("npx tsx prisma/seed.ts", {
      stdio: "pipe",
      env: { ...process.env },
    });
  },
  120_000
);
