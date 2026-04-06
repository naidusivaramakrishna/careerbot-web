"use client";
import { Star, ArrowRight } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
}

interface TopPickCardProps {
  jobs?: Job[];
}

export default function TopPickCard({ jobs = [] }: TopPickCardProps) {
  const topPicks = jobs.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Star size={13} className="text-amber-500 fill-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Top Picks For You</h3>
        </div>
      </div>

      <div className="space-y-3">
        {topPicks.length === 0 ? (
          <div className="py-4 text-center text-xs text-gray-400">Loading jobs...</div>
        ) : (
          topPicks.map((job, i) => (
            <div
              key={job.id}
              className={`flex items-start justify-between gap-3 ${
                i < topPicks.length - 1 ? "pb-3 border-b border-gray-50" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{job.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {job.company} · {job.location}
                </p>
              </div>
              <span className="text-[10px] bg-[#2557a7]/8 text-[#2557a7] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap flex-shrink-0 border border-[#2557a7]/15">
                New
              </span>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-[#2557a7] hover:text-[#1a4a96] transition-colors py-2 border-t border-gray-50"
      >
        View all recommendations <ArrowRight size={12} />
      </button>
    </div>
  );
}
