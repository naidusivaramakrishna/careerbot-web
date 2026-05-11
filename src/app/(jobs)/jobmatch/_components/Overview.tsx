"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { X } from "lucide-react";
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

// ── Constants ─────────────────────────────────────────────────────────────────

const SCAN_ITEMS = [
  { label: "React, TypeScript", detected: true },
  { label: "GraphQL, Apollo",   detected: true },
  { label: "WebGL",             detected: false },
  { label: "Yjs / CRDT",        detected: false },
  { label: "Web Vitals",        detected: true },
];

const SAMPLE_JD = `Senior Frontend Engineer — Modal Labs

We are hiring a Senior Frontend Engineer to build the next generation of our analytics workspace.

What you will bring
• 5+ years building production web UIs with React or comparable
• Deep fluency with TypeScript, Vite, and modern bundlers
• Experience with GraphQL clients (Apollo, urql, or Relay) and REST
• Strong product sense; comfortable in Figma, design tokens, prototyping in code
• Bonus: WebGL, real-time collaboration (Yjs / CRDT), Rust/WASM`;

const SAMPLES = [
  { t: "Senior Frontend Engineer", c: "Modal Labs" },
  { t: "Staff Product Designer",   c: "Vercel" },
  { t: "Data Scientist",           c: "Anthropic" },
  { t: "Backend Engineer",         c: "Stripe" },
];

const SKILL_VOCAB = [
  "React","TypeScript","Vite","GraphQL","Apollo","Tailwind",
  "CSS","Figma","WebGL","Yjs","Rust","WASM","REST","Web Vitals",
];

// ── Inline SVG helpers ────────────────────────────────────────────────────────
const ArrowRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10h12M11 5l5 5-5 5"/>
  </svg>
);

const EyeIcon = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z"/>
    <circle cx="10" cy="10" r="2.5"/>
  </svg>
);

const CheckSmall = () => (
  <svg width="9" height="9" viewBox="0 0 20 20" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10l4 4 8-8"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13V3M5.5 7.5 10 3l4.5 4.5"/>
    <path d="M3.5 14v2.5h13V14"/>
  </svg>
);

const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#5C5C58"
       strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3h7l3 3v11H5z"/>
    <path d="M12 3v3h3"/>
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 5 10 10M15 5 5 15"/>
  </svg>
);

const BoltIcon = () => (
  <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 3 4.5 12h4l-1 5L15 8h-4z"/>
  </svg>
);

// ── Live Scan Card ─────────────────────────────────────────────────────────────
function LiveScanCard() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % SCAN_ITEMS.length), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      background: "white",
      border: "1px solid rgba(0,0,0,0.09)",
      borderRadius: 20,
      boxShadow: "0 0 0 1px rgba(0,0,0,0.04), 0 8px 16px -4px rgba(0,0,0,0.08), 0 32px 64px -16px rgba(47,91,234,0.18)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#FAFAF8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: "#22C55E", animation: "jmPulseDot 1.4s ease-in-out infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#16A34A" }}>Live</span>
        </div>
        <span style={{ width: 1, height: 12, background: "rgba(0,0,0,0.12)", flexShrink: 0 }} />
        <span style={{ fontFamily: "monospace", fontSize: 10.5, color: "#9C9C98", letterSpacing: "0.06em" }}>Resume_2026.pdf</span>
        <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 10, color: "#C0C0BB", flexShrink: 0 }}>00:03.2</span>
      </div>
      {/* Role row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "#9C9C98", textTransform: "uppercase", letterSpacing: "0.08em" }}>Match against</span>
        <span style={{ fontWeight: 700, fontSize: 12.5, color: "#0B0B0A", letterSpacing: "-0.01em" }}>Modal Labs · Sr. Frontend</span>
      </div>
      {/* Skill rows */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {SCAN_ITEMS.map((it, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 13px", borderRadius: 10,
            background: i <= step ? (it.detected ? "rgba(22,163,74,0.04)" : "rgba(47,91,234,0.04)") : "#FAFAFA",
            border: `1px solid ${i <= step ? (it.detected ? "rgba(22,163,74,0.14)" : "rgba(47,91,234,0.14)") : "rgba(0,0,0,0.06)"}`,
            opacity: i <= step ? 1 : 0.35,
            transition: "all .4s ease",
          }}>
            <span style={{ fontSize: 13, fontWeight: 550, color: "#0B0B0A" }}>{it.label}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              padding: "2.5px 9px", borderRadius: 99,
              ...(it.detected
                ? { background: "rgba(22,163,74,0.10)", color: "#16A34A" }
                : { background: "rgba(47,91,234,0.10)", color: "#2F5BEA" }),
            }}>
              {it.detected ? "✓ MATCH" : "MISSING"}
            </span>
          </div>
        ))}
      </div>
      {/* Score bar */}
      <div style={{ margin: "0 14px 14px", padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg, #0B0B0A 0%, #1a1a2e 100%)", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", width: 58, height: 58, flexShrink: 0 }}>
            <svg width="58" height="58" viewBox="0 0 58 58">
              <circle cx="29" cy="29" r="23" stroke="rgba(255,255,255,0.10)" strokeWidth="4.5" fill="none"/>
              <circle cx="29" cy="29" r="23" stroke="url(#scoreGrad)" strokeWidth="4.5" fill="none"
                      strokeDasharray="122 145" strokeLinecap="round" transform="rotate(-90 29 29)"/>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#60A5FA"/>
                  <stop offset="100%" stopColor="#2F5BEA"/>
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>83</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.01em" }}>Strong baseline · 2 gaps</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", marginTop: 3 }}>3 rewrites ready · est. +9 pts</div>
            <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
              {[83, 91, 72, 88].map((v, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: `rgba(96,165,250,${0.25 + (v/100)*0.75})` }} />
              ))}
            </div>
          </div>
          <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
}

