import { describe, it, expect } from "vitest";
import { preferencesSchema } from "@/src/infrastructure/llm/schemas";

describe("preferencesSchema", () => {
  it("accepts null optional fields from LLM output", () => {
    const parsed = preferencesSchema.parse({
      budget: { max: 15 },
      bodyType: ["suv"],
      usageMix: null,
      mustHaveFeatures: null,
      priorities: {
        safety: 8,
        mileage: 7,
        comfort: 5,
        performance: 5,
        value: 6,
      },
      confidence: 0.9,
    });

    expect(parsed.usageMix).toBeUndefined();
    expect(parsed.mustHaveFeatures).toBeUndefined();
    expect(parsed.bodyType).toEqual(["suv"]);
  });

  it("applies default priorities when partially missing", () => {
    const parsed = preferencesSchema.parse({
      priorities: { safety: 9 },
    });

    expect(parsed.priorities.safety).toBe(9);
    expect(parsed.priorities.mileage).toBe(5);
  });
});
