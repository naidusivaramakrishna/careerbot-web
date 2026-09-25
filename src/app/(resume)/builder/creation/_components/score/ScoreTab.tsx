"use client";
import React, { useEffect, useRef, useState } from "react";
import { triggerScoreCalculation, getBuilderScore } from "@/api/resumeApi";
import MultiColorCircularScore from "./MultiColorCircularScore";
import { toast } from "sonner";
import { useScore } from "../../_context/ScoreContext";
import { useResume } from "../../_context/ResumeContext";
import { useResumeScorePreview } from "../../_hooks/useResumeScorePreview";
import { CheckCircle2, ChevronDown, Clock, Loader2, Pencil, RefreshCw, Undo2, Zap } from "lucide-react";
import { getEnhancedCurrentScore } from "../../_utils/enhancedScore";
import { getScoreSectionAction } from "../../_utils/scoreSectionRouting";

const AUTO_CALC_THRESHOLD = 7;

// Semantic tier palette — independent from brand accent
function tier(score: number) {
  if (score >= 70) return { arc: "#10B981", light: "#ECFDF5", muted: "#D1FAE5", text: "#065F46", dot: "bg-emerald-400" };
  if (score >= 40) return { arc: "#F59E0B", light: "#FFFBEB", muted: "#FEF3C7", text: "#92400E", dot: "bg-amber-400"   };
  return               { arc: "#EF4444", light: "#FEF2F2", muted: "#FEE2E2", text: "#991B1B", dot: "bg-red-400"     };
}

// Extract 1-based entry number from messages like "Project 1: ...", "Education entry 2: ..."
function parseEntryIndex(message: string): number | undefined {
  const match = message.match(/\b(\d+)\s*:/);
  if (match) {
    const n = parseInt(match[1], 10);
    return n >= 1 ? n - 1 : undefined;
  }
  return undefined;
}

// ─── Enhanced resume panel ────────────────────────────────────────────────────
function normalizedSectionToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * A card belongs only to the exact backend ATS section that named it. We do
 * not infer ownership from editor routing: that can make a Summary finding
 * appear under Headline or a diagnostic appear under an unrelated section.
 */
