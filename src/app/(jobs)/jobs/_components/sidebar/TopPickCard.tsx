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
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 shadow-inner shadow-white">
            <Star size={13} className="text-amber-500 fill-amber-400" />
          </div>
          <div>
            <h3 className="text-[14px] font-extrabold leading-tight text-slate-950">Top picks for you</h3>
            <p className="text-[10.5px] font-medium text-slate-400">Personalised · refreshed hourly</p>
          </div>
        </div>
        {topPicks.length > 0 && (
          <span className="rounded-full bg-[#f0f4ff] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#2557a7]">
            Live
          </span>
        )}
      </div>

      <div className="border-t border-slate-100" />

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
          <div className="space-y-1">
            {topPicks.map((job, idx) => (
              <div
                key={job.id}
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition-all hover:-translate-y-px hover:border-blue-100 hover:bg-[#f7faff] hover:shadow-[0_10px_24px_rgba(37,87,167,0.08)]"
              >
                {/* Rank badge */}
                <span className={`w-5 h-5 rounded-full border text-[9px] font-black flex items-center justify-center shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${RANK_COLORS[idx]}`}>
                  {idx + 1}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-extrabold leading-tight text-slate-800 transition-colors group-hover:text-[#2557a7]">
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
                  <ArrowRight size={13} className="shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#2557a7]" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3">
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
