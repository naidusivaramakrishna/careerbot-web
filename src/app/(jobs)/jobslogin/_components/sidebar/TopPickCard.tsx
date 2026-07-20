"use client";
import { memo } from "react";
import { Star, ArrowRight, MapPin, Briefcase } from "lucide-react";
import { getMatchBandConfig } from "../utils/matchBand";

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
  loading?: boolean;
  emptyMessage?: string;
  analyzedCount?: number;
  onViewAll?: () => void;
  onSelectJob?: (job: Job) => void;
}

const AVATAR_PALETTE = [
  { bg: "bg-indigo-50", text: "text-indigo-700" },
  { bg: "bg-slate-100", text: "text-slate-700" },
  { bg: "bg-[#f1f3ff]", text: "text-[#4F46E5]" },
];

function avatarPaletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function TopPickCard({ jobs = [], loading = false, emptyMessage, analyzedCount, onViewAll, onSelectJob }: TopPickCardProps) {
  const topPicks = jobs.slice(0, 3);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 shadow-inner shadow-white">
          <Star size={13} className="fill-indigo-100 text-[#4F46E5]" />
        </div>
        <div>
          <h3 className="text-[14px] font-extrabold leading-tight text-slate-950">Today&apos;s shortlist</h3>
          <p className="text-[10.5px] font-medium text-slate-400">Personalised from your activity</p>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Job list */}
      <div className="px-3 py-2">
        {loading ? (
          <div className="py-6 text-center">
            <div className="space-y-1.5 animate-pulse">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>
        ) : topPicks.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <Star size={14} />
            </div>
            <p className="mx-auto mt-2 max-w-[245px] text-[11.5px] leading-relaxed text-slate-500">
              {analyzedCount && analyzedCount > 0
                ? `${analyzedCount.toLocaleString()} jobs analysed · none reached your shortlist threshold today.`
                : emptyMessage ?? "No personalised picks yet."}
            </p>
            <a
              href="/profile"
              className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-[#4F46E5] transition-colors hover:text-[#4338CA]"
            >
              Improve my matches <ArrowRight size={11} />
            </a>
          </div>
        ) : (
          <div className="space-y-1">
            {topPicks.map((job) => {
              const hasScore = !!job.matchScore && Math.round(job.matchScore) > 0;
              const cfg = hasScore ? getMatchBandConfig(job.match_band) : null;
              const palette = avatarPaletteFor(job.company || "?");
              const pct = hasScore ? Math.round(job.matchScore as number) : 0;

              return (
                <div
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectJob?.(job)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectJob?.(job);
                    }
                  }}
                  className="group flex cursor-pointer items-center gap-2.5 rounded-2xl border border-transparent py-2.5 pl-3 pr-4 transition-all hover:-translate-y-px hover:border-blue-100 hover:bg-[#f7faff] hover:shadow-[0_10px_24px_rgba(79,70,229,0.08)]"
                >
                  {/* Company avatar */}
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-extrabold ${palette.bg} ${palette.text}`}>
                    {(job.company?.[0] ?? "?").toUpperCase()}
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-extrabold leading-tight text-slate-800 transition-colors group-hover:text-[#4F46E5]">
                      {job.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                    {cfg && (
                      <p className="mt-0.5 text-[9.5px] font-bold" style={{ color: cfg.color }}>
                        {cfg.label}
                      </p>
                    )}
                  </div>

                  {/* Match ring OR arrow */}
                  {cfg ? (
                    <div
                      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `conic-gradient(${cfg.color} ${pct * 3.6}deg, ${cfg.bg} 0deg)` }}
                    >
                      <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white text-[10px] font-extrabold tabular-nums text-slate-900">
                        {pct}%
                      </div>
                    </div>
                  ) : (
                    <ArrowRight size={13} className="shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#4F46E5]" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {(loading || topPicks.length > 0) && (
        <div className="border-t border-slate-100 px-4 py-2.5">
          <button
            type="button"
            onClick={onViewAll}
            className="flex w-full items-center justify-center gap-1.5 text-[11.5px] font-semibold text-[#4F46E5] transition-all hover:gap-2 hover:text-[#4338CA]"
          >
            View all recommendations <ArrowRight size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(TopPickCard);
