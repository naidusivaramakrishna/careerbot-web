"use client";
import React, { useEffect, useRef, useState } from "react";
import { triggerScoreCalculation, getBuilderScore } from "@/api/resumeApi";
import MultiColorCircularScore from "./MultiColorCircularScore";
import { toast } from "sonner";
import { useScore } from "../../_context/ScoreContext";
import { useResume } from "../../_context/ResumeContext";
import { useSavedResumeSnapshot } from "../../_hooks/useSavedResumeSnapshot";
import { getAiScoreReadiness, joinLabels } from "../../_utils/aiScoreReadiness";
import { useResumeScorePreview } from "../../_hooks/useResumeScorePreview";
import { ArrowRight, CheckCircle2, ChevronRight, ChevronUp, Clock, Loader2, Pencil, RefreshCw, TrendingUp, Undo2, Zap } from "lucide-react";
import { getEnhancedCurrentScore } from "../../_utils/enhancedScore";
import {
  isBulkAutoFixSuggestion,
  suggestionProgressWeight,
  withoutPendingChildrenOfFixedBulkSuggestions,
} from "../../_utils/enhancedSuggestionGroups";
import { getScoreSectionAction } from "../../_utils/scoreSectionRouting";
import { SECTION_STATE_KEYS } from "../../_utils/sectionPayloadKeys";
import type { PreviewScoreSuggestion } from "../../_lib/computePreviewScore";
import { setBuilderFixUnits } from "../../_lib/builderFixHighlights";
import { collectTextUnits, unitKey } from "../../_utils/fixedTextHighlight";
import { SCORE_WEIGHTS, getScoreBand } from "../../_lib/previewScoreRules";

// After an edit makes the AI score stale, wait this long for the edits to settle before asking again
// (the backend skips the AI when nothing it scores has changed, and caps AI calls per user per day).
const STALE_RECALC_DELAY_MS = 8000;

// How long to wait for a score the server is working on (the worker's own time limit is 230 s)
const SCORE_POLL_INTERVAL_MS = 3000;
const SCORE_POLL_WINDOW_MS = 240_000;

// Section names the AI scores, in display order, with the label shown for each.
const AI_SECTION_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["personalInfo", "Contact Information"],
  ["headline", "Headline"],
  ["professionalSummary", "Professional Summary"],
  ["workExperience", "Work Experience"],
  ["internships", "Internships"],
  ["projects", "Projects"],
  ["education", "Education"],
  ["skills", "Skills"],
  ["certifications", "Certifications"],
  ["atsCompatibility", "ATS Compatibility"],
  ["careerProgression", "Career Progression"],
];

type AiSections = Record<string, { score: number; max_pts?: number }>;

// The backend's own names for what it still needs when it refuses to score (422 completeness).
const MISSING_FIELD_LABELS: Record<string, string> = {
  "personal_info.fullname": "your name",
  "personal_info.email": "your email",
  "professional_summary.summary": "a Professional Summary",
  skills: "Skills",
  education: "Education",
  work_experience: "Work Experience",
  work_experience_or_equivalent: "Work Experience or an Internship",
  projects: "Projects",
  certifications: "Certifications",
};

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
/** Red round count of the fixes still waiting in a section (white number). */
function PendingBadge({ count }: { count: number }) {
  return (
    <span
      role="img"
      aria-label={`${count} ${count === 1 ? "suggestion" : "suggestions"} pending`}
      className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white"
    >
      {count}
    </span>
  );
}

// Where each editor section keeps its data in the resume (used to put a section back when a fix is undone)
const SECTION_DATA_KEYS: Record<string, string> = {
  "Personal Info": "personalInfo",
  "Professional Summary": "professionalSummary",
  "Skills": "skills",
  ...SECTION_STATE_KEYS,
};

type ResolvedImprovement = { item: PreviewScoreSuggestion; dataKey?: string; snapshot?: unknown };

/**
 * What the user fixed, kept per resume outside the component: the Score tab is only mounted while it is the open
 * tab, so pressing Fix (which opens the Editor) unmounts it. Without this the fix would never get its green bar.
 */
const improvementLedger = new Map<string, { resolved: ResolvedImprovement[]; opened: Map<string, ResolvedImprovement> }>();
const ledgerFor = (resumeId: string) => {
  let ledger = improvementLedger.get(resumeId);
  if (!ledger) {
    ledger = { resolved: [], opened: new Map() };
    improvementLedger.set(resumeId, ledger);
  }
  return ledger;
};

const cloneData = (value: unknown): unknown => {
  try { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); } catch { return undefined; }
};

/**
 * Improvements for the live score: one collapsible group per section, with a red count of what is left to fix.
 * A suggestion is a card (title, why it matters, Fix). Once the user has fixed it in the editor and it is no
 * longer reported, it becomes a green "Fix applied" line with Undo, which puts the section back as it was
 * when Fix was pressed.
 */
