"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  Lock,
  Loader2,
} from "lucide-react";
import { getReadiness, ReadinessResponse } from "@/api/mockInterviewApi";
import { useMockInterview } from "../_context/MockInterviewContext";

// ─── Score Ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score, max = 10, size = 120 }: { score: number; max?: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(score / max, 1);
  const strokeDash = percent * circumference;
  const opacity = score >= 6 ? 1 : 0.55;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#2557a7" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          opacity={opacity}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{score.toFixed(1)}</span>
        <span className="text-[10px] text-gray-400 font-medium mt-0.5">/ {max}</span>
      </div>
    </div>
  );
}

// ─── Requirement Row ──────────────────────────────────────────────────────────

function RequirementRow({ met, label, detail }: { met: boolean; label: string; detail?: string }) {
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${
      met ? "bg-[#2557a7]/4 border-[#2557a7]/12" : "bg-gray-50 border-gray-200"
    }`}>
      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${met ? "bg-[#2557a7]/10" : "bg-gray-200"}`}>
        {met ? <CheckCircle2 size={12} className="text-[#2557a7]" /> : <AlertCircle size={11} className="text-gray-400" />}
      </div>
      <div>
        <p className={`text-xs font-medium ${met ? "text-[#2557a7]" : "text-gray-700"}`}>{label}</p>
        {detail && <p className={`text-[11px] mt-0.5 ${met ? "text-[#2557a7]/50" : "text-gray-400"}`}>{detail}</p>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReadinessPage() {
  const router = useRouter();
  const { setReadinessPassed } = useMockInterview();
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReadiness()
      .then((data) => {
        setReadiness(data);
        if (data.ready) setReadinessPassed(true);
      })
      .catch(() => setError("Could not load readiness status. Please try again."))
      .finally(() => setLoading(false));
  }, [setReadinessPassed]);

  if (loading) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center">
        <Loader2 size={24} className="text-[#2557a7] animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Checking your readiness…</p>
      </div>
    );
  }

  if (error || !readiness) {
    return (
      <div className="max-w-sm mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/mock-interview")}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-5 transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <AlertCircle size={24} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">{error ?? "Unable to load readiness."}</p>
          <button
            onClick={() => { setLoading(true); setError(null); getReadiness().then(setReadiness).catch(() => setError("Failed")).finally(() => setLoading(false)); }}
            className="mt-3 text-xs text-[#2557a7] hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { ready, criteria, recommendation } = readiness;
  const roundsMet = criteria.rounds_completed >= criteria.min_practice_rounds;
  const scoreMet = criteria.current_avg >= criteria.avg_score_threshold;

  // ── Ready state ──
  if (ready) {
    return (
      <div className="max-w-sm mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/mock-interview")}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-5 transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Score + status */}
          <div className="px-5 pt-6 pb-4 text-center">
            <div className="inline-block mb-3">
              <ScoreRing score={criteria.current_avg} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">You&apos;re Ready!</h1>
            <p className="text-xs text-gray-500 mt-1">
              {criteria.rounds_completed} rounds · Avg {criteria.current_avg.toFixed(1)}/10
            </p>
            {recommendation && (
              <p className="text-xs text-[#2557a7] mt-2 font-medium">{recommendation}</p>
            )}
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 space-y-2">
            <button
              onClick={() => router.push("/mock-interview/live")}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2557a7] text-white rounded-lg font-bold text-sm hover:bg-[#1e4a8f] transition-all shadow-sm shadow-[#2557a7]/20"
            >
              Start Mock Interview <ArrowRight size={14} />
            </button>
            <button
              onClick={() => router.push("/mock-interview/practice")}
              className="w-full py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} className="text-gray-400" />
              Practice More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Not-ready state ──
  return (
    <div className="max-w-sm mx-auto px-4 py-8">
      <button
        onClick={() => router.push("/mock-interview")}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <ChevronLeft size={14} /> Back
      </button>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Score + status */}
        <div className="px-5 pt-6 pb-4 text-center">
          <div className="inline-block mb-3">
            <ScoreRing score={criteria.current_avg} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-[10px] font-semibold text-gray-500 mb-2">
            <Lock size={10} /> Not ready yet
          </div>
          <h1 className="text-lg font-bold text-gray-900">Almost There!</h1>
          <p className="text-xs text-gray-400 mt-1">
            {criteria.current_avg.toFixed(1)}/10 avg · Need {criteria.avg_score_threshold.toFixed(1)}+
          </p>
        </div>

        {/* Progress */}
        <div className="px-5 py-2.5 border-y border-gray-100">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-gray-500">Practice rounds</span>
            <span className="font-semibold text-gray-700 tabular-nums">
              {criteria.rounds_completed}/{criteria.min_practice_rounds} required
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2557a7] rounded-full transition-all duration-500"
              style={{ width: `${Math.min((criteria.rounds_completed / criteria.min_practice_rounds) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="px-5 py-4">
          {/* Requirements */}
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Requirements</p>
          <div className="space-y-1.5 mb-4">
            <RequirementRow
              met={roundsMet}
              label={`Complete ${criteria.min_practice_rounds} practice rounds`}
              detail={!roundsMet ? `${criteria.min_practice_rounds - criteria.rounds_completed} more round(s) needed` : undefined}
            />
            <RequirementRow
              met={scoreMet}
              label={`Average ≥ ${criteria.avg_score_threshold.toFixed(1)}/10`}
              detail={!scoreMet ? `Need ${(criteria.avg_score_threshold - criteria.current_avg).toFixed(1)} more` : undefined}
            />
          </div>

          {recommendation && (
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">{recommendation}</p>
          )}

          <button
            onClick={() => router.push("/mock-interview/practice")}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2557a7] text-white rounded-lg font-bold text-sm hover:bg-[#1e4a8f] transition-all shadow-sm shadow-[#2557a7]/20"
          >
            <RotateCcw size={13} />
            Keep Practising
          </button>
        </div>
      </div>
    </div>
  );
}
