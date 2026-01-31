"use client";

const STATIC_FILTERS = ["Remote", "Hybrid", "On-site", "Full-time", "Senior Level", "Startup", "MNC"];

type Props = {
  selected?: string[];
  onToggle?: (f: string) => void;
};

export default function QuickFilters({ selected = [], onToggle }: Props) {
  return (
    <div className="flex items-start gap-2 text-sm flex-wrap">
      <span className="text-gray-600 font-medium mt-1.5">Quick Filters:</span>
      <div className="flex flex-wrap gap-2">
        {STATIC_FILTERS.map((filter) => {
          const active = selected.includes(filter);

          return (
            <button
              key={filter}
              type="button"
              onClick={() => onToggle?.(filter)}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                active
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
