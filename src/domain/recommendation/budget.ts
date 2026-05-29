/** Max ex-showroom price we store (₹5 Cr) — guards bad LLM output */
export const MAX_BUDGET_RUPEES = 50_000_000;

/**
 * Normalize LLM budget figures to INR rupees.
 * LLMs may return lakhs (18), rupees (1800000), or wrongly scaled values.
 */
export function normalizeBudgetToRupees(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  let rupees: number;

  if (amount >= 100_000) {
    // Already rupees (e.g. 1_500_000 = ₹15L)
    rupees = amount;
  } else if (amount <= 500) {
    // Lakh shorthand (e.g. 18 → ₹18L)
    rupees = amount * 100_000;
  } else {
    // Mid-range: treat as rupees (unlikely valid as lakhs)
    rupees = amount;
  }

  return Math.min(Math.round(rupees), MAX_BUDGET_RUPEES);
}

export function normalizeBudgetRange(budget?: {
  min?: number;
  max?: number;
}): { min?: number; max?: number } | undefined {
  if (!budget) return undefined;

  const min =
    budget.min != null ? normalizeBudgetToRupees(budget.min) : undefined;
  const max =
    budget.max != null ? normalizeBudgetToRupees(budget.max) : undefined;

  if (min === 0 && max === 0) return undefined;
  if (min === 0 && max === undefined) return undefined;
  if (min === undefined && max === 0) return undefined;

  const result: { min?: number; max?: number } = {};
  if (min != null && min > 0) result.min = min;
  if (max != null && max > 0) result.max = max;

  if (result.min != null && result.max != null && result.min > result.max) {
    [result.min, result.max] = [result.max, result.min];
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
