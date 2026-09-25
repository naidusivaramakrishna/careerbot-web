"use client";

import { TrendingUp, RefreshCw } from "lucide-react";
import { memo, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getTrendingSkills } from "@/api/insightsApi";
import type { TrendingSkillItem } from "@/api/insightsApi";

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
      <div className="h-3 w-4 shrink-0 rounded bg-gray-100" />
      <div className="w-20 h-3 bg-gray-200 rounded shrink-0" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full" />
      <div className="w-7 h-3 bg-gray-100 rounded shrink-0" />
    </div>
  );
}

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

  // Extracted from a nested ternary (typescript:S3358) — same JSX for every
  // combination of loading/error as before.
  let content: ReactNode;
  if (loading) {
    content = (
      <div>
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  } else if (error) {
    content = (
      <div className="px-4 py-4 text-center">
        <p className="text-[12px] text-gray-400">Could not load trending skills.</p>
        <button
          type="button"
          onClick={fetch}
          className="mt-1.5 text-[12px] font-semibold text-[#4F46E5] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  } else {
    content = skills.map((item, idx) => {
      // Scaled directly against the true 0-100% domain — not against this
      // list's own max — so bar length always matches what the percentage
      // label says, instead of overstating lower items.
      const barWidth = Math.max(6, Math.round(item.demand_pct));
      return (
        <div key={item.skill} className="flex items-center gap-3 px-4 py-2">
          <span className="w-4 shrink-0 text-[12px] text-gray-400">{idx + 1}</span>
          <span
            className="shrink-0 text-[13px] text-gray-800"
            style={{ width: 84, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            title={item.skill}
          >
            {item.skill}
          </span>
          <div className="h-0.75 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#4F46E5]"
              style={{ width: `${barWidth}%`, transition: "width 0.6s ease" }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-[12px] text-gray-500">
            {Math.round(item.demand_pct)}%
          </span>
        </div>
      );
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <TrendingUp size={13} className="text-gray-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold leading-tight text-gray-900">Trending Skills</h3>
            {period && (
              <p className="text-[12px] text-gray-500">{period} &middot; live demand</p>
            )}
          </div>
        </div>
        {!loading && (
          <button
            type="button"
            onClick={fetch}
            title="Refresh trending skills"
            aria-label="Refresh trending skills"
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {/* List — plain rows, no card-in-card. */}
      <div className="pb-1.5">
        {content}
      </div>

      {!loading && !error && skills.length > 0 && (
        <p className="border-t border-gray-100 px-4 py-2.5 text-[11px] text-gray-400">
          % of active listings requiring each skill
        </p>
      )}
    </div>
  );
}

export default memo(TrendingSkillsCard);
