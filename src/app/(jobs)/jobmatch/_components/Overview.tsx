"use client";

import React, { useState, useRef, useEffect } from "react";
import AnalysisContent from "./analysis/AnalysisContent";
import MatchResultsOverview from "./analysis/MatchResultsOverview";
import LoadingAnimation from "./ui/LoadingAnimation";
import ErrorPopupModal from "@/components/ErrorPopupModal";
import JobMatchStartCard from "./wizard/JobMatchStartCard";
import WizardModalShell from "./wizard/WizardModalShell";
import WizardStepResume from "./wizard/WizardStepResume";
import WizardStepJobDescription from "./wizard/WizardStepJobDescription";
import WizardStepConfirm from "./wizard/WizardStepConfirm";
import { WIZARD_OVERVIEW_STYLES } from "./wizard/wizardOverviewStyles";
import { writeJobmatchSessionSnapshot } from "@/utils/jobmatchSession";
import { toast } from "sonner";

import {
  parseResume,
  parseJDFile,
  parseJDText,
  parseJDUrl,
  matchResumeAndJD,
  getResume,
  getMatchAnalytics,
} from "@/api/parserApi";
import { getExtensionSession } from "@/api/extensionApi";
import { hasAllowedDocumentExtension, hasAllowedResumeExtension } from "@/utils/validators";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

