"use client";

import { Lightbulb, TrendingUp, Zap, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { getSkillGaps, getTrendingSkills } from "@/api/insightsApi";

interface InsightCard {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  labelColor: string;
  text: string;
  badge?: string;
  badgeColor?: string;
}

function SkeletonCard() {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100 animate-pulse">
      <div className="w-7 h-7 rounded-lg bg-gray-200 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1.5 pt-0.5">
        <div className="h-2.5 w-20 bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-100 rounded" />
        <div className="h-2 w-3/4 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function CareerTip() {
  const [cards, setCards] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(false);

    const results = await Promise.allSettled([
      getSkillGaps({ top_n: 5 }),
      getTrendingSkills({ top_n: 5 }),
    ]);

    const newCards: InsightCard[] = [];

    // Skill Gap card — from skill-gaps API
    const gapsResult = results[0];
    if (gapsResult.status === 'fulfilled') {
      const data = gapsResult.value;
      const topMissing = data.missing_critical[0] ?? data.missing_nice_to_have[0];
      const topStrong = data.strongest_skills[0];

      if (topMissing) {
        newCards.push({
          icon: Lightbulb,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-500",
          label: "Skill Gap",
          labelColor: "text-amber-700",
          text: `Adding "${topMissing.skill}" could boost your match rate — required by ${Math.round(topMissing.in_jobs_pct)}% of your matched jobs.`,
          badge: topMissing.priority === 'high' ? 'High priority' : undefined,
          badgeColor: "bg-amber-100 text-amber-600",
        });
      }

      if (topStrong) {
        newCards.push({
          icon: Zap,
          iconBg: "bg-blue-50",
          iconColor: "text-[#2557a7]",
          label: "Top Skill",
          labelColor: "text-[#2557a7]",
          text: `"${topStrong.skill}" is your strongest skill — matched in ${Math.round(topStrong.in_jobs_pct)}% of relevant jobs.`,
        });
      }
    }

    // Trending skills card — from trending-skills API
    const trendingResult = results[1];
    if (trendingResult.status === 'fulfilled') {
      const data = trendingResult.value;
      const topSkill = data.skills[0];
      const secondSkill = data.skills[1];

      if (topSkill) {
        const skillText = secondSkill
          ? `"${topSkill.skill}" and "${secondSkill.skill}" are trending this week — demanded by ${Math.round(topSkill.demand_pct)}%+ of current job postings.`
          : `"${topSkill.skill}" is trending — demanded by ${Math.round(topSkill.demand_pct)}% of current job postings.`;

        newCards.push({
          icon: TrendingUp,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-500",
          label: "Market Trend",
          labelColor: "text-emerald-700",
          text: skillText,
          badge: data.period === 'last_7_days' ? 'This week' : undefined,
          badgeColor: "bg-emerald-100 text-emerald-600",
        });
      }
    }

    if (newCards.length === 0) {
      setError(true);
    } else {
      setCards(newCards);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Career Insights</h3>
        {!loading && (
          <button
            type="button"
            onClick={fetchInsights}
            title="Refresh insights"
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">Upload your resume to unlock personalised insights.</p>
          <button
            type="button"
            onClick={fetchInsights}
            className="mt-2 text-xs text-[#2557a7] font-medium hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="flex gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100"
              >
                <div className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon size={13} className={card.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className={`text-xs font-semibold ${card.labelColor}`}>{card.label}</p>
                    {card.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{card.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