// ── Section mark ──────────────────────────────────────────────────────────────
function SectionMark({ num, label }: { num: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 32 }}>
      <span style={{ fontFamily: "monospace", fontSize: 13, color: "#2F5BEA", fontWeight: 600, letterSpacing: "0.05em" }}>{num}</span>
      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#8C8C88", textTransform: "uppercase", letterSpacing: "0.18em" }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.10)" }} />
    </div>
  );
}

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
  const [_parsedJDData, setParsedJDData] = useState<any>(null);

  const [jdText, setJdText] = useState<string>(() => {
    if (sessionId) return "";
    try { return sessionStorage.getItem("jm_jdText") || ""; } catch { return ""; }
  });

  const [activeTab, setActiveTab] = useState<"upload" | "analysis" | "chat">(() => {
    try {
      if (sessionStorage.getItem("jm_matchResults")) return "analysis";
    } catch {}
    return "upload";
  });

  const [error, setError] = useState<string | null>(null);
  const [workTab, setWorkTab] = useState<number>(0);
  const [drag, setDrag] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdUploadRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const autoAnalyzedRef = useRef(false);
  const [sessionJdId, setSessionJdId] = useState<string | null>(null);

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
        '<mark style="background:rgba(47,91,234,0.12);color:#2F5BEA;border-radius:3px;padding:0 2px">$1</mark>'
      );
    });
    return h;
  }, [jdText, jdSkills]);

  const canRun = (!!uploadedFile || !!sessionResumeId) && (jdText.trim().length > 20 || !!jdFile);

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
    setWorkTab(1);
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
          matchResults={matchResults}
          onBackToUpload={() => setActiveTab("upload")}
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

  // ── Editorial upload page ──────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes jmPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.82); }
        }
