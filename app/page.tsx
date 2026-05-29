"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchForm } from "./components/SearchForm";
import { ResultsList } from "./components/ResultsList";
import { CompareDrawer } from "./components/CompareDrawer";
import { SearchHistory } from "./components/SearchHistory";
import type { RecommendationsResponse } from "@/src/domain/recommendation/types";

const SESSION_KEY = "cardekho_session_id";

interface HistoryItem {
  id: string;
  rawQuery: string;
  createdAt: string;
  _count: { recommendations: number };
}

export default function HomePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) setSessionId(stored);
  }, []);

  const loadHistory = useCallback(async (sid: string) => {
    const res = await fetch(`/api/history?sessionId=${sid}`);
    if (res.ok) {
      const json = await res.json();
      setHistory(json.history);
    }
  }, []);

  useEffect(() => {
    if (sessionId) loadHistory(sessionId);
  }, [sessionId, loadHistory, data]);

  const handleSubmit = async (query: string) => {
    setLoading(true);
    setError(null);
    setSelectedIds([]);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, sessionId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Request failed");
      }

      const result: RecommendationsResponse = await res.json();
      setData(result);
      localStorage.setItem(SESSION_KEY, result.sessionId);
      setSessionId(result.sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleCompare = (carId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(carId)) return prev.filter((id) => id !== carId);
      if (prev.length >= 3) return prev;
      return [...prev, carId];
    });
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">CarDekho</h1>
        <p className="mt-1 text-slate-600">
          Describe your needs in plain language — get a ranked shortlist with tradeoffs.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SearchForm onSubmit={handleSubmit} loading={loading} />
            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </section>

          {data?.llmFallback && (
            <p
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              role="status"
              data-testid="llm-fallback-banner"
            >
              {data.llmFallbackReason ??
                "LLM is temporarily unavailable. Results use rule-based matching."}
            </p>
          )}

          {data && (
            <ResultsList
              data={data}
              selectedIds={selectedIds}
              onToggleCompare={toggleCompare}
            />
          )}
        </div>

        <div>
          <SearchHistory items={history} />
        </div>
      </div>

      {data && selectedIds.length > 0 && (
        <CompareDrawer
          data={data}
          selectedIds={selectedIds}
          onClose={() => setSelectedIds([])}
        />
      )}
    </main>
  );
}
