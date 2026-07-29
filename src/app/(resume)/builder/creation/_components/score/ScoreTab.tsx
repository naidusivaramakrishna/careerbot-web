"use client";
import React, { useEffect, useRef, useState } from "react";
import { triggerScoreCalculation, getBuilderScore } from "@/api/resumeApi";
import MultiColorCircularScore from "./MultiColorCircularScore";
import { toast } from "sonner";
import { useScore } from "../../_context/ScoreContext";
import { useResume } from "../../_context/ResumeContext";
import { useResumeScorePreview } from "../../_hooks/useResumeScorePreview";
import { Clock, Loader2, RefreshCw, Zap } from "lucide-react";

const AUTO_CALC_THRESHOLD = 7;

// Semantic tier palette — independent from brand accent
function tier(score: number) {
  if (score >= 70) return { arc: "#10B981", light: "#ECFDF5", muted: "#D1FAE5", text: "#065F46", dot: "bg-emerald-400" };
  if (score >= 40) return { arc: "#F59E0B", light: "#FFFBEB", muted: "#FEF3C7", text: "#92400E", dot: "bg-amber-400"   };
  return               { arc: "#EF4444", light: "#FEF2F2", muted: "#FEE2E2", text: "#991B1B", dot: "bg-red-400"     };
}

