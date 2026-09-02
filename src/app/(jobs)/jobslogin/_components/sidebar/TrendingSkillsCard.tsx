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
  if (pct >= 40) return "from-[#4F46E5] to-[#4338CA]";
  if (pct >= 25) return "from-[#0891b2] to-[#0e7490]";
  return "from-[#64748b] to-[#475569]";
};

const PCT_COLOR = (pct: number) => {
  if (pct >= 40) return "text-[#4F46E5]";
  if (pct >= 25) return "text-cyan-600";
  return "text-gray-500";
};

// Pill background to match — same tiering as PCT_COLOR, so the number and
// its chip always agree, and both intensify at the same threshold as the bar.
const PCT_BG = (pct: number) => {
  if (pct >= 40) return "bg-indigo-50";
  if (pct >= 25) return "bg-cyan-50";
  return "bg-slate-100";
};

// Rank badge — mirrors TopPickCard's medal-style circles for the top 3 so
// both cards in the panel read as one system; ranks beyond 3 (this list can
// show up to 10) fall back to a neutral badge rather than losing the shape.
const RANK_BADGE_STYLE = (idx: number) => {
  if (idx === 0) return "bg-amber-50 text-amber-500 border-amber-200";
  if (idx === 1) return "bg-gray-50 text-gray-400 border-gray-200";
  if (idx === 2) return "bg-orange-50 text-orange-400 border-orange-200";
  return "bg-slate-50 text-slate-400 border-slate-200";
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-[#f0f4ff] shadow-inner shadow-white">
            <TrendingUp size={13} className="text-[#4F46E5]" />
          </div>
          <div>
            <h3 className="text-[14px] font-extrabold leading-tight text-slate-950">Trending Skills</h3>
            {period && (
              <p className="text-[10.5px] font-medium text-slate-400">{period} · live demand</p>
            )}
          </div>
        </div>
        {!loading && (
          <button
            type="button"
            onClick={fetch}
            title="Refresh trending skills"
            aria-label="Refresh trending skills"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#4F46E5] hover:bg-[#f0f4ff] transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      <div className="border-t border-slate-100" />

      {/* Content */}
      <div className="px-4 py-3.5">
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
              className="mt-1.5 text-[11px] text-[#4F46E5] font-semibold hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {skills.map((item, idx) => {
              // Scaled directly against the true 0-100% domain — not against
              // this list's own max — so bar length always matches what the
              // percentage label says, instead of overstating lower items.
              const barWidth = Math.max(6, Math.round(item.demand_pct));
              return (
                <div key={item.skill} className="group flex items-center gap-3">
                  {/* Rank — same medal-circle treatment as Top Picks */}
                  <span className={`w-5 h-5 rounded-full border text-[9px] font-black flex items-center justify-center shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${RANK_BADGE_STYLE(idx)}`}>
                    {idx + 1}
                  </span>

                  {/* Skill name */}
                  <span
                    className="text-[11.5px] font-medium text-gray-700 shrink-0"
                    style={{ width: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={item.skill}
                  >
                    {item.skill}
                  </span>

                  {/* Bar */}
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                    <div
                      className={`h-full rounded-full bg-linear-to-r shadow-[0_0_14px_rgba(79,70,229,0.16)] ${BAR_COLOR(item.demand_pct)}`}
                      style={{ width: `${barWidth}%`, transition: "width 0.6s ease" }}
                    />
                  </div>

                  {/* Percentage — pill treatment matching Top Picks' match-score chip */}
                  <span className={`inline-flex shrink-0 w-9 items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${PCT_COLOR(item.demand_pct)} ${PCT_BG(item.demand_pct)}`}>
                    {Math.round(item.demand_pct)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && skills.length > 0 && (
          <p className="mt-3 border-t border-slate-100 pt-2.5 text-[10px] text-slate-400">
            % of active listings requiring each skill
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(TrendingSkillsCard);
