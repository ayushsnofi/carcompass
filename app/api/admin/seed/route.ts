import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    execSync("npx tsx prisma/seed.ts", {
      stdio: "inherit",
      env: process.env,
    });
    return NextResponse.json({ ok: true, message: "Database reseeded" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
