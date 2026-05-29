import type { ExplanationItem, StructuredPreferences } from "@/src/domain/recommendation/types";
import type { RankedCar } from "@/src/domain/recommendation/types";
import { DEFAULT_PRIORITIES } from "@/src/domain/recommendation/types";

export function getMockPreferences(query: string): StructuredPreferences {
  const lower = query.toLowerCase();
  const prefs: StructuredPreferences = {
    priorities: { ...DEFAULT_PRIORITIES },
    confidence: 0.85,
  };

  if (lower.includes("15") || lower.includes("15l") || lower.includes("15 lakh")) {
    prefs.budget = { max: 1500000 };
  }
  if (lower.includes("10") || lower.includes("10l")) {
    prefs.budget = { max: 1000000 };
  }
  if (lower.includes("18") || lower.includes("18l")) {
    prefs.budget = { max: 1800000 };
  }
  if (lower.includes("suv")) prefs.bodyType = ["suv"];
  if (lower.includes("sedan")) prefs.bodyType = ["sedan"];
  if (lower.includes("hatch")) prefs.bodyType = ["hatchback"];
  if (lower.includes("diesel")) prefs.fuelType = ["diesel"];
  if (lower.includes("petrol")) prefs.fuelType = ["petrol"];
  if (lower.includes("electric") || lower.includes("ev")) prefs.fuelType = ["electric"];
  if (lower.includes("automatic")) prefs.transmission = ["automatic"];
  if (lower.includes("manual")) prefs.transmission = ["manual"];
  if (lower.includes("sunroof")) prefs.mustHaveFeatures = ["sunroof"];
  if (lower.includes("family") || lower.includes("7 seat")) {
    prefs.seatsMin = 7;
    prefs.priorities.comfort = 8;
    prefs.priorities.safety = 8;
  }
  if (lower.includes("safe") || lower.includes("safety")) {
    prefs.priorities.safety = 9;
  }
  if (lower.includes("mileage") || lower.includes("fuel efficient")) {
    prefs.priorities.mileage = 9;
  }
  if (lower.includes("city")) {
    prefs.usageMix = { city: 80, highway: 20 };
    prefs.priorities.mileage = 8;
  }

  return prefs;
}

export function getMockExplanations(ranked: RankedCar[]): ExplanationItem[] {
  return ranked.slice(0, 5).map((r) => ({
    carId: r.car.id,
    whyRecommended: `${r.car.make} ${r.car.model} scores well on ${r.bestForTag?.toLowerCase() ?? "overall fit"} for your query.`,
    tradeoffs: [
      `Price: ₹${(r.car.exShowroomPrice / 100000).toFixed(1)}L ex-showroom`,
      `Mileage: ${r.car.mileageKmpl} kmpl — ${r.scoreBreakdown.mileage > 0.6 ? "strong" : "average"} for class`,
      r.scoreBreakdown.safety < 0.6
        ? "Safety is acceptable but not class-leading"
        : "Safety ratings are competitive",
    ],
    pickIf: `You want a balanced ${r.car.bodyType} with emphasis on ${r.bestForTag?.replace("Best for ", "").toLowerCase() ?? "value"}.`,
  }));
}
