"use client";

import { TrendingUp, RefreshCw } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { getTrendingSkills } from "@/api/insightsApi";
import type { TrendingSkillItem } from "@/api/insightsApi";

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-4 h-3 bg-gray-100 rounded shrink-0" />
      <div className="w-20 h-3 bg-gray-200 rounded shrink-0" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full" />
      <div className="w-7 h-3 bg-gray-100 rounded shrink-0" />
    </div>
  );
}

const BAR_COLOR = (pct: number) => {
  if (pct >= 40) return "from-[#2557a7] to-[#1f4e98]";
  if (pct >= 25) return "from-[#0891b2] to-[#0e7490]";
  return "from-[#64748b] to-[#475569]";
};

const PCT_COLOR = (pct: number) => {
  if (pct >= 40) return "text-[#2557a7]";
  if (pct >= 25) return "text-cyan-600";
  return "text-gray-500";
};

function TrendingSkillsCard() {
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

  const maxDemand = skills.length > 0 ? Math.max(...skills.map((s) => s.demand_pct)) : 100;

  return (
    <div>
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#f0f4ff] flex items-center justify-center shrink-0">
            <TrendingUp size={13} className="text-[#2557a7]" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-gray-900 leading-tight">Trending Skills</h3>
            {period && (
              <p className="text-[10px] text-gray-400">{period} · live demand</p>
            )}
          </div>
        </div>
        {!loading && (
          <button
            type="button"
            onClick={fetch}
            title="Refresh trending skills"
            aria-label="Refresh trending skills"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#2557a7] hover:bg-[#f0f4ff] transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      <div className="border-t border-gray-100" />

      {/* Content */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-[11px] text-gray-400">Could not load trending skills.</p>
            <button
              type="button"
              onClick={fetch}
              className="mt-1.5 text-[11px] text-[#2557a7] font-semibold hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {skills.map((item, idx) => {
              const barWidth = Math.max(6, Math.round((item.demand_pct / maxDemand) * 100));
              return (
                <div key={item.skill} className="flex items-center gap-3 group">
                  {/* Rank */}
                  <span className="text-[10px] font-bold text-gray-300 w-3 shrink-0 text-right tabular-nums">
                    {idx + 1}
                  </span>

                  {/* Skill name */}
                  <span
                    className="text-[11.5px] font-medium text-gray-700 shrink-0"
                    style={{ width: 88, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={item.skill}
                  >
                    {item.skill}
                  </span>

                  {/* Bar */}
                  <div className="flex-1 h-2 rounded-full bg-gray-100/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${BAR_COLOR(item.demand_pct)}`}
                      style={{ width: `${barWidth}%`, transition: "width 0.6s ease" }}
                    />
                  </div>

                  {/* Percentage */}
                  <span className={`text-[11px] font-bold tabular-nums shrink-0 w-9 text-right ${PCT_COLOR(item.demand_pct)}`}>
                    {Math.round(item.demand_pct)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && skills.length > 0 && (
          <p className="text-[10px] text-gray-400 mt-3 pt-2.5 border-t border-gray-100">
            % of active listings requiring each skill
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(TrendingSkillsCard);
