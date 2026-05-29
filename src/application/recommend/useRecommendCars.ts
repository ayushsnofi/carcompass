import {
  scoreCars,
  computeTradeoffHighlights,
} from "@/src/domain/recommendation/scoring";
import type { RecommendationsResponse } from "@/src/domain/recommendation/types";
import { llmClient } from "@/src/infrastructure/llm/openRouterClient";
import { getAllCarsForScoring } from "@/src/infrastructure/repos/carRepo";
import {
  getOrCreateSession,
  createUserSearch,
  saveExtractedPreference,
  saveRecommendations,
} from "@/src/infrastructure/repos/searchRepo";

export interface RecommendInput {
  query: string;
  sessionId?: string;
}

export async function recommendCars(
  input: RecommendInput
): Promise<RecommendationsResponse> {
  const sessionId = await getOrCreateSession(input.sessionId);
  const searchId = await createUserSearch(sessionId, input.query);

  const { preferences, usedFallback: prefsFallback } =
    await llmClient.extractPreferences(input.query);
  await saveExtractedPreference(searchId, preferences);

  const cars = await getAllCarsForScoring();
  let ranked = scoreCars(cars, preferences, 10);

  if (ranked.length === 0) {
    const relaxed = {
      ...preferences,
      bodyType: undefined,
      fuelType: undefined,
      transmission: undefined,
      mustHaveFeatures: undefined,
      budget: preferences.budget?.max
        ? { max: Math.round(preferences.budget.max * 1.15) }
        : preferences.budget,
    };
    ranked = scoreCars(cars, relaxed, 10);
  }
  const { explanations, usedFallback: explainFallback } =
    await llmClient.generateExplanations(input.query, preferences, ranked);
  const llmFallback = prefsFallback || explainFallback;

  await saveRecommendations(searchId, ranked, explanations);

  const explanationMap = new Map(explanations.map((e) => [e.carId, e]));
  const tradeoffHighlights = computeTradeoffHighlights(ranked);

  return {
    searchId,
    sessionId,
    preferences,
    ranked: ranked.map((r, index) => ({
      ...r,
      rank: index + 1,
      explanation: explanationMap.get(r.car.id),
    })),
    tradeoffHighlights,
    llmFallback: llmFallback || undefined,
    llmFallbackReason: llmFallback
      ? "OpenRouter is rate-limited or unavailable for the selected model. Using rule-based extraction. Try OPENROUTER_FALLBACK_MODEL or add credits at openrouter.ai/credits."
      : undefined,
  };
}