function belongsToScoreSection(
  suggestion: { section: string },
  sectionName: string,
): boolean {
  return normalizedSectionToken(suggestion.section) === normalizedSectionToken(sectionName);
}
function getSectionPercentage(section: unknown): number {
  const score = section as { percentage?: number; score_pct?: number; score?: number; weighted_pts?: number; max_pts?: number };
  const raw = score.percentage
    ?? score.score_pct
    ?? score.score
    ?? (typeof score.weighted_pts === "number" && typeof score.max_pts === "number" && score.max_pts > 0
      ? (score.weighted_pts / score.max_pts) * 100
      : 0);
  return Math.max(0, Math.min(100, Math.round(raw)));
}
function EnhancedScorePanel({ onFixNow }: { onFixNow?: (section: string, entryIndex?: number) => void }) {
  const { enhancedAtsScore, enhancedSuggestions, applyAutoFix, undoFix } = useResume();
  const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null);
  const [undoingSuggestionId, setUndoingSuggestionId] = useState<string | null>(null);
  const [targetPickerSuggestionId, setTargetPickerSuggestionId] = useState<string | null>(null);
  // Sections intentionally begin collapsed so the report stays scannable and
  // the user can address one focused group of recommendations at a time.
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  if (!enhancedAtsScore) {
    return <div className="flex flex-col items-center justify-center gap-2 py-16"><p className="text-[13px] text-[#9CA3AF]">Score data not available.</p></div>;
  }

  const profile = enhancedAtsScore.profile;
  const breakdown = enhancedAtsScore.section_breakdown ?? {};
  const score = getEnhancedCurrentScore(enhancedAtsScore);
  const scoreColor = tier(score);
  const trackedSuggestions = enhancedSuggestions.filter((suggestion) => {
    if (suggestion.status !== "pending" && suggestion.status !== "fixed") return false;
    // A stale bulk action has no remaining server IDs after its concrete
    // recommendations are already fixed. This applies to every ATS section
    // (for example, Leadership bullets and Keywords). Hiding it prevents a
    // dead Auto Fix click and does not hide any pending individual finding.
    const isBulkBulletAction = suggestion.fix_type === "auto"
      && /^(?:apply|add)\s+all(?:\s+at\s+once)?\b/i.test(suggestion.message);
    if (!isBulkBulletAction) return true;
    const sectionToken = normalizedSectionToken(suggestion.section);
    const hasFixedPeer = enhancedSuggestions.some((item) =>
      item.id !== suggestion.id
      && normalizedSectionToken(item.section) === sectionToken
      && item.status === "fixed",
    );
    const hasPendingIndividualAutoFix = enhancedSuggestions.some((item) =>
      item.id !== suggestion.id
      && normalizedSectionToken(item.section) === sectionToken
      && item.status === "pending"
      && item.fix_type === "auto"
      && !/^(?:apply|add)\s+all(?:\s+at\s+once)?\b/i.test(item.message),
    );
    return !hasFixedPeer || hasPendingIndividualAutoFix;
  });
  const fixedSuggestionCount = trackedSuggestions.filter(
    (suggestion) => suggestion.status === "fixed",
  ).length;
  const overallEnhancementProgress = trackedSuggestions.length > 0
    ? Math.round((fixedSuggestionCount / trackedSuggestions.length) * 100)
    : 100;
  // Only server-provided, actionable suggestions become enhancement sections.
  // Pending items rank before resolved work; ties use the backend's lower ATS
  // section score first, so the most urgent work is easiest to find.
  const sectionEntries = Object.entries(breakdown)
    .filter(([name]) => trackedSuggestions.some((suggestion) => belongsToScoreSection(suggestion, name)))
    .sort(([nameA, sectionA], [nameB, sectionB]) => {
      const pendingA = trackedSuggestions.filter((suggestion) =>
        suggestion.status === "pending" && belongsToScoreSection(suggestion, nameA),
      ).length;
      const pendingB = trackedSuggestions.filter((suggestion) =>
        suggestion.status === "pending" && belongsToScoreSection(suggestion, nameB),
      ).length;
      if (pendingA !== pendingB) return pendingB - pendingA;
      const scoreDifference = getSectionPercentage(sectionA) - getSectionPercentage(sectionB);
      return scoreDifference || nameA.localeCompare(nameB);
    });

