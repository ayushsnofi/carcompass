import type { ExplanationItem, StructuredPreferences } from "@/src/domain/recommendation/types";
import type { RankedCar } from "@/src/domain/recommendation/types";
import {
  explanationSchema,
  preferencesSchema,
  type ExplanationSchemaOutput,
  type PreferencesSchemaOutput,
} from "./schemas";
import { normalizeBudgetRange } from "@/src/domain/recommendation/budget";
import { DEFAULT_PRIORITIES } from "@/src/domain/recommendation/types";
import { isLlmRateLimitOrQuotaError, shouldFallbackToMock } from "./errors";
import { getMockExplanations, getMockPreferences } from "./mockLlm";

const EXTRACTION_SYSTEM = `You are a car buying assistant. Extract structured preferences from the user query.
Return ONLY valid JSON matching this shape (no markdown):
{
  "budget": { "min": number?, "max": number? },
  "bodyType": string[]?,
  "fuelType": string[]?,
  "transmission": string[]?,
  "seatsMin": number?,
  "usageMix": { "city": number, "highway": number }?,
  "priorities": { "safety": 1-10, "mileage": 1-10, "comfort": 1-10, "performance": 1-10, "value": 1-10 },
  "mustHaveFeatures": string[]?,
  "niceToHaveFeatures": string[]?,
  "avoid": string[]?,
  "confidence": 0-1
}
Budget is in INR lakhs (e.g. 15 means 15 lakh = 1500000 rupees). Convert lakh mentions to rupees in budget min/max.
Indian market context. Default priorities to 5 if unclear.`;

const EXPLANATION_SYSTEM = `You are a car advisor. Given user preferences and ranked cars with scores, write concise explanations.
Return ONLY valid JSON:
{
  "explanations": [
    { "carId": "...", "whyRecommended": "...", "tradeoffs": ["..."], "pickIf": "..." }
  ]
}
Be specific about tradeoffs (price vs features, mileage vs power, etc).`;

function parseJsonFromText<T>(text: string): T {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in LLM response");
  return JSON.parse(jsonMatch[0]) as T;
}

function normalizePreferences(
  prefs: PreferencesSchemaOutput
): StructuredPreferences {
  return {
    ...prefs,
    budget: normalizeBudgetRange(prefs.budget),
    priorities: prefs.priorities ?? DEFAULT_PRIORITIES,
  };
}

interface OpenRouterChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: {
    message?: string;
    code?: number;
    metadata?: {
      raw?: string;
      retry_after_seconds?: number;
    };
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseOpenRouterError(
  status: number,
  body: OpenRouterChatResponse
): Error & { status: number; retryAfterMs?: number } {
  const raw = body.error?.metadata?.raw;
  const message =
    raw ?? body.error?.message ?? `OpenRouter request failed (${status})`;
  const error = new Error(`OpenRouter ${status}: ${message}`) as Error & {
    status: number;
    retryAfterMs?: number;
  };
  error.status = status;
  const retrySec = body.error?.metadata?.retry_after_seconds;
  if (retrySec != null) {
    error.retryAfterMs = Math.ceil(retrySec * 1000);
  }
  return error;
}

function useJsonResponseFormat(): boolean {
  return process.env.OPENROUTER_JSON_MODE !== "false";
}

export class OpenRouterClient {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl =
      process.env.OPENROUTER_BASE_URL ??
      "https://openrouter.ai/api/v1/chat/completions";
    this.model =
      process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-pro";
    this.apiKey = process.env.OPENROUTER_API_KEY ?? "";
  }

  private async chatOnce(
    systemPrompt: string,
    userContent: string,
    model: string
  ): Promise<string> {
    const payload: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    };
    if (useJsonResponseFormat()) {
      payload.response_format = { type: "json_object" };
    }

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME ?? "CarDekho",
      },
      body: JSON.stringify(payload),
    });

    const body = (await res.json()) as OpenRouterChatResponse;

    if (!res.ok) {
      throw parseOpenRouterError(res.status, body);
    }

    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty OpenRouter response");
    }
    return content;
  }

  private async chat(systemPrompt: string, userContent: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }

    const maxRetries = Number(process.env.OPENROUTER_MAX_RETRIES ?? 3);
    const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL;
    const models = [this.model, fallbackModel].filter(
      (m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i
    );

    let lastError: (Error & { status?: number; retryAfterMs?: number }) | null =
      null;

    for (const model of models) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await this.chatOnce(systemPrompt, userContent, model);
        } catch (error) {
          lastError = error as Error & {
            status?: number;
            retryAfterMs?: number;
          };
          const canRetry =
            attempt < maxRetries && isLlmRateLimitOrQuotaError(error);
          if (!canRetry) break;

          const delay =
            lastError.retryAfterMs ?? Math.min(1000 * 2 ** attempt, 15_000);
          console.warn(
            `[OpenRouter] ${model} rate limited, retry ${attempt + 1}/${maxRetries} in ${delay}ms`
          );
          await sleep(delay);
        }
      }
    }

    throw lastError ?? new Error("OpenRouter request failed");
  }

  async extractPreferences(
    query: string
  ): Promise<{ preferences: StructuredPreferences; usedFallback: boolean }> {
    if (process.env.LLM_MODE === "mock") {
      return { preferences: getMockPreferences(query), usedFallback: false };
    }

    try {
      const text = await this.chat(
        EXTRACTION_SYSTEM,
        `User query: ${query}`
      );
      const parsed = preferencesSchema.parse(parseJsonFromText(text));
      return { preferences: normalizePreferences(parsed), usedFallback: false };
    } catch (error) {
      if (!shouldFallbackToMock(error)) throw error;
      console.warn(
        "[OpenRouter] extractPreferences failed, using mock fallback:",
        error instanceof Error ? error.message : error
      );
      return {
        preferences: getMockPreferences(query),
        usedFallback: true,
      };
    }
  }

  async generateExplanations(
    query: string,
    preferences: StructuredPreferences,
    ranked: RankedCar[]
  ): Promise<{ explanations: ExplanationItem[]; usedFallback: boolean }> {
    if (process.env.LLM_MODE === "mock") {
      return { explanations: getMockExplanations(ranked), usedFallback: false };
    }

    const payload = {
      query,
      preferences,
      cars: ranked.slice(0, 5).map((r) => ({
        carId: r.car.id,
        label: `${r.car.make} ${r.car.model} ${r.car.variant}`,
        totalScore: r.totalScore,
        scoreBreakdown: r.scoreBreakdown,
        price: r.car.exShowroomPrice,
        mileage: r.car.mileageKmpl,
      })),
    };

    try {
      const text = await this.chat(
        EXPLANATION_SYSTEM,
        JSON.stringify(payload)
      );
      const parsed: ExplanationSchemaOutput = explanationSchema.parse(
        parseJsonFromText(text)
      );
      return { explanations: parsed.explanations, usedFallback: false };
    } catch (error) {
      if (!shouldFallbackToMock(error)) throw error;
      console.warn(
        "[OpenRouter] generateExplanations failed, using mock fallback:",
        error instanceof Error ? error.message : error
      );
      return {
        explanations: getMockExplanations(ranked),
        usedFallback: true,
      };
    }
  }
}

export const llmClient = new OpenRouterClient();

// Re-export mocks for tests
export { getMockPreferences, getMockExplanations } from "./mockLlm";
