import { NextRequest, NextResponse } from "next/server";
import { recommendCars } from "@/src/application/recommend/useRecommendCars";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId : undefined;

    if (!query || query.length < 5) {
      return NextResponse.json(
        { error: "Query must be at least 5 characters" },
        { status: 400 }
      );
    }

    const result = await recommendCars({ query, sessionId });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Recommend error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
