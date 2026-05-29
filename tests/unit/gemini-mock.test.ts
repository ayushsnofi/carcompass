import { describe, it, expect } from "vitest";
import {
  getMockPreferences,
  getMockExplanations,
} from "@/src/infrastructure/llm/mockLlm";
import { scoreCars } from "@/src/domain/recommendation/scoring";
import type { CarForScoring } from "@/src/domain/recommendation/types";
import { DEFAULT_PRIORITIES } from "@/src/domain/recommendation/types";

describe("getMockPreferences", () => {
  it("extracts SUV and budget from query", () => {
    const prefs = getMockPreferences("Family SUV under 15 lakh with good safety");
    expect(prefs.bodyType).toContain("suv");
    expect(prefs.budget?.max).toBe(1500000);
    expect(prefs.priorities.safety).toBeGreaterThanOrEqual(8);
  });

  it("boosts mileage priority for city query", () => {
    const prefs = getMockPreferences("Fuel efficient car for city driving");
    expect(prefs.priorities.mileage).toBeGreaterThanOrEqual(8);
    expect(prefs.usageMix?.city).toBe(80);
  });
});

describe("getMockExplanations", () => {
  it("returns explanations for ranked cars", () => {
    const car: CarForScoring = {
      id: "x",
      make: "Tata",
      model: "Nexon",
      variant: "XZ+",
      bodyType: "suv",
      exShowroomPrice: 1200000,
      safetyRating: 0.85,
      mileageKmpl: 18,
      familySuitability: 0.7,
      valueForMoney: 0.8,
      maintenanceCost: 20000,
      resaleScore: 0.75,
      availabilityScore: 0.9,
    };
    const ranked = scoreCars([car], { priorities: DEFAULT_PRIORITIES }, 1);
    const explanations = getMockExplanations(ranked);
    expect(explanations).toHaveLength(1);
    expect(explanations[0].carId).toBe("x");
    expect(explanations[0].tradeoffs.length).toBeGreaterThan(0);
  });
});
