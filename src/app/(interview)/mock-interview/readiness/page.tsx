"use client";

import { PageHeading } from "../_components/MockUI";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  ChevronLeft,

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
      .catch(() => setError("Could not load practice recommendation. Please try again."))
      .finally(() => setLoading(false));
  }, [setReadinessPassed]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm items-center justify-center px-4 text-center">
        <div className="w-full rounded-lg border border-gray-200 bg-white p-7 shadow-sm">
          <Loader2 size={24} className="mx-auto mb-3 animate-spin text-[#2557a7]" />
          <p className="text-sm text-gray-500">Checking your practice recommendation...</p>
        </div>
      </div>
    );
  }

  if (error || !readiness) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <button
          onClick={() => router.push("/mock-interview")}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-5 transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle size={24} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">{error ?? "Unable to load practice recommendation."}</p>
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

  return <main className="mi-page"><button className="mi-back-link" onClick={() => router.push("/mock-interview")}><ChevronLeft size={17} />Back</button><PageHeading eyebrow="A MOMENT TO REFLECT" title={ready ? "Practice Looks Strong" : "Live Interview Is Available"} description="Take stock of your preparation, then choose the next step that feels right for you." /><section className="mi-panel mi-readiness-layout"><div><ScoreRing score={criteria.current_avg} /><span className="mi-pill">{ready ? "Ready for your next conversation" : "Practice recommended"}</span><p>{criteria.rounds_completed} rounds · Avg {criteria.current_avg.toFixed(1)}/10</p></div><div><p className="mi-eyebrow">BUILD ON YOUR PROGRESS</p><h2>{ready ? "Bring your preparation to life." : "A stronger answer starts with an attempt."}</h2><p>{recommendation || "Practice can help, but you can start the live mock now."}</p><div className="mi-readiness-signals"><RequirementRow met={roundsMet} label={"Try " + criteria.min_practice_rounds + " practice rounds"} detail={!roundsMet ? (criteria.min_practice_rounds - criteria.rounds_completed) + " more round(s) suggested" : undefined} /><RequirementRow met={scoreMet} label={"Aim for " + criteria.avg_score_threshold.toFixed(1) + "/10 average"} detail={!scoreMet ? "Practice can raise this by " + (criteria.avg_score_threshold - criteria.current_avg).toFixed(1) : undefined} /></div><div className="mi-mic-track"><span style={{ width: Math.min(criteria.rounds_completed / Math.max(criteria.min_practice_rounds, 1) * 100, 100) + "%" }} /></div><div className="mi-actions"><button className="mi-button" onClick={() => router.push("/mock-interview/live")}>Start Live Interview <ArrowRight size={17} /></button><button className="mi-button mi-button-secondary" onClick={() => router.push("/notes/generate")}><RotateCcw size={16} />{ready ? "Optional Practice" : "Practice First (Optional)"}</button></div></div></section></main>;
}
