import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/recommend/route";
import { NextRequest } from "next/server";

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/recommend", () => {
  it("returns 400 for short query", async () => {
    const res = await POST(makeRequest({ query: "hi" }));
    expect(res.status).toBe(400);
  });

  it("returns ranked recommendations for valid query", async () => {
    const res = await POST(
      makeRequest({
        query: "Family SUV under 15 lakh with good safety and mileage",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.searchId).toBeDefined();
    expect(data.sessionId).toBeDefined();
    expect(data.preferences).toBeDefined();
    expect(data.ranked.length).toBeGreaterThan(0);
    expect(data.ranked[0].rank).toBe(1);
    expect(data.ranked[0].scoreBreakdown).toBeDefined();
    expect(data.tradeoffHighlights).toBeDefined();
  });

  it("persists session across requests", async () => {
    const first = await POST(
      makeRequest({ query: "SUV under 15 lakh automatic diesel" })
    );
    const firstData = await first.json();

    const second = await POST(
      makeRequest({
        query: "Sedan under 12 lakh petrol automatic",
        sessionId: firstData.sessionId,
      })
    );
    const secondData = await second.json();
    expect(secondData.sessionId).toBe(firstData.sessionId);
  });
});
