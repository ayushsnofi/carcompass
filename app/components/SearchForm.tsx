"use client";

const EXAMPLES = [
  "Family SUV under 15 lakh with good safety and 7 seats",
  "Fuel efficient hatchback for city driving under 10 lakh",
  "Automatic diesel sedan with sunroof under 18 lakh",
];

interface SearchFormProps {
  onSubmit: (query: string) => void;
  loading: boolean;
}

export function SearchForm({ onSubmit, loading }: SearchFormProps) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.elements.namedItem("query") as HTMLTextAreaElement;
        onSubmit(input.value.trim());
      }}
    >
      <label htmlFor="query" className="block text-sm font-medium text-slate-700">
        Describe the car you need
      </label>
      <textarea
        id="query"
        name="query"
        rows={3}
        required
        minLength={5}
        placeholder="e.g. Family SUV under 15L, safe, good mileage, automatic..."
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        disabled={loading}
      />
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={loading}
            onClick={() => {
              const textarea = document.getElementById("query") as HTMLTextAreaElement;
              if (textarea) textarea.value = ex;
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
          >
            {ex.slice(0, 40)}…
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Finding cars…" : "Get recommendations"}
      </button>
    </form>
  );
}
