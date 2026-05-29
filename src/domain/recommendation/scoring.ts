import type {
  CarForScoring,
  RankedCar,
  ScoreBreakdown,
  StructuredPreferences,
} from "./types";
import { DEFAULT_PRIORITIES, DEFAULT_WEIGHTS } from "./types";

export type Weights = Record<keyof typeof DEFAULT_WEIGHTS, number>;

export function normalizeMinMax(
  value: number,
  min: number,
  max: number,
  invert = false
): number {
  if (max === min) return 0.5;
  const normalized = (value - min) / (max - min);
  const clamped = Math.max(0, Math.min(1, normalized));
  return invert ? 1 - clamped : clamped;
}

export function calibrateWeights(
  priorities: StructuredPreferences["priorities"]
): Weights {
  const raw = {
    safety: priorities.safety || DEFAULT_PRIORITIES.safety,
    mileage: priorities.mileage || DEFAULT_PRIORITIES.mileage,
    comfort: priorities.comfort || DEFAULT_PRIORITIES.comfort,
    performance: priorities.performance || DEFAULT_PRIORITIES.performance,
    value: priorities.value || DEFAULT_PRIORITIES.value,
  };
  const sum = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  return {
    safety: raw.safety / sum,
    mileage: raw.mileage / sum,
    comfort: raw.comfort / sum,
    performance: raw.performance / sum,
    value: raw.value / sum,
  };
}

export function mergeWithDefaultWeights(calibrated: Weights): Weights {
  const blend = 0.7;
  const keys = Object.keys(DEFAULT_WEIGHTS) as (keyof Weights)[];
  const merged = {} as Weights;
  for (const key of keys) {
    merged[key] = blend * calibrated[key] + (1 - blend) * DEFAULT_WEIGHTS[key];
  }
  const sum = Object.values(merged).reduce((a, b) => a + b, 0);
  for (const key of keys) {
    merged[key] = merged[key] / sum;
  }
  return merged;
}

export function passesHardFilters(
  car: CarForScoring,
  prefs: StructuredPreferences
): boolean {
  const budgetMax = prefs.budget?.max;
  if (budgetMax != null && car.exShowroomPrice > budgetMax * 1.05) {
    return false;
  }
  const budgetMin = prefs.budget?.min;
  if (budgetMin != null && car.exShowroomPrice < budgetMin * 0.95) {
    return false;
  }

  if (prefs.bodyType?.length) {
    const match = prefs.bodyType.some(
      (b) => b.toLowerCase() === car.bodyType.toLowerCase()
    );
    if (!match) return false;
  }

  if (prefs.fuelType?.length && car.specs?.fuelType) {
    const match = prefs.fuelType.some(
      (f) => f.toLowerCase() === car.specs!.fuelType!.toLowerCase()
    );
    if (!match) return false;
  }

  if (prefs.transmission?.length && car.specs?.transmission) {
    const match = prefs.transmission.some(
      (t) => t.toLowerCase() === car.specs!.transmission!.toLowerCase()
    );
    if (!match) return false;
  }

  if (prefs.seatsMin != null && car.specs?.seating != null) {
    if (car.specs.seating < prefs.seatsMin) return false;
  }

  if (prefs.avoid?.length) {
    const label = `${car.make} ${car.model}`.toLowerCase();
    if (prefs.avoid.some((a) => label.includes(a.toLowerCase()))) return false;
  }

  if (prefs.mustHaveFeatures?.length && car.featureVector?.length) {
    const features = car.featureVector.map((f) => f.toLowerCase());
    const allPresent = prefs.mustHaveFeatures.every((req) =>
      features.some((f) => f.includes(req.toLowerCase()))
    );
    if (!allPresent) return false;
  }

  return true;
}

function computeComfortScore(car: CarForScoring): number {
  const boot = car.specs?.bootSpaceL ?? 300;
  const seating = car.specs?.seating ?? 5;
  const bootNorm = Math.min(1, boot / 600);
  const seatNorm = Math.min(1, seating / 7);
  return (bootNorm * 0.4 + seatNorm * 0.3 + car.familySuitability * 0.3);
}

function computePerformanceScore(car: CarForScoring): number {
  const power = car.specs?.powerBhp ?? 80;
  const torque = car.specs?.torqueNm ?? 120;
  const powerNorm = Math.min(1, power / 200);
  const torqueNorm = Math.min(1, torque / 350);
  return powerNorm * 0.55 + torqueNorm * 0.45;
}