async function getMatchByIds(resume_id: string, jd_id: string) {
  const params = new URLSearchParams({ resume_id, jd_id });
  const response = await fetch(`/api/v1/matcher/match?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch match");
  return response.json();
}

type ProcessingStage = "parsing" | "extracting" | "matching" | "scoring" | "generating";

/** Resolves (or parses) the resume that will be matched, and its full parsed data. */
async function resolveResumeForMatch(
  uploadedFile: File | null,
  sessionResumeId: string | null,
  setProcessingStage: (stage: ProcessingStage) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ resume_id: string; fullResumeData: any }> {
  let resume_id = sessionResumeId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fullResumeData: any = null;

  if (!resume_id) {
    const resumeParsed = await parseResume(uploadedFile!);
    resume_id =
      resumeParsed?.resume_id ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (resumeParsed as any)?.id ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (resumeParsed as any)?._id ??
      null;
    if (!resume_id) throw new Error("Resume parsing failed — no resume_id returned.");
    setProcessingStage("extracting");
    try { fullResumeData = await getResume(resume_id); } catch { fullResumeData = resumeParsed; }
  } else {
    setProcessingStage("extracting");
    try { fullResumeData = await getResume(resume_id); } catch { fullResumeData = null; }
  }

  return { resume_id, fullResumeData };
}

/** Resolves (or parses) the job description that will be matched against. */
async function resolveJDForMatch(
  sessionJdId: string | null,
  jdFile: File | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jdFileParsed: any,
  jdText: string,
  setJdText: (value: string) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ jd_id: string | null; jdParsed: any; resolvedJdText: string }> {
  let jd_id: string | null = sessionJdId ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let jdParsed: any = null;
  let resolvedJdText = jdText;

  if (!jd_id) {
    if (jdFile) {
      // Reuse the extraction already triggered on file selection instead of
      // re-parsing the same file a second time.
      jdParsed = jdFileParsed?.jd_id ? jdFileParsed : await parseJDFile(jdFile);
      if (jdParsed?.jd_text) { resolvedJdText = jdParsed.jd_text; setJdText(jdParsed.jd_text); }
    } else if (jdText.trim()) {
      const trimmedText = jdText.trim();
      const isUrl = /^https?:\/\/.+/i.test(trimmedText);
      jdParsed = isUrl ? await parseJDUrl(trimmedText) : await parseJDText(trimmedText);
    } else {
      throw new Error("No job description provided");
    }
    jd_id = jdParsed?.jd_id ?? null;
  }

  return { jd_id, jdParsed, resolvedJdText };
}

/** Calls matchResumeAndJD with exponential-backoff retries (matches original 2-retry policy). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function matchWithRetry(resume_id: string, jd_id: string): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let matchResp: any;
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      matchResp = await matchResumeAndJD(resume_id, jd_id);
      break;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      retryCount++;
      if (retryCount <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
      } else { throw err; }
    }
  }

  return matchResp;
}

/** Resolves the final match payload, de-duplicating against an existing match when the backend reports one. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveFinalMatchData(matchResp: any, resume_id: string, jd_id: string): Promise<any> {
  let finalMatchData = matchResp.data;

  if (matchResp.duplicate) {
    try {
      const existing = await getMatchByIds(resume_id, jd_id);
      if (Array.isArray(existing)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matched = existing.find((m: any) => m.jd_id === jd_id || m.job_description_id === jd_id);
        finalMatchData = matched || existing[0];
      } else { finalMatchData = existing; }
    } catch { finalMatchData = matchResp.data; }
  }

  if (!finalMatchData?.match_id && matchResp.match_id) {
    finalMatchData = { ...finalMatchData, match_id: matchResp.match_id };
  }

  return finalMatchData;
}

/** Extracts a user-facing message + credit details from an analyzeMatch failure, regardless of which shape the backend/http-client wrapped it in. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAnalyzeMatchError(err: any): {
  errorMessage: string;
  details: { error_code?: string; credits_required?: number; credits_remaining?: number };
} {
  let errorMessage = "Something went wrong.";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const details: any = {};

  if (err?.__raw) {
    const raw = err.__raw;
    if (typeof raw === "object") {
      const msg = raw.message || raw.error?.message || raw.error || raw.detail;
      errorMessage = typeof msg === "string" ? msg : JSON.stringify(raw);
      details.error_code = raw.error_code || raw.error?.error_code;
      if (raw.details) { details.credits_required = raw.details.credits_required; details.credits_remaining = raw.details.credits_remaining; }
      else if (raw.error?.details) { details.credits_required = raw.error.details.credits_required; details.credits_remaining = raw.error.details.credits_remaining; }
    } else if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        const msg = parsed.message || parsed.error?.message || parsed.error || parsed.detail;
        errorMessage = typeof msg === "string" ? msg : raw;
        details.error_code = parsed.error_code || parsed.error?.error_code;
        if (parsed.details) { details.credits_required = parsed.details.credits_required; details.credits_remaining = parsed.details.credits_remaining; }
        else if (parsed.error?.details) { details.credits_required = parsed.error.details.credits_required; details.credits_remaining = parsed.error.details.credits_remaining; }
      } catch { errorMessage = raw; }
    }
  } else if (err?.message) {
    try {
      const parsed = JSON.parse(err.message);
      const msg = parsed.message || parsed.error?.message || parsed.error || parsed.detail;
      errorMessage = typeof msg === "string" ? msg : err.message;
      details.error_code = parsed.error_code || parsed.error?.error_code;
      if (parsed.details) { details.credits_required = parsed.details.credits_required; details.credits_remaining = parsed.details.credits_remaining; }
      else if (parsed.error?.details) { details.credits_required = parsed.error.details.credits_required; details.credits_remaining = parsed.error.details.credits_remaining; }
    } catch { errorMessage = err.message; }
  }

  return { errorMessage, details };
}

// ── Main Component ─────────────────────────────────────────────────────────────
const Overview = ({ sessionId }: { sessionId?: string }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sessionResumeId, setSessionResumeId] = useState<string | null>(null);
  const [sessionResumeName, setSessionResumeName] = useState<string | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jdFileParsed, setJdFileParsed] = useState<any>(null);
  const [isExtractingJd, setIsExtractingJd] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    error_code?: string;
    credits_required?: number;
    credits_remaining?: number;
  }>({});

  const [processingStage, setProcessingStage] = useState<
    "parsing" | "extracting" | "matching" | "scoring" | "generating"
  >("parsing");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [matchResults, setMatchResults] = useState<any>(() => {
    try {
      const mr = sessionStorage.getItem("jm_matchResults");
      return mr ? JSON.parse(mr) : null;
    } catch { return null; }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsedResumeData, setParsedResumeData] = useState<any>(() => {
    try {
      const prd = sessionStorage.getItem("jm_parsedResumeData");
      return prd ? JSON.parse(prd) : null;
    } catch { return null; }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsedJDData, setParsedJDData] = useState<any>(() => {
    try {
      const d = sessionStorage.getItem("jm_parsedJDData");
      return d ? JSON.parse(d) : null;
    } catch { return null; }
  });

  // Display-only filenames for the results screen. uploadedFile/jdFile are
  // File objects — they can't survive sessionStorage (or a refresh), so the
  // results cards would silently fall back to generic placeholder text
  // ("Your resume") on reload even though the rest of the snapshot restored
  // fine. These plain strings are captured once analysis succeeds (see
  // analyzeMatch) and persisted alongside the rest of the snapshot instead.
  const [resumeFileName, setResumeFileName] = useState<string | null>(() => {
    try { return sessionStorage.getItem("jm_resumeName") || null; } catch { return null; }
  });
  const [jdFileName, setJdFileName] = useState<string | null>(() => {
    try { return sessionStorage.getItem("jm_jdName") || null; } catch { return null; }
  });
  const [resumeSizeMB, setResumeSizeMB] = useState<number | null>(() => {
    try { const v = sessionStorage.getItem("jm_resumeSizeMB"); return v ? Number.parseFloat(v) : null; } catch { return null; }
  });
  const [jdSizeMB, setJdSizeMB] = useState<number | null>(() => {
    try { const v = sessionStorage.getItem("jm_jdSizeMB"); return v ? Number.parseFloat(v) : null; } catch { return null; }
  });
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(() => {
    try { return sessionStorage.getItem("jm_analyzedAt") || null; } catch { return null; }
  });

  const [jdText, setJdText] = useState<string>(() => {
    if (sessionId) return "";
    try { return sessionStorage.getItem("jm_jdText") || ""; } catch { return ""; }
  });

  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "analysis" | "chat">(() => {
    // Restore an existing analysis for the lifetime of this browser tab. The
    // previous implementation deleted these values on every route remount,
    // which made ordinary in-app navigation destroy the user's work.
    try {
      if (!sessionId && sessionStorage.getItem("jm_matchResults")) {
        return "analysis";
      }
    } catch {}
    return "upload";
  });

  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  // 0 = landing overview, 1 = upload resume, 2 = job description, 3 = confirm & analyze
  const [wizardStep, setWizardStep] = useState<0 | 1 | 2 | 3 | 4>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const autoAnalyzedRef = useRef(false);
  const jdUploadTokenRef = useRef(0);
  const [sessionJdId, setSessionJdId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!sessionId) return;
    getExtensionSession(sessionId)
      .then((session) => {
        if (session.job_description) setJdText(session.job_description);
        if (session.jd_id) setSessionJdId(session.jd_id);
        if (session.resume_id) {
          setSessionResumeId(session.resume_id);
          setSessionResumeName("Resume from extension");
          getResume(session.resume_id)
            .then((resumeData) => {
              if (resumeData?.file_name) setSessionResumeName(resumeData.file_name);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    if (autoAnalyzedRef.current) return;
    if (!sessionResumeId) return;
    if (!sessionJdId && !jdText.trim()) return;
    autoAnalyzedRef.current = true;
    analyzeMatch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sessionResumeId, jdText, sessionJdId]);

  const handleResumeUpload = (file: File) => {
    if (!file) return;
    if (!hasAllowedResumeExtension(file.name)) { setError("Please upload a PDF, DOC, or DOCX file."); return; }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) { setError("Resume must be under 10MB."); return; }
    setUploadedFile(file);
    // A freshly chosen file must win over any resume_id restored from an
    // extension session — otherwise analyzeMatch still finds sessionResumeId
    // set and skips parsing this file, silently reusing the old resume.
    setSessionResumeId(null);
    setSessionResumeName(null);
    setError(null);
  };

  const handleJDFileUpload = async (file: File) => {
    if (!file) return;
    if (!hasAllowedDocumentExtension(file.name)) { setError("Please upload a PDF, DOC, DOCX, or TXT file."); return; }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) { setError("Job description file must be under 10MB."); return; }
    const token = ++jdUploadTokenRef.current;
    setJdFile(file);
    setJdFileParsed(null);
    setJdText("");
    setError(null);

    const isPlainText = /\.txt$/i.test(file.name) || file.type === "text/plain";
    if (isPlainText) {
      file.text()
        .then((text) => { if (jdUploadTokenRef.current === token) setJdText(text); })
        .catch(() => { if (jdUploadTokenRef.current === token) setError("Failed to read job description file"); });
      return;
    }

    // PDF/DOC/DOCX are binary formats — reading them as text produces corrupted
    // output, so extract the text server-side and preview the clean result.
    setIsExtractingJd(true);
    try {
      const parsed = await parseJDFile(file);
      if (jdUploadTokenRef.current !== token) return; // superseded by a newer upload
      setJdFileParsed(parsed);
      // No jd_text is expected when the JD was already parsed before (duplicate) or
      // the backend response just doesn't carry a recognized text field — not an error,
      // the file/jd_id is still valid and will be used as-is during analysis.
      if (parsed?.jd_text) setJdText(parsed.jd_text);
    } catch {
      if (jdUploadTokenRef.current === token) {
        setError("Failed to extract text from this file. You can still continue — it will be parsed during analysis.");
      }
    } finally {
      if (jdUploadTokenRef.current === token) setIsExtractingJd(false);
    }
  };

  const handleJdTextChange = (value: string) => {
    setJdText(value);
    setJdFile(null);
    setJdFileParsed(null);
    setIsExtractingJd(false);
    jdUploadTokenRef.current++;
  };

  const handleJdClear = () => {
    setJdText("");
    setJdFile(null);
    setJdFileParsed(null);
    setIsExtractingJd(false);
    jdUploadTokenRef.current++;
  };

  const analyzeMatch = async () => {
    setError(null);
    if (!uploadedFile && !sessionResumeId) return setError("Please upload a resume.");
    if (!sessionJdId && !jdFile && !jdText.trim()) return setError("Please upload a JD file or paste JD text.");

    setWizardStep(4);
    setIsProcessing(true);
    setProcessingStage("parsing");

    try {
      const { resume_id, fullResumeData } = await resolveResumeForMatch(uploadedFile, sessionResumeId, setProcessingStage);

      setProcessingStage("matching");

      const { jd_id, jdParsed, resolvedJdText } = await resolveJDForMatch(sessionJdId, jdFile, jdFileParsed, jdText, setJdText);

      if (!jd_id) {
        setError("JD parsing failed — no JD ID returned.");
        setIsProcessing(false);
        setWizardStep(3);
        return;
      }

      setProcessingStage("scoring");

      const matchResp = await matchWithRetry(resume_id, jd_id);

      let finalMatchData = await resolveFinalMatchData(matchResp, resume_id, jd_id);

      // Backend returns success:true with a 0% score and eligible:false when
      // the resume structurally can't qualify (e.g. required years of
      // experience the candidate doesn't have) — see the "reason" field in
      // match_result. That's not a request failure, so matchWithRetry won't
      // catch it, but showing the normal all-zero analysis screen for it reads
      // as a broken match rather than the explained ineligibility it is.
      if (finalMatchData?.match_result?.eligible === false) {
        throw new Error(
          finalMatchData.match_result.reason || "Your resume doesn't meet this job's requirements."
        );
      }

      setProcessingStage("generating");

      try {
        const analytics = await getMatchAnalytics(resume_id, jd_id);
        if (analytics) finalMatchData = { ...finalMatchData, analytics };
      } catch {}

      const newMatchResults = {
        data: finalMatchData,
        match_id: matchResp.match_id || finalMatchData?.match_id,
        jd_id,
        duplicate: matchResp.duplicate,
      };

      const resolvedResumeName = uploadedFile?.name || sessionResumeName || fullResumeData?.file_name || null;
      const resolvedJdName = jdFile?.name || null;
      const resolvedResumeSizeMB = uploadedFile ? uploadedFile.size / (1024 * 1024) : null;
      const resolvedJdSizeMB = jdFile ? jdFile.size / (1024 * 1024) : null;
      const resolvedAnalyzedAt = new Date().toISOString();

      setMatchResults(newMatchResults);
      setParsedResumeData(fullResumeData);
      setParsedJDData(jdParsed);
      setResumeFileName(resolvedResumeName);
      setJdFileName(resolvedJdName);
      setResumeSizeMB(resolvedResumeSizeMB);
      setJdSizeMB(resolvedJdSizeMB);
      setAnalyzedAt(resolvedAnalyzedAt);

      try {
        const snapshotWritten = writeJobmatchSessionSnapshot({
          matchResults: newMatchResults,
          parsedResumeData: fullResumeData,
          parsedJDData: jdParsed,
          jdText: resolvedJdText,
          resumeName: resolvedResumeName ?? undefined,
          jobDescriptionName: resolvedJdName ?? undefined,
          resumeSizeMB: resolvedResumeSizeMB ?? undefined,
          jdSizeMB: resolvedJdSizeMB ?? undefined,
          analyzedAt: resolvedAnalyzedAt,
        });
        // The in-memory state set above is still correct for THIS render — a
        // failed write only matters the next time this component mounts
        // (e.g. navigating away and back), since writeJobmatchSessionSnapshot
        // rolls back to the previous run's session data on failure rather
        // than this one. Warn now, while there's still context, instead of
        // letting that remount silently show stale results with no explanation.
        if (!snapshotWritten) {
          toast.warning("Your results are shown below, but couldn't be saved for this browser tab — they may not survive a page refresh.");
        }
      } catch {}

      setTimeout(() => {
        setIsProcessing(false);
        setActiveTab("analysis");
        if (containerRef.current) {
          const top = containerRef.current.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 1500);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const { errorMessage, details } = parseAnalyzeMatchError(err);
      setError(errorMessage);
      setErrorDetails(details);
      setIsProcessing(false);
      setWizardStep(3);
    }
  };

  // ── Analysis mode ──────────────────────────────────────────────────────────
  if (!isProcessing && activeTab === "analysis" && matchResults) {
    return (
      <>
        {showDetailedAnalysis ? <AnalysisContent
          jdText={jdText}
          parsedResumeData={parsedResumeData}
          parsedJDData={parsedJDData}
          matchResults={matchResults}
          onBackToUpload={() => setShowDetailedAnalysis(false)}
        /> : <MatchResultsOverview
          matchResults={matchResults}
          resumeName={uploadedFile?.name || sessionResumeName || resumeFileName || "Your resume"}
          jobDescriptionName={jdFile?.name || jdFileName || "Job description"}
          resumeSizeMB={(uploadedFile ? uploadedFile.size / (1024 * 1024) : resumeSizeMB) ?? undefined}
          jdSizeMB={(jdFile ? jdFile.size / (1024 * 1024) : jdSizeMB) ?? undefined}
          analyzedAt={analyzedAt ?? undefined}
          onBack={() => { setActiveTab("upload"); setWizardStep(0); setShowDetailedAnalysis(false); }}
          onDetails={() => setShowDetailedAnalysis(true)}
        />}
        <ErrorPopupModal
          error={error}
          onRetry={() => { setError(null); setErrorDetails({}); }}
          onClose={() => { setError(null); setErrorDetails({}); }}
          details={errorDetails}
        />
      </>
    );
  }

  // ── Loading mode ───────────────────────────────────────────────────────────
  const hasValidJdInput = () => {
    const value = jdText.trim();
    return Boolean(jdFile) || /^https?:\/\//i.test(value) || value.length >= 200;
  };

  const stepContinueDisabled = () => {
    if (wizardStep === 1) return !uploadedFile && !sessionResumeId;
    if (wizardStep === 2) return isExtractingJd || !hasValidJdInput();
    if (wizardStep === 3) return (!uploadedFile && !sessionResumeId) || isExtractingJd || !hasValidJdInput();
    return false;
  };

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{WIZARD_OVERVIEW_STYLES}</style>

      {/* ── Outer wrapper: scopes overlay to the content area only ── */}
      {/* minHeight subtracts the fixed Header's height (h-14 = 3.5rem) — this
          renders inside <main className="mt-14">, so a plain 100vh here would
          stack on top of that offset and overflow the viewport by 3.5rem,
          producing an empty scrollbar (see AnalysisContent.tsx, which uses
          the same calc for the same reason). */}
      <div style={{ position: "relative", minHeight: "calc(100vh - 3.5rem)" }}>

      {/* ── Page shell — blurs only this area when modal is open ── */}
      <div ref={containerRef} className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden" style={{
        background: "linear-gradient(115deg, #f5faff, #f8fcff 55%, #f5faff)",
        filter: wizardStep > 0 ? "blur(4px)" : "none",
        transition: "filter 0.25s ease",
        pointerEvents: wizardStep > 0 ? "none" : "auto",
      }}>

        <div className="jm-container">
          <JobMatchStartCard mounted={mounted} onStart={() => setWizardStep(1)} />
        </div>
      </div>

      {/* ── WIZARD MODAL (absolute overlay — scoped to content area) ── */}
      <WizardModalShell
        open={wizardStep > 0}
        wizardStep={wizardStep}
        onClose={() => { setError(null); setWizardStep(0); }}
        onBack={() => { setError(null); setWizardStep(prev => (prev - 1) as 0 | 1 | 2 | 3 | 4); }}
        onContinueClick={() => {
          if (stepContinueDisabled()) {
            setError(wizardStep === 1
              ? "Please upload a resume first."
              : "Please add at least 200 characters, upload a job description file, or enter a valid job URL."
            );
            return;
          }
          setError(null);
          setWizardStep(prev => (prev + 1) as 1 | 2 | 3 | 4);
        }}
        continueDisabled={stepContinueDisabled()}
        onAnalyzeClick={analyzeMatch}
      >
        {wizardStep === 1 && (
          <WizardStepResume
            uploadedFile={uploadedFile}
            sessionResumeName={sessionResumeName}
            error={error}
            onFileSelected={handleResumeUpload}
            onClear={() => {
              setUploadedFile(null);
              setSessionResumeId(null);
              setSessionResumeName(null);
              setError(null);
            }}
          />
        )}
        {wizardStep === 2 && (
          <WizardStepJobDescription
            jdText={jdText}
            jdFile={jdFile}
            isExtractingJd={isExtractingJd}
            error={error}
            onTextChange={handleJdTextChange}
            onFileSelected={handleJDFileUpload}
            onClear={handleJdClear}
          />
        )}
        {wizardStep === 3 && (
          <WizardStepConfirm
            uploadedFile={uploadedFile}
            sessionResumeName={sessionResumeName}
            jdFile={jdFile}
            jdText={jdText}
            error={error}
            onReplaceResume={() => { setError(null); setWizardStep(1); }}
            onEditJobDescription={() => { setError(null); setWizardStep(2); }}
          />
        )}
        {wizardStep === 4 && isProcessing && <LoadingAnimation stage={processingStage} />}
      </WizardModalShell>

      </div>{/* ── end outer wrapper ── */}

      <ErrorPopupModal
        error={error}
        onRetry={() => { setError(null); setErrorDetails({}); }}
        onClose={() => { setError(null); setErrorDetails({}); }}
        details={errorDetails}
      />
    </>
  );
};

export default Overview;
