import React from "react";

export interface StatItemData {
  icon: React.ElementType;
  value: string;
  label: string;
}

export interface StatsBarProps {
  items: StatItemData[];
}

export default function StatsBar({ items }: StatsBarProps) {
  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          {items.map(({ icon: Icon, value, label }, i) => (
            <div key={i} className="flex-1 flex items-center gap-4 py-6 sm:px-8 first:sm:pl-0 last:sm:pr-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#eff6ff" }}
              >
                <Icon className="w-5 h-5" style={{ color: "#2557a7" }} />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 leading-none">{value}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
