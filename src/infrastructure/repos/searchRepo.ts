import { prisma } from "@/src/infrastructure/db/prisma";
import type { StructuredPreferences } from "@/src/domain/recommendation/types";
import type { RankedCar, ExplanationItem } from "@/src/domain/recommendation/types";

export async function getOrCreateSession(sessionId?: string): Promise<string> {
  if (sessionId) {
    const existing = await prisma.searchSession.findUnique({
      where: { id: sessionId },
    });
    if (existing) return existing.id;
  }
  const session = await prisma.searchSession.create({ data: {} });
  return session.id;
}

export async function createUserSearch(
  sessionId: string,
  rawQuery: string
): Promise<string> {
  const search = await prisma.userSearch.create({
    data: { sessionId, rawQuery },
  });
  return search.id;
}

export async function saveExtractedPreference(
  userSearchId: string,
  prefs: StructuredPreferences
): Promise<void> {
  await prisma.extractedPreference.create({
    data: {
      userSearchId,
      budgetMin: prefs.budget?.min ?? null,
      budgetMax: prefs.budget?.max ?? null,
      bodyType: prefs.bodyType?.join(",") ?? null,
      fuelType: prefs.fuelType?.join(",") ?? null,
      transmission: prefs.transmission?.join(",") ?? null,
      seatsMin: prefs.seatsMin ?? null,
      cityUsagePercent: prefs.usageMix?.city ?? null,
      highwayUsagePercent: prefs.usageMix?.highway ?? null,
      prioritySafety: prefs.priorities.safety,
      priorityMileage: prefs.priorities.mileage,
      priorityComfort: prefs.priorities.comfort,
      priorityPerformance: prefs.priorities.performance,
      priorityValue: prefs.priorities.value,
      mustHaveFeatures: prefs.mustHaveFeatures
        ? JSON.stringify(prefs.mustHaveFeatures)
        : null,
      niceToHaveFeatures: prefs.niceToHaveFeatures
        ? JSON.stringify(prefs.niceToHaveFeatures)
        : null,
      confidence: prefs.confidence ?? null,
    },
  });
}

export async function saveRecommendations(
  userSearchId: string,
  ranked: RankedCar[],
  explanations: ExplanationItem[]
): Promise<void> {
  const explanationMap = new Map(explanations.map((e) => [e.carId, e]));

  await prisma.recommendationResult.createMany({
    data: ranked.map((r, index) => {
      const exp = explanationMap.get(r.car.id);
      return {
        userSearchId,
        carId: r.car.id,
        rank: index + 1,
        totalScore: r.totalScore,
        scoreBreakdown: JSON.stringify(r.scoreBreakdown),
        tradeoffNotes: exp ? JSON.stringify(exp.tradeoffs) : null,
        explanation: exp?.whyRecommended ?? null,
        bestForTag: r.bestForTag ?? null,
      };
    }),
  });
}

export async function getUserSearchById(id: string) {
  return prisma.userSearch.findUnique({
    where: { id },
    include: {
      extractedPreference: true,
      recommendations: {
        orderBy: { rank: "asc" },
        include: { car: { include: { specs: true } } },
      },
    },
  });
}

export async function getSessionSearchHistory(sessionId: string) {
  return prisma.userSearch.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      rawQuery: true,
      createdAt: true,
      _count: { select: { recommendations: true } },
    },
  });
}
