"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Upload, Link2, X, ChevronRight,
  Eye, AlertCircle, Zap, CheckCircle2,
  ArrowRight,
} from "lucide-react";
import AnalysisContent from "./analysis/AnalysisContent";
import LoadingAnimation from "./ui/LoadingAnimation";
import ErrorPopupModal from "@/components/ErrorPopupModal";

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

async function getMatchByIds(resume_id: string, jd_id: string) {
  const response = await fetch(`/api/v1/matcher/match?resume_id=${resume_id}&jd_id=${jd_id}`);
  if (!response.ok) throw new Error("Failed to fetch match");
  return response.json();
}

const SKILL_VOCAB = [
  "React","TypeScript","Vite","GraphQL","Apollo","Tailwind",
  "CSS","Figma","WebGL","Yjs","Rust","WASM","REST","Web Vitals",
];

const WIZARD_STEPS = [
  { title: "Upload Resume",    desc: "Upload your resume in PDF or DOCX format." },
  { title: "Job Description",  desc: "Paste or upload the target job posting." },
  { title: "Get Match Score",  desc: "AI analyzes fit and highlights skill gaps." },
];

const MODAL_TABS = [
  { num: 1, label: "Upload Resume",    icon: Upload },
  { num: 2, label: "Job Description",  icon: Link2 },
  { num: 3, label: "Analyze",          icon: Sparkles },
];