// ─── Enhanced resume panel ────────────────────────────────────────────────────
function EnhancedScorePanel() {
  const { enhancedAtsScore } = useResume();

  if (!enhancedAtsScore) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <p className="text-[13px] text-[#9CA3AF]">Score data not available.</p>
      </div>
    );
  }

  const score = Math.round(enhancedAtsScore.final_score ?? enhancedAtsScore.Percentage ?? 0);
  const profile = enhancedAtsScore.profile;
  const breakdown = enhancedAtsScore.section_breakdown ?? {};
  const penalties = enhancedAtsScore.intelligence_penalties ?? [];
  const tc = tier(score);
  const sections = Object.entries(breakdown).filter(([, sec]) => sec.weight > 0);

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Score hero */}
      <div
        className="bg-white rounded-2xl border border-[#EAECF0] p-5 flex flex-col items-center gap-3"
        style={{ borderTop: `3px solid ${tc.arc}` }}
      >
        <MultiColorCircularScore value={score} />
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[13px] font-semibold text-[#111827]">ATS Score</span>
          {profile && (
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: tc.light, color: tc.text }}
            >
              {profile}
            </span>
          )}
        </div>
      </div>

      {/* Section breakdown */}
      {sections.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EAECF0] p-4 flex flex-col gap-3">
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Section Breakdown</p>
          <div className="flex flex-col gap-3.5">
            {sections.map(([name, sec]) => {
              const pct = Math.round(sec.percentage);
              const sc = tier(pct);
              return (
                <div key={name} className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[12px] font-medium text-[#374151]">{name}</span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: sc.arc }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: sc.muted }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: sc.arc }}
                    />
                  </div>
                  {sec.deductions?.slice(0, 1).map((d, i) => (
                    <p key={i} className="text-[10px] text-[#B45309] leading-snug mt-0.5">
                      {d.after_example || d.message}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      {penalties.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5">
            <Zap size={11} className="text-[#9CA3AF]" />
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Improvement Tips</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {penalties.map((p, i) => (
              <div
                key={i}
                className="text-[12px] text-[#92400E] px-3 py-2 rounded-xl leading-snug"
                style={{ background: "#FFFBEB", borderLeft: "3px solid #FCD34D" }}
              >
                {p.after_example || p.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Builder score panel ──────────────────────────────────────────────────────
export default function ATSScorePanel() {
  const { resumeData, resumeSource, completionStatus } = useResume();
  const { canonicalScore, canonicalStatus, lastCalculatedAt, setCanonicalScore, setCanonicalStatus, markScoreStale } = useScore();

  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef     = useRef(true);
  const autoTriggeredRef = useRef(false);

  const previewScore  = useResumeScorePreview(resumeData as unknown as import("@/api/resumeApi").ResumeResponse);
  const isEnhanced    = resumeSource === "enhanced";
  const completedCount = Object.values(completionStatus).filter(Boolean).length;

  useEffect(() => {
    if (!isEnhanced && canonicalScore !== null && canonicalStatus === "ready") markScoreStale();
  }, [resumeData, canonicalScore, canonicalStatus, markScoreStale, isEnhanced]);

  useEffect(() => { return () => { isMountedRef.current = false; }; }, []);

  const handleCalculateScore = async () => {
    const resumeId = localStorage.getItem("current_resume_id");
    if (!resumeId || resumeId === "null" || resumeId === "undefined") {
      toast.error("No resume found. Please create a resume first.");
      return;
    }
    try {
      isMountedRef.current = true;
      setIsCalculating(true);
      setError(null);
      setCanonicalStatus("calculating");
      await triggerScoreCalculation(resumeId);

      for (let attempt = 1; attempt <= 10; attempt++) {
        await new Promise((r) => setTimeout(r, 2000));
        if (!isMountedRef.current) return;
        try {
          const result = await getBuilderScore(resumeId);
          if (result.score > 0) {
            if (isMountedRef.current) {
              setCanonicalScore(result.score, new Date().toLocaleString());
              toast.success("ATS score calculated!");
            }
            return;
          }
        } catch { /* continue polling */ }
      }

      if (isMountedRef.current) {
        setError("Score calculation timed out. Please try again.");
        setCanonicalStatus("error");
        toast.error("Score calculation timed out.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to calculate score";
      if (isMountedRef.current) { setError(msg); setCanonicalStatus("error"); toast.error(msg); }
    } finally {
      if (isMountedRef.current) setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (
      !isEnhanced &&
      completedCount >= AUTO_CALC_THRESHOLD &&
      canonicalStatus === "not_calculated" &&
      !autoTriggeredRef.current &&
      !isCalculating
    ) {
      autoTriggeredRef.current = true;
      handleCalculateScore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedCount, canonicalStatus, isEnhanced]);

  if (isEnhanced) return <EnhancedScorePanel />;

  const showFullScore  = canonicalStatus === "ready" || canonicalStatus === "stale";
  const isCalcRunning  = isCalculating || canonicalStatus === "calculating";
  const displayScore   = showFullScore ? (canonicalScore ?? 0) : previewScore.score;
  const isThresholdMet = completedCount >= AUTO_CALC_THRESHOLD;
  const tc = tier(displayScore);

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Score hero card ── */}
      <div
        className="bg-white rounded-2xl border border-[#EAECF0] overflow-hidden"
        style={{ borderTop: `3px solid ${tc.arc}` }}
      >
        <div className="p-5 flex flex-col items-center gap-3">

          {/* Ring — pulses while calculating */}
          <div className={isCalcRunning ? "animate-pulse" : undefined}>
            <MultiColorCircularScore value={displayScore} />
          </div>

          {/* Label block */}
          {isCalcRunning ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Loader2 size={12} className="text-[#2557A7] animate-spin" />
                <span className="text-[13px] font-semibold text-[#111827]">Calculating…</span>
              </div>
              <span className="text-[11px] text-[#9CA3AF]">This takes up to 20 seconds</span>
            </div>
          ) : showFullScore ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[13px] font-semibold text-[#111827]">ATS Score</span>
              {lastCalculatedAt && (
                <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                  <Clock size={10} />
                  {lastCalculatedAt}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-[#374151]">Preview Score</span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-px rounded-full capitalize"
                  style={{ background: tc.light, color: tc.text }}
                >
                  {previewScore.band}
                </span>
              </div>
              <span className="text-[11px] text-[#9CA3AF]">Updates as you edit</span>
            </div>
          )}

          {/* Stale pill — slim, inside card */}
          {canonicalStatus === "stale" && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
              style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              Score may be outdated
              <button
                onClick={handleCalculateScore}
                disabled={isCalculating}
                className="flex items-center gap-0.5 font-semibold underline underline-offset-2 ml-0.5 hover:opacity-70 transition-opacity disabled:opacity-40"
              >
                <RefreshCw size={10} className={isCalculating ? "animate-spin" : ""} />
                Recalculate
              </button>
            </div>
          )}

          {/* Error pill — slim, inside card */}
          {canonicalStatus === "error" && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {error || "Calculation failed"}
              <button
                onClick={() => { autoTriggeredRef.current = false; handleCalculateScore(); }}
                disabled={isCalculating}
                className="flex items-center gap-0.5 font-semibold underline underline-offset-2 ml-0.5 hover:opacity-70 transition-opacity disabled:opacity-40"
              >
                <RefreshCw size={10} className={isCalculating ? "animate-spin" : ""} />
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 7-segment progress track ── */}
      {!showFullScore && !isCalcRunning && canonicalStatus !== "error" && (
        <div className="bg-white rounded-2xl border border-[#EAECF0] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Progress</p>
            <span className="text-[11px] font-bold text-[#2557A7] tabular-nums">
              {completedCount}
              <span className="font-normal text-[#9CA3AF]">/{AUTO_CALC_THRESHOLD}</span>
            </span>
          </div>

          <div className="flex gap-1">
            {Array.from({ length: AUTO_CALC_THRESHOLD }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-2 rounded-full transition-all duration-500"
                style={{
                  background: i < completedCount ? "#2557A7" : "#E5E7EB",
                  transitionDelay: `${i * 40}ms`,
                }}
              />
            ))}
          </div>

          <p className="text-[12px] text-[#6B7280] leading-snug">
            {isThresholdMet
              ? "All sections complete — score calculating shortly"
              : `Complete ${AUTO_CALC_THRESHOLD - completedCount} more section${AUTO_CALC_THRESHOLD - completedCount !== 1 ? "s" : ""} to unlock your ATS score`
            }
          </p>
        </div>
      )}

      {/* ── Quick wins ── */}
      {!showFullScore && previewScore.suggestions.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5">
            <Zap size={11} className="text-[#9CA3AF]" />
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Quick Wins</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {previewScore.suggestions.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="text-[12px] text-[#374151] px-3 py-2.5 rounded-xl leading-snug"
                style={{
                  background: s.severity === "warning" ? "#FFFBEB" : "#EFF6FF",
                  borderLeft: `3px solid ${s.severity === "warning" ? "#FCD34D" : "#93C5FD"}`,
                }}
              >
                {s.message}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