.jm-tab-btn:hover { background: rgba(255,255,255,0.45); }
        .jm-sample-btn:hover { background: rgba(255,255,255,0.55); }
        .jm-ghost-btn:hover { background: rgba(0,0,0,0.04); }
        .jm-cta-scan:hover { opacity: 0.88; }
        @media (max-width: 700px) {
          .jm-how-grid { grid-template-columns: 1fr !important; }
          .jm-stats-grid { grid-template-columns: 1fr !important; }
          .jm-two-col { grid-template-columns: 1fr !important; }
          .jm-beyond-grid { grid-template-columns: 1fr !important; }
          .jm-jd-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div ref={containerRef} style={{ minHeight: "100vh", background: "#ffffff", width: "100%", minWidth: 0 }}>

        {/* ── Shared gradient wrapper: Hero + Workspace ─────────────────── */}
        <div style={{
          position: "relative",
          background: "linear-gradient(150deg, #ffffff 0%, #f0f5ff 28%, #dce8ff 58%, #c8daff 100%)",
        }}>
          {/* Grid overlay — spans entire wrapper */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(37,87,167,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,87,167,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section style={{ position: "relative", overflow: "hidden" }}>
          {/* Top-left radial glow */}
          <div style={{
            position: "absolute", top: "-10%", left: "5%", width: 500, height: 500,
            borderRadius: "50%", pointerEvents: "none",
            background: "radial-gradient(circle, rgba(37,87,167,0.10) 0%, rgba(99,138,215,0.04) 50%, transparent 70%)",
          }} />

          <div style={{ position: "relative", padding: "80px 80px 72px" }}>
            <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>

              {/* Badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "5px 14px 5px 6px", borderRadius: 99, marginBottom: 28,
                background: "rgba(47,91,234,0.07)", border: "1px solid rgba(47,91,234,0.18)",
              }}>
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "2px 10px", borderRadius: 99,
                  background: "#2F5BEA", color: "white",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                }}>NEW</span>
                <span style={{ fontSize: 12.5, color: "#2F5BEA", fontWeight: 500, letterSpacing: "-0.01em" }}>
                  V3 — faster scans, smarter rewrites
                </span>
              </div>

              <h1 style={{
                fontSize: "clamp(48px,6.5vw,92px)",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                lineHeight: 0.94,
                margin: 0,
                color: "#0B0B0A",
              }}>
                Know your fit score<br />
                <em style={{ fontStyle: "italic", fontWeight: 400, color: "#2F5BEA", letterSpacing: "-0.025em" }}>
                  before you apply.
                </em>
              </h1>

              <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5C5C58", maxWidth: 580, margin: "24px auto 0" }}>
                Paste any job description, upload your résumé — JobMatch scores your fit, exposes every skill gap, and rewrites the bullets costing you interviews.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 10, marginTop: 32, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  className="jm-cta-scan"
                  onClick={() => workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 9,
                    padding: "14px 26px", borderRadius: 12,
                    background: "#2F5BEA", color: "white",
                    fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.01em",
                    border: "none", cursor: "pointer",
                    boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 10px 32px -8px rgba(47,91,234,0.50)",
                    transition: "opacity .15s",
                  }}
                >
                  Scan my résumé free <ArrowRight />
                </button>
                {matchResults ? (
                  <button
                    className="jm-ghost-btn"
                    onClick={() => setActiveTab("analysis")}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      padding: "13px 20px", borderRadius: 12,
                      background: "white", color: "#0B0B0A",
                      fontSize: 14.5, fontWeight: 500,
                      border: "1px solid rgba(0,0,0,0.13)", cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      transition: "background .15s",
                    }}
                  >
                    <EyeIcon size={13} /> View last analysis
                  </button>
                ) : null}
              </div>

              {/* Social proof */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 24 }}>
                <div style={{ display: "flex" }}>
                  {["#FF5435","#2B1F4E","#2E7D5B","#B86F1A"].map((c, i) => (
                    <span key={i} style={{
                      width: 28, height: 28, borderRadius: 99,
                      background: c, border: "2.5px solid rgba(248,249,255,0.9)",
                      marginLeft: i ? -9 : 0, display: "inline-block",
                    }} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#F59E0B", fontSize: 13, letterSpacing: 1 }}>★★★★★</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0B0B0A" }}>4.8</span>
                  <span style={{ fontSize: 13, color: "#9C9C98" }}>· 9,200 reviews · 4,212 joined this week</span>
                </div>
              </div>

              {/* Micro-stats row */}
              <div style={{
                display: "inline-flex", gap: 0, marginTop: 40,
                border: "1px solid rgba(0,0,0,0.09)", borderRadius: 14,
                background: "rgba(255,255,255,0.60)", backdropFilter: "blur(8px)",
                overflow: "hidden",
              }}>
                {[
                  { val: "4.1s", label: "Avg scan time" },
                  { val: "412",  label: "Signals checked" },
                  { val: "3.4×", label: "More callbacks" },
                  { val: "11",   label: "ATS systems" },
                ].map((s, i) => (
                  <div key={s.val} style={{
                    padding: "16px 28px",
                    borderLeft: i === 0 ? "none" : "1px solid rgba(0,0,0,0.08)",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.04em", color: "#0B0B0A", lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "#9C9C98", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 5 }}>{s.label}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>


        {/* ── Workspace (TRY IT) ─────────────────────────────────────────── */}
        <section ref={workspaceRef} style={{
          padding: "32px 80px 72px",
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{
            borderRadius: 20, overflow: "hidden",
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 4px 24px -4px rgba(37,87,167,0.10), 0 1px 0 rgba(255,255,255,0.9) inset",
          }}>
            {/* Workspace tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#F8FAFF" }}>
              {[{ label: "Résumé", idx: 0 }, { label: "Job description", idx: 1 }].map(({ label, idx }) => {
                const done = idx === 0 ? (!!uploadedFile || !!sessionResumeId) : (jdText.trim().length > 20 || !!jdFile);
                const active = workTab === idx;
                return (
                  <button
                    key={idx}
                    className="jm-tab-btn"
                    onClick={() => setWorkTab(idx)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 9,
                      padding: "14px 22px", fontSize: 13.5,
                      fontWeight: active ? 600 : 540,
                      color: active ? "#0B0B0A" : "#5C5C58",
                      background: "transparent",
                      border: "none",
                      borderBottom: active ? "2px solid #0B0B0A" : "2px solid transparent",
                      cursor: "pointer", transition: "background .15s, color .15s",
                      position: "relative",
                    }}
                  >
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#8C8C88" }}>0{idx + 1}</span>
                    {label}
                    {done && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        padding: "1.5px 7px", borderRadius: 99,
                        background: "#2E7D5B", color: "white",
                        fontSize: 10, fontWeight: 600,
                      }}>
                        <CheckSmall />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Workspace body */}
            <div style={{ padding: 24, minHeight: 280 }}>

              {/* Tab 0 — Résumé upload */}
              {workTab === 0 && (
                <>
                  <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx,.txt"
                         style={{ display: "none" }}
                         onChange={e => e.target.files?.[0] && handleResumeUpload(e.target.files[0])} />

                  {uploadedFile || sessionResumeId ? (
                    /* Filled state */
                    <div style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 18px", borderRadius: 12,
                      background: "#F8FAFF", border: "1px solid rgba(37,87,167,0.10)",
                    }}>
                      <div style={{
                        position: "relative", width: 42, height: 54, borderRadius: 6, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "#FBFAF7", border: "1px solid rgba(0,0,0,0.10)",
                      }}>
                        <FileIcon />
                        <span style={{
                          position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
                          background: "#0B0B0A", color: "white",
                          fontFamily: "monospace", fontSize: 9, fontWeight: 700,
                          padding: "1.5px 5px", borderRadius: 3, letterSpacing: "0.04em",
                        }}>
                          {uploadedFile ? (uploadedFile.name.split(".").pop() || "").toUpperCase() : "PDF"}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: 14.5, color: "#0B0B0A" }}>
                            {uploadedFile ? uploadedFile.name : sessionResumeName}
                          </span>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontFamily: "monospace", fontSize: 11, fontWeight: 540,
                            padding: "2px 8px", borderRadius: 99,
                            background: "rgba(46,125,91,0.10)", color: "#2E7D5B",
                            border: "1px solid rgba(46,125,91,0.32)",
                          }}>
                            <BoltIcon /> ATS Ready
                          </span>
                        </div>
                        <span style={{ fontSize: 12.5, color: "#5C5C58" }}>
                          {uploadedFile
                            ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`
                            : "From extension"}
                        </span>
                      </div>
                      <button
                        onClick={() => { setUploadedFile(null); setSessionResumeId(null); setSessionResumeName(null); }}
                        style={{
                          width: 30, height: 30, borderRadius: 7, display: "flex",
                          alignItems: "center", justifyContent: "center",
                          background: "transparent", border: "none", color: "#8C8C88", cursor: "pointer",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    /* Empty / drop zone */
                    <div
                      role="button"
                      tabIndex={0}
                      style={{
                        width: "100%", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        textAlign: "center",
                        gap: 14, padding: "52px 28px", borderRadius: 14,
                        background: drag ? "rgba(47,91,234,0.05)" : "#F8FAFF",
                        border: `1.5px dashed ${drag ? "#2F5BEA" : "rgba(0,0,0,0.20)"}`,
                        cursor: "pointer", transition: "all .2s",
                        boxSizing: "border-box",
                      }}
                      onDragOver={e => { e.preventDefault(); setDrag(true); }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleResumeUpload(f); }}
                      onClick={() => resumeInputRef.current?.click()}
                      onKeyDown={e => (e.key === "Enter" || e.key === " ") && resumeInputRef.current?.click()}
                    >
                      <span style={{
                        width: 54, height: 54, borderRadius: 99, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "#ffffff", border: "1px solid rgba(0,0,0,0.10)",
                        color: "#0B0B0A",
                      }}>
                        <UploadIcon />
                      </span>
                      <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", color: "#0B0B0A", margin: 0, textAlign: "center" }}>
                        Drop a résumé. We&apos;ll handle the rest.
                      </h3>
                      <p style={{ fontSize: 13.5, color: "#5C5C58", margin: 0, textAlign: "center" }}>
                        or{" "}
                        <span style={{ color: "#2F5BEA", fontWeight: 540, textDecoration: "underline", textUnderlineOffset: 3 }}>
                          browse files
                        </span>{" "}
                        — PDF, DOCX, DOC, TXT, ≤ 10 MB
                      </p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
                        {["PDF","DOCX","DOC","TXT"].map(f => (
                          <span key={f} style={{
                            fontSize: 10.5, fontFamily: "monospace", color: "#5C5C58",
                            padding: "2px 8px", borderRadius: 99,
                            background: "#FBFAF7", border: "1px solid rgba(0,0,0,0.10)",
                          }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tab 1 — Job description */}
              {workTab === 1 && (
                <div className="jm-jd-grid" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
                  <input ref={jdUploadRef} type="file" accept=".txt,.pdf,.doc,.docx"
                         style={{ display: "none" }}
                         onChange={e => e.target.files?.[0] && handleJDFileUpload(e.target.files[0])} />

                  <div style={{ position: "relative", minHeight: 240 }}>
                    {jdText && (
                      <div
                        style={{
                          position: "absolute", inset: 0, padding: "14px 16px",
                          fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.6,
                          color: "#0B0B0A", whiteSpace: "pre-wrap", wordBreak: "break-word",
                          pointerEvents: "none", overflow: "hidden",
                        }}
                        dangerouslySetInnerHTML={{ __html: jdHtml }}
                      />
                    )}
                    <textarea
                      value={jdText}
                      onChange={e => { setJdText(e.target.value); setJdFile(null); }}
                      placeholder="Paste a job description, or pick a sample on the right."
                      spellCheck={false}
                      style={{
                        width: "100%", minHeight: 240, padding: "14px 16px",
                        resize: "vertical", border: "1px solid rgba(0,0,0,0.10)",
                        borderRadius: 10, outline: "none",
                        background: "#F5F5F2",
                        fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.6,
                        color: jdText ? "transparent" : "#8C8C88",
                        caretColor: "#2F5BEA",
                      }}
                    />
                    {jdText && (
                      <button
                        onClick={() => { setJdText(""); setJdFile(null); }}
                        style={{
                          position: "absolute", top: 8, right: 8,
                          width: 28, height: 28, borderRadius: 99,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(0,0,0,0.08)", border: "none",
                          color: "#5C5C58", cursor: "pointer",
                        }}
                      >
                        <XIcon />
                      </button>
                    )}
                  </div>

                  {/* Sample rail */}
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: 14, borderRadius: 12,
                    background: "#F8FAFF", border: "1px solid rgba(37,87,167,0.08)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#5C5C58", textTransform: "uppercase", letterSpacing: "0.10em" }}>
                        Try a sample
                      </div>
                      <button
                        onClick={() => jdUploadRef.current?.click()}
                        style={{
                          fontSize: 10.5, fontFamily: "monospace", color: "#2F5BEA",
                          background: "transparent", border: "none", cursor: "pointer",
                          padding: "2px 0", textDecoration: "underline", textUnderlineOffset: 2,
                        }}
                      >
                        Upload file
                      </button>
                    </div>
                    {SAMPLES.map(s => (
                      <button
                        key={s.t}
                        className="jm-sample-btn"
                        onClick={() => setJdText(SAMPLE_JD.replace(/Senior Frontend Engineer/g, s.t).replace(/Modal Labs/g, s.c))}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 8,
                          padding: "8px 10px", borderRadius: 7, textAlign: "left",
                          background: "transparent", border: "none", cursor: "pointer",
                          transition: "background .15s",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 540, color: "#0B0B0A" }}>{s.t}</div>
                          <div style={{ fontSize: 11, color: "#8C8C88" }}>{s.c}</div>
                        </div>
                        <ArrowRight size={12} />
                      </button>
                    ))}
                    {jdFile && (
                      <div style={{
                        marginTop: 4, padding: "6px 10px", borderRadius: 8,
                        display: "flex", alignItems: "center", gap: 8,
                        background: "rgba(46,125,91,0.08)", border: "1px solid rgba(46,125,91,0.20)",
                      }}>
                        <CheckSmall />
                        <span style={{ fontSize: 11, fontFamily: "monospace", color: "#2E7D5B", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {jdFile.name}
                        </span>
                        <button onClick={() => setJdFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2E7D5B" }}>
                          <XIcon />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Workspace footer */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 22px",
              borderTop: "1px solid rgba(0,0,0,0.07)",
              background: "#F8FAFF",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <EyeIcon />
                <span style={{ fontSize: 12, color: "#8C8C88" }}>Files processed in-session. Never stored.</span>
              </div>
              <button
                onClick={analyzeMatch}
                disabled={!canRun}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 18px", borderRadius: 99,
                  background: canRun ? "#2F5BEA" : "#E8E7E2",
                  color: canRun ? "white" : "#8C8C88",
                  fontSize: 13.5, fontWeight: 600,
                  boxShadow: canRun ? "0 6px 20px -6px #2F5BEA" : "none",
                  border: "none", cursor: canRun ? "pointer" : "not-allowed",
                  transition: "all .2s",
                }}
              >
                {canRun ? "Run match" : "Add résumé + job"}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
          </div>
        </section>
        </div>{/* end shared gradient wrapper */}

        {/* ── 01 · How it works ─────────────────────────────────────────── */}
        <section style={{ padding: "0 80px 72px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionMark num="01" label="How it works" />
          <h2 style={{ fontSize: "clamp(36px,5vw,64px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.98, margin: "0 0 40px", color: "#0B0B0A" }}>
            Three moves between<br />you and the{" "}
            <em style={{ fontStyle: "italic", fontWeight: 400, color: "#2F5BEA" }}>shortlist.</em>
          </h2>
          <div className="jm-how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "1px solid rgba(0,0,0,0.10)", borderBottom: "1px solid rgba(0,0,0,0.10)", maxWidth: 1280, margin: "0 auto" }}>
            {[
              { n: "STEP 01", t: "Drop & decode", d: "We parse your résumé to its skeleton — every section, every bullet, every date — using the same parser ATS systems do." },
              { n: "STEP 02", t: "Match against the role", d: "Paste any JD or import via URL. JobMatch maps required skills to your experience and surfaces the gaps that matter." },
              { n: "STEP 03", t: "Rewrite, then apply", d: "Accept AI rewrites that sound like you. Export a tailored version per role, track which version converts." },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column", gap: 14,
                padding: "40px 32px 36px",
                borderRight: i < 2 ? "1px solid rgba(0,0,0,0.10)" : "none",
              }}>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#2F5BEA", fontWeight: 600, letterSpacing: "0.14em" }}>{s.n}</span>
                <h3 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", margin: 0, color: "#0B0B0A" }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: "#5C5C58", lineHeight: 1.55, margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* ── 02 · By the numbers ───────────────────────────────────────── */}
        <section style={{ padding: "0 80px 72px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionMark num="02" label="By the numbers" />
          <div className="jm-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "1px solid rgba(0,0,0,0.10)", maxWidth: 1280, margin: "0 auto" }}>
            {[
              { n: "3.4×", caption: "More interview callbacks vs. unedited résumés", italic: false },
              { n: "4.1",  caption: "Median seconds from upload to first score",      italic: true },
              { n: "412",  caption: "Signals checked per scan, across 11 ATS systems", italic: false },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "48px 32px",
                borderRight: i < 2 ? "1px solid rgba(0,0,0,0.10)" : "none",
                borderBottom: "1px solid rgba(0,0,0,0.10)",
              }}>
                <div style={{
                  fontSize: "clamp(64px,8vw,120px)", fontWeight: s.italic ? 400 : 900,
                  letterSpacing: "-0.06em", lineHeight: 0.87,
                  color: s.italic ? "#2F5BEA" : "#0B0B0A",
                  fontStyle: s.italic ? "italic" : "normal",
                }}>
                  {s.n}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 13, color: "#8C8C88", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 18 }}>
                  {s.caption}
                </div>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* ── 03 · ATS Optimizer ────────────────────────────────────────── */}
        <section style={{ padding: "0 80px 80px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionMark num="03" label="ATS Optimizer" />
          <div className="jm-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", maxWidth: 1280, margin: "0 auto" }}>
            <div>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#2F5BEA", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}>For the bots</span>
              <h2 style={{ fontSize: "clamp(28px,3.5vw,42px)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.05, margin: "12px 0 16px", color: "#0B0B0A" }}>
                The parser-first résumé editor.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: "#5C5C58", margin: "0 0 22px" }}>
                Three of every four résumés never reach a human. JobMatch reads yours through the same parsers
                Workday, Greenhouse, Lever, and eight other systems use — then tells you exactly what&apos;s getting eaten.
              </p>
              {["Per-section keyword density","Format & tag structure validation","Inline flags for missing & overstuffed terms","One-click rewrite for any bullet"].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14.5, color: "#2C2C2A", padding: "10px 0", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#8C8C88", minWidth: 32, paddingTop: 2 }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            {/* Score card */}
            <div style={{ padding: 24, borderRadius: 18, background: "#FBFAF7", border: "1px solid rgba(0,0,0,0.10)", boxShadow: "0 18px 48px -28px rgba(20,19,15,0.14)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#8C8C88", textTransform: "uppercase", letterSpacing: "0.10em" }}>Overall ATS</div>
                  <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: "#0B0B0A", marginTop: 4 }}>86</div>
                  <div style={{ fontSize: 13, color: "#2E7D5B", fontWeight: 540, marginTop: 6 }}>↑ 14 since first scan</div>
                </div>
                <div style={{ position: "relative", width: 96, height: 96 }}>
                  <svg width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" stroke="#E8E7E2" strokeWidth="6" fill="none"/>
                    <circle cx="48" cy="48" r="40" stroke="#2F5BEA" strokeWidth="6" fill="none"
                            strokeDasharray="216 251" strokeLinecap="round" transform="rotate(-90 48 48)"/>
                  </svg>
                </div>
              </div>
              {[
                { l: "Searchability", v: 92 }, { l: "Hard skills", v: 78 },
                { l: "Soft skills",   v: 84 }, { l: "Recruiter tips", v: 64 },
                { l: "Formatting",    v: 96 },
              ].map(r => (
                <div key={r.l} style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, color: "#2C2C2A" }}>{r.l}</span>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#5C5C58" }}>{r.v}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: "#E8E7E2", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${r.v}%`, borderRadius: 99,
                      background: r.v >= 80 ? "#2E7D5B" : r.v >= 70 ? "#0B0B0A" : "#C87A20",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </section>

        {/* ── 04 · AI Rewrites ──────────────────────────────────────────── */}
        <section style={{ padding: "0 80px 80px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionMark num="04" label="AI Rewrites" />
          <div className="jm-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", maxWidth: 1280, margin: "0 auto" }}>
            {/* Before/after card */}
            <div style={{ padding: 24, borderRadius: 18, background: "#FBFAF7", border: "1px solid rgba(0,0,0,0.10)", boxShadow: "0 18px 48px -28px rgba(20,19,15,0.14)" }}>
              <div style={{ fontFamily: "monospace", fontSize: 10.5, color: "#8C8C88", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
                Bullet Rewrite · Draft 03
              </div>
              <div style={{ padding: 16, borderRadius: 14, background: "#F5F5F2", border: "1px solid rgba(0,0,0,0.10)" }}>
                <div style={{ fontFamily: "monospace", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C8C88" }}>Before</div>
                <p style={{ textDecoration: "line-through", color: "#8C8C88", fontSize: 13.5, lineHeight: 1.5, margin: "6px 0 16px" }}>
                  Worked on UI improvements across the platform.
                </p>
                <div style={{ fontFamily: "monospace", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2F5BEA" }}>After · Grounded in JD</div>
                <p style={{ color: "#0B0B0A", fontSize: 13.5, lineHeight: 1.5, fontWeight: 500, margin: "6px 0 0" }}>
                  Shipped 6 motion-rich product surfaces in React 18 + TypeScript, lifting Web Vitals 22% across 1.4M users.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button style={{ padding: "8px 14px", borderRadius: 99, background: "#0B0B0A", color: "white", fontSize: 12.5, fontWeight: 540, border: "none", cursor: "pointer" }}>
                  Accept rewrite
                </button>
                <button style={{ padding: "8px 14px", borderRadius: 99, background: "transparent", color: "#2C2C2A", fontSize: 12.5, fontWeight: 540, border: "1px solid rgba(0,0,0,0.14)", cursor: "pointer" }}>
                  Try different angle
                </button>
              </div>
            </div>

            <div>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#2F5BEA", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}>For the humans</span>
              <h2 style={{ fontSize: "clamp(28px,3.5vw,42px)", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.05, margin: "12px 0 16px", color: "#0B0B0A" }}>
                An editor that knows the role you&apos;re chasing.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: "#5C5C58", margin: "0 0 22px" }}>
                Every rewrite is grounded in the actual JD — tone, seniority, and the exact keywords that move scores.
                No &quot;use stronger verbs&quot; slop. The voice stays yours.
              </p>
              {["Bullet-by-bullet impact rewrites","JD-aware tone & seniority match","Quantification suggestions with sources","Voice profile learns from your originals"].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14.5, color: "#2C2C2A", padding: "10px 0", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#8C8C88", minWidth: 32, paddingTop: 2 }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
          </div>
        </section>

        {/* ── 05 · Beyond the scan ──────────────────────────────────────── */}
        <section style={{ padding: "0 80px 80px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SectionMark num="05" label="Beyond the scan" />
          <h2 style={{ fontSize: "clamp(36px,5vw,64px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.98, margin: "0 0 14px", color: "#0B0B0A" }}>
            A workspace for the<br />
            <em style={{ fontStyle: "italic", fontWeight: 400, color: "#2F5BEA" }}>whole job hunt.</em>
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: "#5C5C58", maxWidth: 640, margin: "0 0 40px" }}>
            The scan is the front door. Everything else — profile rewrites, letters, tracking, salary intel — lives in the same workspace, with the same context.
          </p>
          <div className="jm-beyond-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", borderTop: "1px solid rgba(0,0,0,0.10)", maxWidth: 1280, margin: "0 auto" }}>
            {[
              { n: "01", t: "LinkedIn rewrite",    d: "Headline, About, and Featured tuned to the roles you actually want." },
              { n: "02", t: "Cover letter AI",     d: "Voice-matched, role-tailored, in three sentences or three paragraphs." },
              { n: "03", t: "Application tracker", d: "Watch which résumé version converts. Sort jobs by your real fit score." },
              { n: "04", t: "Recruiter signals",   d: "See what hiring managers in your field scan for in the first 6 seconds." },
            ].map((it, i) => (
              <div key={it.t} style={{
                padding: "32px 28px",
                borderRight: i % 2 === 0 ? "1px solid rgba(0,0,0,0.10)" : "none",
                borderBottom: "1px solid rgba(0,0,0,0.10)",
              }}>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#2F5BEA", fontWeight: 600, letterSpacing: "0.12em" }}>{it.n}</div>
                <h3 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.025em", margin: "10px 0 8px", color: "#0B0B0A" }}>{it.t}</h3>
                <p style={{ fontSize: 14, color: "#5C5C58", lineHeight: 1.55, margin: 0 }}>{it.d}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section style={{
          padding: "80px 80px",
          background: "linear-gradient(135deg,#0B3FB8 0%,#07121F 100%)",
          color: "white", position: "relative", overflow: "hidden",
        }}>
          {/* Subtle grid */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
          <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(44px,7vw,80px)", fontWeight: 900, letterSpacing: "-0.045em", lineHeight: 0.95, margin: 0 }}>
              Your fit score,<br />
              <em style={{ fontStyle: "italic", fontWeight: 400, color: "#9DC0FF" }}>in 4 seconds flat.</em>
            </h2>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.70)", maxWidth: 580, margin: "24px auto 32px" }}>
              No signup. No guessing. Paste any job description and see exactly where your résumé stands — then fix it.
            </p>
            <button
              className="jm-cta-scan"
              onClick={() => workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 24px", borderRadius: 99,
                background: "#2F5BEA", color: "white",
                fontSize: 14.5, fontWeight: 600,
                boxShadow: "0 6px 22px -6px #2F5BEA",
                border: "none", cursor: "pointer", transition: "opacity .15s",
              }}
            >
              Scan résumé free <ArrowRight />
            </button>
          </div>
        </section>

      </div>

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