// ── Main Component ─────────────────────────────────────────────────────────────
const Overview = ({ sessionId }: { sessionId?: string }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sessionResumeId, setSessionResumeId] = useState<string | null>(null);
  const [sessionResumeName, setSessionResumeName] = useState<string | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
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

  const [jdText, setJdText] = useState<string>(() => {
    if (sessionId) return "";
    try { return sessionStorage.getItem("jm_jdText") || ""; } catch { return ""; }
  });

  const [activeTab, setActiveTab] = useState<"upload" | "analysis" | "chat">(() => {
    // Always start with upload page, clear old session data
    try {
      sessionStorage.removeItem("jm_matchResults");
      sessionStorage.removeItem("jm_parsedResumeData");
      sessionStorage.removeItem("jm_parsedJDData");
    } catch {}
    return "upload";
  });

  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  // 0 = landing overview, 1 = upload resume, 2 = job description, 3 = confirm & analyze
  const [wizardStep, setWizardStep] = useState<0 | 1 | 2 | 3>(0);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdUploadRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoAnalyzedRef = useRef(false);
  const jdTextareaRef = useRef<HTMLTextAreaElement>(null);
  const jdOverlayRef = useRef<HTMLDivElement>(null);
  const [sessionJdId, setSessionJdId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const jdSkills = useMemo(() => {
    if (!jdText) return [];
    return SKILL_VOCAB.filter(s =>
      new RegExp(`\\b${s.replace(/\+/g, "\\+")}\\b`, "i").test(jdText)
    );
  }, [jdText]);

  const jdHtml = useMemo(() => {
    if (!jdText) return "";
    let h = jdText.replace(/[<>&]/g, ch => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[ch] || ch));
    jdSkills.forEach(s => {
      h = h.replace(
        new RegExp(`\\b(${s.replace(/\+/g, "\\+")})\\b`, "gi"),
        '<mark style="background:rgba(37,87,167,0.12);color:#2557a7;border-radius:3px;padding:0 2px">$1</mark>'
      );
    });
    return h;
  }, [jdText, jdSkills]);

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
    if (file.size > 10 * 1024 * 1024) { setError("Resume must be under 10MB."); return; }
    setUploadedFile(file);
    setError(null);
  };

  const handleJDFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { setJdText(e.target?.result as string); setJdFile(file); setError(null); };
    reader.onerror = () => { setError("Failed to read job description file"); };
    reader.readAsText(file);
  };

  const analyzeMatch = async () => {
    setError(null);
    if (!uploadedFile && !sessionResumeId) return setError("Please upload a resume.");
    if (!sessionJdId && !jdFile && !jdText.trim()) return setError("Please upload a JD file or paste JD text.");

    setIsProcessing(true);
    setProcessingStage("parsing");

    try {
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

      setProcessingStage("matching");

      let jd_id: string | null = sessionJdId ?? null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let jdParsed: any = null;

      if (!jd_id) {
        if (jdText.trim()) {
          const trimmedText = jdText.trim();
          const isUrl = /^https?:\/\/.+/i.test(trimmedText);
          jdParsed = isUrl ? await parseJDUrl(trimmedText) : await parseJDText(trimmedText);
        } else if (jdFile) {
          jdParsed = await parseJDFile(jdFile);
        } else {
          throw new Error("No job description provided");
        }
        jd_id = jdParsed?.jd_id ?? null;
      }

      if (!jd_id) return setError("JD parsing failed — no JD ID returned.");

      setProcessingStage("scoring");

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

      setMatchResults(newMatchResults);
      setParsedResumeData(fullResumeData);
      setParsedJDData(jdParsed);

      try {
        sessionStorage.setItem("jm_matchResults", JSON.stringify(newMatchResults));
        sessionStorage.setItem("jm_parsedResumeData", JSON.stringify(fullResumeData));
        sessionStorage.setItem("jm_parsedJDData", JSON.stringify(jdParsed));
        sessionStorage.setItem("jm_jdText", jdText);
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

      setError(errorMessage);
      setErrorDetails(details);
      setIsProcessing(false);
    }
  };

  // ── Analysis mode ──────────────────────────────────────────────────────────
  if (!isProcessing && activeTab === "analysis" && matchResults) {
    return (
      <>
        <AnalysisContent
          jdText={jdText}
          parsedResumeData={parsedResumeData}
          parsedJDData={parsedJDData}
          matchResults={matchResults}
          onBackToUpload={() => { setActiveTab("upload"); setWizardStep(0); }}
        />
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
  if (isProcessing) {
    return <LoadingAnimation stage={processingStage} />;
  }

  const stepContinueDisabled = () => {
    if (wizardStep === 1) return !uploadedFile && !sessionResumeId;
    if (wizardStep === 2) return jdText.trim().length < 20 && !jdFile;
    return false;
  };

  // ── Main UI ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .jm-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 64px 44px 40px;
        }
        @media (max-width: 1280px) { .jm-container { padding: 48px 32px 28px; } }
        @media (max-width: 768px) { .jm-container { padding: 32px 16px 16px; } }
        .jm-action-btn:hover {
          background: #EEF4FF !important;
          border-color: rgba(37,87,167,0.25) !important;
          color: #2557a7 !important;
        }
        .jm-sample-item:hover { background: #F0F5FF !important; }
        .jm-start-btn:hover {
          box-shadow: 0 10px 36px rgba(37,87,167,0.44) !important;
          transform: translateY(-1px) !important;
        }
      `}</style>

      <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
        onChange={e => e.target.files?.[0] && handleResumeUpload(e.target.files[0])} />
      <input ref={jdUploadRef} type="file" accept=".txt,.pdf,.doc,.docx" className="hidden"
        onChange={e => e.target.files?.[0] && handleJDFileUpload(e.target.files[0])} />

      {/* ── Outer wrapper: scopes overlay to the content area only ── */}
      <div style={{ position: "relative", minHeight: "100vh" }}>

      {/* ── Page shell — blurs only this area when modal is open ── */}
      <div ref={containerRef} className="relative min-h-screen overflow-hidden" style={{
        background: "#EEF4FF",
        filter: wizardStep > 0 ? "blur(4px)" : "none",
        transition: "filter 0.25s ease",
        pointerEvents: wizardStep > 0 ? "none" : "auto",
      }}>

        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(37,87,167,0.07) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="absolute top-0 left-1/4 w-150 h-100 pointer-events-none" style={{
          background: "radial-gradient(ellipse, rgba(37,87,167,0.06) 0%, transparent 70%)",
        }} />

        <div className="jm-container">

          {/* ── HERO ── */}
          <motion.div
            style={{ maxWidth: 760, marginBottom: 28 }}
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div style={{ marginBottom: 16 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#fff", border: "1px solid rgba(37,87,167,0.16)",
                borderRadius: 99, padding: "5px 14px 5px 6px",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.09em",
                color: "#2557a7", textTransform: "uppercase",
                boxShadow: "0 2px 8px rgba(37,87,167,0.09)",
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", background: "#FFC85E",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Sparkles style={{ width: 11, height: 11, color: "#2557a7" }} />
                </span>
                AI Job Matching
              </span>
            </div>

            <h1 style={{
              fontSize: "clamp(42px, 4.8vw, 64px)",
              fontWeight: 900, lineHeight: 1.04,
              letterSpacing: "-0.038em", margin: "0 0 14px",
            }}>
              <span style={{ color: "#0f172a" }}>Job </span>
              <span style={{ color: "#2557a7" }}>Match</span>
            </h1>

            <p style={{ fontSize: 16.5, color: "#4A5568", lineHeight: 1.65, maxWidth: 560, margin: "0 0 20px" }}>
              Upload your resume and paste a job description to get an instant AI-powered match score with actionable gap insights.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 22px", marginBottom: 18 }}>
              {[
                { label: "AI-powered matching", el: <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2557a7", display: "inline-block" }} /> },
                { label: "Skills gap analysis",  el: <Zap style={{ width: 13, height: 13, color: "#2557a7" }} /> },
                { label: "Results in ~30s",      el: <Eye style={{ width: 13, height: 13, color: "#2557a7" }} /> },
              ].map(({ label, el }, i) => (
                <React.Fragment key={label}>
                  {i > 0 && <span style={{ width: 1, height: 14, background: "#C8D6E8", display: "inline-block" }} />}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#4A5568", fontWeight: 500 }}>
                    {el}{label}
                  </span>
                </React.Fragment>
              ))}
            </div>

          </motion.div>

          {/* ── LANDING CARD (always visible) ── */}
          <motion.div
            style={{ maxWidth: "100%" }}
            initial={{ opacity: 0, y: 28 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)",
              border: "1px solid #EBEBEB",
              padding: "40px 80px 36px",
            }}>

              {/* Steps row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", marginBottom: 36 }}>
                {WIZARD_STEPS.map((step, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 44, flexShrink: 0, width: 100 }}>
                        <ArrowRight style={{ width: 18, height: 18, color: "#94A3B8" }} />
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1 }}>
                      <span style={{ fontSize: 90, fontWeight: 800, lineHeight: 1, color: "#EBEBEB", display: "block", marginBottom: 10, letterSpacing: "-0.04em", userSelect: "none" }}>
                        {idx + 1}
                      </span>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "0 0 8px", lineHeight: 1.3 }}>{step.title}</p>
                      <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, lineHeight: 1.55, maxWidth: 200 }}>{step.desc}</p>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* CTA button */}
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => setWizardStep(1)}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    height: 42, padding: "0 36px", borderRadius: 12,
                    background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
                    color: "#fff", fontSize: 14, fontWeight: 700,
                    border: "none", cursor: "pointer",
                    boxShadow: "0 4px 18px rgba(37,87,167,0.35)",
                    transition: "all 0.2s ease",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(37,87,167,0.48)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 18px rgba(37,87,167,0.35)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  Check My Match Score
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      </div>

      {/* ── WIZARD MODAL (absolute overlay — scoped to content area) ── */}
      <AnimatePresence>
        {wizardStep > 0 && (
          <motion.div
            key="wizard-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(15,23,42,0.30)",
              zIndex: 1000,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => { setError(null); setWizardStep(0); }}
          >
            <motion.div
              key="wizard-card"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                background: "#F6F8FA",
                borderRadius: 20,
                boxShadow: "0 8px 16px rgba(0,0,0,0.10), 0 32px 80px rgba(15,23,42,0.28)",
                width: "100%", maxWidth: 620,
                overflow: "hidden",
              }}
              onClick={e => e.stopPropagation()}
            >

              {/* ── Modal header: pill tab breadcrumb ── */}
              <div style={{
                padding: "14px 20px",
                background: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.07)",
                display: "flex", alignItems: "center", gap: 30,
                position: "relative", zIndex: 1,
              }}>
                {MODAL_TABS.map((tab, idx) => {
                  const Icon = tab.icon;
                  const isActive = wizardStep === tab.num;
                  const isDone = wizardStep > tab.num;
                  return (
                    <React.Fragment key={tab.num}>
                      {idx > 0 && (
                        <span style={{ color: "#CBCBCB", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>›</span>
                      )}
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        padding: "6px 16px", borderRadius: 99,
                        border: isActive ? "1.5px solid #2557a7" : "1.5px solid transparent",
                        background: "#fff",
                        boxShadow: isActive
                          ? "0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)"
                          : "0 1px 4px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)",
                        transition: "all 0.2s",
                        flexShrink: 0,
                      }}>
                        {isDone
                          ? <CheckCircle2 style={{ width: 14, height: 14, color: "#2557a7" }} />
                          : <Icon style={{ width: 14, height: 14, color: isActive ? "#2557a7" : "#BBBBBB" }} />
                        }
                        <span style={{
                          fontSize: 13, fontWeight: isActive ? 700 : 500,
                          color: isActive ? "#2557a7" : isDone ? "#94A3B8" : "#BBBBBB",
                          whiteSpace: "nowrap",
                        }}>
                          {tab.label}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}

              </div>

              {/* ── Modal step content ── */}
              <div style={{ padding: "28px 28px 20px" }}>

                {/* Step 1: Upload Resume */}
                {wizardStep === 1 && (
                  <div>
                    {/* Outer card: header + body */}
                    <div style={{
                      border: "1px solid #E8EDF5",
                      borderRadius: "24px 24px 0 0",
                      overflow: "hidden",
                      background: "#fff",
                    }}>
                      {/* Card header */}
                      <div style={{
                        padding: "12px 16px",
                        background: "#fff",
                        borderBottom: "1px solid #E8EDF5",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "linear-gradient(135deg, #2557a7, #1a3a8f)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          boxShadow: "0 2px 6px rgba(37,87,167,0.25)",
                        }}>
                          <Upload style={{ width: 13, height: 13, color: "#fff" }} />
                        </div>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                          Step 1 : Upload Resume
                        </p>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: "16px" }}>
                        {/* Dropzone — always visible */}
                        <div
                          role="button" tabIndex={0}
                          style={{
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center", gap: 12,
                            cursor: "pointer",
                            border: "none",
                            background: "#fff",
                            padding: "28px 24px",
                          }}
                          onDragOver={e => e.preventDefault()}
                          onDragLeave={() => {}}
                          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleResumeUpload(f); }}
                          onClick={() => resumeInputRef.current?.click()}
                          onKeyDown={e => (e.key === "Enter" || e.key === " ") && resumeInputRef.current?.click()}
                        >
                          <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: "#EEF4FF", border: "1.5px solid #C7D9F5",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Upload style={{ width: 24, height: 24, color: "#2557a7" }} />
                          </div>

                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
                              Upload your resume here
                            </p>
                            <p style={{ fontSize: 12, color: "#94A3B8", margin: "0 0 4px" }}>
                              (pdf upto 10MB)
                            </p>
                            <p style={{ fontSize: 12.5, color: "#94A3B8", margin: 0 }}>
                              Upload your Resume in a PDF or DOCX Format
                            </p>
                          </div>

                          <button
                            onClick={e => { e.stopPropagation(); resumeInputRef.current?.click(); }}
                            style={{
                              height: 40, padding: "0 32px", borderRadius: 99,
                              background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
                              color: "#fff", fontSize: 13.5, fontWeight: 700,
                              border: "none", cursor: "pointer",
                              boxShadow: "0 3px 12px rgba(37,87,167,0.28)",
                              marginTop: 4,
                            }}
                          >
                            Choose File
                          </button>

                          {/* Filename shown below button after selection */}
                          {(uploadedFile || sessionResumeName) && (
                            <p style={{ fontSize: 13, color: "#2557a7", fontWeight: 600, margin: 0 }}>
                              {uploadedFile ? uploadedFile.name : sessionResumeName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 14px", marginTop: 12, borderRadius: 10,
                        background: "#FEF2F2", border: "1px solid #FECACA",
                      }}>
                        <AlertCircle style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Job Description */}
                {wizardStep === 2 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
                      <div>
                        <h3 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", margin: "0 0 3px" }}>Job Description</h3>
                        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Paste text, a job URL, or upload a file</p>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                        <button onClick={() => jdUploadRef.current?.click()} className="jm-action-btn" style={{
                          display: "inline-flex", alignItems: "center", gap: 5, height: 30,
                          fontSize: 11, fontWeight: 600, color: "#4A5568",
                          background: "#F5F8FC", border: "1px solid #DDE5F0",
                          padding: "0 11px", borderRadius: 8, cursor: "pointer",
                          transition: "all 0.15s",
                        }}>
                          <Upload style={{ width: 11, height: 11 }} />File
                        </button>
                      </div>
                    </div>

                    <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
                      {jdText && (
                        <div
                          ref={jdOverlayRef}
                          style={{
                            position: "absolute", inset: 0,
                            padding: "12px 14px", fontFamily: "inherit",
                            fontSize: 13.5, lineHeight: 1.7, color: "#0f172a",
                            whiteSpace: "pre-wrap", wordBreak: "break-word",
                            pointerEvents: "none", overflowY: "auto", borderRadius: 12,
                            scrollbarWidth: "none",
                          }}
                          dangerouslySetInnerHTML={{ __html: jdHtml }}
                        />
                      )}
                      <textarea
                        ref={jdTextareaRef}
                        value={jdText}
                        onChange={e => { setJdText(e.target.value); setJdFile(null); }}
                        onScroll={e => {
                          if (jdOverlayRef.current) {
                            jdOverlayRef.current.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
                          }
                        }}
                        placeholder={`Paste the full job description here...

Example:
We are looking for a Software Engineer with 3+ years of experience in React, Node.js, and AWS. The ideal candidate should have strong problem-solving skills, experience with REST APIs, and familiarity with agile methodologies...`}
                        spellCheck={false}
                        style={{
                          minHeight: 300, padding: "12px 14px",
                          resize: "none", borderRadius: 12,
                          border: "1.5px solid #DDE5F0", outline: "none",
                          background: "#fff",
                          fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.7,
                          color: jdText ? "transparent" : "#B0BAC8",
                          caretColor: "#2557a7", width: "100%", boxSizing: "border-box",
                          transition: "border-color 0.15s, box-shadow 0.15s",
                          overflowY: "auto",
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = "#2557a7";
                          e.target.style.boxShadow = "0 0 0 3px rgba(37,87,167,0.09)";
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = "#DDE5F0";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                      {jdText && (
                        <button
                          onClick={() => { setJdText(""); setJdFile(null); }}
                          style={{
                            position: "absolute", top: 9, right: 9,
                            width: 20, height: 20, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "#E8EEF8", color: "#64748B",
                            cursor: "pointer", border: "none",
                          }}
                        >
                          <X style={{ width: 10, height: 10 }} />
                        </button>
                      )}
                    </div>

                    {error && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 14px", marginTop: 10, borderRadius: 10,
                        background: "#FEF2F2", border: "1px solid #FECACA",
                      }}>
                        <AlertCircle style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Confirm & Analyze */}
                {wizardStep === 3 && (() => {
                  const isUrl = /^https?:\/\/.+/i.test(jdText.trim());
                  const jdLabel = jdFile
                    ? jdFile.name
                    : isUrl
                      ? jdText.trim()
                      : jdText.slice(0, 60) + (jdText.length > 60 ? "…" : "");
                  const jdSubLabel = jdFile
                    ? "File added successfully"
                    : isUrl
                      ? "URL added successfully"
                      : "Text added successfully";

                  return (
                    <div>
                      {/* Header */}
                      <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: "50%",
                          background: "#f0fdf4", border: "2px solid #86efac",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          margin: "0 auto 14px",
                        }}>
                          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 10l4 4 8-8"/>
                          </svg>
                        </div>
                        <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>Ready to Analyze</h3>
                        <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
                          We&apos;ve received your resume and job description.<br />
                          Click the button below to get your AI match score.
                        </p>
                      </div>

                      {/* Review card */}
                      <div style={{
                        background: "#fff",
                        border: "1px solid #E8EDF5",
                        borderRadius: 16,
                        overflow: "hidden",
                        marginBottom: 20,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                      }}>
                        {/* Row: Resume */}
                        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px" }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: "#F1F5F9",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <Upload style={{ width: 16, height: 16, color: "#2557a7" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 10, color: "#94A3B8", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700 }}>Resume</p>
                            <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {uploadedFile ? uploadedFile.name : sessionResumeName || "Resume ready"}
                            </p>
                            <p style={{ fontSize: 11.5, color: "#64748B", margin: 0 }}>Uploaded successfully</p>
                          </div>
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: "#f0fdf4", border: "1px solid #bbf7d0",
                            padding: "5px 12px", borderRadius: 99, flexShrink: 0,
                          }}>
                            <svg width="9" height="9" viewBox="0 0 20 20" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 10l4 4 8-8"/>
                            </svg>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>Ready</span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: "#F1F5F9" }} />

                        {/* Row: Job Description */}
                        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px" }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: "#F1F5F9",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <Link2 style={{ width: 16, height: 16, color: "#2557a7" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 10, color: "#94A3B8", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700 }}>Job Description</p>
                            <p style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {jdLabel}
                            </p>
                            <p style={{ fontSize: 11.5, color: "#64748B", margin: 0 }}>{jdSubLabel}</p>
                          </div>
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: "#f0fdf4", border: "1px solid #bbf7d0",
                            padding: "5px 12px", borderRadius: 99, flexShrink: 0,
                          }}>
                            <svg width="9" height="9" viewBox="0 0 20 20" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 10l4 4 8-8"/>
                            </svg>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>Ready</span>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "10px 14px", marginBottom: 16, borderRadius: 10,
                          background: "#FEF2F2", border: "1px solid #FECACA",
                        }}>
                          <AlertCircle style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
                        </div>
                      )}

                      <button
                        onClick={analyzeMatch}
                        style={{
                          width: "100%", height: 56, borderRadius: 14,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                          fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em",
                          cursor: "pointer",
                          background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
                          color: "#fff", border: "none",
                          boxShadow: "0 6px 24px rgba(37,87,167,0.34)",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={e => {
                          const b = e.currentTarget as HTMLButtonElement;
                          b.style.boxShadow = "0 10px 36px rgba(37,87,167,0.44)";
                          b.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={e => {
                          const b = e.currentTarget as HTMLButtonElement;
                          b.style.boxShadow = "0 6px 24px rgba(37,87,167,0.34)";
                          b.style.transform = "translateY(0)";
                        }}
                      >
                        <Sparkles style={{ width: 18, height: 18 }} />
                        Analyze Match Score
                        <ChevronRight style={{ width: 17, height: 17 }} />
                      </button>

                      <p style={{
                        textAlign: "center", fontSize: 11.5, color: "#94A3B8",
                        marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        End-to-end encrypted · Never stored · 100% private
                      </p>
                    </div>
                  );
                })()}

              </div>

              {/* ── Modal footer: navigation ── */}
              <div style={{
                padding: "16px 24px",
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                background: "#F6F8FA",
              }}>
                <button
                  onClick={() => { setError(null); setWizardStep(prev => (prev - 1) as 0 | 1 | 2 | 3); }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    height: 40, padding: "0 20px", borderRadius: 10,
                    fontSize: 13.5, fontWeight: 600, color: "#64748B",
                    background: "#fff", border: "1.5px solid #E2E8F0",
                    cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  ← Go Back
                </button>

                {wizardStep < 3 && (
                  <button
                    onClick={() => {
                      if (stepContinueDisabled()) {
                        setError(wizardStep === 1
                          ? "Please upload a resume first."
                          : "Please add a job description (at least 20 characters)."
                        );
                        return;
                      }
                      setError(null);
                      setWizardStep(prev => (prev + 1) as 1 | 2 | 3);
                    }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      height: 40, padding: "0 24px", borderRadius: 10,
                      fontSize: 13.5, fontWeight: 700,
                      cursor: "pointer",
                      background: stepContinueDisabled()
                        ? "#F1F5F9"
                        : "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
                      color: stepContinueDisabled() ? "#94A3B8" : "#fff",
                      border: "none",
                      boxShadow: stepContinueDisabled() ? "none" : "0 4px 16px rgba(37,87,167,0.28)",
                      transition: "all 0.2s",
                    }}
                  >
                    Continue →
                  </button>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