const openManualFix = (suggestionId: string, section: string, entryIndex?: number) => {
    // The chosen issue travels with the editor navigation. This lets the save
    // flow ask the backend to validate this exact semantic/manual change.
    window.dispatchEvent(new CustomEvent("careerbot:ats-manual-fix-target", {
      detail: { suggestionId, ownerSection: section },
    }));
    onFixNow?.(section, entryIndex);
  };

  const handleApplyAutoFix = async (suggestionId: string) => {
    setApplyingSuggestionId(suggestionId);
    try {
      const result = await applyAutoFix(suggestionId);
      toast.success(
        result.scoreConfirmed
          ? `Fix applied. ATS score updated from ${result.beforeScore} to ${result.afterScore}.`
          : "Fix applied. Your updated ATS score will appear when the server refreshes it.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to apply this fix.");
    } finally {
      setApplyingSuggestionId(null);
    }
  };

  const handleUndo = async (suggestionId: string) => {
    setUndoingSuggestionId(suggestionId);
    try {
      await undoFix(suggestionId);
      toast.success("Fix undone. Your ATS score has been refreshed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to undo this fix.");
    } finally {
      setUndoingSuggestionId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl border border-[#EAECF0] bg-white p-5" style={{ borderTop: `3px solid ${scoreColor.arc}` }}>
        <div className="flex items-center gap-4">
          <MultiColorCircularScore value={score} precision={2} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] font-semibold text-[#111827]">ATS Score</span>
              {profile && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: scoreColor.light, color: scoreColor.text }}>{profile}</span>}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
              Your report identifies the changes; each recommendation below updates this score after it is confirmed.
            </p>
          </div>
        </div>
        <div className="mt-4 border-t border-[#F1F5F9] pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-semibold text-[#334155]">Enhancement progress</span>
            <span className="text-[11px] font-bold tabular-nums text-[#0F172A]">
              {fixedSuggestionCount} of {trackedSuggestions.length} addressed
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]" aria-label={`${overallEnhancementProgress}% of ATS recommendations addressed`}>
            <div className="h-full rounded-full bg-[#2557A7] transition-all duration-700" style={{ width: `${overallEnhancementProgress}%` }} />
          </div>
        </div>
      </div>

      {sectionEntries.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#EAECF0] bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Section Breakdown</p>
          <div className="flex flex-col gap-4">
            {sectionEntries.map(([name, sec], sectionIndex) => {
              const percentage = getSectionPercentage(sec);
              const sectionScoreColor = tier(percentage);
              const pendingSectionSuggestions = trackedSuggestions.filter((suggestion) =>
                suggestion.status === "pending" && belongsToScoreSection(suggestion, name),
              );
              // Fixed cards remain in their original backend section so Undo stays local.
              const fixedSectionSuggestions = trackedSuggestions.filter((suggestion) =>
                suggestion.status === "fixed" && belongsToScoreSection(suggestion, name),
              );
              const sectionSuggestions = [...pendingSectionSuggestions, ...fixedSectionSuggestions];
              const resolvedCount = fixedSectionSuggestions.length;
              const issueCount = sectionSuggestions.length;
              // ATS quality and enhancement progress intentionally remain separate:
              // the former comes from the scoring engine, while the latter is
              // derived solely from the confirmed status of this section's issues.
              const enhancementProgress = issueCount > 0
                ? Math.round((resolvedCount / issueCount) * 100)
                : 100;
              // Recommendation progress and ATS quality are separate signals.
              // A section stays amber until every confirmed finding is fixed,
              // then turns green even if its ATS score refreshes separately.
              const progressColor = enhancementProgress === 100
                ? { track: "#D1FAE5", fill: "#10B981" }
                : { track: "#FEF3C7", fill: "#F59E0B" };
              const isExpanded = expandedSections[name] === true;

              return (
                <section key={name} className={`flex flex-col gap-2 ${sectionIndex > 0 ? "border-t border-[#EAECF0] pt-4" : ""}`}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`ats-section-${normalizedSectionToken(name)}`}
                    aria-label={`${isExpanded ? "Collapse" : "Expand"} ${name} ATS recommendations`}
                    onClick={() => setExpandedSections((current) => ({ ...current, [name]: !isExpanded }))}
                    className="-mx-1 flex w-[calc(100%+0.5rem)] items-baseline justify-between gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557A7] focus-visible:ring-offset-1"
                  >
                    <div className="min-w-0">
                      <span className="truncate text-[12px] font-semibold text-[#374151]">{name}</span>
                      {issueCount > 0 ? (
                        <span className="ml-1.5 text-[10px] text-[#94A3B8]">{resolvedCount}/{issueCount} addressed</span>
                      ) : (
                        <span className="ml-1.5 text-[10px] font-medium text-emerald-600">All recommendations addressed</span>
                      )}
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <ChevronDown size={14} className={`text-[#64748B] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                    </span>
                  </button>
                  <div className="flex items-center gap-2" aria-label={`${name}: ${enhancementProgress}% of recommendations addressed`}>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: progressColor.track }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${enhancementProgress}%`, background: progressColor.fill }} />
                    </div>
                    <span className="w-8 text-right text-[10px] font-semibold tabular-nums text-[#64748B]">{enhancementProgress}%</span>
                  </div>

                  {isExpanded ? (
                    <div id={`ats-section-${normalizedSectionToken(name)}`} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between px-0.5 text-[10px]">
                        <span className="font-medium text-[#64748B]">Section ATS score</span>
                        <span className="font-bold tabular-nums" style={{ color: sectionScoreColor.arc }}>{percentage}%</span>
                      </div>
                      {sectionSuggestions.map((suggestion) => {
                    const isFixed = suggestion.status === "fixed";
                    const isApplying = applyingSuggestionId === suggestion.id;
                    const isUndoing = undoingSuggestionId === suggestion.id;
                    const isAuto = suggestion.fix_type === "auto";
                    const route = getScoreSectionAction(suggestion.section, suggestion.message);
                    const canUndo = isFixed && suggestion.undoAvailable === true;
                    const canOpenEditor = !isFixed && !isAuto && suggestion.fix_type !== "info" && Boolean(onFixNow && route);
                    const canChooseTarget = !isFixed && !isAuto && suggestion.fix_type !== "info" && !route && Boolean(onFixNow);
                    const isTargetPickerOpen = targetPickerSuggestionId === suggestion.id;

                    return (
                      <div key={suggestion.id} className={`rounded-md px-2.5 py-2 ${isFixed ? "bg-emerald-50" : "bg-amber-50"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-start gap-1.5">
                            {isFixed && <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-600" />}
                            <div className="min-w-0">
                              <p className={`text-[10px] leading-snug ${isFixed ? "text-emerald-900" : "text-[#B45309]"}`}>{suggestion.message}</p>
                              {isFixed && <span className="mt-0.5 block text-[9px] font-semibold text-emerald-700">Fixed via {isAuto ? "Auto Fix" : "Manual Fix"}</span>}
                            </div>
                          </div>
                          {isFixed ? (
                            canUndo ? <button type="button" aria-label={`Undo fix: ${suggestion.message}`} onClick={() => void handleUndo(suggestion.id)} disabled={undoingSuggestionId !== null} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"><Undo2 size={11} className={isUndoing ? "animate-pulse" : undefined} />{isUndoing ? "Undoing..." : "Undo"}</button>
                              : onFixNow && route ? <button type="button" onClick={() => onFixNow(route.editorSection, route.entryIndex)} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-800 transition hover:bg-emerald-100"><Pencil size={11} />Edit</button>
                                : <span className="shrink-0 text-[10px] font-medium text-emerald-700">Saved</span>
                          ) : isAuto ? (
                            <button type="button" aria-label={`Auto fix: ${suggestion.message}`} onClick={() => void handleApplyAutoFix(suggestion.id)} disabled={applyingSuggestionId !== null || undoingSuggestionId !== null} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#2557a7] px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-[#1a4585] disabled:cursor-not-allowed disabled:opacity-60"><Zap size={11} className={isApplying ? "animate-pulse" : undefined} />{isApplying ? "Fixing..." : "Auto Fix"}</button>
                          ) : canOpenEditor ? (
                            <button type="button" aria-label={`Manually fix: ${suggestion.message}`} onClick={() => openManualFix(suggestion.id, route!.editorSection, route!.entryIndex)} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#2557a7] px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-[#1a4585]"><Pencil size={11} />Manual Fix</button>
                          ) : canChooseTarget ? (
                            <button type="button" aria-expanded={isTargetPickerOpen} onClick={() => setTargetPickerSuggestionId((current) => current === suggestion.id ? null : suggestion.id)} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#93B4E8] bg-white px-2 py-1 text-[10px] font-semibold text-[#2557A7] transition hover:bg-[#EFF6FF]"><Pencil size={11} />Choose section</button>
                          ) : suggestion.fix_type === "info" ? (
                            <span className="shrink-0 text-[10px] font-medium text-[#64748B]">Review only</span>
                          ) : null}
                        </div>
                        {canChooseTarget && isTargetPickerOpen ? (
                          <div className="mt-2 rounded-md border border-[#BFDBFE] bg-white/80 p-2">
                            <p className="text-[10px] leading-snug text-[#475569]">The ATS service did not provide a source field. Choose the section you want to improve.</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {["Work Experience", "Projects", "Internships"].map((target) => (
                                <button key={target} type="button" onClick={() => { setTargetPickerSuggestionId(null); openManualFix(suggestion.id, target); }} className="rounded-full border border-[#BFDBFE] bg-white px-2 py-1 text-[10px] font-semibold text-[#2557A7] hover:bg-[#EFF6FF]">{target}</button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
export default function ATSScorePanel({ onFixNow, compact = false }: { onFixNow?: (section: string, entryIndex?: number) => void; compact?: boolean } = {}) {
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

      for (let attempt = 1; attempt <= 30; attempt++) {
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

  if (isEnhanced) return <EnhancedScorePanel onFixNow={onFixNow} compact={compact} />;

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
