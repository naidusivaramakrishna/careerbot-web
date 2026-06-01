"use client";
import { memo } from "react";
import { Star, ArrowRight, MapPin, Briefcase } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type?: string;
  matchScore?: number;
  match_band?: string;
}

interface TopPickCardProps {
  jobs?: Job[];
}

const RANK_COLORS = [
  "bg-amber-50 text-amber-500 border-amber-200",
  "bg-gray-50 text-gray-400 border-gray-200",
  "bg-orange-50 text-orange-400 border-orange-200",
];

function TopPickCard({ jobs = [] }: TopPickCardProps) {
  const topPicks = jobs.slice(0, 3);

  return (
    <div>
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Star size={13} className="text-amber-500 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-gray-900 leading-tight">Top picks for you</h3>
            <p className="text-[10px] text-gray-400">Personalised · refreshed hourly</p>
          </div>
        </div>
        {topPicks.length > 0 && (
          <span className="text-[8px] font-bold text-[#2557a7] bg-[#f0f4ff] px-2 py-0.5 rounded-full uppercase tracking-wider">
            Live
          </span>
        )}
      </div>

      <div className="border-t border-gray-100" />

      {/* Job list */}
      <div className="px-3 py-2.5">
        {topPicks.length === 0 ? (
          <div className="py-6 text-center">
            <div className="space-y-1.5 animate-pulse">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {topPicks.map((job, idx) => (
              <div
                key={job.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f0f4ff]/60 group cursor-pointer transition-all hover:shadow-[0_1px_5px_rgba(37,87,167,0.08)] hover:-translate-y-px"
              >
                {/* Rank badge */}
                <span className={`w-5 h-5 rounded-full border text-[9px] font-black flex items-center justify-center shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${RANK_COLORS[idx]}`}>
                  {idx + 1}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-gray-800 truncate group-hover:text-[#2557a7] transition-colors leading-tight">
                    {job.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10.5px] text-gray-400 truncate">{job.company}</span>
                    {job.location && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400 shrink-0">
                        <MapPin size={8} className="text-gray-300" />
                        {job.location.split(",")[0]}
                      </span>
                    )}
                    {job.type && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400 shrink-0">
                        <Briefcase size={8} className="text-gray-300" />
                        {job.type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match score OR arrow */}
                {!!job.matchScore && Math.round(job.matchScore) > 0 ? (
                  <span className="shrink-0 text-[11px] font-bold text-[#2557a7] tabular-nums bg-[#f0f4ff] px-1.5 py-0.5 rounded-md">
                    {Math.round(job.matchScore)}%
                  </span>
                ) : (
                  <ArrowRight size={13} className="shrink-0 text-gray-300 group-hover:text-[#2557a7] transition-colors" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2.5">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-1.5 text-[11.5px] font-semibold text-[#2557a7] hover:text-[#1f4e98] hover:gap-2 transition-all"
        >
          View all recommendations <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}

export default memo(TopPickCard);
