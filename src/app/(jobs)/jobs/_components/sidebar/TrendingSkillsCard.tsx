"use client";

import { TrendingUp, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { getTrendingSkills } from "@/api/insightsApi";
import type { TrendingSkillItem } from "@/api/insightsApi";

function SkeletonRow() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="w-16 h-2.5 bg-gray-200 rounded shrink-0" />
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full" />
      <div className="w-8 h-2 bg-gray-100 rounded" />
    </div>
  );
}

const DEMAND_COLOR = (pct: number) => {
  if (pct >= 40) return { bar: "#2557a7", text: "#2557a7" };
  if (pct >= 20) return { bar: "#0891b2", text: "#0e7490" };
  return { bar: "#94a3b8", text: "#64748b" };
};

export default function TrendingSkillsCard() {
  const [skills, setSkills]   = useState<TrendingSkillItem[]>([]);
  const [period, setPeriod]   = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const fetch = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getTrendingSkills({ top_n: 10 });
      setSkills(data.skills);
      setPeriod(data.period === "last_7_days" ? "This week" : data.period ?? "");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  // Compute max demand for relative bar scaling
  const maxDemand = skills.length > 0 ? Math.max(...skills.map((s) => s.demand_pct)) : 100;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
            <TrendingUp size={11} className="text-[#2557a7]" />
          </div>
          <div>
            <h3 className="text-[12.5px] font-semibold text-gray-900 leading-tight">Trending Skills</h3>
            {period && (
              <p className="text-[10px] text-gray-400">{period} · live demand</p>
            )}
          </div>
        </div>
        {!loading && (
          <button
            type="button"
            onClick={fetch}
            title="Refresh"
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={11} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-3">
            <p className="text-[11px] text-gray-400">Could not load trending skills.</p>
            <button
              type="button"
              onClick={fetch}
              className="mt-1 text-[11px] text-[#2557a7] font-semibold hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {skills.map((item, idx) => {
              const colors = DEMAND_COLOR(item.demand_pct);
              const barWidth = Math.max(4, Math.round((item.demand_pct / maxDemand) * 100));
              return (
                <div key={item.skill} className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-gray-300 w-3 shrink-0 text-right tabular-nums">
                    {idx + 1}
                  </span>
                  <span
                    className="text-[11px] font-medium text-gray-700 shrink-0 capitalize"
                    style={{ width: 82, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={item.skill}
                  >
                    {item.skill}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${barWidth}%`, background: colors.bar, transition: "width 0.5s ease" }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold tabular-nums shrink-0 w-7 text-right"
                    style={{ color: colors.text }}
                  >
                    {Math.round(item.demand_pct)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && skills.length > 0 && (
          <p className="text-[10px] text-gray-400 mt-3 pt-2.5 border-t border-gray-50">
            % of active listings requiring each skill
          </p>
        )}
      </div>
    </div>
  );
}
