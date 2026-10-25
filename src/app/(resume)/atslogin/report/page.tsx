"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { enhanceResume, getEnhancedResume } from "@/api/enhancerApi";
import { verifyFreshEnhancement } from "@/utils/verifyEnhancedRefresh";
import PriorFixesDialog from "@/components/common/PriorFixesDialog";
import { clearStoredFixedSuggestions, clearStoredFixedText } from "@/app/(resume)/builder/creation/_utils/fixedSuggestionsStorage";
import { cacheBuilderResume, readEnhancedResumeIds, rememberEnhancedResumeId, writeReportCache } from "./atsReportCache";
import { buildAtsReport, buildEnhancerFixUrl } from "./atsReportModel";
import { countUserAppliedFixes } from "@/utils/appliedFixes";
import { resolveTargetRole } from "@/utils/targetRole";
import ATSScanReport from "../_components/ATSScanReport";
import { readAtsAnalysis } from "@/api/resumeatsapi";
import type { EnhancedResumeHistoryItem } from "@/types/api.types";

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * The score and suggestions the server holds NOW for a saved record. After the user fixes things in
 * the enhancer and comes back, the stored scan is out of date; the record carries the current one.
 */
function latestScan(record: EnhancedResumeHistoryItem | null): Record<string, unknown> {
  if (!record) return {};
  const rec = record as unknown as Record<string, unknown>;
  const state = isObject(rec.enhancer_state) ? rec.enhancer_state : undefined;
  const display = isObject(rec.ats_display) ? rec.ats_display : isObject(state?.ats_display) ? state!.ats_display : undefined;
  const out: Record<string, unknown> = {};
  if (isObject(display) && typeof display.score === "number") {
    out.ats_display = display;
    out.finalWeightedScore = display.score;
  }
  if (isObject(rec.ats_score)) out.ats_score = rec.ats_score;
  // What the scan applied for the user, as the saved record has it now (an Undo in the enhancer removes one).
  if (Array.isArray(rec.applied_fixes)) out.applied_fixes = rec.applied_fixes;
  return out;
}

/** Applied fixes on a saved record, the record itself, or "missing" when the server no longer has it. */
async function readSavedRecord(
  enhancedResumeId: string
): Promise<{ count: number; record: EnhancedResumeHistoryItem | null } | "missing"> {
  try {
    const record = await getEnhancedResume(enhancedResumeId);
    return { count: countUserAppliedFixes(record?.applied_fixes), record: record ?? null };
  } catch (error) {
    const raw = (error as { __raw?: unknown } | null)?.__raw;
    const text = (() => { try { return JSON.stringify(raw ?? "") + String((error as Error)?.message ?? ""); } catch { return ""; } })();
    return /enhanced_resume_not_found/i.test(text) ? "missing" : { count: 0, record: null };
  }
}

/* ─── MAIN REPORT ─────────────────────────────────────── */
/**
 * ATS Scan is a report: the score, the section scores and every suggestion with its details.
 * Nothing is fixed here. A Fix button opens the enhancer on the matching section, where the
 * user fixes it.
 */
