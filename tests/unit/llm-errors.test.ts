import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isLlmRateLimitOrQuotaError,
  shouldFallbackToMock,
} from "@/src/infrastructure/llm/errors";

describe("isLlmRateLimitOrQuotaError", () => {
  it("detects 429 status", () => {
    expect(isLlmRateLimitOrQuotaError({ status: 429 })).toBe(true);
  });

  it("detects 402 payment required", () => {
    expect(isLlmRateLimitOrQuotaError({ status: 402 })).toBe(true);
  });

  it("detects quota message", () => {
    expect(
      isLlmRateLimitOrQuotaError(
        new Error("OpenRouter 429: quota exceeded")
      )
    ).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isLlmRateLimitOrQuotaError(new Error("network timeout"))).toBe(
      false
    );
  });
});

describe("shouldFallbackToMock", () => {
  const original = process.env.LLM_FALLBACK_ON_ERROR;

  afterEach(() => {
    if (original === undefined) delete process.env.LLM_FALLBACK_ON_ERROR;
    else process.env.LLM_FALLBACK_ON_ERROR = original;
  });

  it("falls back on quota errors by default", () => {
    delete process.env.LLM_FALLBACK_ON_ERROR;
    expect(
      shouldFallbackToMock(new Error("quota exceeded"))
    ).toBe(true);
  });

  it("does not fall back when explicitly disabled", () => {
    process.env.LLM_FALLBACK_ON_ERROR = "false";
    expect(shouldFallbackToMock({ status: 429 })).toBe(false);
  });

  beforeEach(() => {
    delete process.env.LLM_FALLBACK_ON_ERROR;
  });

  it("falls back on any error when LLM_FALLBACK_ON_ERROR=true", () => {
    process.env.LLM_FALLBACK_ON_ERROR = "true";
    expect(shouldFallbackToMock(new Error("random failure"))).toBe(true);
  });
});
