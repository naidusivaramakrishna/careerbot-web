"use client";
import { Star, ArrowRight, MapPin } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore?: number;
}

interface TopPickCardProps {
  jobs?: Job[];
}

export default function TopPickCard({ jobs = [] }: TopPickCardProps) {
  const topPicks = jobs.slice(0, 3);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
            <Star size={11} className="text-amber-500 fill-amber-500" />
          </div>
          <div>
            <h3 className="text-[12.5px] font-semibold text-gray-900 leading-tight">Top picks for you</h3>
            <p className="text-[10px] text-gray-400">Personalised · refreshed hourly</p>
          </div>
        </div>
        {/* AI badge */}
        <span className="px-1.5 py-0.5 bg-[#2557a7] text-white text-[9px] font-bold rounded uppercase tracking-wider">
          AI
        </span>
      </div>

      {/* Job list */}
      <div className="px-4 py-1">
        {topPicks.length === 0 ? (
          <div className="py-4 text-center text-[11px] text-gray-400">Loading recommendations…</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {topPicks.map((job) => (
              <div key={job.id} className="py-2.5 flex items-start justify-between gap-2 group cursor-pointer">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-gray-800 truncate group-hover:text-[#2557a7] transition-colors leading-tight">
                    {job.title}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-[11px] text-gray-400 truncate">{job.company}</p>
                    {job.location && (
                      <>
                        <span className="text-gray-300 text-[10px]">·</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-gray-400 shrink-0">
                          <MapPin size={8} className="text-gray-300" />
                          {job.location.split(",")[0]}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {/* Match % */}
                {job.matchScore && job.matchScore > 0 && (
                  <span className="shrink-0 text-[11px] font-bold text-emerald-600 tabular-nums mt-0.5">
                    {Math.round(job.matchScore)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-50">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-1 text-[11px] font-semibold text-[#2557a7] hover:text-[#1a4a96] transition-colors"
        >
          View all recommendations <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}
