"use client";
import { memo } from "react";
import { Star } from "lucide-react";

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
  readonly jobs?: Job[];
  readonly loading?: boolean;
  readonly emptyMessage?: string;
  readonly onViewAll?: () => void;
}

// Company-initial avatar — a flat colored square with the company's first
// letter, standing in for a logo. Color is a stable hash of the company
// name (not match quality) so the same company always gets the same tint.
const AVATAR_TINTS = [
  { bg: "#e8f0fb", fg: "#215299" },
  { bg: "#fbeee8", fg: "#b3492b" },
  { bg: "#eaf3ee", fg: "#0f7a3d" },
  { bg: "#f3ecfb", fg: "#6b3fa0" },
  { bg: "#fdf3e4", fg: "#b3781f" },
];

function avatarTint(company: string) {
  let hash = 0;
  for (let i = 0; i < company.length; i++) hash = (hash * 31 + company.charCodeAt(i)) | 0;
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length];
}

function TopPickCard({ jobs = [], loading = false, emptyMessage, onViewAll }: TopPickCardProps) {
  const topPicks = jobs.slice(0, 3);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
          <Star size={13} className="text-gray-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold leading-tight text-gray-900">Top picks for you</h3>
          <p className="text-[12px] text-gray-500">Personalised &middot; refreshed hourly</p>
        </div>
      </div>

      {/* List — plain rows separated by hairline dividers, no card-in-card. */}
      <div>
        {(() => {
          if (loading) {
            return (
              <div className="animate-pulse space-y-3 px-4 py-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded bg-gray-100" />
                ))}
              </div>
            );
          }
          if (topPicks.length === 0) {
            return (
              <div className="px-4 py-6 text-center">
                <p className="text-[12px] leading-relaxed text-gray-400">
                  {emptyMessage ?? "No personalised picks yet."}
                </p>
              </div>
            );
          }
          return topPicks.map((job) => {
            const hasMatchScore = !!job.matchScore && Math.round(job.matchScore) > 0;
            const tint = avatarTint(job.company || job.title);
            return (
              <div
                key={job.id}
                className="flex cursor-pointer items-start gap-3 border-t border-gray-100 px-4 py-3 first:border-t-0"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-[14px] font-bold"
                  style={{ background: tint.bg, color: tint.fg }}
                >
                  {(job.company || job.title || "?").charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#4F46E5] hover:underline">
                    {job.title}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-gray-500">
                    {[job.company, job.location, job.type].filter(Boolean).join(" · ")}
                  </p>
                </div>

                {hasMatchScore && (
                  <span className="shrink-0 pt-0.5 text-[11px] font-medium text-gray-500">
                    {Math.round(job.matchScore!)}% match
                  </span>
                )}
              </div>
            );
          });
        })()}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 pb-3 pt-0">
        <button
          type="button"
          onClick={onViewAll}
          className="text-[13px] font-semibold text-[#4F46E5] hover:underline"
        >
          Show all recommendations
        </button>
      </div>
    </div>
  );
}

export default memo(TopPickCard);
