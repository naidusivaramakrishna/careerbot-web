"use client";

import { Plus, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSkillGaps } from "@/api/insightsApi";
import type { SkillGapData } from "@/api/insightsApi";

export default function CareerTip() {
  const router = useRouter();
  const [gap, setGap] = useState<SkillGapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getSkillGaps({ top_n: 5 });
      const topMissing = data.missing_critical[0] ?? data.missing_nice_to_have[0];
      if (topMissing) {
        setGap(topMissing);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInsights(); }, []);

  return (
    <div>
      <style>{`
        @keyframes ct-shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .ct-shimmer {
          background: linear-gradient(90deg, #ececec 25%, #e0e0e2 50%, #ececec 75%);
          background-size: 1200px 100%;
          animation: ct-shimmer 1.6s ease-in-out infinite;
        }
      `}</style>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
            <Plus size={11} className="text-[#2557a7]" />
          </div>
          <div>
            <h3 className="text-[12.5px] font-semibold text-gray-900 leading-tight">Skill gap suggestion</h3>
            {gap && !loading && (
              <p className="text-[10px] text-gray-400">
                Closes ~{Math.round(gap.in_jobs_pct)}% of matches
              </p>
            )}
          </div>
        </div>
        {!loading && (
          <button
            type="button"
            onClick={fetchInsights}
            title="Refresh skill suggestion"
            aria-label="Refresh skill suggestion"
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={11} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3.5 ct-shimmer rounded-full w-3/4" />
            <div className="h-2.5 ct-shimmer rounded-full w-full" />
            <div className="h-2.5 ct-shimmer rounded-full w-5/6" />
            <div className="flex gap-2 mt-3">
              <div className="h-7 ct-shimmer rounded-full w-24" />
              <div className="h-7 ct-shimmer rounded-full w-24" />
            </div>
          </div>
        ) : error || !gap ? (
          <div className="text-center py-1">
            <p className="text-[11px] text-gray-400">Upload your resume to get skill gap suggestions.</p>
            <button
              type="button"
              onClick={fetchInsights}
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#2557a7] font-semibold hover:text-[#1f4e98] transition-colors"
            >
              <RotateCcw size={10} />
              Try again
            </button>
          </div>
        ) : (
          <>
            <p className="text-[13px] font-semibold text-gray-900 leading-snug">
              Add{" "}
              <span className="text-[#2557a7]">{gap.skill}</span>{" "}
              to your profile
            </p>
            <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
              It appears in {Math.round(gap.in_jobs_pct)}% of your top-matched jobs but is missing from your resume.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => router.push("/courses")}
                className="px-3.5 py-1.5 bg-[#2557a7] hover:bg-[#1f4e98] text-white text-[11px] font-bold rounded-full transition-colors"
              >
                Start course
              </button>
              <button
                type="button"
                onClick={() => toast.info("Open your profile to add this skill.")}
                className="px-3.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full hover:border-gray-300 transition-colors"
              >
                Add to profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
