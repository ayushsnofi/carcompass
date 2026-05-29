"use client";

import type { RecommendationsResponse } from "@/src/domain/recommendation/types";

interface ResultsListProps {
  data: RecommendationsResponse;
  selectedIds: string[];
  onToggleCompare: (carId: string) => void;
}

function formatPrice(paise: number): string {
  return `₹${(paise / 100000).toFixed(2)}L`;
}

export function ResultsList({
  data,
  selectedIds,
  onToggleCompare,
}: ResultsListProps) {
  const { ranked, tradeoffHighlights } = data;

  return (
    <div className="space-y-6">
      {(tradeoffHighlights.bestSafety ||
        tradeoffHighlights.bestMileage ||
        tradeoffHighlights.bestValue) && (
        <div className="grid gap-3 sm:grid-cols-3">
          {tradeoffHighlights.bestSafety && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <span className="font-medium text-emerald-800">Best safety</span>
              <p className="text-emerald-700">{tradeoffHighlights.bestSafety}</p>
            </div>
          )}
          {tradeoffHighlights.bestMileage && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm">
              <span className="font-medium text-sky-800">Best mileage</span>
              <p className="text-sky-700">{tradeoffHighlights.bestMileage}</p>
            </div>
          )}
          {tradeoffHighlights.bestValue && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <span className="font-medium text-amber-800">Best value</span>
              <p className="text-amber-700">{tradeoffHighlights.bestValue}</p>
            </div>
          )}
        </div>
      )}

      <ol className="space-y-4" data-testid="results-list">
        {ranked.map((item) => (
          <li
            key={item.car.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            data-testid="result-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-blue-600">
                  #{item.rank}
                </span>
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.car.make} {item.car.model} {item.car.variant}
                </h3>
                <p className="text-sm text-slate-500">
                  {item.car.bodyType} · {formatPrice(item.car.exShowroomPrice)} ·{" "}
                  {item.car.mileageKmpl} kmpl
                </p>
                {item.bestForTag && (
                  <span className="mt-1 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {item.bestForTag}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-800" data-testid="total-score">
                  {(item.totalScore * 100).toFixed(0)}
                </p>
                <p className="text-xs text-slate-500">match score</p>
                <label className="mt-2 flex items-center justify-end gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.car.id)}
                    onChange={() => onToggleCompare(item.car.id)}
                    disabled={
                      !selectedIds.includes(item.car.id) && selectedIds.length >= 3
                    }
                    data-testid="compare-checkbox"
                  />
                  Compare
                </label>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2 text-xs" data-testid="score-breakdown">
              {(
                [
                  ["Safety", item.scoreBreakdown.safety],
                  ["Mileage", item.scoreBreakdown.mileage],
                  ["Comfort", item.scoreBreakdown.comfort],
                  ["Perf", item.scoreBreakdown.performance],
                  ["Value", item.scoreBreakdown.value],
                ] as const
              ).map(([label, score]) => (
                <div key={label} className="rounded bg-slate-50 p-2 text-center">
                  <div className="font-medium text-slate-600">{label}</div>
                  <div className="text-slate-800">{(score * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>

            {item.explanation && (
              <div className="mt-3 border-t border-slate-100 pt-3 text-sm" data-testid="explanation">
                <p className="text-slate-700">{item.explanation.whyRecommended}</p>
                <p className="mt-1 font-medium text-slate-600">Tradeoffs</p>
                <ul className="list-inside list-disc text-slate-600">
                  {item.explanation.tradeoffs.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
                <p className="mt-2 text-slate-500 italic">{item.explanation.pickIf}</p>
              </div>
            )}
          </li>
        ))}
      </ol>

      {ranked.length === 0 && (
        <p className="text-center text-slate-500">
          No cars matched your criteria. Try broadening budget or body type.
        </p>
      )}
    </div>
  );
}
