/** Detect LLM quota / rate-limit failures (429, 402, etc.) */
export function isLlmRateLimitOrQuotaError(error: unknown): boolean {
  const err = error as { status?: number; message?: string };
  if (err.status === 429 || err.status === 403 || err.status === 402) return true;

  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return /429|402|too many requests|quota|rate.?limit|resource exhausted|insufficient credits|billing/i.test(
    message
  );
}

/** @deprecated use isLlmRateLimitOrQuotaError */
export const isGeminiRateLimitOrQuotaError = isLlmRateLimitOrQuotaError;

function isZodValidationError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "ZodError"
  );
}

/** Whether to use local mock LLM when the provider fails */
export function shouldFallbackToMock(error: unknown): boolean {
  if (process.env.LLM_FALLBACK_ON_ERROR === "false") return false;
  // Schema issues are not fixed by mock — surface them instead
  if (isZodValidationError(error)) return false;
  if (isLlmRateLimitOrQuotaError(error)) return true;
  return process.env.LLM_FALLBACK_ON_ERROR === "true";
}