function computeSafetyScore(car: CarForScoring): number {
  const ncap = car.specs?.ncapRating ?? car.safetyRating;
  const airbags = car.specs?.airbags ?? 2;
  const adas = car.specs?.adasLevel ?? 0;
  const ncapNorm = Math.min(1, ncap / 5);
  const airbagNorm = Math.min(1, airbags / 6);
  const adasNorm = Math.min(1, adas / 2);
  return ncapNorm * 0.5 + car.safetyRating * 0.25 + airbagNorm * 0.15 + adasNorm * 0.1;
}

function computeBudgetFit(
  car: CarForScoring,
  prefs: StructuredPreferences
): number {
  const max = prefs.budget?.max;
  if (!max) return 1;
  if (car.exShowroomPrice <= max) {
    const ratio = car.exShowroomPrice / max;
    return 0.7 + 0.3 * ratio;
  }
  const overshoot = (car.exShowroomPrice - max) / max;
  return Math.max(0, 1 - overshoot * 2);
}

function assignBestForTag(breakdown: ScoreBreakdown): string {
  const entries: [string, number][] = [
    ["Best for safety", breakdown.safety],
    ["Best for mileage", breakdown.mileage],
    ["Best for comfort", breakdown.comfort],
    ["Best for performance", breakdown.performance],
    ["Best value", breakdown.value],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export function scoreCars(
  cars: CarForScoring[],
  prefs: StructuredPreferences,
  topN = 10
): RankedCar[] {
  const filtered = cars.filter((c) => passesHardFilters(c, prefs));
  if (filtered.length === 0) return [];

  const weights = mergeWithDefaultWeights(calibrateWeights(prefs.priorities));

  const prices = filtered.map((c) => c.exShowroomPrice);
  const mileages = filtered.map((c) => c.mileageKmpl);
  const maintenance = filtered.map((c) => c.maintenanceCost);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minMileage = Math.min(...mileages);
  const maxMileage = Math.max(...mileages);
  const minMaint = Math.min(...maintenance);
  const maxMaint = Math.max(...maintenance);

  const ranked: RankedCar[] = filtered.map((car) => {
    const safety = computeSafetyScore(car);
    const mileage = normalizeMinMax(car.mileageKmpl, minMileage, maxMileage);
    const comfort = computeComfortScore(car);
    const performance = computePerformanceScore(car);
    const value =
      car.valueForMoney * 0.5 +
      normalizeMinMax(car.exShowroomPrice, minPrice, maxPrice, true) * 0.25 +
      normalizeMinMax(car.maintenanceCost, minMaint, maxMaint, true) * 0.15 +
      car.resaleScore * 0.1;

    const budgetFit = computeBudgetFit(car, prefs);
    const availability = car.availabilityScore;

    let penalties = 0;
    if (prefs.budget?.max && car.exShowroomPrice > prefs.budget.max) {
      penalties += 0.08;
    }
    if (availability < 0.4) {
      penalties += 0.05;
    }

    const scoreBreakdown: ScoreBreakdown = {
      safety,
      mileage,
      comfort,
      performance,
      value,
      budgetFit,
      availability,
      penalties,
    };

    const totalScore =
      weights.safety * safety +
      weights.mileage * mileage +
      weights.comfort * comfort +
      weights.performance * performance +
      weights.value * value +
      0.05 * budgetFit +
      0.03 * availability -
      penalties;

    return {
      car,
      totalScore,
      scoreBreakdown,
      bestForTag: assignBestForTag(scoreBreakdown),
    };
  });

  ranked.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    const budgetA = computeBudgetFit(a.car, prefs);
    const budgetB = computeBudgetFit(b.car, prefs);
    if (budgetB !== budgetA) return budgetB - budgetA;
    if (b.scoreBreakdown.safety !== a.scoreBreakdown.safety) {
      return b.scoreBreakdown.safety - a.scoreBreakdown.safety;
    }
    return b.scoreBreakdown.value - a.scoreBreakdown.value;
  });

  return ranked.slice(0, topN);
}

export function computeTradeoffHighlights(ranked: RankedCar[]): {
  bestSafety?: string;
  bestMileage?: string;
  bestValue?: string;
} {
  if (!ranked.length) return {};
  const label = (r: RankedCar) =>
    `${r.car.make} ${r.car.model} ${r.car.variant}`;

  const bySafety = [...ranked].sort(
    (a, b) => b.scoreBreakdown.safety - a.scoreBreakdown.safety
  )[0];
  const byMileage = [...ranked].sort(
    (a, b) => b.scoreBreakdown.mileage - a.scoreBreakdown.mileage
  )[0];
  const byValue = [...ranked].sort(
    (a, b) => b.scoreBreakdown.value - a.scoreBreakdown.value
  )[0];

  return {
    bestSafety: label(bySafety),
    bestMileage: label(byMileage),
    bestValue: label(byValue),
  };
}
