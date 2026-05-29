import { NextRequest, NextResponse } from "next/server";
import { getSessionSearchHistory } from "@/src/infrastructure/repos/searchRepo";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const history = await getSessionSearchHistory(sessionId);
  return NextResponse.json({ history });
}