export function ImprovementGroups({
  suggestions,
  onFixNow,
}: {
  suggestions: PreviewScoreSuggestion[];
  onFixNow?: (section: string, entryIndex?: number) => void;
}) {
  const { resumeData, setResumeData, resumeId } = useResume() as unknown as {
    resumeData?: Record<string, unknown>;
    resumeId?: string | null;
    setResumeData?: (updater: (previous: Record<string, unknown>) => Record<string, unknown>) => void;
  };
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const ledger = ledgerFor(resumeId ?? "current");
  const [resolved, setResolvedState] = useState<ResolvedImprovement[]>(ledger.resolved);
  const setResolved = (update: (previous: ResolvedImprovement[]) => ResolvedImprovement[]) => {
    ledger.resolved = update(ledger.resolved);
    setResolvedState(ledger.resolved);
  };
  // Suggestions the user pressed Fix on, with the section as it was at that moment
  const openedFixes = useRef<Map<string, ResolvedImprovement>>(ledger.opened);

  const currentIds = new Set(suggestions.map((suggestion) => suggestion.id));
  const currentKey = suggestions.map((suggestion) => suggestion.id).join("|");
  const resumeDataRef = useRef(resumeData);
  resumeDataRef.current = resumeData;
  useEffect(() => {
    const ids = new Set(currentKey ? currentKey.split("|") : []);
    const done: ResolvedImprovement[] = [];
    openedFixes.current.forEach((entry, id) => {
      if (!ids.has(id)) {
        done.push(entry);
        openedFixes.current.delete(id);
        // The text the fix added (what is in the section now and was not there when Fix was pressed): the
        // preview paints it green.
        if (entry.dataKey && entry.snapshot !== undefined) {
          const before = new Set(collectTextUnits({ [entry.dataKey]: entry.snapshot }).map(unitKey));
          const added = collectTextUnits({ [entry.dataKey]: resumeDataRef.current?.[entry.dataKey] })
            .filter((unit) => !before.has(unitKey(unit)));
          setBuilderFixUnits(id, added);
        }
      }
    });
    if (done.length > 0) {
      setResolved((previous) => [...previous.filter((entry) => !done.some((d) => d.item.id === entry.item.id)), ...done]);
    }
  }, [currentKey]);

  const fixed = resolved.filter((entry) => !currentIds.has(entry.item.id));
  const groups: Array<{ section: string; items: PreviewScoreSuggestion[]; fixed: ResolvedImprovement[] }> = [];
  const groupFor = (section: string) => {
    let group = groups.find((entry) => entry.section === section);
    if (!group) {
      group = { section, items: [], fixed: [] };
      groups.push(group);
    }
    return group;
  };
  for (const suggestion of suggestions) groupFor(suggestion.section).items.push(suggestion);
  for (const entry of fixed) groupFor(entry.item.section).fixed.push(entry);

  const handleFix = (item: PreviewScoreSuggestion, route: { editorSection: string; entryIndex?: number }) => {
    const dataKey = SECTION_DATA_KEYS[route.editorSection];
    openedFixes.current.set(item.id, {
      item,
      dataKey,
      snapshot: dataKey ? cloneData(resumeData?.[dataKey]) : undefined,
    });
    onFixNow?.(route.editorSection, route.entryIndex);
  };

  const handleUndo = (entry: ResolvedImprovement) => {
    if (entry.dataKey && setResumeData && entry.snapshot !== undefined) {
      const { dataKey, snapshot } = entry;
      setResumeData((previous) => ({ ...previous, [dataKey]: cloneData(snapshot) }));
    }
    setBuilderFixUnits(entry.item.id, null);
    setResolved((previous) => previous.filter((candidate) => candidate.item.id !== entry.item.id));
  };

  if (groups.length === 0) {
    return (
      <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-800">
        No improvements pending. Nice work!
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {groups.map(({ section, items, fixed: fixedItems }) => {
        const isOpen = expanded[section] === true;
        return (
          <section key={section} className="border-b border-[#eef1f6] pb-1 last:border-b-0">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setExpanded((current) => ({ ...current, [section]: !isOpen }))}
              className="flex w-full items-center gap-2 rounded-md py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557A7]"
            >
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-gray-900">{section}</span>
              {items.length > 0 ? (
                <PendingBadge count={items.length} />
              ) : (
                <CheckCircle2 size={20} className="shrink-0 text-emerald-600" aria-label="All suggestions addressed" />
              )}
              {isOpen
                ? <ChevronUp size={16} className="shrink-0 text-[#1d4fa8]" aria-hidden="true" />
                : <ChevronRight size={16} className="shrink-0 text-gray-800" aria-hidden="true" />}
            </button>
            {isOpen ? (
              <div className="flex flex-col gap-3 pb-2">
                {fixedItems.map((entry) => (
                  <div key={`fixed-${entry.item.id}`} className="overflow-hidden rounded-lg border border-[#cdeedb] bg-white">
                    <div className="flex items-center justify-between gap-3 bg-[#dff7e6] px-4 py-2.5 text-[13px] font-semibold text-[#17803d]">
                      <span className="min-w-0">Fix applied — your resume content has been updated.</span>
                      {entry.dataKey && setResumeData && entry.snapshot !== undefined ? (
                        <button
                          type="button"
                          aria-label={`Undo fix: ${entry.item.message}`}
                          onClick={() => handleUndo(entry)}
                          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-[#1d4fa8] transition hover:underline"
                        >
                          <Undo2 size={13} />Undo
                        </button>
                      ) : null}
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[13px] font-semibold leading-snug text-gray-900">{entry.item.message}</p>
                      <p className="mt-1 text-[13px] leading-snug text-gray-600">Fixed in your {entry.item.section} section.</p>
                    </div>
                  </div>
                ))}
                {items.map((item) => {
                  const route = getScoreSectionAction(item.section, item.message);
                  return (
                    <div key={item.id} className="rounded-lg border border-[#e3e9f2] bg-white p-4">
                      <p className="text-[14px] font-bold leading-snug text-gray-900">{item.message}</p>
                      <p className="mt-1 text-[13px] leading-snug text-gray-600">Fixing this improves your {item.section} score.</p>
                      {route && onFixNow ? (
                        <div className="mt-3 flex items-center justify-end">
                          <button
                            type="button"
                            aria-label={`Manually fix: ${item.message}`}
                            onClick={() => handleFix(item, route)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#2557a7] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#1a4585]"
                          >
                            <Pencil size={13} />Fix
                          </button>
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
  );
}

/**
 * What the Progress card says under its steps. It names the core section(s) still missing and says why they
 * matter, because extra sections (Awards, Hobbies, ...) do not count toward the AI score.
 */
function CoreSectionsMessage({
  readiness,
  onOpenSection,
  calculating = false,
}: {
  readiness: { eligible: boolean; items: Array<{ label: string; done: boolean }> };
  onOpenSection?: (section: string) => void;
  calculating?: boolean;
}) {
  const missing = readiness.items.filter((item) => !item.done).map((item) => item.label);
  const total = readiness.items.length;
  const sectionLink = (label: string) =>
    onOpenSection ? (
      <button
        key={label}
        type="button"
        onClick={() => onOpenSection(label)}
        className="font-semibold text-[#1d4fa8] underline underline-offset-2 hover:text-[#173f86]"
      >
        {label}
      </button>
    ) : (
      <strong key={label} className="font-semibold text-gray-900">{label}</strong>
    );

  if (readiness.eligible) {
    return (
      <p className="mt-2 text-xs text-gray-600">
        {`All ${total} core sections are complete. `}
        {calculating ? "Calculating your ATS score…" : "Your ATS score updates automatically as you edit."}
      </p>
    );
  }
  if (missing.length === 1) {
    return (
      <p className="mt-2 text-xs text-gray-600">
        One core section left: add {sectionLink(missing[0])} to unlock your ATS score.
      </p>
    );
  }
  return (
    <p className="mt-2 text-xs text-gray-600">
      {`Add the remaining ${missing.length} core sections to unlock your ATS score: `}
      {missing.map((label, index) => (
        <React.Fragment key={label}>
          {index > 0 ? (index === missing.length - 1 ? " and " : ", ") : null}
          {sectionLink(label)}
        </React.Fragment>
      ))}
      .
    </p>
  );
}

/**
 * Keeps a suggestion short: "Project 1 'Long project title': no company. Add where you built it." becomes the
 * entry ("Project 1") and the plain advice ("No company. Add where you built it."), so the title is not repeated.
 */
export function simplifySuggestion(message: string): { entry?: string; text: string } {
  const match = message.trim().match(/^((?:Project|Internship|Experience|Work Experience|Education|Certification)\s+\d+)\s*(?:'[^']*'|"[^"]*")?\s*:\s*(.+)$/i);
  const raw = match ? match[2] : message.trim();
  return { entry: match?.[1], text: raw.charAt(0).toUpperCase() + raw.slice(1) };
}

const sameText = (a?: string | null, b?: string | null) =>
  (a ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") === (b ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** What a suggestion would change: "Section title SUMMARY -> Professional Summary", or the proposed text. */
function SuggestionChange({ suggestion, section }: { suggestion: { message?: string; before_example?: string | null; after_example?: string | null }; section?: string }) {
  const before = suggestion.before_example?.trim();
  const after = suggestion.after_example?.trim();
  if (!after) return null;
  const short = after.length <= 48 && (!before || before.length <= 48);
  const isTitle = /\b(rename|title|heading)\b/i.test(suggestion.message ?? "");
  const noun = (section ?? "").trim().split(/\s+/).pop()?.toLowerCase() || "text";
  return (
    <div className="mt-3 rounded-lg border border-[#dde5f1] bg-[#f3f6fb] px-3 py-2.5 text-[14px] leading-snug">
      {short ? (
        <p className="text-gray-700">
          <span className="text-gray-500">{isTitle ? "Section title" : "Change"} </span>
          {before && <><s className="font-medium text-red-600">{before}</s><span aria-hidden="true"> → </span></>}
          <strong className="font-semibold text-[#1d4fa8]">{after}</strong>
        </p>
      ) : (
        <>
          <p className="text-[13px] font-semibold text-gray-500">Proposed {noun}</p>
          <p className="mt-0.5 text-gray-800">{after}</p>
        </>
      )}
    </div>
  );
}

function EnhancedScorePanel({ onFixNow }: { onFixNow?: (section: string, entryIndex?: number) => void }) {
  const { enhancedAtsScore, enhancedSuggestions, applyAutoFix, undoFix, resumeId: openResumeId } = useResume();
  const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null);
  const [undoingSuggestionId, setUndoingSuggestionId] = useState<string | null>(null);
  const [targetPickerSuggestionId, setTargetPickerSuggestionId] = useState<string | null>(null);
  // Sections intentionally begin collapsed so the report stays scannable and
  // the user can address one focused group of recommendations at a time.
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  // "Next best fix" scroll + spotlight timers: a new click or unmount cancels the old ones.
  const spotlightTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => spotlightTimersRef.current.forEach(clearTimeout), []);
  // Points a fixed card earned, and the most recent overall gain for the hero badge.
  const [pointsBySuggestion, setPointsBySuggestion] = useState<Record<string, number>>({});
  const [scoreGain, setScoreGain] = useState<{ amount: number; key: number } | null>(null);
  const currentScore = enhancedAtsScore ? getEnhancedCurrentScore(enhancedAtsScore) : 0;
  // null until the first real score is known: 0 -> 72 on load is not a +72 gain.
  const prevScoreRef = useRef<number | null>(enhancedAtsScore ? currentScore : null);
  const prevFixedRef = useRef<Set<string>>(
    new Set(enhancedSuggestions.filter((item) => item.status === "fixed").map((item) => item.id)),
  );
  // Fixed cards still waiting for the server-confirmed score that pays for them
  // (the status and the refreshed score can land in separate renders).
  const awaitingPointsRef = useRef<string[]>([]);

  useEffect(() => {
    const fixedNow = new Set(enhancedSuggestions.filter((item) => item.status === "fixed").map((item) => item.id));
    const newlyFixed = Array.from(fixedNow).filter((id) => !prevFixedRef.current.has(id));
    const undone = Array.from(prevFixedRef.current).filter((id) => !fixedNow.has(id));
    const delta = enhancedAtsScore && prevScoreRef.current !== null
      ? Math.round((currentScore - prevScoreRef.current) * 10) / 10
      : 0;
    awaitingPointsRef.current = [
      ...awaitingPointsRef.current.filter((id) => fixedNow.has(id)),
      ...newlyFixed,
    ];
    if (undone.length > 0) {
      setPointsBySuggestion((current) => {
        const next = { ...current };
        for (const id of undone) delete next[id];
        return next;
      });
    }
    if (delta > 0) {
      setScoreGain({ amount: delta, key: Date.now() });
      const payees = awaitingPointsRef.current;
      if (payees.length > 0) {
        const share = Math.round((delta / payees.length) * 10) / 10;
        setPointsBySuggestion((current) => {
          const next = { ...current };
          for (const id of payees) next[id] = share;
          return next;
        });
        awaitingPointsRef.current = [];
      }
    }
    prevFixedRef.current = fixedNow;
    prevScoreRef.current = enhancedAtsScore ? currentScore : null;
  }, [currentScore, enhancedSuggestions, enhancedAtsScore]);

  useEffect(() => {
    if (!scoreGain) return;
    const timer = setTimeout(() => setScoreGain(null), 4500);
    return () => clearTimeout(timer);
  }, [scoreGain]);

  if (!enhancedAtsScore) {
    return <div className="flex flex-col items-center justify-center gap-2 py-16"><p className="text-[13px] text-[#9CA3AF]">Score data not available.</p></div>;
  }

  const profile = enhancedAtsScore.profile;
  const breakdown = enhancedAtsScore.section_breakdown ?? {};
  const score = currentScore;
  const scoreColor = tier(score);
  // A confirmed "Add all at once" fix must replace its still-pending child
  // cards (e.g. the individual 'Docker'/'AWS' Auto Fix cards) -- otherwise
  // they kept showing as pending even after the bulk fix that covers them
  // was already applied.
  const visibleSuggestions = withoutPendingChildrenOfFixedBulkSuggestions(enhancedSuggestions);
  const trackedSuggestions = visibleSuggestions.filter((suggestion) => {
    if (suggestion.status !== "pending" && suggestion.status !== "fixed") return false;
    // A stale bulk action has no remaining server IDs after its concrete
    // recommendations are already fixed. This applies to every ATS section
    // (for example, Leadership bullets and Keywords). Hiding it prevents a
    // dead Auto Fix click and does not hide any pending individual finding.
    const isBulkBulletAction = isBulkAutoFixSuggestion(suggestion);
    if (!isBulkBulletAction || suggestion.status === "fixed") return true;
    const sectionToken = normalizedSectionToken(suggestion.section);
    const hasFixedPeer = visibleSuggestions.some((item) =>
      item.id !== suggestion.id
      && normalizedSectionToken(item.section) === sectionToken
      && item.status === "fixed",
    );
    const hasPendingIndividualAutoFix = visibleSuggestions.some((item) =>
      item.id !== suggestion.id
      && normalizedSectionToken(item.section) === sectionToken
      && item.status === "pending"
      && item.fix_type === "auto"
      && !isBulkAutoFixSuggestion(item),
    );
    return !hasFixedPeer || hasPendingIndividualAutoFix;
  });
  // Progress counts only what a section list below actually shows, so the
  // overall figure always equals the sum of the section figures. A suggestion
  // whose section is missing from the score breakdown is listed nowhere and
  // must not inflate the total.
  const listedSuggestions = trackedSuggestions.filter((suggestion) =>
    Object.keys(breakdown).some((name) => belongsToScoreSection(suggestion, name)),
  );
  // A fixed "Add all at once" card stands for every keyword it names (its
  // child cards are hidden), so it is weighted rather than counted as one.
  const countRecommendations = (items: typeof trackedSuggestions): number =>
    items.reduce((total, item) => total + suggestionProgressWeight(item, listedSuggestions), 0);
  const fixedSuggestionCount = countRecommendations(
    listedSuggestions.filter((suggestion) => suggestion.status === "fixed"),
  );
  const totalSuggestionCount = countRecommendations(listedSuggestions);
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

  // Heuristic for "highest impact": the weakest ATS section has the most
  // headroom, and bulk / auto fixes are applied in one click so they win ties.
  const nextBestFix = trackedSuggestions
    .filter((suggestion) => suggestion.status === "pending" && suggestion.fix_type !== "info")
    .flatMap((suggestion) => {
      const entry = Object.entries(breakdown).find(([name]) => belongsToScoreSection(suggestion, name));
      if (!entry) return [];
      const headroom = 100 - getSectionPercentage(entry[1]);
      const speedBonus = isBulkAutoFixSuggestion(suggestion) ? 15 : suggestion.fix_type === "auto" ? 10 : 0;
      return [{ suggestion, sectionName: entry[0], rank: headroom + speedBonus }];
    })
    .sort((a, b) => b.rank - a.rank)[0];

  const goToNextBestFix = () => {
    if (!nextBestFix) return;
    const { suggestion, sectionName } = nextBestFix;
    setExpandedSections((current) => ({ ...current, [sectionName]: true }));
    setSpotlightId(suggestion.id);
    const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    spotlightTimersRef.current.forEach(clearTimeout);
    spotlightTimersRef.current = [
      setTimeout(() => {
        document.getElementById(`ats-fix-${suggestion.id}`)?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "center",
        });
      }, 60),
      setTimeout(() => setSpotlightId(null), 2600),
    ];
  };

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

  const enhBand = getScoreBand(score);
  const enhBandLabel = { weak: "Needs Work", fair: "Fair Match", good: "Good Match", strong: "Strong Match" }[enhBand];
  const enhBandSubtitle = {
    weak: "Your resume needs more work to match industry standards.",
    fair: "Your resume is on track. A few improvements will help.",
    good: "Your resume matches well with industry standards.",
    strong: "Your resume matches very well with industry standards.",
  }[enhBand];
  const rowColor = (pct: number) => (pct >= 75 ? "#22A45D" : pct >= 40 ? "#E0A12A" : "#EF4444");
  const sectionScoreRows = Object.entries(breakdown).map(([name, sec]) => ({ name, pct: getSectionPercentage(sec) }));
  const enhCard = "rounded-xl border border-[#e3e9f2] bg-white p-4";

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {/* ── Overall Resume Score ── */}
      <div className={enhCard}>
        <h3 className="text-[15px] font-bold text-gray-900">Overall Resume Score</h3>
        <p className="mt-0.5 text-xs text-gray-600">{enhBandSubtitle}</p>
        <div className="mt-3 flex flex-col items-center gap-2">
          <div key={scoreGain?.key ?? "idle"} className={scoreGain ? "ats-ring-pulse rounded-full" : undefined}>
            <MultiColorCircularScore value={score} size={104} showMax caption={enhBandLabel} color="#1d4fa8" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {scoreGain && (
              <span key={scoreGain.key} role="status" className="ats-gain-pop inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <TrendingUp size={11} aria-hidden="true" />+{Number(scoreGain.amount.toFixed(1))}
              </span>
            )}
            {profile && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: scoreColor.light, color: scoreColor.text }}>{profile}</span>}
          </div>
        </div>
      </div>

      {/* ── Progress: the ATS recommendations addressed (an uploaded resume already has its ATS score from the scan) ── */}
      <div className={enhCard}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-bold text-gray-900">Progress</h3>
          <span className="text-base font-bold tabular-nums text-[#1d4fa8]">
            {fixedSuggestionCount}/{totalSuggestionCount}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="ATS recommendations addressed"
          aria-valuemin={0}
          aria-valuemax={totalSuggestionCount}
          aria-valuenow={fixedSuggestionCount}
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]"
        >
          <div
            className="h-full rounded-full bg-[#1d4fa8] transition-[width] duration-500"
            style={{ width: `${totalSuggestionCount > 0 ? Math.round((fixedSuggestionCount / totalSuggestionCount) * 100) : 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-600">
          {totalSuggestionCount === 0
            ? "No recommendations right now. Your ATS score is up to date."
            : fixedSuggestionCount === totalSuggestionCount
              ? "Every recommendation is addressed. Your ATS score is up to date."
              : `${totalSuggestionCount - fixedSuggestionCount} ${totalSuggestionCount - fixedSuggestionCount === 1 ? "recommendation" : "recommendations"} left. Each fix you confirm updates your ATS score.`}
        </p>
        {nextBestFix ? (
          <button
            type="button"
            onClick={goToNextBestFix}
            className="mt-3 flex w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-lg bg-[#2557A7] px-3 py-2 text-left text-white transition hover:bg-[#1a4585] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557A7] focus-visible:ring-offset-2"
          >
            <span className="min-w-0">
              <span className="block text-[10px] font-medium text-blue-100">Next best fix · {nextBestFix.sectionName}</span>
              <span className="block truncate text-[12px] font-semibold">{nextBestFix.suggestion.message}</span>
            </span>
            <ArrowRight size={14} className="shrink-0" aria-hidden="true" />
          </button>
        ) : totalSuggestionCount > 0 && fixedSuggestionCount === totalSuggestionCount ? (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-800">
            <CheckCircle2 size={14} aria-hidden="true" /> All recommendations addressed
          </p>
        ) : null}
      </div>

      {/* ── Score Breakdown (real section scores from the ATS report) ── */}
      {sectionScoreRows.length > 0 && (
        <div className={enhCard}>
          <h3 className="text-[15px] font-bold text-gray-900">Score Breakdown</h3>
          <p className="mt-0.5 text-xs text-gray-600">See how each section is performing.</p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {sectionScoreRows.map(({ name, pct }) => (
              <li key={name} className="flex items-center gap-3">
                <span className="w-[42%] shrink-0 truncate text-[13px] text-gray-900">{name}</span>
                <div
                  role="progressbar"
                  aria-label={`${name} section score`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  className="h-2 flex-1 overflow-hidden rounded-full bg-[#e5e8ee]"
                >
                  <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: rowColor(pct) }} />
                </div>
                <span className="w-10 text-right text-[13px] tabular-nums text-gray-900">{pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sectionEntries.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#e3e9f2] bg-white p-4">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Improvements</h3>
            <p className="mt-0.5 text-xs text-gray-600">Take these actions to improve your resume.</p>
          </div>
          <div className="flex flex-col gap-2">
            {sectionEntries.map(([name, sec]) => {
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
              // What is still left to fix in this section: it drops by itself as fixes are confirmed.
              const pendingCount = countRecommendations(pendingSectionSuggestions);
              const isExpanded = expandedSections[name] === true;

              return (
                <section key={name} className="border-b border-[#eef1f6] pb-1 last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`ats-section-${normalizedSectionToken(name)}`}
                    aria-label={`${isExpanded ? "Collapse" : "Expand"} ${name} ATS recommendations`}
                    onClick={() => setExpandedSections((current) => ({ ...current, [name]: !isExpanded }))}
                    className="flex w-full items-center gap-2 rounded-md py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2557A7]"
                  >
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-gray-900">{name}</span>
                    {pendingCount > 0 ? (
                      <PendingBadge count={pendingCount} />
                    ) : (
                      <CheckCircle2 size={20} className="shrink-0 text-emerald-600" aria-label="All suggestions addressed" />
                    )}
                    {isExpanded
                      ? <ChevronUp size={16} className="shrink-0 text-[#1d4fa8]" aria-hidden="true" />
                      : <ChevronRight size={16} className="shrink-0 text-gray-800" aria-hidden="true" />}
                  </button>
                  {isExpanded ? (
                    <div id={`ats-section-${normalizedSectionToken(name)}`} className="flex flex-col gap-3 pb-2">
                      <div className="flex items-center justify-between px-0.5 text-[10px]">
                        <span className="font-medium text-[#64748B]">Section ATS score</span>
                        <span className="font-bold tabular-nums" style={{ color: sectionScoreColor.arc }}>{percentage}%</span>
                      </div>
                      {onFixNow && getScoreSectionAction(name) ? (
                        <button
                          type="button"
                          onClick={() => onFixNow(getScoreSectionAction(name)!.editorSection)}
                          className="inline-flex w-fit items-center gap-1 rounded-md border border-[#1d4fa8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1d4fa8] transition hover:bg-[#eef3fa]"
                        >
                          <Pencil size={11} />Open {getScoreSectionAction(name)!.editorSection} in editor
                        </button>
                      ) : null}
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

                    const simple = simplifySuggestion(suggestion.message);
                    const detailBox = !isFixed ? <SuggestionChange suggestion={suggestion} section={suggestion.section} /> : null;
                    const fixButtonClass = "inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#2557a7] px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-[#1a4585] disabled:cursor-not-allowed disabled:opacity-60";

                    return (
                      <div key={suggestion.id} id={`ats-fix-${suggestion.id}`} className={`transition-shadow ${spotlightId === suggestion.id ? "rounded-lg ring-2 ring-[#2557A7] ring-offset-1" : ""}`}>
                        {isFixed ? (
                          /* A fix that was applied: one green line, with Undo when it can be undone */
                          <div className="overflow-hidden rounded-lg border border-[#cdeedb] bg-white">
                            {/* the bar: that a fix was applied, and Undo */}
                            <div className="flex items-center justify-between gap-3 bg-[#dff7e6] px-4 py-2.5 text-[13px] font-semibold text-[#17803d]">
                              <span className="min-w-0">Fix applied — your resume content has been updated.</span>
                              {canUndo ? (
                                <button type="button" aria-label={`Undo fix: ${suggestion.message}`} onClick={() => void handleUndo(suggestion.id)} disabled={undoingSuggestionId !== null} className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-[#1d4fa8] transition hover:underline disabled:cursor-not-allowed disabled:opacity-60">
                                  <Undo2 size={13} className={isUndoing ? "animate-pulse" : undefined} />{isUndoing ? "Undoing..." : "Undo"}
                                </button>
                              ) : onFixNow && route ? (
                                <button type="button" onClick={() => onFixNow(route.editorSection, route.entryIndex)} className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-[#1d4fa8] transition hover:underline">
                                  <Pencil size={12} />Edit
                                </button>
                              ) : null}
                            </div>
                            {/* what was fixed, and what it changed */}
                            <div className="px-4 py-3">
                              <p className="text-[13px] font-semibold leading-snug text-gray-900">{simple.entry ? `${simple.entry}: ` : ""}{simple.text}</p>
                              {suggestion.reason && !sameText(suggestion.reason, suggestion.message) && !sameText(suggestion.reason, simple.text) && (
                                <p className="mt-1 text-[13px] leading-snug text-gray-600">{suggestion.reason}</p>
                              )}
                              {(suggestion.before_example || suggestion.after_example) && (
                                <div className="mt-3 flex flex-col gap-2 text-[13px] leading-snug">
                                  {suggestion.before_example && (
                                    <div className="rounded-lg border border-[#dde5f1] bg-[#f3f6fb] px-3 py-2">
                                      <p className="text-[12px] font-semibold text-gray-500">Before</p>
                                      <p className="mt-0.5 text-gray-600 line-through decoration-gray-400">{suggestion.before_example}</p>
                                    </div>
                                  )}
                                  {suggestion.after_example && (
                                    <div className="rounded-lg border border-[#c8ecd6] bg-[#e6f7ec] px-3 py-2">
                                      <p className="text-[12px] font-semibold text-[#17803d]">After</p>
                                      <p className="mt-0.5 text-gray-900">{suggestion.after_example}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
                                Fixed via {isAuto ? "Auto Fix" : "Manual Fix"}
                                {pointsBySuggestion[suggestion.id] > 0 && (
                                  <span className="rounded-full bg-emerald-200 px-1.5 py-px text-[10px] font-bold text-emerald-900">+{Number(pointsBySuggestion[suggestion.id].toFixed(1))} pts</span>
                                )}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-[#e3e9f2] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                            {simple.entry && <p className="mb-0.5 text-[12px] font-semibold text-[#1d4fa8]">{simple.entry}</p>}
                            <p className="text-[14px] font-bold leading-snug text-gray-900">{simple.text}</p>
                            {suggestion.reason && !sameText(suggestion.reason, suggestion.message) && !sameText(suggestion.reason, simple.text) && (
                              <p className="mt-1 text-[13px] leading-snug text-gray-600">{suggestion.reason}</p>
                            )}
                            {detailBox}
                            <div className="mt-3 flex items-center justify-end">
                              {suggestion.fix_type === "info" ? (
                                // Explains why the score is lower; there is nothing to apply, so no Fix button.
                                <span className="text-[12px] font-medium text-[#64748B]">Review only</span>
                              ) : isAuto ? (
                                <button type="button" aria-label={`Auto fix: ${suggestion.message}`} onClick={() => void handleApplyAutoFix(suggestion.id)} disabled={applyingSuggestionId !== null || undoingSuggestionId !== null} className={fixButtonClass}>
                                  <Zap size={13} className={isApplying ? "animate-pulse" : undefined} />{isApplying ? "Fixing..." : "Fix"}
                                </button>
                              ) : canOpenEditor ? (
                                <button type="button" aria-label={`Manually fix: ${suggestion.message}`} onClick={() => openManualFix(suggestion.id, route!.editorSection, route!.entryIndex)} className={fixButtonClass}>
                                  <Pencil size={13} />Fix
                                </button>
                              ) : canChooseTarget ? (
                                <button type="button" aria-expanded={isTargetPickerOpen} onClick={() => setTargetPickerSuggestionId((current) => current === suggestion.id ? null : suggestion.id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#93B4E8] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#2557A7] transition hover:bg-[#EFF6FF]">
                                  <Pencil size={13} />Choose section
                                </button>
                              ) : null}
                            </div>
                            {canChooseTarget && isTargetPickerOpen ? (
                              <div className="mt-3 rounded-md border border-[#BFDBFE] bg-[#f4f8ff] p-2.5">
                                <p className="text-[12px] leading-snug text-[#475569]">The ATS service did not provide a source field. Choose the section you want to improve.</p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {["Work Experience", "Projects", "Internships"].map((target) => (
                                    <button key={target} type="button" onClick={() => { setTargetPickerSuggestionId(null); openManualFix(suggestion.id, target); }} className="rounded-full border border-[#BFDBFE] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#2557A7] hover:bg-[#EFF6FF]">{target}</button>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}
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
export default function ATSScorePanel({ onFixNow }: { onFixNow?: (section: string, entryIndex?: number) => void; compact?: boolean } = {}) {
  const { resumeData, resumeId: activeResumeId, resumeSource, isLoadingResume, resumeSavedVersion, enhancedDataVersion } = useResume();
  const { canonicalScore, canonicalStatus, lastCalculatedAt, setCanonicalScore, setCanonicalStatus } = useScore();

  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef     = useRef(true);
  const autoTriggeredRef = useRef(false);
  // Each AI section's score from the server, and what the server said is still missing
  const [aiSections, setAiSections] = useState<AiSections | null>(null);
  const [serverMissing, setServerMissing] = useState<string[]>([]);

  const previewScore  = useResumeScorePreview(resumeData as unknown as import("@/api/resumeApi").ResumeResponse);
  const isEnhanced    = resumeSource === "enhanced";
  // The server scores the SAVED resume, so readiness is judged on the saved content, not on drafts.
  const savedResumeData = useSavedResumeSnapshot(resumeData, isLoadingResume, resumeSavedVersion, enhancedDataVersion);
  const readiness = getAiScoreReadiness(savedResumeData);

  // Marked mounted here (not only in the calculate call): React re-runs effects on mount in development, and a
  // ref left false would silently drop every update from a calculation that is still running.
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Asks for the finished score until the server reports it. The AI scan can take over three minutes, so the
  // wait covers the worker's time limit instead of giving up early and showing a failure for a score that is
  // still on its way. Returns true once the score is stored.
  const pollForScore = async (resumeId: string): Promise<boolean> => {
    const deadline = Date.now() + SCORE_POLL_WINDOW_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, SCORE_POLL_INTERVAL_MS));
      if (!isMountedRef.current) return false;
      try {
        const result = await getBuilderScore(resumeId);
        // An out-of-date score is still returned while the new one is being worked out, so a
        // score above 0 is not enough: wait until the server reports it completed.
        const finished = result.status ? result.status === "completed" : result.score > 0;
        if (result.score > 0 && finished) {
          if (isMountedRef.current) {
            setCanonicalScore(result.score, new Date().toLocaleString());
            setAiSections(result.section_breakdown ?? null);
          }
          return true;
        }
      } catch { /* continue polling */ }
    }
    return false;
  };

  const handleCalculateScore = async () => {
    const resumeId = activeResumeId ?? localStorage.getItem("current_resume_id");
    if (!resumeId || resumeId === "null" || resumeId === "undefined") {
      toast.error("No resume found. Please create a resume first.");
      return;
    }
    try {
      isMountedRef.current = true;
      setIsCalculating(true);
      setError(null);
      setCanonicalStatus("calculating");
      setServerMissing([]);
      await triggerScoreCalculation(resumeId);

      if (await pollForScore(resumeId)) {
        if (isMountedRef.current) toast.success("ATS score calculated!");
        return;
      }
      if (!isMountedRef.current) return;

      if (isMountedRef.current) {
        setError("Score calculation timed out. Please try again.");
        setCanonicalStatus("error");
        toast.error("Score calculation timed out.");
      }
    } catch (err) {
      // 422 here means one specific thing: the score service validated the
      // resume and refused to score it yet (not enough content). It is an
      // expected response, not a failure, so it does not become a visible
      // error -- the live client-side preview is still a valid number. Every
      // other status keeps the error pill. Mount-guarded like the branch
      // below: this runs after an await and the panel may be gone.
      const failure = err as { response?: { status?: number; data?: { completeness?: { missing_required_fields?: string[] } } } };
      if (failure.response?.status === 422) {
        if (isMountedRef.current) {
          // Say what the server is still waiting for instead of failing silently.
          setServerMissing(failure.response.data?.completeness?.missing_required_fields ?? []);
          setCanonicalStatus("not_calculated");
        }
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed to calculate score";
      if (isMountedRef.current) { setError(msg); setCanonicalStatus("error"); toast.error(msg); }
    } finally {
      if (isMountedRef.current) setIsCalculating(false);
    }
  };

  // Coming back to this tab: a calculation another visit started may still be running (carry on waiting for
  // it), and a failure left over from an earlier visit is cleared so the score is asked for again.
  const recoveredOnMountRef = useRef(false);
  useEffect(() => {
    if (isEnhanced || recoveredOnMountRef.current) return;
    recoveredOnMountRef.current = true;
    const resumeId = activeResumeId ?? localStorage.getItem("current_resume_id");
    if (!resumeId || resumeId === "null" || resumeId === "undefined") return;
    if (canonicalStatus === "error") {
      setCanonicalStatus(canonicalScore !== null ? "stale" : "not_calculated");
      return;
    }
    if (canonicalStatus === "calculating") {
      void (async () => {
        setIsCalculating(true);
        try {
          if (await pollForScore(resumeId)) {
            if (isMountedRef.current) toast.success("ATS score calculated!");
          } else if (isMountedRef.current) {
            setCanonicalStatus(canonicalScore !== null ? "stale" : "not_calculated");
          }
        } finally {
          if (isMountedRef.current) setIsCalculating(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Until the 7 core sections are filled in, only the live preview score is shown. Once they
  // are, the AI score is requested automatically and replaces it.
  useEffect(() => {
    if (
      !isEnhanced &&
      readiness.eligible &&
      canonicalStatus === "not_calculated" &&
      !autoTriggeredRef.current &&
      !isCalculating
    ) {
      autoTriggeredRef.current = true;
      handleCalculateScore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readiness.eligible, canonicalStatus, isEnhanced]);

  // After that, an edit (a new or changed section) makes the AI score stale: ask again once the
  // edits settle, so every section's score follows the resume.
  useEffect(() => {
    if (isEnhanced || !readiness.eligible || canonicalStatus !== "stale" || isCalculating) return;
    const timer = setTimeout(() => { void handleCalculateScore(); }, STALE_RECALC_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnhanced, readiness.eligible, canonicalStatus, isCalculating, savedResumeData]);

  // A score that was calculated earlier (page reload): fetch its per-section scores once.
  useEffect(() => {
    if (isEnhanced || aiSections !== null) return;
    if (canonicalStatus !== "ready" && canonicalStatus !== "stale") return;
    const resumeId = activeResumeId ?? localStorage.getItem("current_resume_id");
    if (!resumeId || resumeId === "null" || resumeId === "undefined") return;
    let cancelled = false;
    getBuilderScore(resumeId)
      .then((result) => { if (!cancelled && result.section_breakdown) setAiSections(result.section_breakdown); })
      .catch(() => undefined);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnhanced, canonicalStatus, activeResumeId]);

  if (isEnhanced) return <EnhancedScorePanel onFixNow={onFixNow} />;

  // PreviewPanel marks a canonical score stale when resume data changes, even
  // while this tab is unmounted. Keep showing that server score here with the
  // stale pill as its recalculate signal; use the live preview only when no
  // server score exists.
  const showFullScore  = canonicalScore !== null
    && (canonicalStatus === "ready" || canonicalStatus === "stale");
  const isCalcRunning  = isCalculating || canonicalStatus === "calculating";
  const displayScore   = showFullScore ? (canonicalScore ?? previewScore.score) : previewScore.score;
  // What the server itself says is missing (when it refused) takes priority over the local guess.
  const serverMissingLabels = serverMissing.map((key) => MISSING_FIELD_LABELS[key] ?? key);
  const tc = tier(displayScore);

  const band = getScoreBand(displayScore);
  const bandLabel = { weak: "Needs Work", fair: "Fair Match", good: "Good Match", strong: "Strong Match" }[band];
  const bandSubtitle = {
    weak: "Your resume needs more content to match industry standards.",
    fair: "Your resume is on track. A few improvements will help.",
    good: "Your resume matches well with industry standards.",
    strong: "Your resume matches very well with industry standards.",
  }[band];
  const barColor = (pct: number) => (pct >= 75 ? "#22A45D" : pct >= 40 ? "#E0A12A" : "#EF4444");

  // Real per-section percentages from the live score breakdown (points earned / points possible).
  const aiRows = showFullScore && aiSections
    ? AI_SECTION_LABELS
        .filter(([key]) => aiSections[key] && typeof aiSections[key].score === "number")
        .map(([key, label]) => ({ label, pct: Math.max(0, Math.min(100, Math.round(aiSections[key].score))) }))
    : [];

  const previewRows = ([
    ["Contact Information", "contact"],
    ["Professional Summary", "summary"],
    ["Work Experience", "evidence"],
    ["Education", "education"],
    ["Skills", "skills"],
    ["Certifications", "certifications"],
    ["Impact & Metrics", "metrics"],
    ["Achievements", "achievements"],
  ] as const).map(([label, key]) => ({
    label,
    pct: Math.round(((previewScore.breakdown?.[key] ?? 0) / SCORE_WEIGHTS[key]) * 100),
  }));

  const breakdownRows = aiRows.length > 0 ? aiRows : previewRows;

  const cardClass = "rounded-xl border border-[#e3e9f2] bg-white p-4";

  return (
    <div className="flex min-w-0 flex-col gap-3">

      {/* ── Overall Resume Score ── */}
      <div className={cardClass}>
        <h3 className="text-[15px] font-bold text-gray-900">Overall Resume Score</h3>
        <p className="mt-0.5 text-xs text-gray-600">{bandSubtitle}</p>

        <div className="mt-3 flex flex-col items-center gap-3">
          <div className={isCalcRunning ? "animate-pulse" : undefined}>
            <MultiColorCircularScore value={displayScore} size={104} showMax caption={bandLabel} color="#1d4fa8" />
          </div>

          {isCalcRunning ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Loader2 size={12} className="text-[#2557A7] animate-spin" />
                <span className="text-[13px] font-semibold text-[#111827]">Calculating…</span>
              </div>
              <span className="text-[11px] text-[#9CA3AF]">This takes up to 20 seconds</span>
            </div>
          ) : !showFullScore ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-[#374151]">Preview Score</span>
              <span
                className="text-[10px] font-semibold px-1.5 py-px rounded-full capitalize"
                style={{ background: tc.light, color: tc.text }}
              >
                {previewScore.band}
              </span>
              <span className="text-[11px] text-[#9CA3AF]">· Updates as you edit</span>
            </div>
          ) : null}

          {/* Stale pill */}
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

          {/* Error pill */}
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

      {/* ── Progress: the core sections that unlock the ATS score, one step each ── */}
      <div className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-bold text-gray-900">Progress</h3>
          <span className="text-base font-bold tabular-nums text-[#1d4fa8]">
            {readiness.doneCount}/{readiness.items.length}
          </span>
        </div>
        <ol
          aria-label={`${readiness.doneCount} of ${readiness.items.length} core sections complete`}
          className="mt-3 flex gap-2"
        >
          {/* Filled from the left: the number of completed sections, not which sections they are */}
          {readiness.items.map((item, i) => (
            <li
              key={item.label}
              title={`${readiness.doneCount} of ${readiness.items.length} sections complete`}
              aria-label={i < readiness.doneCount ? "complete" : "not complete"}
              className="h-2.5 flex-1 rounded-full transition-all duration-500"
              style={{ background: i < readiness.doneCount ? "#1d4fa8" : "#E5E7EB", transitionDelay: `${i * 40}ms` }}
            />
          ))}
        </ol>
        <CoreSectionsMessage readiness={readiness} onOpenSection={onFixNow ? (section) => onFixNow(section) : undefined} calculating={isCalcRunning} />
        {serverMissingLabels.length > 0 && (
          <p className="mt-1 text-xs text-gray-600">Still needed: {joinLabels(serverMissingLabels)}.</p>
        )}
        {showFullScore && lastCalculatedAt && (
          <span className="mt-2 flex items-center gap-1 text-[11px] text-[#9CA3AF]">
            <Clock size={10} />
            {lastCalculatedAt}
          </span>
        )}
      </div>

      {/* ── Score Breakdown ── */}
      <div className={cardClass}>
        <h3 className="text-[15px] font-bold text-gray-900">Score Breakdown</h3>
        <p className="mt-0.5 text-xs text-gray-600">See how each section is performing.</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {breakdownRows.map(({ label, pct }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="w-[42%] shrink-0 truncate text-[13px] text-gray-900">{label}</span>
              <div
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                className="h-2 flex-1 overflow-hidden rounded-full bg-[#e5e8ee]"
              >
                <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: barColor(pct) }} />
              </div>
              <span className="w-10 text-right text-[13px] tabular-nums text-gray-900">{pct}%</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Improvements ── */}
      <div className={cardClass}>
        <h3 className="text-[15px] font-bold text-gray-900">Improvements</h3>
        <p className="mt-0.5 text-xs text-gray-600">Take these actions to improve your resume.</p>
        <ImprovementGroups suggestions={previewScore.suggestions} onFixNow={onFixNow} />
      </div>

    </div>
  );
}
