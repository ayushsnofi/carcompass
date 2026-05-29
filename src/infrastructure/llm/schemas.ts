import { z } from "zod";

/** LLMs often return null instead of omitting optional fields */
function stripNulls<T>(value: T): T {
  if (value === null) return undefined as T;
  if (Array.isArray(value)) {
    return value.map((item) => stripNulls(item)) as T;
  }
  if (typeof value === "object" && value !== undefined) {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        val === null ? undefined : stripNulls(val),
      ])
    ) as T;
  }
  return value;
}

export const preferencesSchema = z.preprocess(
  stripNulls,
  z.object({
    budget: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
    bodyType: z.array(z.string()).optional(),
    fuelType: z.array(z.string()).optional(),
    transmission: z.array(z.string()).optional(),
    seatsMin: z.number().optional(),
    usageMix: z
      .object({
        city: z.number(),
        highway: z.number(),
      })
      .optional(),
    priorities: z
      .object({
        safety: z.number().min(1).max(10).default(5),
        mileage: z.number().min(1).max(10).default(5),
        comfort: z.number().min(1).max(10).default(5),
        performance: z.number().min(1).max(10).default(5),
        value: z.number().min(1).max(10).default(5),
      })
      .default({
        safety: 5,
        mileage: 5,
        comfort: 5,
        performance: 5,
        value: 5,
      }),
    mustHaveFeatures: z.array(z.string()).optional(),
    niceToHaveFeatures: z.array(z.string()).optional(),
    avoid: z.array(z.string()).optional(),
    confidence: z.number().min(0).max(1).optional(),
  })
);

export const explanationSchema = z.preprocess(
  stripNulls,
  z.object({
    explanations: z.array(
      z.object({
        carId: z.string(),
        whyRecommended: z.string(),
        tradeoffs: z.array(z.string()),
        pickIf: z.string(),
      })
    ),
  })
);

export type PreferencesSchemaOutput = z.infer<typeof preferencesSchema>;
export type ExplanationSchemaOutput = z.infer<typeof explanationSchema>;