function ATSLoginReport() {
  const router   = useRouter();
  const searchParams = useSearchParams();
  const requestedResumeId = searchParams.get("resume_id");
  const [loading,   setLoading]   = useState(true);
  const [reportPayload, setReportPayload] = useState<Record<string, unknown> | null>(null);
  // The enhancer record the Fix buttons open.
  const [enhancedId, setEnhancedId] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  // Fixes already on the record this scan returned (see PriorFixesDialog).
  const [priorFixCount, setPriorFixCount] = useState(0);
  const [rescanning, setRescanning] = useState(false);

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
      }
    } finally {
      setLoading(false);
    }
  }, [requestedResumeId]);

  const model = useMemo(() => buildAtsReport(reportPayload), [reportPayload]);

  const getStoredReport = (): Record<string, unknown> | null => {
    const key = requestedResumeId ? `atsAnalysis_${requestedResumeId}` : "atsAnalysisData";
    const raw = readAtsAnalysis(key) ?? readAtsAnalysis("atsAnalysisData");
    if (!raw) return null;
    try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
  };

  /** The role the report was scored for (stored with it), else the one the scanned resume names. */
  const reportRole = (d: Record<string, unknown>): string => {
    const role = resolveTargetRole(d) ?? resolveTargetRole(d.resume_data) ?? resolveTargetRole(d.parsed_data)
      ?? resolveTargetRole(d.enhanced_resume);
    if (!role) throw new Error("We could not tell which role this resume was scored for. Please scan the resume again.");
    return role;
  };

  const persistReport = (payload: Record<string, unknown>) => {
    const resumeId = typeof payload.resume_id === "string" ? payload.resume_id : undefined;
    // Quota/availability is a cache concern only -- it must never turn a
    // server-confirmed scan into an uncaught error. writeReportCache strips
    // embedded images (as storeAtsAnalysis does) and drops a stale
    // localStorage copy when the fresh write fails.
    writeReportCache("atsAnalysisData", payload);
    if (resumeId) writeReportCache(`atsAnalysis_${resumeId}`, payload);
    setReportPayload(payload);
  };

  /** Find or create the enhancer record for the scanned resume. The user stays on the report. */
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
    // answers "not found"). Only that answer means "scan again"; any other
    // failure keeps the old behaviour.
    let savedFixCount = 0;
    let savedRecord: EnhancedResumeHistoryItem | null = knownRecord;
    if (enhancedResumeId) {
      const saved = await readSavedRecord(enhancedResumeId);
      if (saved === "missing") enhancedResumeId = undefined;
      else {
        savedFixCount = saved.count;
        savedRecord = saved.record ?? savedRecord;
      }
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
      // Show what the server holds now, not what was stored when the scan ran.
      const updated = { ...d, ...latestScan(savedRecord), enhanced_resume_id: enhancedResumeId, enhanced_resume: sourceData };
      return { enhancedResumeId, report: updated };
    }

    const result = await enhanceResume({
      resume_id: resumeId,
      mode: "auto",
      target_role: reportRole(d),
      ...(typeof d.ats_breakdown_id === "string" ? { ats_breakdown: d.ats_breakdown_id } : {}),
    });
    if (!result.enhanced_resume_id) throw new Error("Enhancement did not return an enhanced resume ID.");
    const response = result as unknown as Record<string, unknown>;
    const sourceData = (response.enhanced_resume as Record<string, unknown> | undefined)
      || ((response.enhancer_state as { resume?: Record<string, unknown> } | undefined)?.resume) || {};
    cacheBuilderResume(result.enhanced_resume_id, sourceData);
    rememberEnhancedResumeId(result.enhanced_resume_id);
    setPriorFixCount(await countAppliedFixes(response, result.enhanced_resume_id));
    const updated = { ...d, ...response, target_role: response.target_role ?? d.target_role, enhanced_resume_id: result.enhanced_resume_id, enhanced_resume: sourceData };
    return { enhancedResumeId: result.enhanced_resume_id, report: updated };
  };

  /** Fixes the returned record already carries: from the response, else the saved record. */
  const countAppliedFixes = async (response: Record<string, unknown>, enhancedResumeId: string): Promise<number> => {
    if (Array.isArray(response.applied_fixes)) return countUserAppliedFixes(response.applied_fixes);
    const saved = await readSavedRecord(enhancedResumeId);
    return saved === "missing" ? 0 : saved.count; // the note is informational; never block the report on it
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
        mode: "auto",
        target_role: reportRole(d),
        // Same breakdown the first scan was tied to.
        ...(typeof d.ats_breakdown_id === "string" ? { ats_breakdown: d.ats_breakdown_id } : {}),
      });
      if (!result.enhanced_resume_id) throw new Error("The new scan did not return a resume ID.");
      const refreshVerification = await verifyFreshEnhancement(result);
      if (refreshVerification === "retained") {
        // The service kept the saved fixes. As in the upload dialog, ask again
        // (Continue or retry) instead of replacing the report with an error.
        const response = result as unknown as Record<string, unknown>;
        setPriorFixCount(Math.max(1, await countAppliedFixes(response, result.enhanced_resume_id)));
        toast.error("The saved fixes are still present. Please try again.");
        return;
      }
      const response = result as unknown as Record<string, unknown>;
      const sourceData = (response.enhanced_resume as Record<string, unknown> | undefined)
        || ((response.enhancer_state as { resume?: Record<string, unknown> } | undefined)?.resume) || {};
      cacheBuilderResume(result.enhanced_resume_id, sourceData);
      rememberEnhancedResumeId(result.enhanced_resume_id);
      // The fresh record reuses the same ID, and this browser keeps its green
      // "fixed" cards and highlights under that ID: forget them, or the enhancer
      // reloads fixes the server no longer has.
      for (const id of new Set([result.enhanced_resume_id, enhancedId])) {
        clearStoredFixedSuggestions(id ?? undefined);
        clearStoredFixedText(id ?? "current");
      }
      persistReport({ ...d, ...response, target_role: response.target_role ?? d.target_role, enhanced_resume_id: result.enhanced_resume_id, enhanced_resume: sourceData });
      setPriorFixCount(0);
      setEnhancedId(result.enhanced_resume_id);
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Could not scan the original resume again.");
    } finally {
      setRescanning(false);
    }
  };

  // Prepare/reuse the enhancer record once, so the Fix buttons have somewhere to go.
  useEffect(() => {
    if (!reportPayload || enhancedId || setupError) return;
    let active = true;
    ensureEnhancedResumeForReport()
      .then(({ enhancedResumeId, report }) => {
        if (!active) return;
        // Persist here, in the same batch as setEnhancedId: calling
        // setReportPayload inside the setup itself re-triggered this effect
        // before the ID was set (an endless loop under React act()).
        persistReport(report);
        setEnhancedId(enhancedResumeId);
      })
      .catch((error) => {
        if (active) setSetupError(error instanceof Error ? error.message : "Could not prepare the enhancer.");
      });
    return () => { active = false; };
    // reportPayload is replaced only together with enhancedId (above), so
    // the guard prevents a second setup/enhancement request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportPayload, enhancedId, setupError]);

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
  if (!model) return (
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

  const goToEnhancer = (atsSectionName?: string) => {
    if (!enhancedId) return;
    router.push(buildEnhancerFixUrl(enhancedId, atsSectionName));
  };

  return (
    <>
      <PriorFixesDialog
        count={priorFixCount}
        busy={rescanning}
        onStartFresh={rescanOriginal}
        onContinue={() => setPriorFixCount(0)}
      />
      <ATSScanReport
        model={model}
        fixReady={Boolean(enhancedId)}
        preparing={!enhancedId && !setupError}
        setupError={setupError}
        onRetrySetup={() => setSetupError(null)}
        onFix={goToEnhancer}
        onScanAnother={() => router.push("/atslogin")}
      />
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
