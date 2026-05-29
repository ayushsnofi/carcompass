import { describe, it, expect } from "vitest";
import {
  normalizeBudgetToRupees,
  normalizeBudgetRange,
} from "@/src/domain/recommendation/budget";

describe("normalizeBudgetToRupees", () => {
  it("converts lakh shorthand to rupees", () => {
    expect(normalizeBudgetToRupees(18)).toBe(1_800_000);
    expect(normalizeBudgetToRupees(15)).toBe(1_500_000);
  });

  it("keeps values already in rupees", () => {
    expect(normalizeBudgetToRupees(1_800_000)).toBe(1_800_000);
    expect(normalizeBudgetToRupees(1_500_000)).toBe(1_500_000);
  });

  it("does not double-convert rupees into trillions", () => {
    // Bug: 1_800_000 * 100_000 = 180_000_000_000
    const once = normalizeBudgetToRupees(1_800_000);
    expect(once).toBe(1_800_000);
    expect(normalizeBudgetToRupees(once)).toBe(1_800_000);
  });
});

describe("normalizeBudgetRange", () => {
  it("swaps min/max when inverted", () => {
    const range = normalizeBudgetRange({ min: 2_000_000, max: 1_000_000 });
    expect(range?.min).toBe(1_000_000);
    expect(range?.max).toBe(2_000_000);
  });
});
