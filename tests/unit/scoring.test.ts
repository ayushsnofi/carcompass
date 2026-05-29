import { describe, it, expect } from "vitest";
import {
  normalizeMinMax,
  calibrateWeights,
  mergeWithDefaultWeights,
  passesHardFilters,
  scoreCars,
  computeTradeoffHighlights,
} from "@/src/domain/recommendation/scoring";
import type { CarForScoring, StructuredPreferences } from "@/src/domain/recommendation/types";
import { DEFAULT_PRIORITIES } from "@/src/domain/recommendation/types";

const baseCar = (overrides: Partial<CarForScoring> = {}): CarForScoring => ({
  id: "car-1",
  make: "Maruti",
  model: "Brezza",
  variant: "ZX",
  bodyType: "suv",
  exShowroomPrice: 1200000,
  safetyRating: 0.8,
  mileageKmpl: 20,
  familySuitability: 0.75,
  valueForMoney: 0.8,
  maintenanceCost: 25000,
  resaleScore: 0.7,
  availabilityScore: 0.9,
  featureVector: ["abs", "rear-camera", "sunroof"],
  specs: {
    fuelType: "petrol",
    transmission: "automatic",
    seating: 5,
    bootSpaceL: 450,
    airbags: 4,
    adasLevel: 1,
    ncapRating: 4,
    powerBhp: 103,
    torqueNm: 137,
  },
  ...overrides,
});

const basePrefs: StructuredPreferences = {
  budget: { max: 1500000 },
  bodyType: ["suv"],
  priorities: { ...DEFAULT_PRIORITIES, safety: 9 },
};

describe("normalizeMinMax", () => {
  it("normalizes within range", () => {
    expect(normalizeMinMax(5, 0, 10)).toBe(0.5);
  });

  it("inverts when requested", () => {
    expect(normalizeMinMax(0, 0, 10, true)).toBe(1);
  });

  it("returns 0.5 when min equals max", () => {
    expect(normalizeMinMax(5, 5, 5)).toBe(0.5);
  });
});

describe("calibrateWeights", () => {
  it("sums to 1", () => {
    const w = calibrateWeights({
      safety: 10,
      mileage: 5,
      comfort: 5,
      performance: 5,
      value: 5,
    });
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it("increases safety weight when priority is high", () => {
    const w = mergeWithDefaultWeights(
      calibrateWeights({
        safety: 10,
        mileage: 1,
        comfort: 1,
        performance: 1,
        value: 1,
      })
    );
    expect(w.safety).toBeGreaterThan(w.mileage);
  });
});

describe("passesHardFilters", () => {
  it("rejects cars over budget", () => {
    const car = baseCar({ exShowroomPrice: 2000000 });
    expect(passesHardFilters(car, basePrefs)).toBe(false);
  });

  it("rejects wrong body type", () => {
    const car = baseCar({ bodyType: "hatchback" });
    expect(passesHardFilters(car, basePrefs)).toBe(false);
  });

  it("accepts matching car", () => {
    expect(passesHardFilters(baseCar(), basePrefs)).toBe(true);
  });
});

describe("scoreCars", () => {
  const cars: CarForScoring[] = [
    baseCar({ id: "a", exShowroomPrice: 1100000, safetyRating: 0.9 }),
    baseCar({ id: "b", exShowroomPrice: 1400000, safetyRating: 0.6 }),
    baseCar({
      id: "c",
      bodyType: "hatchback",
      exShowroomPrice: 800000,
    }),
  ];

  it("returns ranked results within topN", () => {
    const ranked = scoreCars(cars, basePrefs, 2);
    expect(ranked.length).toBeLessThanOrEqual(2);
    expect(ranked[0].totalScore).toBeGreaterThanOrEqual(ranked[ranked.length - 1]?.totalScore ?? 0);
  });

  it("excludes hatchback when SUV required", () => {
    const ranked = scoreCars(cars, basePrefs, 10);
    expect(ranked.every((r) => r.car.bodyType === "suv")).toBe(true);
  });

  it("returns empty when no matches", () => {
    const ranked = scoreCars(cars, { priorities: DEFAULT_PRIORITIES, budget: { max: 100000 } }, 10);
    expect(ranked).toHaveLength(0);
  });
});

describe("computeTradeoffHighlights", () => {
  it("returns highlight labels", () => {
    const ranked = scoreCars(
      [baseCar({ id: "a" }), baseCar({ id: "b", mileageKmpl: 25 })],
      basePrefs,
      10
    );
    const highlights = computeTradeoffHighlights(ranked);
    expect(highlights.bestSafety).toBeDefined();
    expect(highlights.bestMileage).toBeDefined();
  });
});
