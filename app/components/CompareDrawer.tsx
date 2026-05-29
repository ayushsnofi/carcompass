"use client";

import type { RecommendationsResponse } from "@/src/domain/recommendation/types";

interface CompareDrawerProps {
  data: RecommendationsResponse;
  selectedIds: string[];
  onClose: () => void;
}

export function CompareDrawer({ data, selectedIds, onClose }: CompareDrawerProps) {
  const selected = data.ranked.filter((r) => selectedIds.includes(r.car.id));

  if (selected.length === 0) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white shadow-lg"
      data-testid="compare-drawer"
    >
      <div className="mx-auto max-w-4xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">
            Compare ({selected.length}/3)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Close
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {selected.map((item) => (
            <div
              key={item.car.id}
              className="rounded-lg border border-slate-200 p-3 text-sm"
            >
              <p className="font-medium">
                {item.car.make} {item.car.model}
              </p>
              <p className="text-slate-500">
                ₹{(item.car.exShowroomPrice / 100000).toFixed(1)}L ·{" "}
                {item.car.mileageKmpl} kmpl
              </p>
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt>Safety</dt>
                  <dd>{(item.scoreBreakdown.safety * 100).toFixed(0)}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Mileage</dt>
                  <dd>{(item.scoreBreakdown.mileage * 100).toFixed(0)}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Value</dt>
                  <dd>{(item.scoreBreakdown.value * 100).toFixed(0)}%</dd>
                </div>
              </dl>
              {item.explanation && (
                <p className="mt-2 text-xs text-slate-600" data-testid="compare-tradeoff">
                  {item.explanation.tradeoffs[0]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
