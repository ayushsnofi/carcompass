export interface StructuredPreferences {
  budget?: { min?: number; max?: number };
  bodyType?: string[];
  fuelType?: string[];
  transmission?: string[];
  seatsMin?: number;
  usageMix?: { city: number; highway: number };
  priorities: {
    safety: number;
    mileage: number;
    comfort: number;
    performance: number;
    value: number;
  };
  mustHaveFeatures?: string[];
  niceToHaveFeatures?: string[];
  avoid?: string[];
  confidence?: number;
}

export interface CarForScoring {
  id: string;
  make: string;
  model: string;
  variant: string;
  bodyType: string;
  exShowroomPrice: number;
  safetyRating: number;
  mileageKmpl: number;
  familySuitability: number;
  valueForMoney: number;
  maintenanceCost: number;
  resaleScore: number;
  availabilityScore: number;
  featureVector?: string[];
  specs?: {
    engineCc?: number | null;
    powerBhp?: number | null;
    torqueNm?: number | null;
    transmission?: string | null;
    fuelType?: string | null;
    seating?: number | null;
    bootSpaceL?: number | null;
    airbags?: number | null;
    adasLevel?: number | null;
    ncapRating?: number | null;
  } | null;
}

export interface ScoreBreakdown {
  safety: number;
  mileage: number;
  comfort: number;
  performance: number;
  value: number;
  budgetFit: number;
  availability: number;
  penalties: number;
}

export interface RankedCar {
  car: CarForScoring;
  totalScore: number;
  scoreBreakdown: ScoreBreakdown;
  bestForTag?: string;
}

export interface ExplanationItem {
  carId: string;
  whyRecommended: string;
  tradeoffs: string[];
  pickIf: string;
}

export interface RecommendationsResponse {
  searchId: string;
  sessionId: string;
  preferences: StructuredPreferences;
  ranked: Array<
    RankedCar & {
      rank: number;
      explanation?: ExplanationItem;
    }
  >;
  tradeoffHighlights: {
    bestSafety?: string;
    bestMileage?: string;
    bestValue?: string;
  };
  /** True when the LLM provider failed (e.g. quota) and mock was used */
  llmFallback?: boolean;
  llmFallbackReason?: string;
}

export const DEFAULT_PRIORITIES: StructuredPreferences["priorities"] = {
  safety: 5,
  mileage: 5,
  comfort: 5,
  performance: 5,
  value: 5,
};

export const DEFAULT_WEIGHTS = {
  safety: 0.25,
  mileage: 0.2,
  comfort: 0.15,
  performance: 0.15,
  value: 0.25,
} as const;
