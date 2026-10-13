"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, RefreshCw, XCircle, X } from "lucide-react";
import ResumeSide from "@/app/(resume)/builder/creation/_components/resumeSidebar/ResumeSide";
import PreviewPanel from "@/app/(resume)/builder/creation/_components/PreviewPanel";
import TemplatesTab from "@/app/(resume)/builder/creation/_components/templates/TemplatesTab";

import { ResumeProvider, useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { getEnhancedCurrentScore } from "@/app/(resume)/builder/creation/_utils/enhancedScore";
import { ScoreProvider } from "@/app/(resume)/builder/creation/_context/ScoreContext";
import { enhanceResume, getEnhancedResume } from "@/api/enhancerApi";
import { verifyFreshEnhancement } from "@/utils/verifyEnhancedRefresh";
import PriorFixesDialog from "@/components/common/PriorFixesDialog";
import { clearStoredFixedSuggestions, clearStoredFixedText } from "@/app/(resume)/builder/creation/_utils/fixedSuggestionsStorage";
import { cacheBuilderResume, readEnhancedResumeIds, rememberEnhancedResumeId, writeReportCache } from "./atsReportCache";
import { readAtsAnalysis } from "@/api/resumeatsapi";
import type { EnhancedResumeHistoryItem } from "@/types/api.types";


/* ─── TYPES ───────────────────────────────────────────── */
interface BreakdownItem {
  score?: number;
  raw_score?: number;
  max?: number;
  max_score?: number;
  max_raw_score?: number;
  deductions?: unknown[];
  percentage?: number;
  Percentage?: number;
  details?: Record<string, unknown>;
}

interface ResumeScoreData {
  TotalScore: number;
  FinalWeightedScore: number;
  MaxScore: number;
  Breakdown: Record<string, unknown>;
  Fresher: boolean;
  Domain: string;
  Profile: string;
  EstimatedScore?: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/* ─── HELPERS ─────────────────────────────────────────── */
function transformData(raw: Record<string, unknown>): ResumeScoreData {
  // Scan and enhancer endpoints wrap the same score differently. Read the
  // returned enhancer snapshot as well, so a successful fix never renders an
  // old score from browser storage.
  const enhancerState = raw?.enhancer_state as Record<string, unknown> | undefined;
  const atsScore = (raw?.ats_score || raw?.ats_breakdown || enhancerState?.ats_breakdown) as Record<string, unknown> | undefined;

  const sectionBreakdown = (
    atsScore?.SectionBreakdown ||
    atsScore?.section_breakdown ||
    {}
  ) as Record<string, unknown>;

  const numericBreakdown = (
    atsScore?.breakdown ||
    atsScore?.Breakdown ||
    raw?.breakdown ||
    {}
  ) as Record<string, unknown>;

  // Build section map from ats_display.sections (new API format fallback)
  const atsDisplayRaw = (raw?.ats_display || enhancerState?.ats_display) as {
    score?: number;
    sections?: Array<{
      name: string;
      score_pct: number;
      weighted_pts: number;
      max_pts: number;
      is_not_applicable: boolean;
      deductions: unknown[];
    }>;
    action_items?: Record<string, Array<{ id: string; after_example: string; fix_type?: string; impact?: string; section?: string }>>;
  } | undefined;

  const atsDisplaySections: Record<string, BreakdownItem> = {};
  if (atsDisplayRaw?.sections) {
    for (const s of atsDisplayRaw.sections) {
      if (!s.is_not_applicable) {
        atsDisplaySections[s.name] = {
          percentage: s.score_pct,
          max_score: s.max_pts,
          raw_score: s.weighted_pts,
          deductions: s.deductions || [],
        };
      }
    }
  }

  const numericKeyword = Number(atsScore?.keyword_score ?? numericBreakdown.keywords ?? 0);
  const numericFormat  = Number(atsScore?.format_score  ?? numericBreakdown.formatting ?? 0);

  function getSection(keys: string[], numericPct: number, maxRaw: number): BreakdownItem {
    for (const k of keys) {
      const v = sectionBreakdown[k];
      if (v && typeof v === "object" && !Array.isArray(v)) return v as BreakdownItem;
    }
    // Fallback to ats_display.sections (new API format)
    for (const k of keys) {
      const v = atsDisplaySections[k];
      if (v && typeof v === "object" && !Array.isArray(v)) return v as BreakdownItem;
    }
    for (const k of keys) {
      const v = numericBreakdown[k];
      if (v && typeof v === "object" && !Array.isArray(v)) return v as BreakdownItem;
    }
    if (numericPct > 0) return { percentage: numericPct, deductions: [] };
    return { raw_score: 0, max_raw_score: maxRaw, deductions: [] };
  }

  const scoreFromAtsDisplay = Number(atsDisplayRaw?.score ?? 0);
  const scoreFromStorage = Number(raw?.finalWeightedScore) || 0;
  const scoreFromAts = Number(
    atsScore?.FinalScore ??
    atsScore?.final_score ??
    atsScore?.Percentage ??
    atsScore?.percentage ??
    atsScore?.overall_score ??
    atsScore?.total_score ??
    atsScore?.score ??
    atsScore?.TotalScore ??
    0
  );
  const score = scoreFromAtsDisplay || scoreFromStorage || scoreFromAts;
  const scoreSources = [
    raw,
    atsScore,
    raw?.ats_display as Record<string, unknown> | undefined,
    raw?.enhancer_state as Record<string, unknown> | undefined,
    (raw?.enhancer_state as Record<string, unknown> | undefined)?.ats_display as Record<string, unknown> | undefined,
    (raw?.enhancer_state as Record<string, unknown> | undefined)?.ats_breakdown as Record<string, unknown> | undefined,
  ];
  const estimatedScore = scoreSources
    .flatMap(source => source ? [
      source.estimated_score_after_fixes,
      source.estimated_after_fixes,
      source.projected_score,
      source.potential_score,
      source.score_after_fixes,
      source.post_fix_score,
    ] : [])
    .map(value => Number(value))
    .find(value => Number.isFinite(value) && value >= score && value <= 100);

  return {
    TotalScore: score,
    FinalWeightedScore: score,
    MaxScore: 100,
    Breakdown: {
      Contact:          getSection(["Contact",          "contact"],                                                          0,             5),
      Headline:         getSection(["Headline",         "headline"],                                                         0,             0),
      Education:        getSection(["Education",        "education"],                                                        0,             15),
      Experience:       getSection(["Experience",       "experience", "WorkExperience"],                                     0,             0),
      Projects:         getSection(["Projects",         "projects"],                                                         0,             20),
      Skills:           getSection(["Skills",           "skills"],                                                           numericKeyword, 20),
      Certifications:   getSection(["Certifications",   "certifications"],                                                   0,             10),
      Summary:          getSection(["Summary",          "summary"],                                                          0,             5),
      Formatting:       getSection(["Formatting",       "formatting", "FormattingEnhanced", "Format", "format"],             numericFormat, 10),
      Internships:      getSection(["Internships",      "internships"],                                                      0,             10),
      ContentQuality:   getSection(["ContentQuality",   "content_quality", "Content Quality", "Readability", "readability", "content"], 0, 15),
      ATSCompatibility: getSection(["ATSCompatibility", "ats_compatibility", "ATS Compatibility", "ats"],                   0,             5),
      Keywords:         getSection(["Keywords",         "keywords"],                                                         numericKeyword, 30),
      LengthScore:      getSection(["LengthScore",      "length_score"],                                                     0,             10),
      StructureScore:   getSection(["StructureScore",   "structure_score"],                                                  0,             20),
      Leadership:       getSection(["Leadership",       "leadership"],                                                       0,             4),
      CareerProgression:getSection(["CareerProgression","career_progression", "Career Progression"],                         0,             0),
      Suggestions: [
        ...((atsScore?.suggestions as unknown[]) || (atsScore?.Suggestions as unknown[]) || (numericBreakdown.Suggestions as unknown[]) || []),
        ...Object.entries(atsDisplayRaw?.action_items ?? {}).flatMap(([section, actionItems]) =>
          Array.isArray(actionItems)
            ? actionItems
              .filter((actionItem): actionItem is Record<string, unknown> => isObject(actionItem))
              .map((actionItem) => ({
                ...actionItem,
                section: typeof actionItem.section === "string" ? actionItem.section : section,
              }))
            : []
        ),
      ],
    },
    ...(() => {
      const parsedOverallExp = (raw?.parsed_data as Record<string, unknown> | undefined)
        ?.llm_data as Record<string, unknown> | undefined;
      const overallExp = parsedOverallExp?.overall_experience as Record<string, unknown> | undefined;
      const isFresherFromParser = typeof overallExp?.is_fresher === "boolean" ? overallExp.is_fresher : null;
      const isFresherLegacy = !!(raw?.Fresher ?? atsScore?.Fresher) || (atsScore?.profile as string) === "Fresher";
      const isFresher = isFresherFromParser !== null ? isFresherFromParser : isFresherLegacy;
      const atsProfile = atsScore?.profile as string | undefined;
      return {
        Fresher: isFresher,
        Domain: (raw?.Domain as string) || (atsScore?.Domain as string) || "General",
        Profile: isFresher
          ? "Fresher"
          : (atsProfile && atsProfile !== "Fresher" ? atsProfile : "General"),
        EstimatedScore: estimatedScore,
      };
    })(),
  };
}

/* Robustly extract a human-readable text string from a deduction/suggestion item.
   Handles: JSON strings, objects with various field names, suggested_keywords arrays. */

/* ─── WHY TOOLTIP ─────────────────────────────────────── */
/* ─── MOBILE FIX BAR ──────────────────────────────────── */
/** Collapsed-state summary for the small-screen fix drawer: score + fixes left. */
function MobileFixSummary({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { enhancedAtsScore, enhancedSuggestions } = useResume();
  const score = enhancedAtsScore ? Math.round(getEnhancedCurrentScore(enhancedAtsScore)) : null;
  const pending = enhancedSuggestions.filter((item) => item.status === "pending" && item.fix_type !== "info").length;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="ats-fix-panel"
      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left lg:hidden"
    >
      <span className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
        {score !== null && (
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#EFF6FF] px-1.5 text-xs font-bold tabular-nums text-[#2557A7]">{score}</span>
        )}
        ATS fixes
        <span className="text-xs font-medium text-slate-500">{pending > 0 ? `${pending} left` : "all addressed"}</span>
      </span>
      <ChevronDown size={18} className={`text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
    </button>
  );
}

/* ─── MAIN REPORT ─────────────────────────────────────── */
/** ATS-only shell: same editor, preview and score model without exposing the full enhancer route. */
function ATSFixWorkspaceInner({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Toolbar panels: Templates and Job Match open in the side drawer (as the
  // builder's TemplatesSidebar does); Score switches the ATS sidebar's tab.
  const [drawerTab, setDrawerTab] = useState<"Templates" | null>(null);
  const [sidebarTabRequest, setSidebarTabRequest] = useState<{ tab: string; id: number } | null>(null);
  // Below the lg breakpoint the fix panel is a sticky, collapsible drawer so the
  // resume preview keeps the screen; from lg up it is the usual left column.
  const [mobileFixPanelOpen, setMobileFixPanelOpen] = useState(false);

  // The shared item editors use this source marker to select enhanced-resume
  // update/delete APIs. Keep it in the ATS URL as well; otherwise a project or
  // certificate deletion can accidentally call the normal-builder endpoint.
  useEffect(() => {
    if (searchParams.get("source") === "enhanced") return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("source", "enhanced");
    router.replace(`/atslogin/report?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
        <div>
          <p className="text-sm font-bold text-slate-900">ATS Scan</p>
          <p className="text-xs text-slate-500">Fix ATS recommendations one at a time.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/atslogin")}
          className="inline-flex items-center gap-2 rounded-md border border-[#9db7e5] bg-white px-3 py-2 text-xs font-bold text-[#2557a7] transition-colors hover:bg-blue-50"
        >
          <RefreshCw size={14} />
          Scan another resume
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="sticky top-14 z-[45] w-full min-w-0 shrink-0 overflow-hidden border-b border-gray-200 bg-white shadow-sm lg:static lg:z-auto lg:h-screen lg:w-[clamp(340px,32vw,480px)] lg:basis-[clamp(340px,32vw,480px)] lg:border-b-0 lg:border-r lg:shadow-none">
          <MobileFixSummary open={mobileFixPanelOpen} onToggle={() => setMobileFixPanelOpen((open) => !open)} />
          <div
            id="ats-fix-panel"
            className={`${mobileFixPanelOpen ? "block max-h-[60vh]" : "hidden"} min-w-0 overflow-hidden border-t border-gray-100 lg:block lg:h-full lg:max-h-none lg:border-t-0`}
          >
            <ResumeSide
              isTemplateSidebarOpen={false}
              resumeId={resumeId}
              initialTab="Score"
              defaultOpen={true}
              tabRequest={sidebarTabRequest}
              atsFixMode
              embedded
            />
          </div>
        </aside>
        <main className="min-w-0 flex-1 bg-gray-50">
          <PreviewPanel
            isTemplateSidebarOpen={false}
            onTabClick={(tab) => {
              if (tab === "Score") {
                setSidebarTabRequest((prev) => ({ tab: "Score", id: (prev?.id ?? 0) + 1 }));
                setMobileFixPanelOpen(true);
              } else if (tab === "Templates") {
                setDrawerTab(tab);
              }
            }}
            resumeId={resumeId}
            isEnhancedResume
            hideJobMatch
            atsMinimalToolbar
          />
        </main>
      </div>

      {drawerTab && (
        <div
          className="fixed inset-0 z-[70] flex justify-end bg-slate-950/35"
          role="dialog"
          aria-modal="true"
          aria-label="Resume templates"
        >
          <div className="flex h-full w-full max-w-[520px] flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{drawerTab}</h2>
                <p className="mt-0.5 text-xs text-slate-500">Choose a layout without leaving ATS Scan.</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerTab(null)}
                className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close templates"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <TemplatesTab
                resumeId={resumeId}
                onTemplateSelect={() => setDrawerTab(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function ATSFixWorkspace({ resumeId }: { resumeId: string }) {
  return <ResumeProvider resumeId={resumeId} source="enhanced"><ScoreProvider><ATSFixWorkspaceInner resumeId={resumeId} /></ScoreProvider></ResumeProvider>;
}

function ATSLoginReport() {
  const router   = useRouter();
  const searchParams = useSearchParams();
  const requestedResumeId = searchParams.get("resume_id");
  const [scoreData, setScoreData] = useState<ResumeScoreData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [reportPayload, setReportPayload] = useState<Record<string, unknown> | null>(null);
  const [atsWorkspaceId, setAtsWorkspaceId] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  // Fixes already on the record this scan returned (see PriorFixesBanner).
  const [priorFixCount, setPriorFixCount] = useState(0);
  const [rescanning, setRescanning] = useState(false);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);

  useEffect(() => {
    try {
      // The scan result is written to a resume-specific key and to the legacy
      // key for backwards compatibility. A reload can lose one storage entry
      // (for example after a quota fallback), so safely recover from the
      // matching legacy payload rather than showing a false "No Report Found".
      const keys = requestedResumeId
        ? [`atsAnalysis_${requestedResumeId}`, "atsAnalysisData"]
        : ["atsAnalysisData"];
      let data: Record<string, unknown> | null = null;

      for (const key of keys) {
        const raw = readAtsAnalysis(key); // guarded: blocked storage reads as a miss, not a crash
        if (!raw) continue;
        try {
          const candidate = JSON.parse(raw) as Record<string, unknown>;
          if (!requestedResumeId || candidate.resume_id === requestedResumeId) {
            data = candidate;
            break;
          }
        } catch {
          // Ignore only the corrupt cache entry and continue to the next safe fallback.
        }
      }

      if (data) {
        if (requestedResumeId) {
          // Non-fatal cache recovery; also strips images from reports cached before image stripping existed.
          writeReportCache(`atsAnalysis_${requestedResumeId}`, data);
        }
        setReportPayload(data);
        setScoreData(transformData(data));
      }
    } finally {
      setLoading(false);
    }
  }, [requestedResumeId]);
  const getStoredReport = (): Record<string, unknown> | null => {
    const key = requestedResumeId ? `atsAnalysis_${requestedResumeId}` : "atsAnalysisData";
    const raw = readAtsAnalysis(key) ?? readAtsAnalysis("atsAnalysisData");
    if (!raw) return null;
    try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
  };

  const persistReport = (payload: Record<string, unknown>) => {
    const resumeId = typeof payload.resume_id === "string" ? payload.resume_id : undefined;
    // Quota/availability is a cache concern only -- it must never turn a
    // server-confirmed fix into an uncaught error. writeReportCache strips
    // embedded images (as storeAtsAnalysis does) and drops a stale
    // localStorage copy when the fresh write fails.
    writeReportCache("atsAnalysisData", payload);
    if (resumeId) writeReportCache(`atsAnalysis_${resumeId}`, payload);
    setReportPayload(payload);
    setScoreData(transformData(payload));
  };

  /** Prepare the server-owned state but keep the user on the ATS report. */
  const ensureEnhancedResumeForReport = async (): Promise<{ enhancedResumeId: string; report: Record<string, unknown> }> => {
    const d = reportPayload ?? getStoredReport();
    if (!d) throw new Error("Your ATS report is no longer available. Please scan the resume again.");
    const resumeId = d.resume_id as string | undefined;
    if (!resumeId) throw new Error("The scanned resume ID is missing. Please scan the resume again.");

    let knownRecord: EnhancedResumeHistoryItem | null = null;
    let enhancedResumeId = typeof d.enhanced_resume_id === "string" && d.enhanced_resume_id.trim()
      ? d.enhanced_resume_id.trim()
      : undefined;
    if (!enhancedResumeId) {
      const knownIds = readEnhancedResumeIds();
      const results = await Promise.allSettled(knownIds.map((id) => getEnhancedResume(id)));
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.original_resume_id === resumeId) {
          knownRecord = result.value;
          enhancedResumeId = result.value.id;
          break;
        }
      }
    }

    // The report may name a saved record the server has since invalidated (a
    // re-parse of the same file marks unedited records stale; reading one then
    // answers "not found", which left an empty editor). Only that answer means
    // "scan again"; any other failure keeps the old behaviour.
    let savedFixCount = 0;
    if (enhancedResumeId) {
      const saved = await readSavedFixCount(enhancedResumeId);
      if (saved === "missing") enhancedResumeId = undefined;
      else savedFixCount = saved;
    }

    if (enhancedResumeId) {
      const sourceData =
        (d.enhanced_resume as Record<string, unknown> | null | undefined) ||
        ((d.enhancer_state as { resume?: Record<string, unknown> } | undefined)?.resume) ||
        knownRecord?.enhanced_data ||
        (d.resume_data as Record<string, unknown> | null | undefined) || {};
      cacheBuilderResume(enhancedResumeId, sourceData);
      rememberEnhancedResumeId(enhancedResumeId);
      // A re-scan of a known file arrives here (the report already names its
      // saved record), so the fix count must be read on this path too.
      setPriorFixCount(savedFixCount);
      const updated = { ...d, enhanced_resume_id: enhancedResumeId, enhanced_resume: sourceData };
      return { enhancedResumeId, report: updated };
    }

    const result = await enhanceResume({
      resume_id: resumeId,
      ...(typeof d.ats_breakdown_id === "string" ? { ats_breakdown: d.ats_breakdown_id } : {}),
    });
    if (!result.enhanced_resume_id) throw new Error("Enhancement did not return an enhanced resume ID.");
    const response = result as unknown as Record<string, unknown>;
    const sourceData = (response.enhanced_resume as Record<string, unknown> | undefined)
      || ((response.enhancer_state as { resume?: Record<string, unknown> } | undefined)?.resume) || {};
    cacheBuilderResume(result.enhanced_resume_id, sourceData);
    rememberEnhancedResumeId(result.enhanced_resume_id);
    setPriorFixCount(await countAppliedFixes(response, result.enhanced_resume_id));
    const updated = { ...d, ...response, enhanced_resume_id: result.enhanced_resume_id, enhanced_resume: sourceData };
    return { enhancedResumeId: result.enhanced_resume_id, report: updated };
  };

  /** Applied fixes on a saved record, or "missing" when the server no longer has it. */
  const readSavedFixCount = async (enhancedResumeId: string): Promise<number | "missing"> => {
    try {
      const record = await getEnhancedResume(enhancedResumeId);
      return Array.isArray(record?.applied_fixes) ? record.applied_fixes.length : 0;
    } catch (error) {
      const raw = (error as { __raw?: unknown } | null)?.__raw;
      const text = (() => { try { return JSON.stringify(raw ?? "") + String((error as Error)?.message ?? ""); } catch { return ""; } })();
      return /enhanced_resume_not_found/i.test(text) ? "missing" : 0;
    }
  };

  /** Fixes the returned record already carries: from the response, else the saved record. */
  const countAppliedFixes = async (response: Record<string, unknown>, enhancedResumeId: string): Promise<number> => {
    if (Array.isArray(response.applied_fixes)) return response.applied_fixes.length;
    try {
      const record = await getEnhancedResume(enhancedResumeId);
      return Array.isArray(record.applied_fixes) ? record.applied_fixes.length : 0;
    } catch {
      return 0; // the note is informational; never block the workspace on it
    }
  };

  /** Scan the uploaded file again, discarding the fixes saved on its record. */
  const rescanOriginal = async () => {
    const d = reportPayload ?? getStoredReport();
    const resumeId = d?.resume_id as string | undefined;
    if (!d || !resumeId || rescanning) return;
    setRescanning(true);
    try {
      const result = await enhanceResume({
        resume_id: resumeId,
        force_refresh: true,
        // Same breakdown the first scan was tied to.
        ...(typeof d.ats_breakdown_id === "string" ? { ats_breakdown: d.ats_breakdown_id } : {}),
      });
      if (!result.enhanced_resume_id) throw new Error("The new scan did not return a resume ID.");
      const refreshVerification = await verifyFreshEnhancement(result);
      if (refreshVerification === "retained") {
        throw new Error("The saved fixes are still present. Please try again.");
      }
      const response = result as unknown as Record<string, unknown>;
      const sourceData = (response.enhanced_resume as Record<string, unknown> | undefined)
        || ((response.enhancer_state as { resume?: Record<string, unknown> } | undefined)?.resume) || {};
      cacheBuilderResume(result.enhanced_resume_id, sourceData);
      rememberEnhancedResumeId(result.enhanced_resume_id);
      // The fresh record reuses the same ID, and this browser keeps its green
      // "fixed" cards and highlights under that ID: forget them, or the new
      // workspace reloads fixes the server no longer has.
      for (const id of new Set([result.enhanced_resume_id, atsWorkspaceId])) {
        clearStoredFixedSuggestions(id ?? undefined);
        clearStoredFixedText(id ?? "current");
      }
      persistReport({ ...d, ...response, enhanced_resume_id: result.enhanced_resume_id, enhanced_resume: sourceData });
      setPriorFixCount(0);
      setAtsWorkspaceId(result.enhanced_resume_id);
      setWorkspaceVersion(version => version + 1); // remount the workspace on the fresh record
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Could not scan the original resume again.");
    } finally {
      setRescanning(false);
    }
  };

  // ATS fixes happen inside this page. Prepare/reuse the enhanced server state
  // once, then mount the editor/score/preview workspace around that state.
  useEffect(() => {
    if (!reportPayload || atsWorkspaceId || workspaceError) return;
    let active = true;
    ensureEnhancedResumeForReport()
      .then(({ enhancedResumeId, report }) => {
        if (!active) return;
        // Persist here, in the same batch as setAtsWorkspaceId: calling
        // setReportPayload inside the setup itself re-triggered this effect
        // before the ID was set (an endless loop under React act()).
        persistReport(report);
        setAtsWorkspaceId(enhancedResumeId);
      })
      .catch((error) => {
        if (active) setWorkspaceError(error instanceof Error ? error.message : "Could not prepare the ATS editing workspace.");
      });
    return () => { active = false; };
    // reportPayload is replaced only together with atsWorkspaceId (above), so
    // the guard prevents a second setup/enhancement request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportPayload, atsWorkspaceId, workspaceError]);

/* ── Loading ─────────────────────── */
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFF6FF" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <div className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3465BC", borderTopColor: "transparent" }} />
        </div>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Analyzing your resume…</p>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Building your personalized report</p>
      </div>
    </div>
  );

  /* ── No data ─────────────────────── */
  if (!scoreData) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFF6FF", padding: "0 24px" }}>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center", background: "#fff", borderRadius: 20, padding: "48px 40px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <XCircle style={{ width: 32, height: 32, color: "#dc2626" }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>No Report Found</h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28, lineHeight: 1.6 }}>Upload and scan your resume first to see your full ATS analysis.</p>
        <button onClick={() => router.push("/atslogin")} style={{ width: "100%", padding: "14px 24px", borderRadius: 12, background: "#3465BC", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <RefreshCw style={{ width: 16, height: 16 }} /> Go to ATS Scanner
        </button>
      </div>
    </div>
  );

  /* ── Report ──────────────────────── */
  if (workspaceError) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f9fd", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%", padding: 28, textAlign: "center", background: "#fff", border: "1px solid #fecaca", borderRadius: 16, boxShadow: "0 8px 26px rgba(15,23,42,0.08)" }}>
        <XCircle style={{ width: 32, height: 32, color: "#dc2626", margin: "0 auto 12px" }} />
        <h2 style={{ margin: 0, color: "#172554", fontSize: 20 }}>Could not prepare ATS fixes</h2>
        {/* The scan itself succeeded: keep its score visible even though the fix workspace could not be set up. */}
        {scoreData.FinalWeightedScore > 0 && (
          <p data-testid="ats-score-fallback" style={{ margin: "12px 0 0", color: "#172554", fontSize: 15, fontWeight: 700 }}>
            Your ATS score: {Math.round(scoreData.FinalWeightedScore)} / 100
          </p>
        )}
        <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: 13, lineHeight: 1.55 }}>{workspaceError}</p>
        <button type="button" onClick={() => { setWorkspaceError(null); setAtsWorkspaceId(null); }} style={{ marginTop: 20, padding: "10px 16px", border: "none", borderRadius: 8, background: "#1677e8", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Try again</button>
      </div>
    </div>
  );

  if (!atsWorkspaceId) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f9fd" }}>
      <div style={{ textAlign: "center" }}>
        <div className="w-9 h-9 border-[3px] border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "#1677e8", borderTopColor: "transparent" }} />
        <p style={{ marginTop: 14, color: "#334155", fontSize: 14, fontWeight: 700 }}>Preparing your ATS editing workspace…</p>
      </div>
    </div>
  );

  return (
    <>
      <PriorFixesDialog
        count={priorFixCount}
        busy={rescanning}
        onStartFresh={rescanOriginal}
        onContinue={() => setPriorFixCount(0)}
      />
      <ATSFixWorkspace key={workspaceVersion} resumeId={atsWorkspaceId} />
    </>
  );
}

/* ─── EXPORT ──────────────────────────────────────────── */
export default function ATSLoginReportPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#EFF6FF" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <div className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3465BC", borderTopColor: "transparent" }} />
          </div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Loading report…</p>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Preparing your ATS analysis</p>
        </div>
      </div>
    }>
      <ATSLoginReport />
    </Suspense>
  );
}
