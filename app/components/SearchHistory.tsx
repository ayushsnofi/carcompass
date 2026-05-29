"use client";

interface HistoryItem {
  id: string;
  rawQuery: string;
  createdAt: string;
  _count: { recommendations: number };
}

interface SearchHistoryProps {
  items: HistoryItem[];
}

export function SearchHistory({ items }: SearchHistoryProps) {
  if (!items.length) return null;

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4" data-testid="search-history">
      <h2 className="text-sm font-semibold text-slate-800">Recent searches</h2>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="text-xs text-slate-600">
            <span className="line-clamp-2">{item.rawQuery}</span>
            <span className="text-slate-400">
              {item._count.recommendations} results ·{" "}
              {new Date(item.createdAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
